"""
Jobs app models
"""
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Department(models.Model):
    """Department model"""
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Job(models.Model):
    """Job Description model"""
    # Basic Information
    title = models.CharField(max_length=200)
    description = models.TextField()
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)
    location = models.CharField(max_length=200, blank=True, help_text="e.g. Tehran, Remote")
    
    # Employment Details
    EMPLOYMENT_TYPE_CHOICES = [
        ('full_time', 'Full-time'),
        ('part_time', 'Part-time'),
        ('contract', 'Contract'),
        ('internship', 'Internship'),
        ('temporary', 'Temporary'),
    ]
    employment_type = models.CharField(
        max_length=20,
        choices=EMPLOYMENT_TYPE_CHOICES,
        blank=True,
        help_text="Type of employment"
    )
    
    EXPERIENCE_LEVEL_CHOICES = [
        ('junior', 'Junior'),
        ('mid', 'Mid-level'),
        ('senior', 'Senior'),
        ('lead', 'Lead'),
        ('management', 'Management'),
    ]
    experience_level = models.CharField(
        max_length=20,
        choices=EXPERIENCE_LEVEL_CHOICES,
        blank=True,
        help_text="Required experience level"
    )
    
    # Salary
    salary_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    salary_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Skills
    # Format: [{"name": "Python", "priority": "Critical"}, ...]
    # Priority: "Critical", "Important", "Nice-to-have"
    required_skills = models.JSONField(
        default=list,
        blank=True,
        help_text="List of required skills with priority: [{'name': 'Python', 'priority': 'Critical'}, ...]"
    )
    
    # Experience Requirements
    experience_min_years = models.IntegerField(
        null=True,
        blank=True,
        help_text="Minimum years of experience required"
    )
    experience_min_years_auto_reject = models.BooleanField(
        default=False,
        help_text="Auto reject candidates who don't meet minimum years of experience"
    )
    
    # Demographic Requirements - Age Range
    age_range_min = models.IntegerField(
        null=True,
        blank=True,
        help_text="Minimum age requirement"
    )
    age_range_max = models.IntegerField(
        null=True,
        blank=True,
        help_text="Maximum age requirement"
    )
    age_range_auto_reject = models.BooleanField(
        default=False,
        help_text="Auto reject candidates who don't meet age range requirements"
    )
    
    # Demographic Requirements - Gender
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('any', 'Any'),
    ]
    gender = models.CharField(
        max_length=20,
        choices=GENDER_CHOICES,
        blank=True,
        help_text="Gender requirement"
    )
    gender_auto_reject = models.BooleanField(
        default=False,
        help_text="Auto reject candidates who don't meet gender requirement"
    )
    
    # Demographic Requirements - Military Status
    MILITARY_STATUS_CHOICES = [
        ('completed_or_full_exempt', 'Completed or Full Exempt'),
        ('educational_exempt', 'Educational Exempt'),
        ('any', 'Any'),
    ]
    military_status = models.CharField(
        max_length=30,
        choices=MILITARY_STATUS_CHOICES,
        blank=True,
        help_text="Military service status requirement"
    )
    military_auto_reject = models.BooleanField(
        default=False,
        help_text="Auto reject candidates who don't meet military status requirement"
    )
    
    # Demographic Requirements - Education Level
    EDUCATION_LEVEL_CHOICES = [
        ('diploma', 'Diploma'),
        ('bachelor', 'Bachelor'),
        ('master', 'Master'),
        ('doctorate', 'Doctorate'),
        ('postdoctoral', 'Postdoctoral'),
        ('any', 'Any'),
    ]
    education_level = models.CharField(
        max_length=20,
        choices=EDUCATION_LEVEL_CHOICES,
        blank=True,
        help_text="Education level requirement"
    )
    education_level_auto_reject = models.BooleanField(
        default=False,
        help_text="Auto reject candidates who don't meet education level requirement"
    )
    
    # Demographic Requirements - Education Major
    education_major = models.JSONField(
        default=list,
        blank=True,
        help_text="List of required education majors"
    )
    education_major_auto_reject = models.BooleanField(
        default=False,
        help_text="Auto reject candidates who don't meet education major requirement"
    )
    
    # Demographic Requirements - Preferred Universities
    preferred_universities_enabled = models.BooleanField(
        default=False,
        help_text="Enable preferred universities requirement"
    )
    preferred_universities_auto_reject = models.BooleanField(
        default=False,
        help_text="Auto reject candidates who don't meet preferred universities requirement"
    )
    preferred_universities = models.JSONField(
        default=list,
        blank=True,
        help_text="List of preferred universities (e.g., ['top_iranian', 'international', ...])"
    )
    
    # Demographic Requirements - Target Companies
    target_companies_enabled = models.BooleanField(
        default=False,
        help_text="Enable target companies requirement"
    )
    target_companies = models.JSONField(
        default=list,
        blank=True,
        help_text="List of target companies"
    )
    
    # Legacy auto_reject_rules (kept for backward compatibility)
    # Can be merged into demographic_requirements in the future
    auto_reject_rules = models.JSONField(
        default=dict,
        blank=True,
        help_text="Legacy: Rules for auto-rejecting candidates. Use demographic_requirements instead."
    )
    
    # Metadata
    created_by = models.ForeignKey(
        User, 
        on_delete=models.PROTECT, 
        null=False,
        related_name='created_jobs',
        help_text="User who created this job"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
