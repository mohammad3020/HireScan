"""
Jobs app serializers
"""
from rest_framework import serializers
from .models import Department, Job


class DepartmentSerializer(serializers.ModelSerializer):
    """Department serializer"""
    class Meta:
        model = Department
        fields = ['id', 'name', 'description', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class JobSerializer(serializers.ModelSerializer):
    """Job serializer"""
    department_name = serializers.CharField(source='department.name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = Job
        fields = [
            'id', 'title', 'description', 'department', 'department_name',
            'salary_min', 'salary_max', 'required_skills', 'auto_reject_rules',
            'created_by', 'created_by_username', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

