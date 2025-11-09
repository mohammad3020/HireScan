"""
Processing services for resume parsing and ranking (synchronous)
"""
import os
from pathlib import Path
from django.conf import settings
from core.openrouter import OpenRouterClient
from candidates.models import Candidate, Resume, ParsedResume, Experience, Skill, TimelineEvent, JobScore
from jobs.models import Job
from .models import BatchUpload, FileItem
import PyPDF2
from docx import Document


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
    Parse a resume using OpenRouter API
    
    Args:
        resume_instance: Resume model instance
        
    Returns:
        ParsedResume instance
    """
    client = OpenRouterClient()
    
    # Extract text from file
    file_path = resume_instance.file.path
    resume_text = extract_text_from_file(file_path)
    
    # Load prompt template
    prompt_template = load_prompt_template('parse_resume')
    
    # Parse via OpenRouter
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
    
    # Update candidate information from parsed data
    candidate = resume_instance.candidate
    if parsed_data.get('name') and not candidate.name:
        candidate.name = parsed_data['name']
    if parsed_data.get('email') and not candidate.email:
        candidate.email = parsed_data['email']
    if parsed_data.get('phone') and not candidate.phone:
        candidate.phone = parsed_data.get('phone', '')
    if parsed_data.get('linkedin_url') and not candidate.linkedin_url:
        candidate.linkedin_url = parsed_data.get('linkedin_url', '')
    if parsed_data.get('github_url') and not candidate.github_url:
        candidate.github_url = parsed_data.get('github_url', '')
    candidate.save()
    
    # Create Experience records
    Experience.objects.filter(parsed_resume=parsed_resume).delete()
    for exp_data in parsed_data.get('experiences', []):
        Experience.objects.create(
            parsed_resume=parsed_resume,
            company=exp_data.get('company', ''),
            role=exp_data.get('role', ''),
            start_date=exp_data.get('start_date') or None,
            end_date=exp_data.get('end_date') or None,
            is_current=exp_data.get('is_current', False),
            description=exp_data.get('description', '')
        )
    
    # Create Skill records
    Skill.objects.filter(parsed_resume=parsed_resume).delete()
    for skill_data in parsed_data.get('skills', []):
        Skill.objects.create(
            parsed_resume=parsed_resume,
            name=skill_data.get('name', ''),
            category=skill_data.get('category', ''),
            proficiency=skill_data.get('proficiency', '')
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

