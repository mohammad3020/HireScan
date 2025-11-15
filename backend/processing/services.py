"""
Processing services for resume parsing and ranking (synchronous)
"""
import os
import sys
from pathlib import Path
from django.conf import settings
from core.openrouter import OpenRouterClient
from candidates.models import (
    Candidate, Resume, ParsedResume, Experience, Education, TimelineEvent, JobScore,
    TechnicalSkill, SoftSkill, SkillMentionedInJobTitle,
    Project, Award, Language, Course, Publication
)
from jobs.models import Job
from .models import BatchUpload, FileItem
import PyPDF2
from docx import Document

# Add ai directory to path to import service
ai_dir = Path(settings.BASE_DIR).parent / 'ai'
if str(ai_dir) not in sys.path:
    sys.path.insert(0, str(ai_dir))

try:
    from ai.service import process_file_with_prompt
    HAS_AI_SERVICE = True
except ImportError:
    HAS_AI_SERVICE = False


def extract_text_from_file(file_path):
    """Extract text from PDF or DOCX file"""
    file_ext = Path(file_path).suffix.lower()
    
    if file_ext == '.pdf':
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
                return text
        except Exception as e:
            raise ValueError(f"Error reading PDF: {str(e)}")
    
    elif file_ext in ['.doc', '.docx']:
        try:
            doc = Document(file_path)
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
            return text
        except Exception as e:
            raise ValueError(f"Error reading DOCX: {str(e)}")
    
    else:
        raise ValueError(f"Unsupported file type: {file_ext}")


def load_prompt_template(template_name):
    """Load prompt template from ai/prompts directory"""
    prompts_dir = Path(settings.BASE_DIR).parent / 'ai' / 'prompts'
    template_path = prompts_dir / f"{template_name}.md"
    
    if not template_path.exists():
        raise FileNotFoundError(f"Prompt template not found: {template_path}")
    
    with open(template_path, 'r') as f:
        content = f.read()
        # Extract the prompt part (skip markdown headers)
        lines = content.split('\n')
        # Find the actual prompt content
        prompt_start = False
        prompt_lines = []
        for line in lines:
            if 'Resume text:' in line or 'Job Description:' in line:
                prompt_start = True
            if prompt_start:
                prompt_lines.append(line)
        
        return '\n'.join(prompt_lines) if prompt_lines else content


def parse_resume_service(resume_instance):
    """
    Parse a resume using OpenRouter API via AI service
    
    Args:
        resume_instance: Resume model instance
        
    Returns:
        ParsedResume instance
    """
    # Get file path
    file_path = resume_instance.file.path
    
    # Use AI service if available, otherwise fallback to old method
    if HAS_AI_SERVICE:
        try:
            # Use the AI service to process the file
            parsed_data = process_file_with_prompt(
                file_path=str(file_path),
                prompt_name='parse_resume',
                model=settings.OPENROUTER_PARSE_MODEL,
                temperature=0.7,
                max_tokens=4000,
                response_format={"type": "json_object"},
                extract_text=True  # Extract text for better parsing
            )
            # Extract text for raw_text field
            resume_text = extract_text_from_file(file_path)
        except Exception as e:
            # Fallback to old method if AI service fails
            client = OpenRouterClient()
            resume_text = extract_text_from_file(file_path)
            prompt_template = load_prompt_template('parse_resume')
            parsed_data = client.parse_resume(resume_text, prompt_template)
    else:
        # Fallback to old method
        client = OpenRouterClient()
        resume_text = extract_text_from_file(file_path)
        prompt_template = load_prompt_template('parse_resume')
        parsed_data = client.parse_resume(resume_text, prompt_template)
    
    # Create or update ParsedResume
    parsed_resume, created = ParsedResume.objects.get_or_create(
        resume=resume_instance,
        defaults={
            'raw_text': resume_text,
            'parsed_data': parsed_data
        }
    )
    
    if not created:
        parsed_resume.raw_text = resume_text
        parsed_resume.parsed_data = parsed_data
        parsed_resume.save()
    
    # Extract personal info
    personal_info = parsed_data.get('personal_info', {})
    links = personal_info.get('links', {})
    
    # Update ParsedResume with personal information
    parsed_resume.full_name = personal_info.get('full_name', '')
    parsed_resume.phone = personal_info.get('phone', '')
    parsed_resume.email = personal_info.get('email', '')
    parsed_resume.address = personal_info.get('address', '')
    parsed_resume.date_of_birth = personal_info.get('date_of_birth', '')
    parsed_resume.marital_status = personal_info.get('marital_status', '')
    parsed_resume.military_service = personal_info.get('military_service', '')
    parsed_resume.linkedin_url = links.get('linkedin', '')
    parsed_resume.github_url = links.get('github', '')
    parsed_resume.portfolio_url = links.get('portfolio', '')
    parsed_resume.website_url = links.get('website', '')
    parsed_resume.other_links = links.get('other', [])
    parsed_resume.interests = parsed_data.get('interests', {})
    parsed_resume.other_sections = parsed_data.get('other_sections', {})
    parsed_resume.extraction_notes = parsed_data.get('extraction_notes', {})
    parsed_resume.save()
    
    # Update candidate information from parsed data
    candidate = resume_instance.candidate
    if parsed_resume.full_name and not candidate.name:
        candidate.name = parsed_resume.full_name
    if parsed_resume.email and not candidate.email:
        candidate.email = parsed_resume.email
    if parsed_resume.phone and not candidate.phone:
        candidate.phone = parsed_resume.phone
    if parsed_resume.linkedin_url and not candidate.linkedin_url:
        candidate.linkedin_url = parsed_resume.linkedin_url
    if parsed_resume.github_url and not candidate.github_url:
        candidate.github_url = parsed_resume.github_url
    candidate.save()
    
    # Delete existing related records
    Education.objects.filter(parsed_resume=parsed_resume).delete()
    Experience.objects.filter(parsed_resume=parsed_resume).delete()
    TechnicalSkill.objects.filter(parsed_resume=parsed_resume).delete()
    SoftSkill.objects.filter(parsed_resume=parsed_resume).delete()
    SkillMentionedInJobTitle.objects.filter(parsed_resume=parsed_resume).delete()
    Project.objects.filter(parsed_resume=parsed_resume).delete()
    Award.objects.filter(parsed_resume=parsed_resume).delete()
    Language.objects.filter(parsed_resume=parsed_resume).delete()
    Course.objects.filter(parsed_resume=parsed_resume).delete()
    Publication.objects.filter(parsed_resume=parsed_resume).delete()
    
    # Create Education records
    for idx, edu_data in enumerate(parsed_data.get('education', [])):
        Education.objects.create(
            parsed_resume=parsed_resume,
            degree=edu_data.get('degree', ''),
            field=edu_data.get('field', ''),
            institution=edu_data.get('institution', ''),
            location=edu_data.get('location', ''),
            start_date=edu_data.get('start_date', ''),
            end_date=edu_data.get('end_date', ''),
            gpa=edu_data.get('gpa', ''),
            honors=edu_data.get('honors', ''),
            thesis=edu_data.get('thesis', ''),
            relevant_courses=edu_data.get('relevant_courses', []),
            order=idx
        )
    
    # Create Experience records
    for idx, exp_data in enumerate(parsed_data.get('experience', [])):
        Experience.objects.create(
            parsed_resume=parsed_resume,
            job_title=exp_data.get('job_title', ''),
            company=exp_data.get('company', ''),
            company_type=exp_data.get('company_type', ''),
            location=exp_data.get('location', ''),
            employment_type=exp_data.get('employment_type', ''),
            start_date=exp_data.get('start_date', ''),
            end_date=exp_data.get('end_date', ''),
            duration=exp_data.get('duration', ''),
            is_currently_employed=exp_data.get('is_currently_employed', False),
            reasoning=exp_data.get('reasoning', ''),
            responsibilities=exp_data.get('responsibilities', []),
            order=idx
        )
    
    # Create Technical Skills
    skills_data = parsed_data.get('skills', {})
    technical_skills = skills_data.get('technical', [])
    for category_data in technical_skills:
        category = category_data.get('category', '')
        for item in category_data.get('items', []):
            TechnicalSkill.objects.create(
                parsed_resume=parsed_resume,
                category=category,
                name=item.get('name', ''),
                level=item.get('level', '')
            )
    
    # Create Soft Skills
    for skill_name in skills_data.get('soft', []):
        SoftSkill.objects.create(
            parsed_resume=parsed_resume,
            name=skill_name
        )
    
    # Create Skills Mentioned in Job Title
    for skill_name in skills_data.get('skills_mentioned_in_job_title', []):
        SkillMentionedInJobTitle.objects.create(
            parsed_resume=parsed_resume,
            name=skill_name
        )
    
    # Create Projects
    for idx, project_data in enumerate(parsed_data.get('projects', [])):
        Project.objects.create(
            parsed_resume=parsed_resume,
            name=project_data.get('name', ''),
            role=project_data.get('role', ''),
            date=project_data.get('date', ''),
            technologies=project_data.get('technologies', []),
            description=project_data.get('description', ''),
            link=project_data.get('link', ''),
            order=idx
        )
    
    # Create Awards
    for idx, award_data in enumerate(parsed_data.get('awards', [])):
        Award.objects.create(
            parsed_resume=parsed_resume,
            title=award_data.get('title', ''),
            issuer=award_data.get('issuer', ''),
            rank=award_data.get('rank', ''),
            date=award_data.get('date', ''),
            description=award_data.get('description', ''),
            order=idx
        )
    
    # Create Languages
    for lang_data in parsed_data.get('languages', []):
        Language.objects.create(
            parsed_resume=parsed_resume,
            language=lang_data.get('language', ''),
            proficiency=lang_data.get('proficiency', ''),
            skills=lang_data.get('skills', {}),
            certificates=lang_data.get('certificates', [])
        )
    
    # Create Courses
    for idx, course_data in enumerate(parsed_data.get('courses', [])):
        Course.objects.create(
            parsed_resume=parsed_resume,
            name=course_data.get('name', ''),
            provider=course_data.get('provider', ''),
            instructor=course_data.get('instructor', ''),
            completion_date=course_data.get('completion_date', ''),
            duration=course_data.get('duration', ''),
            certificate_id=course_data.get('certificate_id', ''),
            verification_link=course_data.get('verification_link', ''),
            order=idx
        )
    
    # Create Publications
    for idx, pub_data in enumerate(parsed_data.get('publications', [])):
        Publication.objects.create(
            parsed_resume=parsed_resume,
            title=pub_data.get('title', ''),
            authors=pub_data.get('authors', []),
            venue=pub_data.get('venue', ''),
            year=pub_data.get('year', ''),
            volume_pages=pub_data.get('volume_pages', ''),
            doi=pub_data.get('doi', ''),
            link=pub_data.get('link', ''),
            citations=pub_data.get('citations', ''),
            order=idx
        )
    
    # Create timeline event
    TimelineEvent.objects.create(
        candidate=candidate,
        event_type='parsed',
        description='Resume parsed successfully',
        metadata={'resume_id': resume_instance.id}
    )
    
    return parsed_resume


def apply_auto_reject_rules(candidate, job):
    """
    Apply auto-reject rules for a candidate against a job
    
    Returns:
        tuple: (is_rejected: bool, reason: str)
    """
    rules = job.auto_reject_rules or {}
    reasons = []
    
    # Check minimum years of experience
    if 'min_years_experience' in rules:
        min_years = rules['min_years_experience']
        # Calculate years of experience from parsed resume
        # This is a simplified version - you might want to improve this
        parsed_resumes = ParsedResume.objects.filter(resume__candidate=candidate)
        total_years = 0
        for pr in parsed_resumes:
            experiences = pr.experiences.all()
            for exp in experiences:
                if exp.start_date and exp.end_date:
                    # Simple calculation
                    years = (exp.end_date.year - exp.start_date.year) + \
                           (exp.end_date.month - exp.start_date.month) / 12
                    total_years += years
        
        if total_years < min_years:
            reasons.append(f"Insufficient experience: {total_years:.1f} years (required: {min_years})")
    
    # Check required skills
    if 'required_skills' in rules:
        required_skills = set(rules['required_skills'])
        candidate_skills = set()
        parsed_resumes = ParsedResume.objects.filter(resume__candidate=candidate)
        for pr in parsed_resumes:
            skills = pr.skills.values_list('name', flat=True)
            candidate_skills.update([s.lower() for s in skills])
        
        missing_skills = required_skills - candidate_skills
        if missing_skills:
            reasons.append(f"Missing required skills: {', '.join(missing_skills)}")
    
    # Check salary requirements
    if 'max_salary' in rules and candidate.job_scores.filter(job=job).exists():
        # This would need to be extracted from resume or provided separately
        pass
    
    is_rejected = len(reasons) > 0
    reason = "; ".join(reasons) if reasons else ""
    
    return is_rejected, reason


def calculate_initial_score(candidate, job):
    """
    Calculate initial score for a candidate against a job
    
    Returns:
        float: Score from 0 to 100
    """
    score = 0.0
    max_score = 100.0
    
    # Get parsed resume data
    parsed_resumes = ParsedResume.objects.filter(resume__candidate=candidate)
    if not parsed_resumes.exists():
        return 0.0
    
    parsed_resume = parsed_resumes.first()
    
    # Score based on required skills match (40 points)
    required_skills = set(job.required_skills or [])
    if required_skills:
        candidate_skills = set()
        for skill in parsed_resume.skills.all():
            candidate_skills.add(skill.name.lower())
        
        matched_skills = len(required_skills & candidate_skills)
        skill_score = (matched_skills / len(required_skills)) * 40
        score += skill_score
    
    # Score based on experience (30 points)
    experiences = parsed_resume.experiences.all()
    if experiences.exists():
        # Simple scoring based on number of experiences
        exp_score = min(len(experiences) * 10, 30)
        score += exp_score
    
    # Score based on education (20 points)
    education = parsed_resume.parsed_data.get('education', [])
    if education:
        score += 20
    
    # Score based on certifications (10 points)
    certifications = parsed_resume.parsed_data.get('certifications', [])
    if certifications:
        score += min(len(certifications) * 5, 10)
    
    return min(score, max_score)


def rank_candidates_service(job, candidates):
    """
    Rank candidates for a job using OpenRouter API
    
    Args:
        job: Job instance
        candidates: QuerySet or list of Candidate instances
        
    Returns:
        List of ranked candidates with scores
    """
    client = OpenRouterClient()
    
    # Prepare candidates data
    candidates_data = []
    for candidate in candidates:
        parsed_resumes = ParsedResume.objects.filter(resume__candidate=candidate)
        if not parsed_resumes.exists():
            continue
        
        pr = parsed_resumes.first()
        candidate_data = {
            'candidate_id': candidate.id,
            'name': candidate.name,
            'email': candidate.email,
            'skills': [s.name for s in pr.skills.all()],
            'experiences': [
                {
                    'company': exp.company,
                    'role': exp.role,
                    'start_date': str(exp.start_date) if exp.start_date else None,
                    'end_date': str(exp.end_date) if exp.end_date else None,
                }
                for exp in pr.experiences.all()
            ],
            'summary': pr.parsed_data.get('summary', '')
        }
        candidates_data.append(candidate_data)
    
    if not candidates_data:
        return []
    
    # Load prompt template
    prompt_template = load_prompt_template('rank_candidates')
    
    # Rank via OpenRouter
    job_description = f"{job.title}\n\n{job.description}"
    ranked_results = client.rank_candidates(job_description, candidates_data, prompt_template)
    
    return ranked_results


def process_batch_service(batch_id):
    """
    Process a batch of uploaded files (synchronous)
    
    Args:
        batch_id: BatchUpload ID
    """
    batch = BatchUpload.objects.get(id=batch_id)
    batch.status = 'processing'
    batch.save()
    
    file_items = batch.file_items.all()
    batch.total_files = file_items.count()
    batch.save()
    
    try:
        for file_item in file_items:
            file_item.status = 'processing'
            file_item.save()
            
            try:
                # Create or get candidate (based on email if available in filename or parse)
                # For MVP, create a new candidate for each file
                candidate, created = Candidate.objects.get_or_create(
                    email=f"candidate_{file_item.id}@example.com",  # Placeholder
                    defaults={'name': f"Candidate {file_item.id}"}
                )
                
                # Create resume
                resume = Resume.objects.create(
                    candidate=candidate,
                    file=file_item.file
                )
                
                file_item.candidate = candidate
                
                # Parse resume
                parsed_resume = parse_resume_service(resume)
                
                # Update candidate email if found in parsed data
                if parsed_resume.parsed_data.get('email'):
                    candidate.email = parsed_resume.parsed_data['email']
                    candidate.save()
                
                file_item.status = 'completed'
                file_item.save()
                
                batch.processed_files += 1
                batch.save()
                
            except Exception as e:
                file_item.status = 'failed'
                file_item.error_message = str(e)
                file_item.save()
                batch.processed_files += 1
                batch.save()
        
        batch.status = 'completed'
        batch.save()
        
    except Exception as e:
        batch.status = 'failed'
        batch.save()
        raise

