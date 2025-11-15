from django.contrib import admin
from .models import Department, Job


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    """Admin interface for Department model"""
    list_display = ('name', 'description', 'created_at', 'updated_at')
    list_filter = ('created_at',)
    search_fields = ('name', 'description')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    """Admin interface for Job model"""
    list_display = ('title', 'department', 'location', 'employment_type', 'experience_level', 'created_by', 'created_at')
    list_filter = ('department', 'employment_type', 'experience_level', 'created_at', 'created_by')
    search_fields = ('title', 'description', 'location')
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'department', 'location')
        }),
        ('Employment Details', {
            'fields': ('employment_type', 'experience_level')
        }),
        ('Salary', {
            'fields': ('salary_min', 'salary_max'),
            'classes': ('collapse',)
        }),
        ('Skills & Experience', {
            'fields': ('required_skills', 'experience_min_years', 'experience_min_years_auto_reject')
        }),
        ('Demographic Requirements - Age', {
            'fields': ('age_range_min', 'age_range_max', 'age_range_auto_reject'),
            'classes': ('collapse',)
        }),
        ('Demographic Requirements - Gender', {
            'fields': ('gender', 'gender_auto_reject'),
            'classes': ('collapse',)
        }),
        ('Demographic Requirements - Military Status', {
            'fields': ('military_status', 'military_auto_reject'),
            'classes': ('collapse',)
        }),
        ('Demographic Requirements - Education', {
            'fields': (
                'education_level', 'education_level_auto_reject',
                'education_major', 'education_major_auto_reject'
            ),
            'classes': ('collapse',)
        }),
        ('Demographic Requirements - Universities', {
            'fields': (
                'preferred_universities_enabled',
                'preferred_universities_auto_reject',
                'preferred_universities'
            ),
            'classes': ('collapse',)
        }),
        ('Demographic Requirements - Companies', {
            'fields': ('target_companies_enabled', 'target_companies'),
            'classes': ('collapse',)
        }),
        ('Legacy Settings', {
            'fields': ('auto_reject_rules',),
            'classes': ('collapse',),
            'description': 'Legacy field for backward compatibility'
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at')
        }),
    )
    
    def save_model(self, request, obj, form, change):
        """Set created_by to current user if creating a new job"""
        if not change:  # If creating a new object
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
