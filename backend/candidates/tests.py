from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase

from .models import (
    Candidate,
    Resume,
    ParsedResume,
    Education,
    Experience,
    TechnicalSkill,
    SoftSkill,
    SkillMentionedInJobTitle,
    Project,
    Award,
    Language,
    Course,
    Certification,
    Publication,
)
from .serializers import ParsedResumeSerializer


class ParsedResumeSerializerTests(TestCase):
    def setUp(self):
        self.candidate = Candidate.objects.create(
            email="candidate@example.com",
            name="Placeholder Name",
            phone="+123456789",
        )
        resume_file = SimpleUploadedFile("resume.pdf", b"dummy content", content_type="application/pdf")
        self.resume = Resume.objects.create(candidate=self.candidate, file=resume_file)
        self.parsed_resume = ParsedResume.objects.create(
            resume=self.resume,
            raw_text="Sample resume text",
            parsed_data={"foo": "bar"},
            full_name="Test User",
            phone="+9800112233",
            email="test.user@example.com",
            address="Tehran, Iran",
            date_of_birth="1990-01-01",
            marital_status="Single",
            military_service="Completed",
            linkedin_url="https://linkedin.com/in/test",
            github_url="https://github.com/test",
            portfolio_url="https://test.dev",
            website_url="https://test.site",
            other_links=["https://twitter.com/test"],
            interests={"professional": ["AI"], "personal": ["Music"]},
            other_sections={"summary": "Seasoned engineer"},
            extraction_notes={"ambiguous_items": ["Phone number format"]},
            experience_depth_score=75.5,
            education_level_score=82.1,
            overall_weighted_score=78.3,
            seniority_match_score=88.0,
            scoring_details={
                "detailed_calculations": {"total_weighted_years": 4.2},
                "seniority_match_calculation": {"target_seniority": "Senior"},
            },
            interpretation={
                "seniority_fit_analysis": {"fit_level": "Good", "explanation": "Aligned experience"},
                "strengths": ["Leadership"],
            },
            audit_trail={
                "data_completeness": {"positions_complete": 2, "positions_total": 3},
                "warnings": ["Missing GPA"],
            },
        )

        Education.objects.create(
            parsed_resume=self.parsed_resume,
            degree="Masters",
            field="Computer Science",
            institution="Sharif University",
            location="Tehran",
            institution_category="Top Iranian Universities",
            graduation_year=2015,
            start_date="2013",
            end_date="2015",
            order=0,
        )
        Experience.objects.create(
            parsed_resume=self.parsed_resume,
            job_title="Senior Engineer",
            company="Tech Co",
            location="Tehran",
            employment_type="Full-time",
            start_date="2018-01",
            end_date="2020-12",
            duration="3 years",
            duration_months=36,
            is_currently_employed=False,
            responsibilities=["Built systems"],
            extracted_skills=["Python", "Django"],
            order=0,
        )
        TechnicalSkill.objects.create(
            parsed_resume=self.parsed_resume,
            category="Programming",
            name="Python",
            level="Advanced",
        )
        SoftSkill.objects.create(parsed_resume=self.parsed_resume, name="Communication")
        SkillMentionedInJobTitle.objects.create(parsed_resume=self.parsed_resume, name="Leadership")
        Project.objects.create(parsed_resume=self.parsed_resume, name="AI Platform", order=0)
        Award.objects.create(parsed_resume=self.parsed_resume, title="Best Engineer", order=0)
        Language.objects.create(parsed_resume=self.parsed_resume, language="English", proficiency="Advanced")
        Course.objects.create(parsed_resume=self.parsed_resume, name="ML Specialization", order=0)
        Certification.objects.create(parsed_resume=self.parsed_resume, name="AWS Architect", issuer="AWS", order=0)
        Publication.objects.create(parsed_resume=self.parsed_resume, title="AI Paper", order=0)

    def test_parsed_resume_serializer_matches_ai_structure(self):
        serializer = ParsedResumeSerializer(self.parsed_resume)
        data = serializer.data

        self.assertIn("extracted_resume_data", data)
        extracted = data["extracted_resume_data"]

        personal_info = extracted["personal_info"]
        self.assertEqual(personal_info["full_name"], "Test User")
        self.assertEqual(personal_info["links"]["linkedin"], "https://linkedin.com/in/test")

        self.assertEqual(len(extracted["education"]), 1)
        self.assertEqual(extracted["education"][0]["institution_category"], "Top Iranian Universities")
        self.assertEqual(extracted["experience"][0]["duration_months"], 36)
        self.assertIn("technical", extracted["skills"])
        self.assertEqual(extracted["skills"]["technical"][0]["name"], "Python")
        self.assertIn("certifications", extracted)
        self.assertEqual(extracted["certifications"][0]["name"], "AWS Architect")

        scoring = data["scoring_results"]
        self.assertAlmostEqual(scoring["final_scores"]["experience_depth_score"], 75.5)
        self.assertIn("seniority_match_calculation", scoring)

        self.assertEqual(data["interpretation"]["strengths"][0], "Leadership")
        self.assertIn("data_completeness", data["audit_trail"])
