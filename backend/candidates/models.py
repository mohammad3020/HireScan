"""
Candidates app models
"""
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


def default_dict():
    """Helper function for JSONField default dict"""
    return {}


def default_list():
    """Helper function for JSONField default list"""
    return []


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
    """Parsed resume data model - stores all parsed CV information"""
    resume = models.OneToOneField(Resume, on_delete=models.CASCADE, related_name='parsed_data')
    raw_text = models.TextField(blank=True, help_text="Extracted raw text from CV file")
    parsed_data = models.JSONField(default=default_dict, help_text="Complete structured data from AI parsing (backup)")
    parsed_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Personal Information
    full_name = models.CharField(max_length=200, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    date_of_birth = models.CharField(max_length=100, blank=True)
    marital_status = models.CharField(max_length=50, blank=True)
    military_service = models.CharField(max_length=100, blank=True, null=True)
    
    # Links
    linkedin_url = models.URLField(blank=True)
    github_url = models.URLField(blank=True)
    portfolio_url = models.URLField(blank=True)
    website_url = models.URLField(blank=True)
    other_links = models.JSONField(default=default_list, blank=True, help_text="List of other links")
    
    # Complex nested data stored as JSON
    interests = models.JSONField(default=default_dict, blank=True, help_text="Professional, personal, volunteer interests and memberships")
    other_sections = models.JSONField(default=default_dict, blank=True, help_text="Professional summary, career objectives, references, custom sections")
    extraction_notes = models.JSONField(default=default_dict, blank=True, help_text="Ambiguous items, missing sections, quality issues, special notes")
    
    # AI Review and Salary (from AI parsing JSON response)
    ai_review = models.TextField(blank=True, help_text="AI summary and review of candidate's qualifications")
    expected_salary = models.CharField(max_length=200, blank=True, help_text="Expected salary from resume (e.g., '45 Million Toman / Month')")

    # Scoring summary (selected fields are exposed to UI)
    experience_depth_score = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="EDS summary score (0-100, 2 decimals)"
    )
    education_level_score = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="ELS summary score (0-100, 2 decimals)"
    )
    overall_weighted_score = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Overall weighted score (0-100, 2 decimals)"
    )
    seniority_match_score = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Seniority match score (0-100, 2 decimals)"
    )
    scoring_details = models.JSONField(
        default=default_dict,
        blank=True,
        help_text="Full scoring_results.detailed_calculations payload"
    )

    # Narrative sections
    interpretation = models.JSONField(
        default=default_dict,
        blank=True,
        help_text="Interpretation and seniority fit analysis"
    )
    audit_trail = models.JSONField(
        default=default_dict,
        blank=True,
        help_text="Audit trail, completeness and assumptions"
    )
    
    class Meta:
        ordering = ['-parsed_at']
    
    def __str__(self):
        return f"Parsed resume for {self.resume.candidate.name}"


class Education(models.Model):
    """Education model"""
    parsed_resume = models.ForeignKey(ParsedResume, on_delete=models.CASCADE, related_name='educations')
    degree = models.CharField(max_length=100, help_text="مقطع تحصیلی")
    field = models.CharField(max_length=200, help_text="رشته/گرایش تحصیلی")
    institution = models.CharField(max_length=200, help_text="نام دانشگاه/مؤسسه")
    location = models.CharField(max_length=200, blank=True, help_text="شهر، کشور")
    institution_category = models.CharField(
        max_length=100,
        blank=True,
        help_text="Institution category (e.g., Top Iranian Universities, International)"
    )
    graduation_year = models.IntegerField(
        null=True,
        blank=True,
        help_text="Graduation year (numeric)"
    )
    start_date = models.CharField(max_length=50, blank=True, help_text="تاریخ شروع")
    end_date = models.CharField(max_length=50, blank=True, help_text="تاریخ پایان یا 'در حال تحصیل'")
    gpa = models.CharField(max_length=50, blank=True, null=True, help_text="معدل و مقیاس")
    honors = models.CharField(max_length=200, blank=True, null=True, help_text="رتبه/افتخارات")
    thesis = models.CharField(max_length=500, blank=True, null=True, help_text="عنوان پایان‌نامه")
    relevant_courses = models.JSONField(default=default_list, blank=True, help_text="دروس مرتبط")
    order = models.IntegerField(default=0, help_text="Order for sorting")
    
    class Meta:
        ordering = ['order', '-start_date']
    
    def __str__(self):
        return f"{self.degree} in {self.field} at {self.institution}"


class Experience(models.Model):
    """Work experience model"""
    parsed_resume = models.ForeignKey(ParsedResume, on_delete=models.CASCADE, related_name='experiences')
    job_title = models.CharField(max_length=200, blank=True, help_text="عنوان شغلی")
    company = models.CharField(max_length=200, blank=True, help_text="نام شرکت/سازمان")
    company_type = models.CharField(max_length=200, blank=True, null=True, help_text="نوع شرکت")
    location = models.CharField(max_length=200, blank=True, help_text="شهر، کشور")
    employment_type = models.CharField(max_length=100, blank=True, null=True, help_text="نوع همکاری")
    start_date = models.CharField(max_length=50, blank=True, help_text="تاریخ شروع")
    end_date = models.CharField(max_length=50, blank=True, null=True, help_text="تاریخ پایان یا 'تاکنون'")
    duration = models.CharField(max_length=50, blank=True, null=True, help_text="Legacy duration text")
    duration_months = models.IntegerField(
        null=True,
        blank=True,
        help_text="Duration in months (numeric)"
    )
    is_currently_employed = models.BooleanField(default=False, help_text="آیا در حال حاضر مشغول به کار است")
    reasoning = models.TextField(blank=True, help_text="توضیح کوتاه به فارسی")
    responsibilities = models.JSONField(default=default_list, blank=True, help_text="شرح وظایف و دستاوردها")
    extracted_skills = models.JSONField(
        default=default_list,
        blank=True,
        help_text="Skills automatically extracted from responsibilities"
    )
    order = models.IntegerField(default=0, help_text="Order for sorting")
    # Legacy fields for backward compatibility
    role = models.CharField(max_length=200, blank=True, help_text="Legacy: role field")
    is_current = models.BooleanField(default=False, help_text="Legacy: is_current field")
    description = models.TextField(blank=True, help_text="Legacy: description field")
    
    class Meta:
        ordering = ['order', '-start_date']
    
    def __str__(self):
        return f"{self.job_title or self.role} at {self.company}"


class TechnicalSkill(models.Model):
    """Technical skill model with category and level"""
    parsed_resume = models.ForeignKey(ParsedResume, on_delete=models.CASCADE, related_name='technical_skills')
    category = models.CharField(
        max_length=100,
        blank=True,
        help_text="دسته‌بندی مهارت (مثلاً: زبان‌های برنامه‌نویسی، فریمورک‌ها)"
    )
    name = models.CharField(max_length=100, help_text="نام مهارت")
    level = models.CharField(max_length=50, blank=True, null=True, help_text="سطح تسلط (مثلاً: پیشرفته، متوسط)")
    
    class Meta:
        ordering = ['category', 'name']
        unique_together = ['parsed_resume', 'category', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.category}) - {self.level or 'N/A'}"


class SoftSkill(models.Model):
    """Soft skill model"""
    parsed_resume = models.ForeignKey(ParsedResume, on_delete=models.CASCADE, related_name='soft_skills')
    name = models.CharField(max_length=100)
    
    class Meta:
        ordering = ['name']
        unique_together = ['parsed_resume', 'name']
    
    def __str__(self):
        return self.name


class SkillMentionedInJobTitle(models.Model):
    """Skills mentioned in job titles"""
    parsed_resume = models.ForeignKey(ParsedResume, on_delete=models.CASCADE, related_name='skills_mentioned_in_job_title')
    name = models.CharField(max_length=100)
    
    class Meta:
        ordering = ['name']
        unique_together = ['parsed_resume', 'name']
    
    def __str__(self):
        return self.name


class Project(models.Model):
    """Project model"""
    parsed_resume = models.ForeignKey(ParsedResume, on_delete=models.CASCADE, related_name='projects')
    name = models.CharField(max_length=200, help_text="نام پروژه")
    role = models.CharField(max_length=200, blank=True, help_text="نقش")
    date = models.CharField(max_length=100, blank=True, help_text="تاریخ/مدت زمان")
    technologies = models.JSONField(default=default_list, blank=True, help_text="تکنولوژی‌های استفاده شده")
    description = models.TextField(blank=True, help_text="توضیحات کامل")
    link = models.URLField(blank=True, null=True, help_text="لینک پروژه")
    order = models.IntegerField(default=0, help_text="Order for sorting")
    
    class Meta:
        ordering = ['order', '-date']
    
    def __str__(self):
        return self.name


class Award(models.Model):
    """Award model"""
    parsed_resume = models.ForeignKey(ParsedResume, on_delete=models.CASCADE, related_name='awards')
    title = models.CharField(max_length=200, help_text="عنوان جایزه")
    issuer = models.CharField(max_length=200, blank=True, null=True, help_text="مؤسسه اهداکننده")
    rank = models.CharField(max_length=100, blank=True, null=True, help_text="رتبه")
    date = models.CharField(max_length=50, blank=True, null=True, help_text="تاریخ")
    description = models.TextField(blank=True, help_text="توضیح مختصر")
    order = models.IntegerField(default=0, help_text="Order for sorting")
    
    class Meta:
        ordering = ['order', '-date']
    
    def __str__(self):
        return self.title


class Language(models.Model):
    """Language model"""
    parsed_resume = models.ForeignKey(ParsedResume, on_delete=models.CASCADE, related_name='languages')
    language = models.CharField(max_length=100, help_text="نام زبان")
    proficiency = models.CharField(max_length=50, blank=True, null=True, help_text="سطح تسلط کلی")
    skills = models.JSONField(default=default_dict, blank=True, null=True, help_text="سطح گفتاری، نوشتاری، شنیداری، خواندن")
    certificates = models.JSONField(default=default_list, blank=True, help_text="گواهینامه‌های زبان")
    
    class Meta:
        ordering = ['language']
        unique_together = ['parsed_resume', 'language']
    
    def __str__(self):
        return f"{self.language} - {self.proficiency or 'N/A'}"


class Course(models.Model):
    """Course model"""
    parsed_resume = models.ForeignKey(ParsedResume, on_delete=models.CASCADE, related_name='courses')
    name = models.CharField(max_length=200, help_text="نام دوره")
    provider = models.CharField(max_length=200, blank=True, null=True, help_text="مؤسسه برگزارکننده")
    instructor = models.CharField(max_length=200, blank=True, null=True, help_text="مدرس")
    completion_date = models.CharField(max_length=50, blank=True, null=True, help_text="تاریخ اتمام")
    duration = models.CharField(max_length=100, blank=True, null=True, help_text="مدت زمان")
    certificate_id = models.CharField(max_length=100, blank=True, null=True, help_text="شماره گواهی")
    verification_link = models.URLField(blank=True, null=True, help_text="لینک تأیید")
    order = models.IntegerField(default=0, help_text="Order for sorting")
    
    class Meta:
        ordering = ['order', '-completion_date']
    
    def __str__(self):
        return self.name


class Certification(models.Model):
    """Certification model"""
    parsed_resume = models.ForeignKey(ParsedResume, on_delete=models.CASCADE, related_name='certifications')
    name = models.CharField(max_length=200, help_text="نام گواهی")
    issuer = models.CharField(max_length=200, blank=True, null=True, help_text="صادرکننده")
    date = models.CharField(max_length=50, blank=True, null=True, help_text="تاریخ دریافت")
    description = models.TextField(blank=True, help_text="توضیحات یا مهارت‌های پوشش داده شده")
    certificate_id = models.CharField(max_length=100, blank=True, null=True, help_text="شماره گواهی")
    verification_link = models.URLField(blank=True, null=True, help_text="لینک تأیید")
    order = models.IntegerField(default=0, help_text="Order for sorting")

    class Meta:
        ordering = ['order', '-date']

    def __str__(self):
        return self.name


class Publication(models.Model):
    """Publication model"""
    parsed_resume = models.ForeignKey(ParsedResume, on_delete=models.CASCADE, related_name='publications')
    title = models.CharField(max_length=500, help_text="عنوان مقاله")
    authors = models.JSONField(default=default_list, blank=True, help_text="نویسندگان")
    venue = models.CharField(max_length=200, blank=True, null=True, help_text="نام ژورنال/کنفرانس")
    year = models.CharField(max_length=10, blank=True, null=True, help_text="سال انتشار")
    volume_pages = models.CharField(max_length=100, blank=True, null=True, help_text="شماره مجلد/صفحات")
    doi = models.CharField(max_length=200, blank=True, null=True, help_text="DOI")
    link = models.URLField(blank=True, null=True, help_text="لینک")
    citations = models.CharField(max_length=50, blank=True, null=True, help_text="تعداد ارجاعات")
    order = models.IntegerField(default=0, help_text="Order for sorting")
    
    class Meta:
        ordering = ['order', '-year']
    
    def __str__(self):
        return self.title


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
    metadata = models.JSONField(default=default_dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.event_type} for {self.candidate.name}"


class JobScore(models.Model):
    """Job score model - scores a candidate for a specific job"""
    CATEGORY_CHOICES = [
        ('shortlisted', 'Shortlisted'),
        ('rejected', 'Rejected'),
        ('interview_scheduled', 'Interview Scheduled'),
        ('interviewed', 'Interviewed'),
        ('offer_sent', 'Offer Sent'),
        ('hired', 'Hired'),
    ]
    
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name='job_scores')
    job = models.ForeignKey('jobs.Job', on_delete=models.CASCADE, related_name='candidate_scores')
    score = models.FloatField(help_text="Overall score out of 100 (from scoring response)")
    experience_score = models.FloatField(null=True, blank=True, help_text="Experience score out of 100 (from scoring response)")
    education_score = models.FloatField(null=True, blank=True, help_text="Education score out of 100 (from scoring response)")
    rank = models.IntegerField(null=True, blank=True, help_text="Rank among all candidates for this job")
    auto_rejected = models.BooleanField(default=False)
    rejection_reason = models.TextField(blank=True)
    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default='shortlisted',
        help_text="Candidate status/category for this job"
    )
    scored_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-score', 'rank']
        unique_together = ['candidate', 'job']
    
    def __str__(self):
        return f"{self.candidate.name} - {self.job.title}: {self.score}"
