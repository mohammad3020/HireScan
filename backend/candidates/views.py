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
from rest_framework_simplejwt.authentication import JWTAuthentication
from django_filters.rest_framework import DjangoFilterBackend

from .models import Candidate, Resume, ParsedResume, Note, TimelineEvent
from .serializers import (
    CandidateSerializer, CandidateListSerializer, ResumeSerializer,
    NoteSerializer, TimelineEventSerializer, ParsedResumeSerializer
)
from processing.models import BatchUpload, FileItem


class CandidateViewSet(viewsets.ModelViewSet):
    """Candidate viewset"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    queryset = Candidate.objects.prefetch_related(
        'resumes__parsed_data',
        'resumes__parsed_data__educations',
        'resumes__parsed_data__experiences',
        'resumes__parsed_data__technical_skills',
        'resumes__parsed_data__soft_skills',
        'resumes__parsed_data__skills_mentioned_in_job_title',
        'resumes__parsed_data__projects',
        'resumes__parsed_data__awards',
        'resumes__parsed_data__languages',
        'resumes__parsed_data__courses',
        'resumes__parsed_data__certifications',
        'resumes__parsed_data__publications',
        'notes', 
        'timeline_events', 
        'job_scores__job'
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
    
    def retrieve(self, request, *args, **kwargs):
        """Get full candidate detail with all related data"""
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error serializing candidate {kwargs.get('pk')}: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Error loading candidate: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'], url_path='detail')
    def detail_action(self, request, pk=None):
        """Alias for retrieve - kept for backward compatibility"""
        return self.retrieve(request, pk=pk)
    
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
    
    @action(detail=True, methods=['delete'], url_path='delete_note/(?P<note_id>[^/.]+)')
    def delete_note(self, request, pk=None, note_id=None):
        """Delete a note from a candidate"""
        candidate = self.get_object()
        try:
            note = candidate.notes.get(id=note_id)
            # Only allow the note creator or superuser to delete
            if note.user != request.user and not request.user.is_superuser:
                return Response(
                    {'error': 'You do not have permission to delete this note.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            note.delete()
            return Response({'message': 'Note deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
        except Note.DoesNotExist:
            return Response(
                {'error': 'Note not found'},
                status=status.HTTP_404_NOT_FOUND
            )


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
    Uses background processing via process_batch_service
    """
    authentication_classes = [JWTAuthentication]  # Only JWT auth, exempts from CSRF
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
        
        # Get job if job_id is provided
        job = None
        if job_id:
            try:
                from jobs.models import Job
                job = Job.objects.get(id=job_id)
            except Job.DoesNotExist:
                return Response(
                    {'error': f'Job with id {job_id} not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Always create batch for tracking (required for processing page)
        batch = BatchUpload.objects.create(
            user=request.user,
            job=job,
            status='pending',
            total_files=len(files),
            processed_files=0
        )
        
        # Create file items for all files
        file_items = []
        for file in files:
            file_item = FileItem.objects.create(
                batch=batch,
                file=file,
                status='pending'
            )
            file_items.append(file_item)
        
        # Update batch total_files to match actual count
        batch.total_files = len(file_items)
        batch.save()
        
        # Process batch in background thread using process_batch_service
        def process_in_thread():
            import logging
            logger = logging.getLogger(__name__)
            try:
                from processing.services import process_batch_service
                logger.info(f"Starting background processing for batch {batch.id}")
                process_batch_service(batch.id)
                logger.info(f"Completed background processing for batch {batch.id}")
            except Exception as e:
                logger.error(f"Failed to process batch {batch.id}: {str(e)}", exc_info=True)
                batch.status = 'failed'
                batch.error_message = str(e)
                batch.save()
        
        thread = threading.Thread(target=process_in_thread)
        thread.daemon = True
        thread.start()
        
        # Return response immediately with batch_id
        response_data = {
            'message': f'Uploaded {len(files)} files. Processing started.',
            'successful': 0,  # Will be updated as processing completes
            'failed': 0,  # Will be updated as processing completes
            'batch_id': batch.id
        }
        
        return Response(response_data, status=status.HTTP_202_ACCEPTED)
