"""
Candidates app serializers
"""
from rest_framework import serializers
from .models import (
    Candidate, Resume, ParsedResume, Experience, Education,
    TechnicalSkill, SoftSkill, SkillMentionedInJobTitle,
    Project, Award, Language, Course, Certification, Publication,
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
            'institution_category', 'graduation_year',
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
            'duration_months',
            'is_currently_employed', 'reasoning', 'responsibilities',
            'extracted_skills', 'order'
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


class CertificationSerializer(serializers.ModelSerializer):
    """Certification serializer"""
    class Meta:
        model = Certification
        fields = [
            'id', 'name', 'issuer', 'date', 'description',
            'certificate_id', 'verification_link', 'order'
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
    """Parsed resume serializer aligned with AI output structure"""
    extracted_resume_data = serializers.SerializerMethodField()
    scoring_results = serializers.SerializerMethodField()
    interpretation = serializers.SerializerMethodField()
    audit_trail = serializers.SerializerMethodField()

    def _format_score(self, value):
        if value is None:
            return None
        try:
            return round(float(value), 2)
        except (TypeError, ValueError):
            return None

    def get_extracted_resume_data(self, obj):
        """Compose extracted resume data JSON"""
        personal_info = {
            "full_name": obj.full_name,
            "phone": obj.phone,
            "email": obj.email,
            "address": obj.address,
            "date_of_birth": obj.date_of_birth,
            "marital_status": obj.marital_status,
            "military_service": obj.military_service,
            "links": {
                "linkedin": obj.linkedin_url,
                "github": obj.github_url,
                "portfolio": obj.portfolio_url,
                "website": obj.website_url,
                "other": obj.other_links or []
            }
        }

        technical_skills = [
            {
                "id": skill.id,
                "name": skill.name,
                "category": skill.category,
                "level": skill.level
            }
            for skill in obj.technical_skills.all()
        ]
        soft_skills = [skill.name for skill in obj.soft_skills.all()]
        mentioned_skills = [skill.name for skill in obj.skills_mentioned_in_job_title.all()]

        extracted = {
            "personal_info": personal_info,
            "education": EducationSerializer(obj.educations.all(), many=True).data,
            "experience": ExperienceSerializer(obj.experiences.all(), many=True).data,
            "skills": {
                "technical": technical_skills,
                "soft": soft_skills,
                "skills_mentioned_in_job_title": mentioned_skills
            },
            "projects": ProjectSerializer(obj.projects.all(), many=True).data,
            "awards": AwardSerializer(obj.awards.all(), many=True).data,
            "languages": LanguageSerializer(obj.languages.all(), many=True).data,
            "courses": CourseSerializer(obj.courses.all(), many=True).data,
            "certifications": CertificationSerializer(obj.certifications.all(), many=True).data,
            "publications": PublicationSerializer(obj.publications.all(), many=True).data,
            "interests": obj.interests or {},
            "other_sections": obj.other_sections or {},
            "extraction_notes": obj.extraction_notes or {}
        }
        return extracted

    def get_scoring_results(self, obj):
        """Compose scoring results with summary and stored details"""
        final_scores = {
            "experience_depth_score": self._format_score(obj.experience_depth_score),
            "education_level_score": self._format_score(obj.education_level_score),
            "overall_weighted_score": self._format_score(obj.overall_weighted_score),
            "seniority_match_score": self._format_score(obj.seniority_match_score),
        }
        other_sections = obj.scoring_details or {}
        return {
            "final_scores": final_scores,
            **other_sections
        }

    def get_interpretation(self, obj):
        return obj.interpretation or {}

    def get_audit_trail(self, obj):
        return obj.audit_trail or {}

    class Meta:
        model = ParsedResume
        fields = [
            'id', 'resume', 'raw_text', 'parsed_data', 'parsed_at', 'updated_at',
            'ai_review', 'expected_salary',
            'extracted_resume_data', 'scoring_results', 'interpretation', 'audit_trail'
        ]
        read_only_fields = ['id', 'parsed_at', 'updated_at']


class ResumeSerializer(serializers.ModelSerializer):
    """Resume serializer"""
    parsed_data = serializers.SerializerMethodField()
    candidate_name = serializers.SerializerMethodField()
    
    def get_candidate_name(self, obj):
        """Safely get candidate name"""
        return obj.candidate.name if obj.candidate else None
    
    def get_parsed_data(self, obj):
        """Safely get parsed resume data"""
        try:
            # Check if parsed_data relationship exists
            if hasattr(obj, 'parsed_data') and obj.parsed_data is not None:
                return ParsedResumeSerializer(obj.parsed_data).data
            return None
        except Exception:
            return None
    
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
        read_only_fields = ['id', 'user', 'candidate', 'created_at', 'updated_at']


class TimelineEventSerializer(serializers.ModelSerializer):
    """Timeline event serializer"""
    class Meta:
        model = TimelineEvent
        fields = ['id', 'candidate', 'event_type', 'description', 'metadata', 'created_at']
        read_only_fields = ['id', 'created_at']


class JobScoreSerializer(serializers.ModelSerializer):
    """Job score serializer"""
    job_title = serializers.SerializerMethodField()
    candidate_name = serializers.CharField(source='candidate.name', read_only=True)
    
    def get_job_title(self, obj):
        """Safely get job title"""
        return obj.job.title if obj.job else None
    
    class Meta:
        model = JobScore
        fields = [
            'id', 'candidate', 'candidate_name', 'job', 'job_title',
            'score', 'experience_score', 'education_score', 'rank',
            'auto_rejected', 'rejection_reason', 'category', 'scored_at', 'updated_at'
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
            'id', 'email', 'name', 'phone', 'linkedin_url', 'github_url', 'state',
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
            'state', 'created_at', 'resume_count'
        ]
        read_only_fields = ['id', 'created_at']

