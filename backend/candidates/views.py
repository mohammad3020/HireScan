"""
Candidates app views
"""
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Candidate, Resume, Note, TimelineEvent
from .serializers import (
    CandidateSerializer, CandidateListSerializer, ResumeSerializer,
    NoteSerializer, TimelineEventSerializer
)


class CandidateViewSet(viewsets.ModelViewSet):
    """Candidate viewset"""
    queryset = Candidate.objects.prefetch_related(
        'resumes', 'notes', 'timeline_events', 'job_scores'
    ).all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['email']
    search_fields = ['name', 'email', 'phone']
    ordering_fields = ['created_at', 'name']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Use different serializers for list and detail"""
        if self.action == 'list':
            return CandidateListSerializer
        return CandidateSerializer
    
    @action(detail=True, methods=['get'])
    def detail(self, request, pk=None):
        """Get full candidate detail with all related data"""
        candidate = self.get_object()
        serializer = CandidateSerializer(candidate)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_note(self, request, pk=None):
        """Add a note to a candidate"""
        candidate = self.get_object()
        serializer = NoteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(candidate=candidate, user=request.user)
            # Create timeline event
            TimelineEvent.objects.create(
                candidate=candidate,
                event_type='note_added',
                description=f"Note added by {request.user.username}",
                metadata={'note_id': serializer.instance.id}
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def timeline(self, request, pk=None):
        """Get candidate timeline events"""
        candidate = self.get_object()
        events = candidate.timeline_events.all()
        serializer = TimelineEventSerializer(events, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def notes(self, request, pk=None):
        """Get candidate notes"""
        candidate = self.get_object()
        notes = candidate.notes.all()
        serializer = NoteSerializer(notes, many=True)
        return Response(serializer.data)


class ResumeViewSet(viewsets.ModelViewSet):
    """Resume viewset"""
    queryset = Resume.objects.select_related('candidate', 'parsed_data').all()
    serializer_class = ResumeSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['candidate']
    ordering_fields = ['uploaded_at']
    ordering = ['-uploaded_at']
