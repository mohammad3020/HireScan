"""
Candidates app URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CandidateViewSet, ResumeViewSet, CVUploadView, JobScoreViewSet

router = DefaultRouter()
router.register(r'candidates', CandidateViewSet, basename='candidate')
router.register(r'resumes', ResumeViewSet, basename='resume')
router.register(r'job-scores', JobScoreViewSet, basename='jobscore')

urlpatterns = [
    path('', include(router.urls)),
    path('upload-cv/', CVUploadView.as_view(), name='upload-cv'),
]

