from django.contrib import admin
from .models import (
    Candidate, Resume, ParsedResume,
    Education, Experience,
    TechnicalSkill, SoftSkill, SkillMentionedInJobTitle,
    Project, Award, Language, Course, Publication,
    Note, TimelineEvent, JobScore
)


@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'phone', 'created_at']
    search_fields = ['name', 'email', 'phone']
    list_filter = ['created_at']


@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ['candidate', 'file', 'uploaded_at']
    search_fields = ['candidate__name', 'candidate__email']
    list_filter = ['uploaded_at']


class EducationInline(admin.TabularInline):
    model = Education
    extra = 0


class ExperienceInline(admin.TabularInline):
    model = Experience
    extra = 0


class TechnicalSkillInline(admin.TabularInline):
    model = TechnicalSkill
    extra = 0


class SoftSkillInline(admin.TabularInline):
    model = SoftSkill
    extra = 0


class SkillMentionedInJobTitleInline(admin.TabularInline):
    model = SkillMentionedInJobTitle
    extra = 0


class ProjectInline(admin.TabularInline):
    model = Project
    extra = 0


class AwardInline(admin.TabularInline):
    model = Award
    extra = 0


class LanguageInline(admin.TabularInline):
    model = Language
    extra = 0


class CourseInline(admin.TabularInline):
    model = Course
    extra = 0


class PublicationInline(admin.TabularInline):
    model = Publication
    extra = 0


@admin.register(ParsedResume)
class ParsedResumeAdmin(admin.ModelAdmin):
    list_display = ['resume', 'full_name', 'email', 'phone', 'parsed_at']
    search_fields = ['full_name', 'email', 'phone', 'resume__candidate__name']
    list_filter = ['parsed_at']
    readonly_fields = ['parsed_at', 'updated_at']
    inlines = [
        EducationInline,
        ExperienceInline,
        TechnicalSkillInline,
        SoftSkillInline,
        SkillMentionedInJobTitleInline,
        ProjectInline,
        AwardInline,
        LanguageInline,
        CourseInline,
        PublicationInline,
    ]
    fieldsets = (
        ('Resume', {
            'fields': ('resume', 'raw_text', 'parsed_data')
        }),
        ('Personal Information', {
            'fields': (
                'full_name', 'phone', 'email', 'address',
                'date_of_birth', 'marital_status', 'military_service'
            )
        }),
        ('Links', {
            'fields': (
                'linkedin_url', 'github_url', 'portfolio_url',
                'website_url', 'other_links'
            )
        }),
        ('Additional Data', {
            'fields': ('interests', 'other_sections', 'extraction_notes'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('parsed_at', 'updated_at')
        }),
    )


@admin.register(Education)
class EducationAdmin(admin.ModelAdmin):
    list_display = ['parsed_resume', 'degree', 'field', 'institution', 'start_date']
    search_fields = ['degree', 'field', 'institution']
    list_filter = ['degree']


@admin.register(Experience)
class ExperienceAdmin(admin.ModelAdmin):
    list_display = ['parsed_resume', 'job_title', 'company', 'start_date', 'is_currently_employed']
    search_fields = ['job_title', 'company']
    list_filter = ['is_currently_employed', 'employment_type']


@admin.register(TechnicalSkill)
class TechnicalSkillAdmin(admin.ModelAdmin):
    list_display = ['parsed_resume', 'category', 'name', 'level']
    search_fields = ['name', 'category']
    list_filter = ['category']


@admin.register(SoftSkill)
class SoftSkillAdmin(admin.ModelAdmin):
    list_display = ['parsed_resume', 'name']
    search_fields = ['name']


@admin.register(SkillMentionedInJobTitle)
class SkillMentionedInJobTitleAdmin(admin.ModelAdmin):
    list_display = ['parsed_resume', 'name']
    search_fields = ['name']


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['parsed_resume', 'name', 'role', 'date']
    search_fields = ['name', 'role']


@admin.register(Award)
class AwardAdmin(admin.ModelAdmin):
    list_display = ['parsed_resume', 'title', 'issuer', 'date']
    search_fields = ['title', 'issuer']


@admin.register(Language)
class LanguageAdmin(admin.ModelAdmin):
    list_display = ['parsed_resume', 'language', 'proficiency']
    search_fields = ['language']


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['parsed_resume', 'name', 'provider', 'completion_date']
    search_fields = ['name', 'provider']


@admin.register(Publication)
class PublicationAdmin(admin.ModelAdmin):
    list_display = ['parsed_resume', 'title', 'venue', 'year']
    search_fields = ['title', 'venue']


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ['candidate', 'user', 'created_at']
    search_fields = ['content', 'candidate__name']
    list_filter = ['created_at']


@admin.register(TimelineEvent)
class TimelineEventAdmin(admin.ModelAdmin):
    list_display = ['candidate', 'event_type', 'created_at']
    search_fields = ['description', 'candidate__name']
    list_filter = ['event_type', 'created_at']


@admin.register(JobScore)
class JobScoreAdmin(admin.ModelAdmin):
    list_display = ['candidate', 'job', 'score', 'rank', 'auto_rejected']
    search_fields = ['candidate__name', 'job__title']
    list_filter = ['auto_rejected', 'job']
