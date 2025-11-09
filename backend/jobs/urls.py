"""
Jobs app URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DepartmentViewSet, JobViewSet

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'jobs', JobViewSet, basename='job')

urlpatterns = [
    path('', include(router.urls)),
]

