"""
Candidates app views
"""
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from .models import Candidate, Resume, ParsedResume, Note, TimelineEvent
from .serializers import (
    CandidateSerializer, CandidateListSerializer, ResumeSerializer,
    NoteSerializer, TimelineEventSerializer, ParsedResumeSerializer
)
from processing.models import BatchUpload, FileItem


class CandidateViewSet(viewsets.ModelViewSet):
    """Candidate viewset"""
    queryset = Candidate.objects.prefetch_related(
        'resumes', 'notes', 'timeline_events', 'job_scores'
    ).all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['email']
    search_fields = ['name', 'email', 'phone']
    ordering_fields = ['created_at', 'name']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Use different serializers for list and detail"""
        if self.action == 'list':
            return CandidateListSerializer
        return CandidateSerializer
    
    @action(detail=True, methods=['get'])
    def detail(self, request, pk=None):
        """Get full candidate detail with all related data"""
        candidate = self.get_object()
        serializer = CandidateSerializer(candidate)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_note(self, request, pk=None):
        """Add a note to a candidate"""
        candidate = self.get_object()
        serializer = NoteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(candidate=candidate, user=request.user)
            # Create timeline event
            TimelineEvent.objects.create(
                candidate=candidate,
                event_type='note_added',
                description=f"Note added by {request.user.email}",
                metadata={'note_id': serializer.instance.id}
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def timeline(self, request, pk=None):
        """Get candidate timeline events"""
        candidate = self.get_object()
        events = candidate.timeline_events.all()
        serializer = TimelineEventSerializer(events, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def notes(self, request, pk=None):
        """Get candidate notes"""
        candidate = self.get_object()
        notes = candidate.notes.all()
        serializer = NoteSerializer(notes, many=True)
        return Response(serializer.data)


class ResumeViewSet(viewsets.ModelViewSet):
    """Resume viewset"""
    queryset = Resume.objects.select_related('candidate', 'parsed_data').all()
    serializer_class = ResumeSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['candidate']
    ordering_fields = ['uploaded_at']
    ordering = ['-uploaded_at']


class CVUploadView(APIView):
    """
    API endpoint to upload CV files for a job and process them with AI
    Uses threading for concurrent processing
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Upload CV files for a job
        
        Expected request:
        - job_id: integer (optional, can be passed in query params or body)
        - files: list of files (PDF, DOC, DOCX)
        """
        job_id = request.data.get('job_id') or request.query_params.get('job_id')
        files = request.FILES.getlist('files')
        
        if not files:
            return Response(
                {'error': 'No files provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(files) > 100:
            return Response(
                {'error': 'Maximum 100 files allowed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file types
        allowed_extensions = ['.pdf', '.doc', '.docx']
        for file in files:
            ext = '.' + file.name.lower().split('.')[-1] if '.' in file.name else ''
            if ext not in allowed_extensions:
                return Response(
                    {'error': f'Invalid file type: {file.name}. Allowed: PDF, DOC, DOCX'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Create batch for tracking (optional, for job association)
        batch = None
        if job_id:
            try:
                from jobs.models import Job
                job = Job.objects.get(id=job_id)
                batch = BatchUpload.objects.create(
                    user=request.user,
                    status='processing',
                    total_files=len(files)
                )
            except Exception:
                pass  # Continue without batch if job not found
        
        # Store files and create candidates/resumes
        resumes_to_process = []
        file_items = []
        
        for file in files:
            # Create a temporary candidate (will be updated after parsing)
            candidate = Candidate.objects.create(
                email=f"temp_{file.name}_{threading.get_ident()}@temp.com",
                name=f"Temp Candidate {file.name}"
            )
            
            # Create resume
            resume = Resume.objects.create(
                candidate=candidate,
                file=file
            )
            resumes_to_process.append(resume)
            
            # Create file item if batch exists
            if batch:
                file_item = FileItem.objects.create(
                    batch=batch,
                    file=file,
                    status='pending',
                    candidate=candidate
                )
                file_items.append(file_item)
        
        # Process resumes concurrently using threading
        # Use ThreadPoolExecutor with max 3 workers to respect rate limits
        results = []
        errors = []
        
        def process_single_resume(resume):
            """Process a single resume with AI"""
            try:
                # Import here to avoid circular imports
                from processing.services import parse_resume_service
                
                # Small delay to respect rate limits (20 requests/minute = ~3 seconds between requests)
                # Since we have max 3 workers, this helps spread out the requests
                time.sleep(0.5)  # 500ms delay per request
                
                # Process the resume
                parsed_resume = parse_resume_service(resume)
                
                # Update file item status if batch exists
                if batch:
                    file_item = FileItem.objects.filter(
                        batch=batch,
                        candidate=resume.candidate
                    ).first()
                    if file_item:
                        file_item.status = 'completed'
                        file_item.save()
                
                return {
                    'resume_id': resume.id,
                    'candidate_id': resume.candidate.id,
                    'status': 'success',
                    'parsed_resume_id': parsed_resume.id
                }
            except Exception as e:
                # Update file item status if batch exists
                if batch:
                    file_item = FileItem.objects.filter(
                        batch=batch,
                        candidate=resume.candidate
                    ).first()
                    if file_item:
                        file_item.status = 'failed'
                        file_item.error_message = str(e)
                        file_item.save()
                
                return {
                    'resume_id': resume.id,
                    'candidate_id': resume.candidate.id,
                    'status': 'error',
                    'error': str(e)
                }
        
        # Process with threading (max 3 concurrent to respect rate limits)
        with ThreadPoolExecutor(max_workers=3) as executor:
            # Submit all tasks
            future_to_resume = {
                executor.submit(process_single_resume, resume): resume 
                for resume in resumes_to_process
            }
            
            # Collect results as they complete
            for future in as_completed(future_to_resume):
                result = future.result()
                if result['status'] == 'success':
                    results.append(result)
                else:
                    errors.append(result)
        
        # Update batch status
        if batch:
            batch.processed_files = len(results)
            if len(errors) == 0:
                batch.status = 'completed'
            elif len(results) > 0:
                batch.status = 'completed'  # Partial success
            else:
                batch.status = 'failed'
            batch.save()
        
        # Return response
        response_data = {
            'message': f'Processed {len(results)} out of {len(files)} files',
            'successful': len(results),
            'failed': len(errors),
            'results': results,
            'errors': errors
        }
        
        if batch:
            response_data['batch_id'] = batch.id
        
        return Response(response_data, status=status.HTTP_200_OK)
