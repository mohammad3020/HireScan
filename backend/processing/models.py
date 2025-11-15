"""
Processing app models
"""
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class BatchUpload(models.Model):
    """Batch upload model"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    total_files = models.IntegerField(default=0)
    processed_files = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Batch {self.id} - {self.status} ({self.processed_files}/{self.total_files})"
    
    @property
    def progress_percentage(self):
        """Calculate progress percentage"""
        if self.total_files == 0:
            return 0
        return int((self.processed_files / self.total_files) * 100)


class FileItem(models.Model):
    """File item in a batch upload"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    batch = models.ForeignKey(BatchUpload, on_delete=models.CASCADE, related_name='file_items')
    file = models.FileField(upload_to='batch_uploads/')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(blank=True)
    candidate = models.ForeignKey('candidates.Candidate', on_delete=models.SET_NULL, null=True, blank=True, related_name='file_items')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"File {self.id} in batch {self.batch.id} - {self.status}"


class Ranking(models.Model):
    """Ranking model for job candidates"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    job = models.ForeignKey('jobs.Job', on_delete=models.CASCADE, related_name='rankings')
    batch = models.ForeignKey(BatchUpload, on_delete=models.CASCADE, related_name='rankings', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    ranked_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['job', 'batch']
    
    def __str__(self):
        return f"Ranking for {self.job.title} - {self.status}"
