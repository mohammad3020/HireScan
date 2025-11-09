"""
Candidates app serializers
"""
from rest_framework import serializers
from .models import (
    Candidate, Resume, ParsedResume, Experience, Skill, Note, TimelineEvent, JobScore
)


class SkillSerializer(serializers.ModelSerializer):
    """Skill serializer"""
    class Meta:
        model = Skill
        fields = ['id', 'name', 'category', 'proficiency']


class ExperienceSerializer(serializers.ModelSerializer):
    """Experience serializer"""
    class Meta:
        model = Experience
        fields = ['id', 'company', 'role', 'start_date', 'end_date', 'is_current', 'description']


class ParsedResumeSerializer(serializers.ModelSerializer):
    """Parsed resume serializer"""
    experiences = ExperienceSerializer(many=True, read_only=True)
    skills = SkillSerializer(many=True, read_only=True)
    
    class Meta:
        model = ParsedResume
        fields = ['id', 'raw_text', 'parsed_data', 'parsed_at', 'experiences', 'skills']


class ResumeSerializer(serializers.ModelSerializer):
    """Resume serializer"""
    parsed_data = ParsedResumeSerializer(read_only=True)
    candidate_name = serializers.CharField(source='candidate.name', read_only=True)
    
    class Meta:
        model = Resume
        fields = ['id', 'candidate', 'candidate_name', 'file', 'uploaded_at', 'parsed_data']
        read_only_fields = ['id', 'uploaded_at']


class NoteSerializer(serializers.ModelSerializer):
    """Note serializer"""
    user_username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Note
        fields = ['id', 'candidate', 'user', 'user_username', 'content', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class TimelineEventSerializer(serializers.ModelSerializer):
    """Timeline event serializer"""
    class Meta:
        model = TimelineEvent
        fields = ['id', 'candidate', 'event_type', 'description', 'metadata', 'created_at']
        read_only_fields = ['id', 'created_at']


class JobScoreSerializer(serializers.ModelSerializer):
    """Job score serializer"""
    job_title = serializers.CharField(source='job.title', read_only=True)
    candidate_name = serializers.CharField(source='candidate.name', read_only=True)
    
    class Meta:
        model = JobScore
        fields = [
            'id', 'candidate', 'candidate_name', 'job', 'job_title',
            'score', 'rank', 'auto_rejected', 'rejection_reason',
            'scored_at', 'updated_at'
        ]
        read_only_fields = ['id', 'scored_at', 'updated_at']


class CandidateSerializer(serializers.ModelSerializer):
    """Candidate serializer"""
    resumes = ResumeSerializer(many=True, read_only=True)
    notes = NoteSerializer(many=True, read_only=True)
    timeline_events = TimelineEventSerializer(many=True, read_only=True)
    job_scores = JobScoreSerializer(many=True, read_only=True)
    
    class Meta:
        model = Candidate
        fields = [
            'id', 'email', 'name', 'phone', 'linkedin_url', 'github_url',
            'created_at', 'updated_at', 'resumes', 'notes', 'timeline_events', 'job_scores'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CandidateListSerializer(serializers.ModelSerializer):
    """Simplified candidate serializer for list views"""
    resume_count = serializers.IntegerField(source='resumes.count', read_only=True)
    
    class Meta:
        model = Candidate
        fields = [
            'id', 'email', 'name', 'phone', 'linkedin_url', 'github_url',
            'created_at', 'resume_count'
        ]
        read_only_fields = ['id', 'created_at']

