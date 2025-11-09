"""
Jobs app views
"""
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Department, Job
from .serializers import DepartmentSerializer, JobSerializer


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
