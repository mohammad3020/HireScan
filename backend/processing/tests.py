import uuid
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase

from candidates.models import Candidate, Resume, ParsedResume, Experience, Education
from jobs.models import Job, Department
from processing.services import apply_auto_reject_rules


class ApplyAutoRejectRulesTests(TestCase):
    def setUp(self):
        user_model = get_user_model()
        self.user = user_model.objects.create_user(
            email='test@example.com',
            password='password123'
        )
        self.department = Department.objects.create(name='Engineering')

    def _create_candidate_with_parsed_resume(self, **parsed_kwargs):
        unique_email = f"candidate_{uuid.uuid4().hex[:10]}@example.com"
        candidate = Candidate.objects.create(
            name='Test Candidate',
            email=unique_email,
        )
        resume_file = SimpleUploadedFile(f"{uuid.uuid4().hex}.pdf", b"%PDF-1.4 test content")
        resume = Resume.objects.create(candidate=candidate, file=resume_file)
        parsed_resume = ParsedResume.objects.create(
            resume=resume,
            raw_text='',
            parsed_data=parsed_kwargs.get('parsed_data', {}),
            date_of_birth=parsed_kwargs.get('date_of_birth', ''),
            military_service=parsed_kwargs.get('military_service', ''),
        )
        return candidate, parsed_resume

    def _create_job(self, **overrides):
        defaults = {
            'title': 'Sample Job',
            'description': 'Job description',
            'department': self.department,
            'created_by': self.user,
        }
        defaults.update(overrides)
        return Job.objects.create(**defaults)

    def test_experience_auto_reject_when_years_below_requirement(self):
        candidate, parsed_resume = self._create_candidate_with_parsed_resume()
        Experience.objects.create(
            parsed_resume=parsed_resume,
            job_title='Developer',
            company='ACME',
            duration_months=12,
        )
        job = self._create_job(
            experience_min_years=5,
            experience_min_years_auto_reject=True,
        )

        is_rejected, reason = apply_auto_reject_rules(candidate, job)

        self.assertTrue(is_rejected)
        self.assertIn('experience', reason.lower())

    def test_age_auto_reject_when_candidate_outside_range(self):
        candidate, _ = self._create_candidate_with_parsed_resume(date_of_birth='1980-01-01')
        job = self._create_job(
            age_range_min=25,
            age_range_max=35,
            age_range_auto_reject=True,
        )

        is_rejected, reason = apply_auto_reject_rules(candidate, job)

        self.assertTrue(is_rejected)
        self.assertIn('age requirement mismatch', reason.lower())

    def test_preferred_universities_auto_reject_without_match(self):
        candidate, parsed_resume = self._create_candidate_with_parsed_resume()
        Education.objects.create(
            parsed_resume=parsed_resume,
            degree='Bachelor of Science',
            field='Computer Engineering',
            institution='University of Tehran',
            institution_category='Top Iranian Universities',
        )
        job = self._create_job(
            preferred_universities_enabled=True,
            preferred_universities_auto_reject=True,
            preferred_universities=['international'],
        )

        is_rejected, reason = apply_auto_reject_rules(candidate, job)

        self.assertTrue(is_rejected)
        self.assertIn('university', reason.lower())
