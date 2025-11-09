"""
Processing app serializers
"""
from rest_framework import serializers
from .models import BatchUpload, FileItem, Ranking
from candidates.serializers import CandidateListSerializer, JobScoreSerializer


class FileItemSerializer(serializers.ModelSerializer):
    """File item serializer"""
    candidate = CandidateListSerializer(read_only=True)
    
    class Meta:
        model = FileItem
        fields = [
            'id', 'batch', 'file', 'status', 'error_message',
            'candidate', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class BatchUploadSerializer(serializers.ModelSerializer):
    """Batch upload serializer"""
    file_items = FileItemSerializer(many=True, read_only=True)
    progress_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = BatchUpload
        fields = [
            'id', 'user', 'status', 'total_files', 'processed_files',
            'progress_percentage', 'created_at', 'updated_at', 'file_items'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class RankingSerializer(serializers.ModelSerializer):
    """Ranking serializer"""
    job_title = serializers.CharField(source='job.title', read_only=True)
    
    class Meta:
        model = Ranking
        fields = [
            'id', 'job', 'job_title', 'batch', 'status',
            'ranked_at', 'created_at'
        ]
        read_only_fields = ['id', 'ranked_at', 'created_at']

