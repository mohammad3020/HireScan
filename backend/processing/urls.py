"""
Processing app URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BatchUploadViewSet, ReviewDashboardView, RankingRefreshView

router = DefaultRouter()
router.register(r'batches', BatchUploadViewSet, basename='batch')

urlpatterns = [
    path('', include(router.urls)),
    path('review/', ReviewDashboardView.as_view(), name='review-dashboard'),
    path('ranking/<int:job_id>/refresh/', RankingRefreshView.as_view(), name='ranking-refresh'),
]

