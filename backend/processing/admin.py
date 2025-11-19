from django.contrib import admin
from .models import BatchUpload, FileItem, Ranking


class FileItemInline(admin.TabularInline):
    """Inline admin for FileItem"""
    model = FileItem
    extra = 0
    readonly_fields = ('created_at',)
    fields = ('file', 'status', 'candidate', 'error_message', 'created_at')
    can_delete = False


@admin.register(BatchUpload)
class BatchUploadAdmin(admin.ModelAdmin):
    """Admin interface for BatchUpload model"""
    list_display = ('id', 'user', 'job', 'status', 'progress_display', 'total_files', 'processed_files', 'created_at')
    list_filter = ('status', 'created_at', 'job')
    search_fields = ('id', 'user__email', 'job__title', 'error_message')
    readonly_fields = ('created_at', 'updated_at', 'progress_percentage')
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'job', 'status')
        }),
        ('Progress', {
            'fields': ('total_files', 'processed_files', 'progress_percentage')
        }),
        ('Error Information', {
            'fields': ('error_message',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    inlines = [FileItemInline]
    
    def progress_display(self, obj):
        """Display progress as percentage"""
        return f"{obj.progress_percentage}%"
    progress_display.short_description = 'Progress'


@admin.register(FileItem)
class FileItemAdmin(admin.ModelAdmin):
    """Admin interface for FileItem model"""
    list_display = ('id', 'batch', 'file', 'status', 'candidate', 'created_at')
    list_filter = ('status', 'created_at', 'batch')
    search_fields = ('file', 'candidate__name', 'candidate__email', 'error_message')
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('File Information', {
            'fields': ('batch', 'file', 'status')
        }),
        ('Processing Result', {
            'fields': ('candidate', 'error_message')
        }),
        ('Timestamps', {
            'fields': ('created_at',)
        }),
    )


@admin.register(Ranking)
class RankingAdmin(admin.ModelAdmin):
    """Admin interface for Ranking model"""
    list_display = ('id', 'job', 'batch', 'status', 'ranked_at', 'created_at')
    list_filter = ('status', 'created_at', 'job')
    search_fields = ('job__title', 'batch__id')
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Ranking Information', {
            'fields': ('job', 'batch', 'status', 'ranked_at')
        }),
        ('Timestamps', {
            'fields': ('created_at',)
        }),
    )
