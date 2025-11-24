"""
Jobs app views
"""
import logging
import threading
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db import close_old_connections
from .models import Department, Job
from .serializers import DepartmentSerializer, JobSerializer
from candidates.models import JobScore
from processing.services import apply_auto_reject_rules, calculate_initial_score

logger = logging.getLogger(__name__)


class DepartmentViewSet(viewsets.ModelViewSet):
    """Department viewset"""
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']


class JobViewSet(viewsets.ModelViewSet):
    """Job viewset"""
    queryset = Job.objects.select_related('department', 'created_by').all()
    serializer_class = JobSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['department', 'created_by']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'title', 'salary_min', 'salary_max']
    ordering = ['-created_at']
    
    def perform_create(self, serializer):
        """Set the created_by field to the current user"""
        serializer.save(created_by=self.request.user)
    
    def perform_update(self, serializer):
        """Update job and re-evaluate all candidates for this job"""
        instance = serializer.save()
        
        # Re-evaluate all candidates for this job after update (in background to avoid blocking the response)
        logger.info(f"Job {instance.id} updated. Scheduling re-evaluation of all candidates for this job...")
        # Run re-evaluation in a separate thread to avoid blocking the API response
        # Pass job.id instead of job object to avoid thread-safety issues
        thread = threading.Thread(target=self._reevaluate_candidates_for_job, args=(instance.id,))
        thread.daemon = True
        thread.start()
    
    def _reevaluate_candidates_for_job(self, job_id):
        """
        Re-evaluate all candidates for a job by re-applying auto-reject rules and recalculating scores
        """
        # Close old database connections for this thread
        close_old_connections()
        
        try:
            # Re-fetch the job object in this thread to ensure fresh database connection
            try:
                job = Job.objects.get(id=job_id)
            except Job.DoesNotExist:
                logger.error(f"Job {job_id} not found. Skipping re-evaluation.")
                return
            
            # Get all job scores for this job
            job_scores = JobScore.objects.filter(job=job).select_related('candidate')
            total_candidates = job_scores.count()
            
            if total_candidates == 0:
                logger.info(f"No candidates found for job {job.id}. Skipping re-evaluation.")
                return
            
            logger.info(f"Re-evaluating {total_candidates} candidates for job {job.id}...")
            
            updated_count = 0
            for job_score in job_scores:
                try:
                    candidate = job_score.candidate
                    
                    # Re-apply auto-reject rules
                    is_rejected, rejection_reason = apply_auto_reject_rules(candidate, job)
                    
                    # Recalculate score
                    score = calculate_initial_score(candidate, job)
                    
                    # Update JobScore
                    job_score.score = score
                    job_score.auto_rejected = is_rejected
                    job_score.rejection_reason = rejection_reason
                    job_score.save()
                    
                    updated_count += 1
                    
                except Exception as e:
                    logger.error(
                        f"Error re-evaluating candidate {job_score.candidate.id} for job {job.id}: {str(e)}",
                        exc_info=True
                    )
                    continue
            
            # Recalculate ranks for all candidates (non-rejected candidates only)
            # Rank is based on score, with higher scores getting lower rank numbers (1 = best)
            non_rejected_scores = JobScore.objects.filter(
                job=job,
                auto_rejected=False
            ).order_by('-score', 'id')
            
            rank = 1
            for job_score in non_rejected_scores:
                job_score.rank = rank
                job_score.save(update_fields=['rank'])
                rank += 1
            
            # Set rank to None for rejected candidates
            rejected_scores = JobScore.objects.filter(job=job, auto_rejected=True)
            rejected_scores.update(rank=None)
            
            logger.info(
                f"Successfully re-evaluated {updated_count}/{total_candidates} candidates for job {job.id}. "
                f"Recalculated ranks for {non_rejected_scores.count()} non-rejected candidates."
            )
            
        except Exception as e:
            logger.error(
                f"Error re-evaluating candidates for job {job_id}: {str(e)}",
                exc_info=True
            )
    
    @action(detail=False, methods=['get'])
    def by_department(self, request):
        """Get jobs filtered by department"""
        department_id = request.query_params.get('department_id')
        if department_id:
            jobs = self.queryset.filter(department_id=department_id)
            serializer = self.get_serializer(jobs, many=True)
            return Response(serializer.data)
        return Response([])
    
    @action(detail=False, methods=['get'])
    def salary_range(self, request):
        """Get jobs filtered by salary range"""
        min_salary = request.query_params.get('min_salary')
        max_salary = request.query_params.get('max_salary')
        queryset = self.queryset
        
        if min_salary:
            queryset = queryset.filter(salary_max__gte=min_salary)
        if max_salary:
            queryset = queryset.filter(salary_min__lte=max_salary)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
