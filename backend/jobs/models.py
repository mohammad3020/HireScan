"""
Jobs app models
"""
from django.db import models
from django.contrib.auth.models import User


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
    title = models.CharField(max_length=200)
    description = models.TextField()
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)
    salary_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    salary_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    required_skills = models.JSONField(default=list, blank=True, help_text="List of required skills")
    auto_reject_rules = models.JSONField(
        default=dict,
        blank=True,
        help_text="Rules for auto-rejecting candidates (e.g., min_years_experience, required_certifications)"
    )
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_jobs')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
