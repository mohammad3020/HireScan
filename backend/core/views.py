"""
Core app views - JWT Authentication
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Count, Avg, Q
from django.utils import timezone
from datetime import timedelta
from .serializers import CustomTokenObtainPairSerializer, UserRegistrationSerializer
from .models import User
from jobs.models import Job, Department
from candidates.models import Candidate, JobScore
from processing.models import BatchUpload


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT token obtain view that uses email instead of username"""
    serializer_class = CustomTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        """Override to include user data in response"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # Get user from validated serializer
        user = serializer.user
        # Call parent to get tokens (this will validate again but that's okay)
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            # Add user data to response
            response.data['user'] = {
                'email': user.email,
                'first_name': user.first_name or '',
                'last_name': user.last_name or '',
            }
        return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """Get current authenticated user information"""
    user = request.user
    return Response({
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """Register a new user and return JWT tokens"""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            }
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DashboardView(APIView):
    """Dashboard view for KPIs and statistics"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get dashboard KPIs and statistics"""
        # KPIs
        total_jobs = Job.objects.count()
        active_jobs = Job.objects.filter(
            # Consider a job active if it has candidates or was created recently
            Q(candidate_scores__isnull=False) | Q(created_at__gte=timezone.now() - timedelta(days=30))
        ).distinct().count()
        total_candidates = Candidate.objects.count()
        
        # Average score across all job scores
        avg_score_result = JobScore.objects.aggregate(
            avg_score=Avg('score')
        )
        average_score = round(avg_score_result['avg_score'] or 0, 1)
        
        # Score distribution
        score_distribution = {
            '0-20': JobScore.objects.filter(score__gte=0, score__lt=21).count(),
            '21-40': JobScore.objects.filter(score__gte=21, score__lt=41).count(),
            '41-60': JobScore.objects.filter(score__gte=41, score__lt=61).count(),
            '61-80': JobScore.objects.filter(score__gte=61, score__lt=81).count(),
            '81-100': JobScore.objects.filter(score__gte=81, score__lte=100).count(),
        }
        
        # Candidates by status (based on category in JobScore)
        # Try to use category field, fallback to score-based if field doesn't exist
        try:
            shortlisted_count = JobScore.objects.filter(category='shortlisted').count()
            rejected_count = JobScore.objects.filter(category='rejected').count()
            interview_scheduled_count = JobScore.objects.filter(category='interview_scheduled').count()
            interviewed_count = JobScore.objects.filter(category='interviewed').count()
            offer_sent_count = JobScore.objects.filter(category='offer_sent').count()
            hired_count = JobScore.objects.filter(category='hired').count()
        except Exception:
            # Fallback to score-based calculation if category field doesn't exist yet
            shortlisted_count = JobScore.objects.filter(score__gte=80, auto_rejected=False).count()
            rejected_count = JobScore.objects.filter(auto_rejected=True).count()
            interview_scheduled_count = JobScore.objects.filter(score__gte=70, score__lt=80, auto_rejected=False).count()
            interviewed_count = 0
            offer_sent_count = 0
            hired_count = 0
        
        # Jobs by department
        jobs_by_department = Department.objects.annotate(
            job_count=Count('job')
        ).values('name', 'job_count')
        
        # Candidates per job (top 10)
        candidates_per_job = Job.objects.annotate(
            candidate_count=Count('candidate_scores', distinct=True),
            avg_job_score=Avg('candidate_scores__score')
        ).filter(candidate_count__gt=0).order_by('-candidate_count')[:10].values(
            'id', 'title', 'candidate_count', 'avg_job_score'
        )
        
        # Candidate trend (by month - last 6 months)
        six_months_ago = timezone.now() - timedelta(days=180)
        candidate_trend = []
        for i in range(6):
            month_start = timezone.now() - timedelta(days=30 * (i + 1))
            month_end = timezone.now() - timedelta(days=30 * i)
            candidates_in_month = Candidate.objects.filter(
                created_at__gte=month_start,
                created_at__lt=month_end
            ).count()
            month_name = month_start.strftime('%b')
            candidate_trend.append({
                'month': month_name,
                'candidates': candidates_in_month
            })
        candidate_trend.reverse()
        
        # Recent activity
        recent_activity = []
        
        # Recent batches
        recent_batches = BatchUpload.objects.order_by('-created_at')[:3]
        for batch in recent_batches:
            recent_activity.append({
                'id': batch.id,
                'type': 'upload',
                'message': f'New batch uploaded: {batch.total_files} resumes',
                'time': self._format_time_ago(batch.created_at),
            })
        
        # Recent job scores
        recent_scores = JobScore.objects.select_related('job', 'candidate').order_by('-scored_at')[:3]
        for score in recent_scores:
            recent_activity.append({
                'id': score.id,
                'type': 'scored',
                'message': f'{score.candidate.name} scored {round(score.score)} for {score.job.title}',
                'time': self._format_time_ago(score.scored_at),
            })
        
        # Sort by most recent first (reverse chronological)
        recent_activity.sort(key=lambda x: x.get('id', 0), reverse=True)
        
        return Response({
            'kpis': {
                'total_jobs': total_jobs,
                'active_jobs': active_jobs,
                'total_candidates': total_candidates,
                'average_score': average_score,
            },
            'score_distribution': [
                {'score': k, 'count': v} for k, v in score_distribution.items()
            ],
            'candidates_by_status': [
                {'name': 'Shortlisted', 'value': shortlisted_count, 'color': '#10B981'},
                {'name': 'Interview Scheduled', 'value': interview_scheduled_count, 'color': '#3B82F6'},
                {'name': 'Interviewed', 'value': interviewed_count, 'color': '#8B5CF6'},
                {'name': 'Offer Sent', 'value': offer_sent_count, 'color': '#F59E0B'},
                {'name': 'Hired', 'value': hired_count, 'color': '#059669'},
                {'name': 'Rejected', 'value': rejected_count, 'color': '#EF4444'},
            ],
            'jobs_by_department': list(jobs_by_department),
            'candidates_per_job': [
                {
                    'name': item['title'][:15] + '...' if len(item['title']) > 15 else item['title'],
                    'candidates': item['candidate_count'],
                    'avgScore': round(item['avg_job_score'] or 0, 1)
                }
                for item in candidates_per_job
            ],
            'candidate_trend': candidate_trend,
            'recent_activity': recent_activity[:5],  # Limit to 5 most recent
        })
    
    def _format_time_ago(self, date):
        """Format datetime as time ago string"""
        if not date:
            return 'Unknown'
        delta = timezone.now() - date
        if delta.days > 0:
            return f'{delta.days} day{"s" if delta.days > 1 else ""} ago'
        hours = delta.seconds // 3600
        if hours > 0:
            return f'{hours} hour{"s" if hours > 1 else ""} ago'
        minutes = delta.seconds // 60
        if minutes > 0:
            return f'{minutes} minute{"s" if minutes > 1 else ""} ago'
        return 'Just now'
