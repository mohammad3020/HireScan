"""
Processing services for resume parsing and ranking (synchronous)
"""
import os
import sys
import re
import json
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
    
    with open(template_path, 'r', encoding='utf-8') as f:
        content = f.read()
        # Return full prompt content - don't skip any part
        # The prompt will be formatted with resume_text later
        return content


def parse_resume_service(resume_instance):
    """
    Parse a resume using OpenRouter API via AI service
    
    Args:
        resume_instance: Resume model instance
        
    Returns:
        ParsedResume instance
        
    Raises:
        ValueError: If parsing fails or returns error
    """
    import logging
    logger = logging.getLogger(__name__)
    
    # Get file path
    file_path = resume_instance.file.path
    logger.info(f"Parsing resume: {file_path}")
    
    # Use AI service if available, otherwise fallback to old method
    parsed_data = None
    if HAS_AI_SERVICE:
        try:
            # Extract text using PyPDF2 first (as requested)
            logger.info("Extracting text from resume using PyPDF2...")
            resume_text = extract_text_from_file(file_path)
            logger.info(f"Extracted {len(resume_text)} characters from resume")
            
            # Process the file with the prompt - AI service will use extracted text
            logger.info("Processing CV file with OpenRouter API using parse_resume.md prompt...")
            # Calculate approximate prompt length
            prompt_template = load_prompt_template('parse_resume')
            total_length = len(prompt_template) + len(resume_text)
            logger.info(f"Total prompt + resume text length: {total_length} characters")
            
            # Increase max_tokens for longer responses (JSON can be large)
            # Estimate tokens: ~3 chars per token (conservative for mixed Persian/English)
            estimated_input_tokens = int(total_length / 3)
            # For JSON response, we need significant tokens
            max_tokens = max(16000, int(estimated_input_tokens * 0.5) + 4000)
            # Cap at reasonable maximum
            max_tokens = min(max_tokens, 32000)
            logger.info(f"Using max_tokens: {max_tokens} for total length: {total_length} chars (~{estimated_input_tokens} input tokens)")
            
            parsed_data = process_file_with_prompt(
                file_path=str(file_path),
                prompt_name='parse_resume',
                model=settings.OPENROUTER_PARSE_MODEL,
                extract_text=True,  # Force text extraction (we already extracted, but this ensures it's used)
                temperature=0.3,  # Lower temperature for more consistent JSON output
                max_tokens=max_tokens,
                response_format={"type": "json_object"}
            )
            logger.info("AI service parsing completed")
        except Exception as e:
            error_str = str(e)
            # Log the full error for debugging
            logger.error(f"AI service error details: {error_str}", exc_info=True)
            
            # Extract the actual error message, avoiding double-wrapping
            if "AI service returned error" in error_str:
                # Extract the actual error message after the prefix
                actual_error = error_str.replace("AI service returned error: ", "").replace("AI service returned error response: ", "")
                logger.error(f"AI service returned error: {actual_error}")
                # Don't fallback, just raise with the actual error
                raise ValueError(f"Resume parsing failed: {actual_error}")
            elif "OpenRouter API error" in error_str:
                # This is an API-level error, don't fallback
                logger.error(f"OpenRouter API error: {error_str}")
                raise ValueError(f"Resume parsing failed: {error_str}")
            logger.warning(f"AI service failed: {error_str}, falling back to old method")
            # Fallback to old method if AI service fails (old method requires text input)
            try:
                # Extract text for old method
                resume_text = ""
                try:
                    resume_text = extract_text_from_file(file_path)
                    # Validate extracted text
                    if not resume_text or len(resume_text.strip()) < 50:
                        raise ValueError("Text extraction returned empty or too short text")
                    logger.info(f"Extracted {len(resume_text)} characters for fallback method")
                except Exception as extract_error:
                    error_msg = str(extract_error)
                    logger.error(f"Text extraction failed for fallback: {error_msg}")
                    # Don't proceed if text extraction failed
                    raise ValueError(f"Failed to extract text from resume: {error_msg}")
                
                client = OpenRouterClient()
                prompt_template = load_prompt_template('parse_resume')
                parsed_data = client.parse_resume(resume_text, prompt_template)
            except Exception as fallback_error:
                # If both methods fail, raise with clear error message
                fallback_error_str = str(fallback_error)
                logger.error(f"Fallback parsing also failed: {fallback_error_str}")
                # Avoid double-wrapping error messages
                if "Resume parsing failed" in fallback_error_str:
                    raise ValueError(fallback_error_str)
                # Extract actual error if it's wrapped
                if "AI service returned error" in fallback_error_str:
                    actual_error = fallback_error_str.replace("AI service returned error: ", "").replace("AI service returned error response: ", "")
                    raise ValueError(f"Resume parsing failed: {actual_error}")
                raise ValueError(f"Resume parsing failed: {fallback_error_str}")
    else:
        # Fallback to old method
        logger.info("Using old method for parsing")
        try:
            # Extract text for old method (which requires text input)
            resume_text = ""
            try:
                resume_text = extract_text_from_file(file_path)
            except Exception as extract_error:
                logger.warning(f"Text extraction failed: {str(extract_error)}")
            
            client = OpenRouterClient()
            prompt_template = load_prompt_template('parse_resume')
            parsed_data = client.parse_resume(resume_text, prompt_template)
        except Exception as e:
            error_str = str(e)
            logger.error(f"Old method parsing failed: {error_str}")
            # Avoid double-wrapping if error message already contains "Resume parsing failed"
            if "Resume parsing failed" in error_str:
                raise ValueError(error_str)
            raise ValueError(f"Resume parsing failed: {error_str}")
    
    # Validate parsed_data structure (similar to test_service.py validation)
    if parsed_data is None:
        logger.error("Parsing returned None - no data was parsed")
        raise ValueError("Resume parsing failed: No data was parsed")
    
    if not isinstance(parsed_data, dict):
        logger.error(f"Invalid parsed data format: expected dict, got {type(parsed_data)}")
        raise ValueError(f"Resume parsing failed: Invalid response format - expected dict, got {type(parsed_data)}")
    
    # Log parsed data structure for debugging
    logger.info(f"Parsed data keys: {list(parsed_data.keys())}")
    
    # Check for error indicators in response (as per prompt format)
    error_value = parsed_data.get('error')
    if error_value:
        # Handle different error formats
        if isinstance(error_value, dict):
            error_message = error_value.get('message', error_value.get('error', str(error_value)))
        elif isinstance(error_value, str):
            error_message = error_value
        elif isinstance(error_value, bool) and error_value:
            # If error is just True, try to get message from elsewhere
            error_message = parsed_data.get('message', 'Unknown error during parsing')
        else:
            error_message = str(error_value)
        
        # Log full parsed_data for debugging
        logger.error(f"Parsing returned error. Full parsed_data: {json.dumps(parsed_data, indent=2, default=str)}")
        logger.error(f"Extracted error message: {error_message}")
        raise ValueError(f"Resume parsing failed: {error_message}")
    
    # Check if parsed_data is empty or only contains metadata
    if not parsed_data or (len(parsed_data) == 1 and 'raw_response' in parsed_data):
        logger.error(f"Parsing returned empty or invalid data: {list(parsed_data.keys())}")
        raise ValueError("Resume parsing failed: Empty or invalid data structure")
    
    # Extract text for raw_text field (only if needed, after successful parsing)
    # This is for storage purposes only - AI service already processed the file
    raw_text = ""
    try:
        raw_text = extract_text_from_file(file_path)
    except Exception as extract_error:
        logger.debug(f"Could not extract raw text for storage: {str(extract_error)}")
        raw_text = ""
    
    # Create or update ParsedResume
    parsed_resume, created = ParsedResume.objects.get_or_create(
        resume=resume_instance,
        defaults={
            'raw_text': raw_text,
            'parsed_data': parsed_data
        }
    )
    
    if not created:
        parsed_resume.raw_text = raw_text
        parsed_resume.parsed_data = parsed_data
        parsed_resume.save()
    
    # Extract personal info - handle both nested and flat structures
    personal_info = parsed_data.get('personal_info', {})
    if not personal_info:
        # Try flat structure if personal_info doesn't exist
        personal_info = parsed_data
    
    links = personal_info.get('links', {}) if isinstance(personal_info, dict) else {}
    
    # Update ParsedResume with personal information
    parsed_resume.full_name = personal_info.get('full_name', '') or ''
    parsed_resume.phone = personal_info.get('phone', '') or ''
    parsed_resume.email = personal_info.get('email', '') or ''
    parsed_resume.address = personal_info.get('address', '') or ''
    parsed_resume.date_of_birth = personal_info.get('date_of_birth', '') or ''
    parsed_resume.marital_status = personal_info.get('marital_status', '') or ''
    parsed_resume.military_service = personal_info.get('military_service', '') or ''
    
    if links:
        parsed_resume.linkedin_url = links.get('linkedin', '') or ''
        parsed_resume.github_url = links.get('github', '') or ''
        parsed_resume.portfolio_url = links.get('portfolio', '') or ''
        parsed_resume.website_url = links.get('website', '') or ''
        parsed_resume.other_links = links.get('other', []) or []
    else:
        # Try flat structure for links
        parsed_resume.linkedin_url = personal_info.get('linkedin_url', '') or ''
        parsed_resume.github_url = personal_info.get('github_url', '') or ''
        parsed_resume.portfolio_url = personal_info.get('portfolio_url', '') or ''
        parsed_resume.website_url = personal_info.get('website_url', '') or ''
        parsed_resume.other_links = personal_info.get('other_links', []) or []
    
    parsed_resume.interests = parsed_data.get('interests', {}) or {}
    parsed_resume.extraction_notes = parsed_data.get('extraction_notes', {}) or {}
    
    # Extract summary and store in other_sections
    summary = parsed_data.get('summary', '') or personal_info.get('summary', '')
    other_sections = parsed_data.get('other_sections', {}) or {}
    if summary:
        other_sections['summary'] = summary
    parsed_resume.other_sections = other_sections
    
    # Extract AI review and expected salary from parsed_data
    # These fields can be at the root level or nested in personal_info
    parsed_resume.ai_review = parsed_data.get('ai_review', '') or personal_info.get('ai_review', '') or ''
    parsed_resume.expected_salary = parsed_data.get('expected_salary', '') or personal_info.get('expected_salary', '') or ''
    
    parsed_resume.save()
    
    # Update candidate information from parsed data
    candidate = resume_instance.candidate
    # Update name if we have a parsed name and candidate name is empty or still a placeholder
    is_placeholder_name = (candidate.name and 
                          candidate.name.startswith('Candidate ') and 
                          candidate.name.replace('Candidate ', '').strip().isdigit())
    if parsed_resume.full_name and (not candidate.name or is_placeholder_name):
        old_name = candidate.name
        candidate.name = parsed_resume.full_name
        logger.info(f"Updated candidate {candidate.id} name from '{old_name}' to '{parsed_resume.full_name}'")
    # Fix: use parsed_resume.email (already set above) instead of parsed_resume.parsed_data
    if parsed_resume.email and (not candidate.email or candidate.email.startswith('temp_') or candidate.email.endswith('@temp.com') or candidate.email.endswith('@example.com')):
        old_email = candidate.email
        candidate.email = parsed_resume.email
        logger.info(f"Updated candidate {candidate.id} email from '{old_email}' to '{parsed_resume.email}'")
    if parsed_resume.phone and not candidate.phone:
        candidate.phone = parsed_resume.phone
    if parsed_resume.linkedin_url and not candidate.linkedin_url:
        candidate.linkedin_url = parsed_resume.linkedin_url
    if parsed_resume.github_url and not candidate.github_url:
        candidate.github_url = parsed_resume.github_url
    candidate.save()
    
    logger.info(f"Updated candidate {candidate.id}: {candidate.name}, {candidate.email}")
    
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
        end_date = edu_data.get('end_date', '')
        is_current = edu_data.get('is_current', False)
        # If end_date is null, empty, or contains "current" keywords, mark as current
        if not end_date or end_date.lower() in ['null', 'current', 'present', 'در حال تحصیل', 'تاکنون']:
            is_current = True
            if not end_date:
                end_date = 'در حال تحصیل'
        
        Education.objects.create(
            parsed_resume=parsed_resume,
            degree=edu_data.get('degree', ''),
            field=edu_data.get('field', ''),
            institution=edu_data.get('institution', ''),
            location=edu_data.get('location', ''),
            start_date=edu_data.get('start_date', ''),
            end_date=end_date,
            gpa=edu_data.get('gpa', ''),
            honors=edu_data.get('honors', ''),
            thesis=edu_data.get('thesis', ''),
            relevant_courses=edu_data.get('relevant_courses', []),
            order=idx
        )
    
    # Create Experience records
    for idx, exp_data in enumerate(parsed_data.get('experiences', []) or parsed_data.get('experience', [])):
        # Support both formats: 'experiences' (from sample) and 'experience' (current)
        job_title = exp_data.get('job_title', '') or exp_data.get('role', '')
        is_current = exp_data.get('is_current', False) or exp_data.get('is_currently_employed', False)
        end_date = exp_data.get('end_date', '')
        description = exp_data.get('description', '')
        
        # If end_date is null or empty, mark as current
        if not end_date or end_date.lower() in ['null', 'current', 'present', 'تاکنون']:
            is_current = True
            if not end_date:
                end_date = 'تاکنون'
        
        # Convert description to responsibilities if it's a string
        responsibilities = exp_data.get('responsibilities', [])
        if description and not responsibilities:
            # If description is a string, convert to list
            if isinstance(description, str):
                responsibilities = [description]
            elif isinstance(description, list):
                responsibilities = description
        
        Experience.objects.create(
            parsed_resume=parsed_resume,
            job_title=job_title,
            role=exp_data.get('role', '') or job_title,  # Legacy field
            company=exp_data.get('company', ''),
            company_type=exp_data.get('company_type', ''),
            location=exp_data.get('location', ''),
            employment_type=exp_data.get('employment_type', ''),
            start_date=exp_data.get('start_date', ''),
            end_date=end_date,
            duration=exp_data.get('duration', ''),
            is_currently_employed=is_current,
            is_current=is_current,  # Legacy field
            reasoning=exp_data.get('reasoning', ''),
            description=description,  # Legacy field
            responsibilities=responsibilities,
            order=idx
        )
    
    # Create Technical Skills
    # Support both nested structure (technical/soft) and flat structure (from sample)
    skills_data = parsed_data.get('skills', {})
    
    # Handle nested structure (current format)
    if isinstance(skills_data, dict):
        technical_skills = skills_data.get('technical', [])
        for category_data in technical_skills:
            if isinstance(category_data, dict):
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
    
    # Handle flat structure (from parse_resume sample.md)
    elif isinstance(skills_data, list):
        for skill_item in skills_data:
            if isinstance(skill_item, dict):
                skill_name = skill_item.get('name', '')
                skill_category = skill_item.get('category', '')
                skill_proficiency = skill_item.get('proficiency', '')
                
                # Determine if it's technical or soft skill based on category
                if skill_category and skill_category.lower() not in ['soft skills', 'soft', 'interpersonal']:
                    TechnicalSkill.objects.create(
                        parsed_resume=parsed_resume,
                        category=skill_category or 'General',
                        name=skill_name,
                        level=skill_proficiency
                    )
                else:
                    SoftSkill.objects.create(
                        parsed_resume=parsed_resume,
                        name=skill_name
                    )
    
    # Create Skills Mentioned in Job Title
    # Only process if skills_data is a dict (nested structure)
    if isinstance(skills_data, dict):
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
    
    # Create Certifications (from parse_resume sample.md format)
    # Certifications can be stored as Courses with provider as issuer
    for idx, cert_data in enumerate(parsed_data.get('certifications', [])):
        Course.objects.create(
            parsed_resume=parsed_resume,
            name=cert_data.get('name', ''),
            provider=cert_data.get('issuer', ''),  # issuer maps to provider
            completion_date=cert_data.get('date', ''),
            order=idx + len(parsed_data.get('courses', []))  # Append after courses
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
        # Note: start_date and end_date are CharField, not DateField
        parsed_resumes = ParsedResume.objects.filter(resume__candidate=candidate)
        total_years = 0
        for pr in parsed_resumes:
            experiences = pr.experiences.all()
            for exp in experiences:
                # Use duration field if available (it's already calculated)
                if exp.duration:
                    # Try to extract years from duration string (e.g., "2 years", "1.5 years")
                    duration_match = re.search(r'(\d+\.?\d*)\s*(?:year|yr|سال)', exp.duration.lower())
                    if duration_match:
                        total_years += float(duration_match.group(1))
                    else:
                        # If duration doesn't match pattern, count as 1 year per experience
                        total_years += 1
                elif exp.start_date and exp.end_date:
                    # Fallback: count each experience as approximately 1 year
                    total_years += 1
        
        if total_years < min_years:
            reasons.append(f"Insufficient experience: {total_years:.1f} years (required: {min_years})")
    
    # Check required skills
    if 'required_skills' in rules:
        # Lowercase required_skills for comparison (candidate_skills are already lowercased)
        required_skills = set([s.lower() if isinstance(s, str) else str(s).lower() for s in rules['required_skills']])
        candidate_skills = set()
        parsed_resumes = ParsedResume.objects.filter(resume__candidate=candidate)
        for pr in parsed_resumes:
            # Get technical skills
            technical_skills = pr.technical_skills.values_list('name', flat=True)
            candidate_skills.update([s.lower() for s in technical_skills])
            # Also check soft skills if needed
            soft_skills = pr.soft_skills.values_list('name', flat=True)
            candidate_skills.update([s.lower() for s in soft_skills])
        
        missing_skills = required_skills - candidate_skills
        if missing_skills:
            reasons.append(f"Missing required skills: {', '.join(missing_skills)}")
    
    # Check experience minimum years from job model
    if job.experience_min_years and job.experience_min_years_auto_reject:
        parsed_resumes = ParsedResume.objects.filter(resume__candidate=candidate)
        total_years = 0
        for pr in parsed_resumes:
            experiences = pr.experiences.all()
            for exp in experiences:
                # Try to parse dates - they might be strings
                try:
                    if exp.start_date and exp.end_date:
                        # Dates might be strings like "2020-01" or "Jan 2020"
                        # For now, just count experiences as approximate years
                        # TODO: Improve date parsing
                        total_years += 1  # Approximate: each experience = 1 year
                except Exception as e:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.warning(f"Error processing experience dates for candidate {candidate.id}: {str(e)}")
                    # Continue with next experience
                    pass
        
        if total_years < job.experience_min_years:
            reasons.append(f"Insufficient experience: approximately {total_years} years (required: {job.experience_min_years})")
    
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
    required_skills_list = job.required_skills or []
    if required_skills_list and len(required_skills_list) > 0:
        # Handle both list of strings and list of dicts with 'name' key
        # Check if first element is a dict (but only if list is not empty)
        if isinstance(required_skills_list[0], dict):
            required_skills = set([s.get('name', '').lower() for s in required_skills_list if s.get('name')])
        else:
            required_skills = set([s.lower() for s in required_skills_list if isinstance(s, str)])
        
        if required_skills:
            candidate_skills = set()
            # Get technical skills
            for skill in parsed_resume.technical_skills.all():
                candidate_skills.add(skill.name.lower())
            # Also include soft skills
            for skill in parsed_resume.soft_skills.all():
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
        # Get all skills (technical + soft)
        all_skills = [s.name for s in pr.technical_skills.all()]
        all_skills.extend([s.name for s in pr.soft_skills.all()])
        
        candidate_data = {
            'candidate_id': candidate.id,
            'name': candidate.name,
            'email': candidate.email,
            'skills': all_skills,
            'experiences': [
                {
                    'company': exp.company,
                    'job_title': exp.job_title or exp.role or '',
                    'role': exp.role or exp.job_title or '',
                    'start_date': str(exp.start_date) if exp.start_date else None,
                    'end_date': str(exp.end_date) if exp.end_date else None,
                    'duration': exp.duration or '',
                }
                for exp in pr.experiences.all()
            ],
            'education': [
                {
                    'degree': edu.degree,
                    'field': edu.field,
                    'institution': edu.institution,
                }
                for edu in pr.educations.all()[:3]  # Limit to top 3
            ],
            'summary': pr.parsed_data.get('summary', '') or pr.parsed_data.get('personal_info', {}).get('summary', '')
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
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        batch = BatchUpload.objects.get(id=batch_id)
    except BatchUpload.DoesNotExist:
        logger.error(f"Batch {batch_id} not found")
        raise ValueError(f"Batch {batch_id} not found")
    
    batch.status = 'processing'
    batch.save()
    logger.info(f"Starting processing for batch {batch_id} (job: {batch.job.id if batch.job else 'None'})")
    
    file_items = batch.file_items.all()
    batch.total_files = file_items.count()
    batch.save()
    
    if batch.total_files == 0:
        logger.warning(f"Batch {batch_id} has no files to process")
        batch.status = 'completed'
        batch.save()
        return
    
    successful_count = 0
    failed_count = 0
    
    try:
        for file_item in file_items:
            file_item.status = 'processing'
            file_item.save()
            logger.info(f"Processing file item {file_item.id}: {file_item.file.name}")
            
            try:
                # Create or get candidate (based on email if available in filename or parse)
                # For MVP, create a new candidate for each file
                candidate, created = Candidate.objects.get_or_create(
                    email=f"candidate_{file_item.id}@example.com",  # Placeholder
                    defaults={'name': f"Candidate {file_item.id}"}
                )
                
                if created:
                    logger.info(f"Created new candidate {candidate.id} for file item {file_item.id}")
                else:
                    logger.info(f"Using existing candidate {candidate.id} for file item {file_item.id}")
                
                # Create resume
                try:
                    resume = Resume.objects.create(
                        candidate=candidate,
                        file=file_item.file
                    )
                    logger.info(f"Created resume {resume.id} for candidate {candidate.id}")
                except Exception as e:
                    logger.error(f"Failed to create resume for file item {file_item.id}: {str(e)}")
                    raise ValueError(f"Failed to create resume: {str(e)}")
                
                file_item.candidate = candidate
                file_item.save()
                
                # Parse resume
                try:
                    parsed_resume = parse_resume_service(resume)
                    logger.info(f"Successfully parsed resume {resume.id}")
                except Exception as parse_error:
                    logger.error(f"Failed to parse resume {resume.id}: {str(parse_error)}")
                    raise ValueError(f"Resume parsing failed: {str(parse_error)}")
                
                # Update candidate email if found in parsed data (already done in parse_resume_service)
                # But ensure it's updated if parsing succeeded
                if parsed_resume.email and (not candidate.email or candidate.email.startswith('temp_') or candidate.email.endswith('@temp.com') or candidate.email.endswith('@example.com')):
                    old_email = candidate.email
                    candidate.email = parsed_resume.email
                    candidate.save()
                    logger.info(f"Updated candidate {candidate.id} email from {old_email} to {parsed_resume.email}")
                
                # If batch has a job, create JobScore and apply auto-reject rules
                if batch.job:
                    job = batch.job
                    logger.info(f"Processing job scoring for candidate {candidate.id} and job {job.id}")
                    
                    try:
                        # Apply auto-reject rules
                        is_rejected, rejection_reason = apply_auto_reject_rules(candidate, job)
                        logger.info(f"Auto-reject check for candidate {candidate.id}: rejected={is_rejected}, reason={rejection_reason}")
                        
                        # Calculate initial score
                        score = calculate_initial_score(candidate, job)
                        logger.info(f"Calculated score for candidate {candidate.id}: {score}")
                        
                        # Create or update JobScore
                        job_score, created = JobScore.objects.get_or_create(
                            candidate=candidate,
                            job=job,
                            defaults={
                                'score': score,
                                'auto_rejected': is_rejected,
                                'rejection_reason': rejection_reason
                            }
                        )
                        
                        if not created:
                            job_score.score = score
                            job_score.auto_rejected = is_rejected
                            job_score.rejection_reason = rejection_reason
                            job_score.save()
                            logger.info(f"Updated JobScore for candidate {candidate.id} and job {job.id}")
                        else:
                            logger.info(f"Created JobScore for candidate {candidate.id} and job {job.id}")
                        
                        # Create timeline event
                        TimelineEvent.objects.create(
                            candidate=candidate,
                            event_type='scored',
                            description=f'Scored for job: {job.title}',
                            metadata={'job_id': job.id, 'score': score, 'auto_rejected': is_rejected}
                        )
                    except Exception as scoring_error:
                        logger.error(f"Failed to score candidate {candidate.id} for job {job.id}: {str(scoring_error)}")
                        # Don't fail the whole process if scoring fails, just log it
                        pass
                
                file_item.status = 'completed'
                file_item.save()
                successful_count += 1
                logger.info(f"Successfully processed file item {file_item.id}")
                
                batch.processed_files += 1
                batch.save()
                
            except Exception as e:
                failed_count += 1
                error_message = str(e)
                file_item.status = 'failed'
                file_item.error_message = error_message
                file_item.save()
                logger.error(f"Failed to process file item {file_item.id}: {error_message}", exc_info=True)
                
                batch.processed_files += 1
                batch.save()
        
        batch.status = 'completed'
        batch.save()
        logger.info(f"Batch {batch_id} processing completed: {successful_count} successful, {failed_count} failed")
        
    except Exception as e:
        batch.status = 'failed'
        batch.save()
        logger.error(f"Batch {batch_id} processing failed with exception: {str(e)}", exc_info=True)
        raise

