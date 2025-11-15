"""
Candidates app serializers
"""
from rest_framework import serializers
from .models import (
    Candidate, Resume, ParsedResume, Experience, Education,
    TechnicalSkill, SoftSkill, SkillMentionedInJobTitle,
    Project, Award, Language, Course, Publication,
    Note, TimelineEvent, JobScore
)


class TechnicalSkillSerializer(serializers.ModelSerializer):
    """Technical skill serializer"""
    class Meta:
        model = TechnicalSkill
        fields = ['id', 'category', 'name', 'level']


class SoftSkillSerializer(serializers.ModelSerializer):
    """Soft skill serializer"""
    class Meta:
        model = SoftSkill
        fields = ['id', 'name']


class SkillMentionedInJobTitleSerializer(serializers.ModelSerializer):
    """Skill mentioned in job title serializer"""
    class Meta:
        model = SkillMentionedInJobTitle
        fields = ['id', 'name']


class EducationSerializer(serializers.ModelSerializer):
    """Education serializer"""
    class Meta:
        model = Education
        fields = [
            'id', 'degree', 'field', 'institution', 'location',
            'start_date', 'end_date', 'gpa', 'honors', 'thesis',
            'relevant_courses', 'order'
        ]


class ExperienceSerializer(serializers.ModelSerializer):
    """Experience serializer"""
    class Meta:
        model = Experience
        fields = [
            'id', 'job_title', 'company', 'company_type', 'location',
            'employment_type', 'start_date', 'end_date', 'duration',
            'is_currently_employed', 'reasoning', 'responsibilities', 'order'
        ]


class ProjectSerializer(serializers.ModelSerializer):
    """Project serializer"""
    class Meta:
        model = Project
        fields = [
            'id', 'name', 'role', 'date', 'technologies',
            'description', 'link', 'order'
        ]


class AwardSerializer(serializers.ModelSerializer):
    """Award serializer"""
    class Meta:
        model = Award
        fields = [
            'id', 'title', 'issuer', 'rank', 'date',
            'description', 'order'
        ]


class LanguageSerializer(serializers.ModelSerializer):
    """Language serializer"""
    class Meta:
        model = Language
        fields = [
            'id', 'language', 'proficiency', 'skills', 'certificates'
        ]


class CourseSerializer(serializers.ModelSerializer):
    """Course serializer"""
    class Meta:
        model = Course
        fields = [
            'id', 'name', 'provider', 'instructor', 'completion_date',
            'duration', 'certificate_id', 'verification_link', 'order'
        ]


class PublicationSerializer(serializers.ModelSerializer):
    """Publication serializer"""
    class Meta:
        model = Publication
        fields = [
            'id', 'title', 'authors', 'venue', 'year',
            'volume_pages', 'doi', 'link', 'citations', 'order'
        ]


class ParsedResumeSerializer(serializers.ModelSerializer):
    """Parsed resume serializer"""
    educations = EducationSerializer(many=True, read_only=True)
    experiences = ExperienceSerializer(many=True, read_only=True)
    technical_skills = TechnicalSkillSerializer(many=True, read_only=True)
    soft_skills = SoftSkillSerializer(many=True, read_only=True)
    skills_mentioned_in_job_title = SkillMentionedInJobTitleSerializer(many=True, read_only=True)
    projects = ProjectSerializer(many=True, read_only=True)
    awards = AwardSerializer(many=True, read_only=True)
    languages = LanguageSerializer(many=True, read_only=True)
    courses = CourseSerializer(many=True, read_only=True)
    publications = PublicationSerializer(many=True, read_only=True)
    
    class Meta:
        model = ParsedResume
        fields = [
            'id', 'resume', 'raw_text', 'parsed_data', 'parsed_at', 'updated_at',
            # Personal info
            'full_name', 'phone', 'email', 'address', 'date_of_birth',
            'marital_status', 'military_service',
            # Links
            'linkedin_url', 'github_url', 'portfolio_url', 'website_url', 'other_links',
            # Complex data
            'interests', 'other_sections', 'extraction_notes',
            # Related objects
            'educations', 'experiences', 'technical_skills', 'soft_skills',
            'skills_mentioned_in_job_title', 'projects', 'awards',
            'languages', 'courses', 'publications'
        ]
        read_only_fields = ['id', 'parsed_at', 'updated_at']


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
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = Note
        fields = ['id', 'candidate', 'user', 'user_email', 'content', 'created_at', 'updated_at']
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

