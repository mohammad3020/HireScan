"""
Candidates app models
"""
from django.db import models
from django.contrib.auth.models import User


class Candidate(models.Model):
    """Candidate model"""
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20, blank=True)
    linkedin_url = models.URLField(blank=True)
    github_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.email})"


class Resume(models.Model):
    """Resume file model"""
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name='resumes')
    file = models.FileField(upload_to='resumes/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f"Resume for {self.candidate.name}"


class ParsedResume(models.Model):
    """Parsed resume data model"""
    resume = models.OneToOneField(Resume, on_delete=models.CASCADE, related_name='parsed_data')
    raw_text = models.TextField(blank=True)
    parsed_data = models.JSONField(default=dict, help_text="Structured data from AI parsing")
    parsed_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Parsed resume for {self.resume.candidate.name}"


class Experience(models.Model):
    """Work experience model"""
    parsed_resume = models.ForeignKey(ParsedResume, on_delete=models.CASCADE, related_name='experiences')
    company = models.CharField(max_length=200)
    role = models.CharField(max_length=200)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    is_current = models.BooleanField(default=False)
    description = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-start_date', '-end_date']
    
    def __str__(self):
        return f"{self.role} at {self.company}"


class Skill(models.Model):
    """Skill model"""
    parsed_resume = models.ForeignKey(ParsedResume, on_delete=models.CASCADE, related_name='skills')
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=50, blank=True, help_text="e.g., programming, soft skills")
    proficiency = models.CharField(
        max_length=20,
        blank=True,
        choices=[
            ('beginner', 'Beginner'),
            ('intermediate', 'Intermediate'),
            ('advanced', 'Advanced'),
            ('expert', 'Expert'),
        ]
    )
    
    class Meta:
        ordering = ['category', 'name']
        unique_together = ['parsed_resume', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.category})"


class Note(models.Model):
    """Note model for candidates"""
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name='notes')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Note for {self.candidate.name} by {self.user}"


class TimelineEvent(models.Model):
    """Timeline event model for candidate activity"""
    EVENT_TYPES = [
        ('uploaded', 'Resume Uploaded'),
        ('parsed', 'Resume Parsed'),
        ('scored', 'Scored for Job'),
        ('ranked', 'Ranked'),
        ('auto_rejected', 'Auto-Rejected'),
        ('note_added', 'Note Added'),
        ('status_changed', 'Status Changed'),
    ]
    
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name='timeline_events')
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    description = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.event_type} for {self.candidate.name}"


class JobScore(models.Model):
    """Job score model - scores a candidate for a specific job"""
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name='job_scores')
    job = models.ForeignKey('jobs.Job', on_delete=models.CASCADE, related_name='candidate_scores')
    score = models.FloatField(help_text="Score out of 100")
    rank = models.IntegerField(null=True, blank=True, help_text="Rank among all candidates for this job")
    auto_rejected = models.BooleanField(default=False)
    rejection_reason = models.TextField(blank=True)
    scored_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-score', 'rank']
        unique_together = ['candidate', 'job']
    
    def __str__(self):
        return f"{self.candidate.name} - {self.job.title}: {self.score}"
