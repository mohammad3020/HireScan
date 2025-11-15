"""
Jobs app URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DepartmentViewSet, JobViewSet

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'jobs', JobViewSet, basename='job')

# Custom URL patterns to match user requirements
urlpatterns = [
    # GET /jobs - List all jobs
    path('jobs/', JobViewSet.as_view({'get': 'list'}), name='job-list'),
    # POST /jobs/new - Create new job
    path('jobs/new/', JobViewSet.as_view({'post': 'create'}), name='job-create'),
    # GET, PUT, PATCH, DELETE /jobs/{id} - Get, Update, Delete job by id
    path('jobs/<int:pk>/', JobViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='job-detail'),
    # Include router URLs for backward compatibility
    path('', include(router.urls)),
]

