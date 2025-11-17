"""
Processing app views
"""
import threading
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, Q, Avg
from .models import BatchUpload, FileItem, Ranking
from .serializers import BatchUploadSerializer, FileItemSerializer, RankingSerializer
from .services import (
    process_batch_service, rank_candidates_service,
    apply_auto_reject_rules, calculate_initial_score
)
from candidates.models import Candidate, JobScore
from jobs.models import Job


class BatchUploadViewSet(viewsets.ModelViewSet):
    """Batch upload viewset"""
    queryset = BatchUpload.objects.prefetch_related('file_items').all()
    serializer_class = BatchUploadSerializer
    
    def perform_create(self, serializer):
        """Set the user and create batch"""
        batch = serializer.save(user=self.request.user)
        
        # Process files in background thread for better UX
        # For MVP, we'll process synchronously but in a thread
        def process_in_thread():
            try:
                process_batch_service(batch.id)
            except Exception as e:
                batch.status = 'failed'
                batch.save()
        
        thread = threading.Thread(target=process_in_thread)
        thread.daemon = True
        thread.start()
    
    @action(detail=True, methods=['post'])
    def upload_files(self, request, pk=None):
        """Upload files to a batch"""
        import logging
        import time
        logger = logging.getLogger(__name__)
        timing_logger = logging.getLogger('processing.timing')
        
        upload_start_time = time.time()
        batch = self.get_object()
        files = request.FILES.getlist('files')
        
        timing_logger.info(f"[TIMING] Starting file upload for batch {batch.id} - {len(files)} file(s)")
        
        if len(files) > 100:
            return Response(
                {'error': 'Maximum 100 files allowed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file types
        allowed_extensions = ['.pdf', '.doc', '.docx']
        for file in files:
            ext = file.name.lower().split('.')[-1]
            if f'.{ext}' not in allowed_extensions:
                return Response(
                    {'error': f'Invalid file type: {file.name}. Allowed: PDF, DOC, DOCX'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Create file items
        file_items = []
        for file in files:
            file_upload_start = time.time()
            file_item = FileItem.objects.create(
                batch=batch,
                file=file,
                status='pending'
            )
            file_upload_time = time.time() - file_upload_start
            file_size_kb = file.size / 1024
            timing_logger.info(f"[TIMING] File '{file.name}' ({file_size_kb:.1f} KB) uploaded in {file_upload_time:.2f} seconds ({file_upload_time*1000:.0f}ms) - FileItem ID: {file_item.id}")
            file_items.append(file_item)
        
        batch.total_files = batch.file_items.count()
        batch.save()
        
        upload_total_time = time.time() - upload_start_time
        timing_logger.info(f"[TIMING] Total upload completed in {upload_total_time:.2f} seconds ({upload_total_time*1000:.0f}ms) for {len(files)} file(s) in batch {batch.id}")
        
        # Process batch in background
        def process_in_thread():
            try:
                process_batch_service(batch.id)
            except Exception as e:
                batch.status = 'failed'
                batch.save()
        
        thread = threading.Thread(target=process_in_thread)
        thread.daemon = True
        thread.start()
        
        serializer = FileItemSerializer(file_items, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        """Get batch processing status"""
        batch = self.get_object()
        serializer = self.get_serializer(batch)
        return Response(serializer.data)


class ReviewDashboardView(APIView):
    """Review dashboard view"""
    
    def get(self, request):
        """Get dashboard KPIs and data"""
        job_id = request.query_params.get('jobId')
        
        if not job_id:
            return Response(
                {'error': 'jobId parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            job = Job.objects.get(id=job_id)
        except Job.DoesNotExist:
            return Response(
                {'error': 'Job not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get candidates with scores for this job
        job_scores = JobScore.objects.filter(job=job).select_related('candidate', 'job')
        
        # KPIs
        total_candidates = job_scores.count()
        auto_rejected = job_scores.filter(auto_rejected=True).count()
        average_score = job_scores.aggregate(
            avg_score=Avg('score')
        )['avg_score'] or 0
        
        # Top candidates (non-rejected, ordered by score)
        top_candidates = job_scores.filter(
            auto_rejected=False
        ).order_by('-score', 'rank')[:20]
        
        # Auto-rejected candidates
        rejected_candidates = job_scores.filter(
            auto_rejected=True
        ).order_by('-score')
        
        # All candidates for the frontend (non-rejected first, then rejected)
        all_candidates = job_scores.order_by('auto_rejected', '-score', 'rank')
        
        from candidates.serializers import JobScoreSerializer, CandidateSerializer
        
        # Serialize all candidates with full candidate details
        all_candidates_data = []
        for job_score in all_candidates:
            candidate_data = JobScoreSerializer(job_score).data
            # Add candidate details if needed
            candidate_details = CandidateSerializer(job_score.candidate).data
            candidate_data['candidate_details'] = {
                'name': candidate_details['name'],
                'email': candidate_details['email'],
                'phone': candidate_details['phone'],
                'linkedin_url': candidate_details.get('linkedin_url', ''),
                'github_url': candidate_details.get('github_url', ''),
            }
            # Get skills from parsed resume
            try:
                resume = candidate_details.get('resumes', [{}])[0] if candidate_details.get('resumes') else {}
                parsed_data = resume.get('parsed_data', {}) if resume else {}
                technical_skills = parsed_data.get('technical_skills', []) if parsed_data else []
                skills = [s.get('name', '') for s in technical_skills]
                candidate_data['skills'] = skills
                candidate_data['skillset'] = ', '.join(skills[:5]) if skills else ''
                # Add AI review from parsed resume
                candidate_data['ai_review'] = parsed_data.get('ai_review', '')
                candidate_data['ai_summary'] = parsed_data.get('ai_review', '')  # Alias for frontend compatibility
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Error extracting skills/AI review for candidate {job_score.candidate.id}: {str(e)}")
                candidate_data['skills'] = []
                candidate_data['skillset'] = ''
                candidate_data['ai_review'] = ''
                candidate_data['ai_summary'] = ''
            
            # Get notes for this candidate
            try:
                notes = job_score.candidate.notes.all()
                if notes.exists():
                    candidate_data['notes'] = ' | '.join([note.content for note in notes])
                else:
                    candidate_data['notes'] = ''
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Error extracting notes for candidate {job_score.candidate.id}: {str(e)}")
                candidate_data['notes'] = ''
            
            all_candidates_data.append(candidate_data)
        
        return Response({
            'job': {
                'id': job.id,
                'title': job.title,
            },
            'kpis': {
                'total_candidates': total_candidates,
                'auto_rejected': auto_rejected,
                'average_score': round(average_score, 2),
            },
            'top_candidates': JobScoreSerializer(top_candidates, many=True).data,
            'rejected_candidates': JobScoreSerializer(rejected_candidates, many=True).data,
            'all_candidates': all_candidates_data,
        })


class RankingRefreshView(APIView):
    """Ranking refresh view"""
    
    def post(self, request, job_id):
        """Refresh ranking for a job"""
        try:
            job = Job.objects.get(id=job_id)
        except Job.DoesNotExist:
            return Response(
                {'error': 'Job not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get all candidates with parsed resumes
        candidates = Candidate.objects.filter(
            resumes__parsed_data__isnull=False
        ).distinct()
        
        if not candidates.exists():
            return Response(
                {'error': 'No candidates with parsed resumes found'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate scores and apply auto-reject rules
        for candidate in candidates:
            is_rejected, reason = apply_auto_reject_rules(candidate, job)
            score = calculate_initial_score(candidate, job)
            
            job_score, created = JobScore.objects.get_or_create(
                candidate=candidate,
                job=job,
                defaults={
                    'score': score,
                    'auto_rejected': is_rejected,
                    'rejection_reason': reason
                }
            )
            
            if not created:
                job_score.score = score
                job_score.auto_rejected = is_rejected
                job_score.rejection_reason = reason
                job_score.save()
        
        # Rank candidates using OpenRouter
        candidates_to_rank = candidates.filter(
            job_scores__job=job,
            job_scores__auto_rejected=False
        ).distinct()
        
        if candidates_to_rank.exists():
            ranked_results = rank_candidates_service(job, candidates_to_rank)
            
            # Update ranks
            for result in ranked_results:
                candidate_id = result.get('candidate_id')
                rank = result.get('rank')
                score = result.get('score', 0)
                
                try:
                    job_score = JobScore.objects.get(
                        candidate_id=candidate_id,
                        job=job
                    )
                    job_score.rank = rank
                    job_score.score = score  # Update score from ranking
                    job_score.save()
                except JobScore.DoesNotExist:
                    pass
        
        # Create or update ranking record
        ranking, created = Ranking.objects.get_or_create(
            job=job,
            defaults={'status': 'completed'}
        )
        if not created:
            ranking.status = 'completed'
            ranking.save()
        
        return Response({
            'message': 'Ranking refreshed successfully',
            'total_candidates': candidates.count(),
            'ranked_candidates': candidates_to_rank.count()
        })


