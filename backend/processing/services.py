"""
Processing services for resume parsing and ranking (synchronous)
"""
import os
import sys
import re
import json
from datetime import date
from decimal import Decimal, InvalidOperation
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock
import time
from django.conf import settings
from django.utils import timezone
from django.db import IntegrityError
from core.openrouter import OpenRouterClient
from candidates.models import (
    Candidate, Resume, ParsedResume, Experience, Education, TimelineEvent, JobScore,
    TechnicalSkill, SoftSkill, SkillMentionedInJobTitle,
    Project, Award, Language, Course, Certification, Publication
)
from jobs.models import Job
from .models import BatchUpload, FileItem

# Optional import for DOCX text extraction (PDF files are sent directly to OpenRouter)
try:
    from docx import Document
    HAS_DOCX = True
except ImportError:
    HAS_DOCX = False
    Document = None

# Add ai directory to path to import service
ai_dir = Path(settings.BASE_DIR).parent / 'ai'
if str(ai_dir) not in sys.path:
    sys.path.insert(0, str(ai_dir))

try:
    from service import process_file_with_prompt
    HAS_AI_SERVICE = True
except ImportError as e:
    import logging
    logger = logging.getLogger(__name__)
    logger.error(f"Failed to import AI service from {ai_dir}: {e}")
    HAS_AI_SERVICE = False


class RateLimiter:
    """Thread-safe rate limiter to ensure minimum delay between API requests"""
    def __init__(self, min_delay_seconds=0.5):
        self.min_delay_seconds = min_delay_seconds
        self.last_request_time = 0
        self.lock = Lock()
    
    def wait_if_needed(self):
        """Wait if necessary to maintain minimum delay between requests"""
        with self.lock:
            current_time = time.time()
            time_since_last_request = current_time - self.last_request_time
            if time_since_last_request < self.min_delay_seconds:
                sleep_time = self.min_delay_seconds - time_since_last_request
                time.sleep(sleep_time)
            self.last_request_time = time.time()


# Global rate limiter instance for API requests
_api_rate_limiter = RateLimiter(min_delay_seconds=0.5)


PERSIAN_DIGIT_TRANSLATION = str.maketrans('۰۱۲۳۴۵۶۷۸۹', '0123456789')
EDUCATION_LEVEL_ORDER = {
    'diploma': 1,
    'bachelor': 2,
    'master': 3,
    'doctorate': 4,
    'postdoctoral': 5,
}
GENDER_KEYWORDS = {
    'male': ['male', 'man', 'm', 'مرد', 'آقا'],
    'female': ['female', 'woman', 'f', 'زن', 'خانم'],
}
MILITARY_STATUS_KEYWORDS = {
    'completed_or_full_exempt': ['completed', 'served', 'done', 'پایان', 'خدمت', 'معافیت دائم', 'معاف دائم', 'full exempt'],
    'educational_exempt': ['educational', 'student', 'تحصیلی', 'معافیت تحصیلی'],
}
UNIVERSITY_CATEGORY_KEYWORDS = {
    'top_iranian': ['top iranian', 'برتر', 'تهران', 'شریف', 'امیرکبیر'],
    'international': ['international', 'بین المللی', 'خارج', 'خارجی'],
    'public': ['public', 'دولتی'],
    'azad': ['azad', 'آزاد'],
    'payam_noor_nonprofit': ['payam noor', 'non-profit', 'nonprofit', 'پیام نور', 'غیرانتفاعی', 'علمی کاربردی'],
}
UNIVERSITY_CATEGORY_IDS = set(UNIVERSITY_CATEGORY_KEYWORDS.keys())


def _to_decimal(value):
    """Convert numeric-like value to Decimal with graceful failure"""
    if value is None or value == '':
        return None
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError):
        return None


def _normalize_email(email):
    """
    Normalize email address by removing spaces, converting to lowercase, and trimming.
    
    Args:
        email: Email string (may contain spaces or other formatting issues)
        
    Returns:
        Normalized email string or None if invalid
    """
    if not email or not isinstance(email, str):
        return None
    
    # Remove all spaces
    email = email.replace(' ', '').replace('\t', '').replace('\n', '')
    
    # Convert to lowercase and strip
    email = email.lower().strip()
    
    # Basic validation - must contain @ and at least one character before and after
    if '@' not in email or len(email.split('@')) != 2:
        return None
    
    local, domain = email.split('@')
    if not local or not domain:
        return None
    
    return email


def extract_text_from_docx(file_path):
    """Extract text from DOCX file (PDF files are sent directly to OpenRouter)"""
    import logging
    import time
    logger = logging.getLogger('processing.timing')
    
    file_ext = Path(file_path).suffix.lower()
    start_time = time.time()
    
    if file_ext not in ['.doc', '.docx']:
        raise ValueError(f"Text extraction only supported for DOCX files. File type: {file_ext}")
    
    if not HAS_DOCX:
        raise ImportError("python-docx is required for DOCX text extraction. Install it with: pip install python-docx")
    
    try:
        logger.info(f"[TIMING] Starting DOCX text extraction: {file_path}")
        doc = Document(file_path)
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        extraction_time = time.time() - start_time
        logger.info(f"[TIMING] DOCX text extraction completed in {extraction_time:.2f} seconds ({extraction_time*1000:.0f}ms) - Extracted {len(text)} characters")
        return text
    except Exception as e:
        extraction_time = time.time() - start_time
        logger.error(f"[TIMING] DOCX text extraction failed after {extraction_time:.2f} seconds: {str(e)}")
        raise ValueError(f"Error reading DOCX: {str(e)}")


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


def _map_experience_level_to_seniority(experience_level, employment_type):
    """Map stored experience level to target seniority options"""
    if not experience_level and employment_type == 'internship':
        return "Intern"
    mapping = {
        'intern': 'Intern',
        'junior': 'Junior',
        'mid': 'Mid-Level',
        'senior': 'Senior',
        'lead': 'Lead',
        'management': 'Executive',
    }
    if experience_level:
        return mapping.get(experience_level, experience_level.title())
    return ""


def _normalize_required_skills(required_skills):
    """Convert job required_skills to standardized prompt format"""
    normalized = []
    if not required_skills:
        return normalized
    for skill in required_skills:
        skill_name = ""
        importance = ""
        if isinstance(skill, dict):
            skill_name = skill.get('name') or skill.get('skill_name') or ""
            importance = skill.get('priority') or skill.get('importance') or ""
        elif isinstance(skill, str):
            skill_name = skill
        if not skill_name:
            continue
        importance_clean = importance.title() if isinstance(importance, str) and importance else ""
        normalized.append({
            "skill_name": skill_name,
            "importance": importance_clean or "Important"
        })
    return normalized


def _build_target_job_payload(job):
    """Serialize job info for AI prompt"""
    if not job:
        return None
    payload = {
        "job_title": job.title or "",
        "seniority_level": _map_experience_level_to_seniority(job.experience_level, job.employment_type),
        "required_skills": _normalize_required_skills(job.required_skills or []),
        "target_companies": job.target_companies if job.target_companies_enabled and job.target_companies else [],
        "reputable_companies": [],
        "target_universities": job.preferred_universities if job.preferred_universities_enabled and job.preferred_universities else [],
    }
    auto_rules = job.auto_reject_rules or {}
    if isinstance(auto_rules, dict):
        reputable = auto_rules.get('reputable_companies') or auto_rules.get('preferred_companies')
        if isinstance(reputable, list):
            payload["reputable_companies"] = reputable
    return payload


def _append_job_context_to_prompt(prompt_template, job, file_item_id=None):
    """Append target job section and file_item_id to prompt and return payload for logging"""
    target_payload = _build_target_job_payload(job)
    
    # Build JSON payload with file_item_id and target_job
    payload_data = {}
    if file_item_id is not None:
        payload_data['file_item_id'] = file_item_id
    if target_payload:
        payload_data['target_job'] = target_payload
    
    if not payload_data:
        return prompt_template, None
    
    job_section = (
        "\n\n### Input Parameters (Received from User)\n\n"
        "```json\n"
        f"{json.dumps(payload_data, ensure_ascii=False, indent=2)}\n"
        "```\n"
    )
    return f"{prompt_template}\n{job_section}", target_payload


def parse_resume_service(resume_instance, job=None, file_item_id=None):
    """
    Parse a resume using OpenRouter API via AI service
    
    Args:
        resume_instance: Resume model instance
        job: Optional Job instance for contextual parsing
        file_item_id: Optional file_item_id to include in prompt for tracking
        
    Returns:
        ParsedResume instance
        
    Raises:
        ValueError: If parsing fails or returns error
    """
    import logging
    import time
    logger = logging.getLogger(__name__)
    timing_logger = logging.getLogger('processing.timing')
    
    # Get file path
    file_path = resume_instance.file.path
    parse_start_time = time.time()
    resume_id = resume_instance.id
    candidate_id = resume_instance.candidate.id
    timing_logger.info(f"[RESUME {resume_id}] Starting resume parsing for resume {resume_id} (candidate {candidate_id}): {file_path}")
    logger.info(f"[RESUME {resume_id}] Resume parse started at {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Use AI service if available, otherwise fallback to old method
    parsed_data = None
    if HAS_AI_SERVICE:
        try:
            # Send file directly to OpenRouter (no local text extraction)
            # OpenRouter will handle PDF parsing, and DOCX will be auto-extracted by AI service
            timing_logger.info(f"[RESUME {resume_id}] [TIMING] Starting AI processing with OpenRouter API (direct file upload)...")
            logger.info(f"[RESUME {resume_id}] Preparing to send file directly to OpenRouter API at {time.strftime('%Y-%m-%d %H:%M:%S')}")
            ai_start_time = time.time()
            
            # Rate limiting: Wait if needed to maintain 500ms delay between API requests
            _api_rate_limiter.wait_if_needed()
            
            # Load prompt template with job context and file_item_id
            prompt_template = load_prompt_template('parse_resume')
            prompt_template, target_job_payload = _append_job_context_to_prompt(prompt_template, job, file_item_id=file_item_id)
            if file_item_id:
                logger.info(f"[RESUME {resume_id}] Included file_item_id {file_item_id} in prompt")
            if target_job_payload and job:
                logger.info(f"[RESUME {resume_id}] Included target job context in prompt for job {job.id}")
            
            # Use default max_tokens (OpenRouter will handle file size automatically)
            # For direct file upload, we don't know the exact text length, so use a safe default
            max_tokens = 16000  # Default, OpenRouter can handle larger files
            logger.info(f"[RESUME {resume_id}] Using max_tokens: {max_tokens} for direct file upload")
            
            # Send file directly to OpenRouter
            # For PDFs: sent directly to OpenRouter as base64 data URL (OpenRouter handles parsing)
            # For DOCX: AI service will automatically extract text (OpenRouter doesn't support DOCX natively)
            file_ext = Path(file_path).suffix.lower()
            logger.info(f"[RESUME {resume_id}] Using DIRECT FILE UPLOAD to OpenRouter (file type: {file_ext})")
            logger.info(f"[RESUME {resume_id}] Sending file directly to OpenRouter API (model: {settings.OPENROUTER_MODEL}) at {time.strftime('%Y-%m-%d %H:%M:%S')}")
            api_request_start = time.time()
            
            # Get PDF engine from settings if configured (optional)
            pdf_engine = getattr(settings, 'OPENROUTER_PDF_ENGINE', None)
            if pdf_engine:
                logger.info(f"[RESUME {resume_id}] Using PDF engine: {pdf_engine}")
            
            parsed_data = process_file_with_prompt(
                file_path=str(file_path),
                prompt_name='parse_resume',
                prompt_override=prompt_template,
                model=settings.OPENROUTER_MODEL,
                pdf_engine=pdf_engine,  # Optional PDF engine configuration
                temperature=0.3,  # Lower temperature for more consistent JSON output
                max_tokens=max_tokens,
                response_format={"type": "json_object"}
            )
            api_request_end = time.time()
            api_request_time = api_request_end - api_request_start
            ai_processing_time = api_request_end - ai_start_time
            logger.info(f"[RESUME {resume_id}] Received response from OpenRouter API at {time.strftime('%Y-%m-%d %H:%M:%S')} (API request took {api_request_time:.2f}s, total AI processing: {ai_processing_time:.2f}s)")
            timing_logger.info(f"[RESUME {resume_id}] [TIMING] OpenRouter API request completed in {api_request_time:.2f} seconds ({api_request_time*1000:.0f}ms)")
            timing_logger.info(f"[RESUME {resume_id}] [TIMING] AI processing completed in {ai_processing_time:.2f} seconds ({ai_processing_time*1000:.0f}ms)")
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
            # No fallback - raise error directly
            raise ValueError(f"Resume parsing failed: {error_str}")
    else:
        # AI service not available
        logger.error("AI service is not available. Please ensure ai/service.py is accessible.")
        raise ValueError("Resume parsing failed: AI service is not available")
    
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
    
    # Save raw JSON response before any processing (for debugging in admin)
    raw_json_response_copy = json.loads(json.dumps(parsed_data, default=str))
    logger.info(f"[RESUME {resume_id}] Raw JSON response saved (keys: {list(raw_json_response_copy.keys())})")
    
    # Extract text for raw_text field (only for DOCX, after successful parsing)
    # PDF files are stored without raw_text extraction (already processed by OpenRouter)
    # This is for storage purposes only - AI service already processed the file
    raw_text = ""
    file_ext = Path(file_path).suffix.lower()
    if file_ext in ['.doc', '.docx']:
        try:
            raw_text = extract_text_from_docx(file_path)
        except Exception as extract_error:
            logger.debug(f"Could not extract raw text from DOCX for storage: {str(extract_error)}")
            raw_text = ""
    
    # Create or update ParsedResume
    parsed_resume, created = ParsedResume.objects.get_or_create(
        resume=resume_instance,
        defaults={
            'raw_text': raw_text,
            'parsed_data': parsed_data,
            'raw_json_response': raw_json_response_copy
        }
    )
    
    if not created:
        parsed_resume.raw_text = raw_text
        parsed_resume.parsed_data = parsed_data
        parsed_resume.raw_json_response = raw_json_response_copy
        parsed_resume.save()
    
    # Extract resume data sections (new structure nests under extracted_resume_data)
    extracted_resume_data = parsed_data.get('extracted_resume_data')
    if not isinstance(extracted_resume_data, dict) or not extracted_resume_data:
        extracted_resume_data = parsed_data

    # Extract personal info - handle nested and flat structures
    personal_info = (
        (extracted_resume_data.get('personal_info', {}) if isinstance(extracted_resume_data, dict) else {}) or
        parsed_data.get('personal_info', {}) or
        {}
    )
    if not personal_info:
        personal_info = parsed_data
    
    # Log personal_info structure for debugging
    logger.info(f"[RESUME {resume_id}] Personal info keys: {list(personal_info.keys()) if isinstance(personal_info, dict) else 'Not a dict'}")
    if isinstance(personal_info, dict):
        full_name_in_personal_info = personal_info.get('full_name', 'NOT_FOUND')
        logger.info(f"[RESUME {resume_id}] full_name from personal_info: '{full_name_in_personal_info}' (type: {type(full_name_in_personal_info)})")
    else:
        logger.warning(f"[RESUME {resume_id}] personal_info is not a dict: {type(personal_info)}")
    
    links = personal_info.get('links', {}) if isinstance(personal_info, dict) else {}
    
    # Update ParsedResume with personal information
    full_name_raw = personal_info.get('full_name', '') or ''
    logger.info(f"[RESUME {resume_id}] full_name_raw extracted: '{full_name_raw}' (type: {type(full_name_raw)}, len: {len(str(full_name_raw))})")
    
    # Ignore "unknown" values from AI parsing
    full_name_normalized = full_name_raw.strip().lower()
    parsed_resume.full_name = '' if full_name_normalized == 'unknown' else full_name_raw
    logger.info(f"[RESUME {resume_id}] parsed_resume.full_name set to: '{parsed_resume.full_name}' (normalized was: '{full_name_normalized}')")
    parsed_resume.phone = personal_info.get('phone', '') or ''
    # Normalize email (remove spaces, lowercase, etc.)
    raw_email = personal_info.get('email', '') or ''
    parsed_resume.email = _normalize_email(raw_email) or ''
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
    
    parsed_resume.interests = (
        extracted_resume_data.get('interests', {}) if isinstance(extracted_resume_data, dict) else {}
    ) or parsed_data.get('interests', {}) or {}
    parsed_resume.extraction_notes = parsed_data.get('extraction_notes', {}) or {}
    
    # Extract summary and store in other_sections
    summary = (
        extracted_resume_data.get('summary', '') if isinstance(extracted_resume_data, dict) else ''
    ) or parsed_data.get('summary', '') or personal_info.get('summary', '')
    other_sections = (
        extracted_resume_data.get('other_sections', {}) if isinstance(extracted_resume_data, dict) else {}
    ) or parsed_data.get('other_sections', {}) or {}
    if summary:
        other_sections['summary'] = summary
    parsed_resume.other_sections = other_sections
    
    # Extract AI review and expected salary from parsed_data
    # These fields can be at the root level or nested in personal_info
    parsed_resume.ai_review = parsed_data.get('ai_review', '') or personal_info.get('ai_review', '') or ''
    parsed_resume.expected_salary = parsed_data.get('expected_salary', '') or personal_info.get('expected_salary', '') or ''

    # Scoring results (summary exposed to UI, rest stored for audit)
    scoring_results = parsed_data.get('scoring_results', {}) or {}
    final_scores = scoring_results.get('final_scores', {}) if isinstance(scoring_results, dict) else {}
    parsed_resume.experience_depth_score = _to_decimal(final_scores.get('experience_depth_score'))
    parsed_resume.education_level_score = _to_decimal(final_scores.get('education_level_score'))
    parsed_resume.overall_weighted_score = _to_decimal(final_scores.get('overall_weighted_score'))
    parsed_resume.seniority_match_score = _to_decimal(final_scores.get('seniority_match_score'))
    scoring_payload = {}
    if isinstance(scoring_results, dict):
        scoring_payload = scoring_results.copy()
        scoring_payload.pop('final_scores', None)
    parsed_resume.scoring_details = scoring_payload or {}
    # Get interpretation from scoring_results.interpretation first (as per parse_resume.md),
    # then from root level interpretation
    parsed_resume.interpretation = (
        scoring_results.get('interpretation', {}) or 
        parsed_data.get('interpretation', {}) or 
        {}
    )
    parsed_resume.audit_trail = parsed_data.get('audit_trail', {}) or {}
    
    parsed_resume.save()
    
    # Find/update candidate using file_item_id
    candidate = None
    if file_item_id:
        try:
            # Find FileItem by file_item_id
            file_item = FileItem.objects.get(id=file_item_id)
            candidate = file_item.candidate
            if candidate:
                logger.info(f"[RESUME {resume_id}] Found candidate {candidate.id} using file_item_id {file_item_id}")
            else:
                logger.warning(f"[RESUME {resume_id}] FileItem {file_item_id} has no candidate, using resume_instance.candidate")
                candidate = resume_instance.candidate
        except FileItem.DoesNotExist:
            logger.warning(f"[RESUME {resume_id}] FileItem {file_item_id} not found, using resume_instance.candidate")
            candidate = resume_instance.candidate
    else:
        # Fallback to resume_instance.candidate if file_item_id not provided
        candidate = resume_instance.candidate
    
    # Update candidate information from parsed data
    # Update name if we have a parsed name and candidate name is empty or "unknown"
    candidate_name_normalized = (candidate.name or '').strip().lower()
    parsed_full_name_normalized = (parsed_resume.full_name or '').strip().lower()
    
    logger.info(f"[RESUME {resume_id}] Candidate update check - candidate.name: '{candidate.name}', candidate_name_normalized: '{candidate_name_normalized}'")
    logger.info(f"[RESUME {resume_id}] Candidate update check - parsed_resume.full_name: '{parsed_resume.full_name}', parsed_full_name_normalized: '{parsed_full_name_normalized}'")
    
    # Only update if parsed name exists, is not "unknown", and candidate name is empty/unknown
    should_update = (
        parsed_resume.full_name and 
        parsed_full_name_normalized != 'unknown' and
        parsed_full_name_normalized != '' and
        (not candidate.name or candidate_name_normalized == '' or candidate_name_normalized == 'unknown')
    )
    
    logger.info(f"[RESUME {resume_id}] Should update candidate name: {should_update}")
    
    if should_update:
        old_name = candidate.name
        candidate.name = parsed_resume.full_name
        logger.info(f"[RESUME {resume_id}] Updated candidate {candidate.id} name from '{old_name}' to '{parsed_resume.full_name}'")
    else:
        logger.info(f"[RESUME {resume_id}] Skipped updating candidate name - conditions not met")
    
    # Update email if we have a parsed email and candidate email is temporary
    if parsed_resume.email and (candidate.email.startswith('temp_') or candidate.email.endswith('@temp.com') or candidate.email.endswith('@example.com')):
        old_email = candidate.email
        normalized_email = _normalize_email(parsed_resume.email)
        
        if normalized_email:
            # Check if another candidate with this email already exists
            existing_candidate = None
            try:
                existing_candidate = Candidate.objects.exclude(id=candidate.id).get(email=normalized_email)
            except Candidate.DoesNotExist:
                pass
            
            if existing_candidate:
                # Another candidate with this email exists - link resume to existing candidate
                logger.warning(
                    f"[RESUME {resume_id}] Candidate {candidate.id} has email '{normalized_email}' that already exists for candidate {existing_candidate.id}. "
                    f"Linking resume to existing candidate {existing_candidate.id}."
                )
                # Update resume to point to existing candidate
                resume_instance.candidate = existing_candidate
                resume_instance.save()
                candidate = existing_candidate
            else:
                # Email is unique, update candidate
                candidate.email = normalized_email
                logger.info(f"[RESUME {resume_id}] Updated candidate {candidate.id} email from '{old_email}' to '{normalized_email}'")
        else:
            logger.warning(f"[RESUME {resume_id}] Invalid email format extracted: '{parsed_resume.email}', skipping email update")
    
    if parsed_resume.phone and not candidate.phone:
        candidate.phone = parsed_resume.phone
        logger.info(f"[RESUME {resume_id}] Updated candidate {candidate.id} phone: {parsed_resume.phone}")
    if parsed_resume.linkedin_url and not candidate.linkedin_url:
        candidate.linkedin_url = parsed_resume.linkedin_url
        logger.info(f"[RESUME {resume_id}] Updated candidate {candidate.id} linkedin_url: {parsed_resume.linkedin_url}")
    if parsed_resume.github_url and not candidate.github_url:
        candidate.github_url = parsed_resume.github_url
        logger.info(f"[RESUME {resume_id}] Updated candidate {candidate.id} github_url: {parsed_resume.github_url}")
    
    try:
        candidate.save()
        logger.info(f"[RESUME {resume_id}] Successfully saved candidate {candidate.id} to database: name='{candidate.name}', email='{candidate.email}'")
    except IntegrityError as exc:
        logger.error(
            f"[RESUME {resume_id}] Duplicate candidate email detected while saving parsed resume for candidate {candidate.id}",
            exc_info=True,
        )
        raise ValueError("Resume parsing failed: فایل رزومه تکراری ست") from exc
    
    logger.info(f"[RESUME {resume_id}] Updated candidate {candidate.id}: {candidate.name}, {candidate.email}")
    
    # Extract full_name from raw_json_response and update candidate name
    # This is an additional step to ensure we get the name directly from the raw JSON response
    if parsed_resume.raw_json_response:
        try:
            raw_json = parsed_resume.raw_json_response
            # Try different paths to find full_name in the JSON structure
            full_name_from_raw = None
            
            # Path 1: extracted_resume_data.personal_info.full_name
            extracted_data = raw_json.get('extracted_resume_data', {})
            if isinstance(extracted_data, dict):
                personal_info = extracted_data.get('personal_info', {})
                if isinstance(personal_info, dict):
                    full_name_from_raw = personal_info.get('full_name')
            
            # Path 2: personal_info.full_name (flat structure)
            if not full_name_from_raw:
                personal_info = raw_json.get('personal_info', {})
                if isinstance(personal_info, dict):
                    full_name_from_raw = personal_info.get('full_name')
            
            # Path 3: full_name at root level
            if not full_name_from_raw:
                full_name_from_raw = raw_json.get('full_name')
            
            # Update candidate name if we found a valid full_name
            if full_name_from_raw:
                full_name_str = str(full_name_from_raw).strip()
                full_name_normalized = full_name_str.lower()
                
                # Ignore "unknown" values
                if full_name_str and full_name_normalized != 'unknown' and full_name_normalized != '':
                    old_candidate_name = candidate.name
                    candidate.name = full_name_str
                    candidate.save()
                    logger.info(
                        f"[RESUME {resume_id}] Updated candidate {candidate.id} name from raw_json_response: "
                        f"'{old_candidate_name}' -> '{full_name_str}'"
                    )
                else:
                    logger.debug(
                        f"[RESUME {resume_id}] full_name from raw_json_response is empty or 'unknown': '{full_name_str}'"
                    )
            else:
                logger.debug(f"[RESUME {resume_id}] full_name not found in raw_json_response")
        except Exception as e:
            logger.warning(
                f"[RESUME {resume_id}] Error extracting full_name from raw_json_response: {str(e)}",
                exc_info=True
            )
    
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
    Certification.objects.filter(parsed_resume=parsed_resume).delete()
    Publication.objects.filter(parsed_resume=parsed_resume).delete()
    
    education_entries = []
    if isinstance(extracted_resume_data, dict):
        education_entries = extracted_resume_data.get('education', []) or []
    if not education_entries:
        education_entries = parsed_data.get('education', []) or []

    experience_entries = []
    if isinstance(extracted_resume_data, dict):
        experience_entries = (
            extracted_resume_data.get('experience') or
            extracted_resume_data.get('experiences') or
            []
        )
    if not experience_entries:
        experience_entries = parsed_data.get('experiences', []) or parsed_data.get('experience', []) or []

    skills_section = {}
    if isinstance(extracted_resume_data, dict):
        skills_section = extracted_resume_data.get('skills', {}) or {}
    if not skills_section:
        skills_section = parsed_data.get('skills', {}) or {}

    courses_entries = []
    if isinstance(extracted_resume_data, dict):
        courses_entries = extracted_resume_data.get('courses', []) or []
    if not courses_entries:
        courses_entries = parsed_data.get('courses', []) or []

    certifications_entries = []
    if isinstance(extracted_resume_data, dict):
        certifications_entries = extracted_resume_data.get('certifications', []) or []
    if not certifications_entries:
        certifications_entries = parsed_data.get('certifications', []) or []

    languages_entries = []
    if isinstance(extracted_resume_data, dict):
        languages_entries = extracted_resume_data.get('languages', []) or []
    if not languages_entries:
        languages_entries = parsed_data.get('languages', []) or []

    projects_entries = []
    if isinstance(extracted_resume_data, dict):
        projects_entries = extracted_resume_data.get('projects', []) or []
    if not projects_entries:
        projects_entries = parsed_data.get('projects', []) or []

    awards_entries = []
    if isinstance(extracted_resume_data, dict):
        awards_entries = extracted_resume_data.get('awards', []) or []
    if not awards_entries:
        awards_entries = parsed_data.get('awards', []) or []

    publications_entries = []
    if isinstance(extracted_resume_data, dict):
        publications_entries = extracted_resume_data.get('publications', []) or []
    if not publications_entries:
        publications_entries = parsed_data.get('publications', []) or []

    # Create Education records
    for idx, edu_data in enumerate(education_entries):
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
            institution_category=edu_data.get('institution_category', ''),
            graduation_year=edu_data.get('graduation_year'),
            start_date=edu_data.get('start_date', ''),
            end_date=end_date,
            gpa=edu_data.get('gpa', ''),
            honors=edu_data.get('honors', ''),
            thesis=edu_data.get('thesis', ''),
            relevant_courses=edu_data.get('relevant_courses', []),
            order=idx
        )
    
    # Create Experience records
    for idx, exp_data in enumerate(experience_entries):
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
            duration_months=exp_data.get('duration_months'),
            is_currently_employed=is_current,
            is_current=is_current,  # Legacy field
            reasoning=exp_data.get('reasoning', ''),
            description=description,  # Legacy field
            responsibilities=responsibilities,
            extracted_skills=exp_data.get('extracted_skills', []),
            order=idx
        )
    
    # Create Technical Skills
    # Support both nested structure (technical/soft) and flat structure (from sample)
    skills_data = skills_section
    
    # Handle nested structure (current format)
    if isinstance(skills_data, dict):
        technical_skills = skills_data.get('technical', []) or []
        for category_data in technical_skills:
            # Format: {"category": "...", "items": [{"name": "..."}] or ["string", ...]}
            if isinstance(category_data, dict) and category_data.get('items'):
                category = category_data.get('category', '')
                for item in category_data.get('items', []):
                    if isinstance(item, dict):
                        TechnicalSkill.objects.create(
                            parsed_resume=parsed_resume,
                            category=category or '',
                            name=item.get('name', ''),
                            level=item.get('level', '')
                        )
                    elif isinstance(item, str):
                        # If item is a string, use it as the name
                        TechnicalSkill.objects.create(
                            parsed_resume=parsed_resume,
                            category=category or '',
                            name=item,
                            level=''
                        )
                continue
            
            # Format: {"name": "...", "level": "...", "category": "..."}
            if isinstance(category_data, dict) and category_data.get('name'):
                TechnicalSkill.objects.create(
                    parsed_resume=parsed_resume,
                    category=category_data.get('category', '') or '',
                    name=category_data.get('name', ''),
                    level=category_data.get('level', '')
                )
                continue
            
            # Format: plain string
            if isinstance(category_data, str):
                TechnicalSkill.objects.create(
                    parsed_resume=parsed_resume,
                    category='',
                    name=category_data,
                    level=''
                )
        
        # Create Soft Skills
        soft_skills = skills_data.get('soft', []) or []
        for skill_item in soft_skills:
            if isinstance(skill_item, dict) and skill_item.get('name'):
                SoftSkill.objects.create(
                    parsed_resume=parsed_resume,
                    name=skill_item.get('name')
                )
            elif isinstance(skill_item, str):
                SoftSkill.objects.create(
                    parsed_resume=parsed_resume,
                    name=skill_item
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
    for idx, project_data in enumerate(projects_entries):
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
    for idx, award_data in enumerate(awards_entries):
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
    for lang_data in languages_entries:
        if isinstance(lang_data, str):
            Language.objects.create(
                parsed_resume=parsed_resume,
                language=lang_data,
                proficiency='',
                skills={},
                certificates=[]
            )
        elif isinstance(lang_data, dict):
            Language.objects.create(
                parsed_resume=parsed_resume,
                language=lang_data.get('language', ''),
                proficiency=lang_data.get('proficiency', ''),
                skills=lang_data.get('skills', {}),
                certificates=lang_data.get('certificates', [])
            )
    
    # Create Courses
    for idx, course_data in enumerate(courses_entries):
        if isinstance(course_data, str):
            Course.objects.create(
                parsed_resume=parsed_resume,
                name=course_data,
                order=idx
            )
            continue
        
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
    
    # Create Certifications
    for idx, cert_data in enumerate(certifications_entries):
        if isinstance(cert_data, str):
            Certification.objects.create(
                parsed_resume=parsed_resume,
                name=cert_data,
                order=idx
            )
            continue
        
        Certification.objects.create(
            parsed_resume=parsed_resume,
            name=cert_data.get('name', '') or cert_data.get('title', ''),
            issuer=cert_data.get('issuer', ''),
            date=cert_data.get('date', ''),
            description=cert_data.get('description', ''),
            certificate_id=cert_data.get('certificate_id', ''),
            verification_link=cert_data.get('verification_link', ''),
            order=idx
        )
    
    # Create Publications
    for idx, pub_data in enumerate(publications_entries):
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
    
    # Start database operations
    db_ops_start = time.time()
    logger.info(f"[RESUME {resume_id}] Starting database operations (saving parsed data) at {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    db_ops_time = time.time() - db_ops_start
    logger.info(f"[RESUME {resume_id}] Database operations completed in {db_ops_time:.2f} seconds at {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    parse_total_time = time.time() - parse_start_time
    TimelineEvent.objects.create(
        candidate=candidate,
        event_type='parsed',
        description='Resume parsed successfully',
        metadata={
            'resume_id': resume_instance.id,
            'duration_seconds': round(parse_total_time, 2)
        }
    )
    timing_logger.info(f"[RESUME {resume_id}] [TIMING] Total resume parsing completed in {parse_total_time:.2f} seconds ({parse_total_time*1000:.0f}ms) for resume {resume_instance.id}")
    logger.info(f"[RESUME {resume_id}] Resume parsing completed successfully at {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    return parsed_resume


def _normalize_digits(value):
    """Convert Persian digits to ASCII for reliable parsing."""
    if value is None:
        return ''
    value_str = str(value)
    return value_str.translate(PERSIAN_DIGIT_TRANSLATION)


def _normalize_text(value):
    """Lowercase and collapse whitespace for comparison."""
    if not value:
        return ''
    normalized = _normalize_digits(value).lower()
    return re.sub(r'\s+', ' ', normalized.strip())


def _age_from_value(raw_value):
    """Estimate age (in years) from a raw date or age string."""
    if not raw_value:
        return None
    normalized = _normalize_digits(raw_value)
    # Try direct numeric age (e.g., "32 years old")
    age_match = re.search(r'(\d{2})\s*(?:سال|سالگی|years?)', normalized)
    if age_match:
        try:
            return int(age_match.group(1))
        except (TypeError, ValueError):
            pass
    year_match = re.search(r'(1[34]\d{2}|20\d{2}|19\d{2})', normalized)
    if not year_match:
        return None
    try:
        year = int(year_match.group(1))
    except ValueError:
        return None
    if year < 1700:
        year += 621
    current_year = timezone.now().year
    age = current_year - year
    if age < 0 or age > 100:
        return None
    return age


def _extract_candidate_age(parsed_resumes):
    for parsed_resume in parsed_resumes:
        if parsed_resume.date_of_birth:
            age = _age_from_value(parsed_resume.date_of_birth)
            if age is not None:
                return age
        data = parsed_resume.parsed_data if isinstance(parsed_resume.parsed_data, dict) else {}
        personal_info = data.get('personal_info', {}) if isinstance(data, dict) else {}
        dob_value = personal_info.get('date_of_birth') or data.get('date_of_birth')
        if dob_value:
            age = _age_from_value(dob_value)
            if age is not None:
                return age
        age_value = personal_info.get('age') or data.get('age')
        if isinstance(age_value, (int, float)):
            return int(age_value)
        if isinstance(age_value, str):
            digits = re.search(r'\d+', _normalize_digits(age_value))
            if digits:
                return int(digits.group())
    return None


def _parse_duration_months_from_text(value):
    if not value:
        return None
    normalized = _normalize_digits(value).lower()
    months = 0.0
    found = False
    for match in re.findall(r'(\d+(?:\.\d+)?)\s*(?:year|yr|سال)', normalized):
        months += float(match) * 12
        found = True
    for match in re.findall(r'(\d+(?:\.\d+)?)\s*(?:month|ماه)', normalized):
        months += float(match)
        found = True
    if not found:
        return None
    return int(round(months))


def _parse_year_month_string(value):
    if not value:
        return None
    normalized = _normalize_digits(value).replace('/', '-').strip()
    parts = normalized.split('-')
    if len(parts) < 2:
        return None
    year_part, month_part = parts[0], parts[1]
    if not year_part.isdigit() or not month_part.isdigit():
        return None
    year = int(year_part)
    month = max(1, min(12, int(month_part)))
    if year < 1700:
        year += 621
    try:
        return date(year, month, 1)
    except ValueError:
        return None


def _calculate_total_experience_years(parsed_resumes):
    total_months = 0
    found = False
    for parsed_resume in parsed_resumes:
        for experience in parsed_resume.experiences.all():
            months = None
            if experience.duration_months:
                months = experience.duration_months
            elif experience.duration:
                months = _parse_duration_months_from_text(experience.duration)
            elif experience.start_date and experience.end_date:
                start = _parse_year_month_string(experience.start_date)
                end = _parse_year_month_string(experience.end_date)
                if start and end:
                    diff = (end.year - start.year) * 12 + (end.month - start.month)
                    months = max(diff, 0)
            if months is None:
                # Fallback: count each experience as roughly one year
                months = 12
            total_months += months
            found = True
    if not found:
        return None
    return round(total_months / 12.0, 1)


def _normalize_gender(value):
    normalized = _normalize_text(value)
    if not normalized:
        return None
    for key, keywords in GENDER_KEYWORDS.items():
        if normalized == key or any(keyword in normalized for keyword in keywords):
            return key
    return None


def _extract_candidate_gender(parsed_resumes):
    for parsed_resume in parsed_resumes:
        data = parsed_resume.parsed_data if isinstance(parsed_resume.parsed_data, dict) else {}
        personal_info = data.get('personal_info', {}) if isinstance(data, dict) else {}
        gender_value = personal_info.get('gender') or data.get('gender')
        if gender_value:
            gender = _normalize_gender(gender_value)
            if gender:
                return gender
    return None


def _map_military_value(value):
    normalized = _normalize_text(value)
    if not normalized:
        return None
    for status, keywords in MILITARY_STATUS_KEYWORDS.items():
        if normalized == status or any(keyword in normalized for keyword in keywords):
            return status
    return None


def _extract_military_status(parsed_resumes):
    for parsed_resume in parsed_resumes:
        if parsed_resume.military_service:
            status = _map_military_value(parsed_resume.military_service)
            if status:
                return status
        data = parsed_resume.parsed_data if isinstance(parsed_resume.parsed_data, dict) else {}
        personal_info = data.get('personal_info', {}) if isinstance(data, dict) else {}
        military_value = personal_info.get('military_service') or data.get('military_service')
        if military_value:
            status = _map_military_value(military_value)
            if status:
                return status
    return None


def _map_degree_to_level(value):
    normalized = _normalize_text(value)
    if not normalized:
        return None
    if any(token in normalized for token in ['postdoc', 'post-doctoral', 'پساس', 'پسادکترا']):
        return 'postdoctoral'
    if any(token in normalized for token in ['phd', 'doctorate', 'دکت', 'ph.d']):
        return 'doctorate'
    if any(token in normalized for token in ['master', 'ارشد', 'msc', 'm.s', 'm.sc']):
        return 'master'
    if any(token in normalized for token in ['bachelor', 'کارشناسی', 'لیسانس', 'b.sc', 'bs']):
        return 'bachelor'
    if any(token in normalized for token in ['diploma', 'دیپلم', 'کاردانی', 'associate']):
        return 'diploma'
    return None


def _determine_highest_education_level(parsed_resumes):
    highest = None
    for parsed_resume in parsed_resumes:
        for education in parsed_resume.educations.all():
            level = _map_degree_to_level(education.degree)
            if not level:
                continue
            if highest is None or EDUCATION_LEVEL_ORDER[level] > EDUCATION_LEVEL_ORDER[highest]:
                highest = level
    return highest


def _collect_candidate_majors(parsed_resumes):
    majors = set()
    for parsed_resume in parsed_resumes:
        for education in parsed_resume.educations.all():
            if education.field:
                majors.add(_normalize_text(education.field))
    return majors


def _map_institution_category(value):
    normalized = _normalize_text(value)
    if normalized in UNIVERSITY_CATEGORY_IDS:
        return normalized
    for category, keywords in UNIVERSITY_CATEGORY_KEYWORDS.items():
        if any(keyword in normalized for keyword in keywords):
            return category
    return None


def _normalize_university_identifier(value):
    normalized = _normalize_text(value)
    if normalized in UNIVERSITY_CATEGORY_IDS:
        return normalized
    mapped = _map_institution_category(value)
    if mapped:
        return mapped
    return normalized


def _collect_candidate_universities(parsed_resumes):
    universities = set()
    for parsed_resume in parsed_resumes:
        for education in parsed_resume.educations.all():
            if education.institution:
                identifier = _normalize_university_identifier(education.institution)
                if identifier:
                    universities.add(identifier)
            if education.institution_category:
                mapped = _map_institution_category(education.institution_category)
                if mapped:
                    universities.add(mapped)
    return universities


def apply_auto_reject_rules(candidate, job):
    """
    Apply auto-reject rules for a candidate against a job
    
    Returns:
        tuple: (is_rejected: bool, reason: str)
    """
    reasons = []
    parsed_resumes = list(
        ParsedResume.objects.filter(resume__candidate=candidate).prefetch_related('experiences', 'educations')
    )

    if not parsed_resumes:
        return False, ""
    
    # Check experience minimum years from job model
    if job.experience_min_years and job.experience_min_years_auto_reject:
        total_years = _calculate_total_experience_years(parsed_resumes)
        if total_years is not None and total_years < job.experience_min_years:
            reasons.append(
                f"Minimum years of experience not met: {total_years:.1f} < {job.experience_min_years}"
            )
    
    # Age range requirements
    if job.age_range_auto_reject and (job.age_range_min is not None or job.age_range_max is not None):
        candidate_age = _extract_candidate_age(parsed_resumes)
        if candidate_age is not None:
            if job.age_range_min is not None and candidate_age < job.age_range_min:
                reasons.append(
                    f"Age requirement mismatch: {candidate_age} < minimum {job.age_range_min}"
                )
            if job.age_range_max is not None and candidate_age > job.age_range_max:
                reasons.append(
                    f"Age requirement mismatch: {candidate_age} > maximum {job.age_range_max}"
                )
    
    # Gender requirement
    if job.gender_auto_reject and job.gender and job.gender != 'any':
        candidate_gender = _extract_candidate_gender(parsed_resumes)
        if candidate_gender and candidate_gender != job.gender:
            reasons.append(f"Gender requirement mismatch: expected {job.gender}, got {candidate_gender}")
    
    # Military service requirement
    if job.military_auto_reject and job.military_status and job.military_status != 'any':
        candidate_military_status = _extract_military_status(parsed_resumes)
        if candidate_military_status and candidate_military_status != job.military_status:
            reasons.append(
                f"Military status mismatch: expected {job.military_status}, got {candidate_military_status}"
            )
    
    # Minimum education level
    if job.education_level_auto_reject and job.education_level and job.education_level != 'any':
        candidate_level = _determine_highest_education_level(parsed_resumes)
        if candidate_level:
            if EDUCATION_LEVEL_ORDER[candidate_level] < EDUCATION_LEVEL_ORDER[job.education_level]:
                reasons.append(
                    f"Education level mismatch: highest {candidate_level}, requires {job.education_level}"
                )
        else:
            reasons.append("Education level data unavailable to satisfy requirement")
    
    # Education major requirement
    job_majors = [m for m in (job.education_major or []) if isinstance(m, str) and m.strip()]
    if job.education_major_auto_reject and job_majors:
        normalized_required_majors = {_normalize_text(m) for m in job_majors}
        candidate_majors = _collect_candidate_majors(parsed_resumes)
        if candidate_majors and normalized_required_majors.isdisjoint(candidate_majors):
            reasons.append("Required university major not found in candidate profile")
        elif not candidate_majors:
            reasons.append("Required university major not found in candidate profile")
    
    # Target / preferred universities
    if (
        job.preferred_universities_auto_reject
        and job.preferred_universities_enabled
        and job.preferred_universities
    ):
        normalized_targets = {
            identifier
            for value in job.preferred_universities
            if value
            for identifier in [_normalize_university_identifier(value)]
            if identifier
        }
        if normalized_targets:
            candidate_universities = _collect_candidate_universities(parsed_resumes)
            if candidate_universities:
                if normalized_targets.isdisjoint(candidate_universities):
                    reasons.append("Candidate university history does not match preferred targets")
            else:
                reasons.append("Candidate university history does not match preferred targets")
    
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


def _process_single_file_item(file_item, batch, counters, lock):
    """
    Process a single file item (called by worker threads)
    
    Args:
        file_item: FileItem instance to process
        batch: BatchUpload instance
        counters: dict with 'successful' and 'failed' keys (thread-safe counters)
        lock: threading.Lock for thread-safe operations
    """
    import logging
    import time
    from django.db import connections
    
    logger = logging.getLogger(__name__)
    timing_logger = logging.getLogger('processing.timing')
    
    try:
        file_processing_start = time.time()
        file_item.status = 'processing'
        file_item.save()
        timing_logger.info(f"[TIMING] Starting processing for file item {file_item.id}: {file_item.file.name}")
        logger.info(f"[FILE ITEM {file_item.id}] Starting processing at {time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Create temporary candidate with file_item_id (no email/name yet)
        # Email will be set after parsing
        candidate, created = Candidate.objects.get_or_create(
            email=f"temp_file_item_{file_item.id}@temp.com",  # Temporary email with file_item_id
            defaults={'name': ''}  # Empty name, will be set after parsing
        )
        
        if created:
            logger.info(f"[FILE ITEM {file_item.id}] Created temporary candidate {candidate.id} for file item {file_item.id}")
        else:
            logger.info(f"[FILE ITEM {file_item.id}] Using existing temporary candidate {candidate.id} for file item {file_item.id}")
        
        # Create resume
        try:
            resume = Resume.objects.create(
                candidate=candidate,
                file=file_item.file
            )
            resume_id = resume.id
            logger.info(f"[FILE ITEM {file_item.id}] Created resume {resume_id} for candidate {candidate.id} at {time.strftime('%Y-%m-%d %H:%M:%S')}")
        except Exception as e:
            logger.error(f"[FILE ITEM {file_item.id}] Failed to create resume for file item {file_item.id}: {str(e)}")
            raise ValueError(f"Failed to create resume: {str(e)}")
        
        upload_duration_seconds = max((timezone.now() - file_item.created_at).total_seconds(), 0.0)
        TimelineEvent.objects.create(
            candidate=candidate,
            event_type='uploaded',
            description='Resume uploaded',
            metadata={
                'resume_id': resume_id,
                'file_name': Path(file_item.file.name).name,
                'duration_seconds': round(upload_duration_seconds, 2)
            }
        )
        
        file_item.candidate = candidate
        file_item.save()
        job = batch.job if getattr(batch, 'job', None) else None
        
        # Parse resume
        try:
            logger.info(f"[FILE ITEM {file_item.id}] Starting resume parsing for resume {resume_id} at {time.strftime('%Y-%m-%d %H:%M:%S')}")
            parsed_resume = parse_resume_service(resume, job=job, file_item_id=file_item.id)
            logger.info(f"[FILE ITEM {file_item.id}] Successfully parsed resume {resume_id} at {time.strftime('%Y-%m-%d %H:%M:%S')}")
        except Exception as parse_error:
            logger.error(f"[FILE ITEM {file_item.id}] Failed to parse resume {resume_id}: {str(parse_error)}", exc_info=True)
            raise ValueError(f"Resume parsing failed: {str(parse_error)}")
        
        # Update candidate email if found in parsed data (already done in parse_resume_service)
        # But ensure it's updated if parsing succeeded
        if parsed_resume.email and (not candidate.email or candidate.email.startswith('temp_') or candidate.email.endswith('@temp.com') or candidate.email.endswith('@example.com')):
            old_email = candidate.email
            normalized_email = _normalize_email(parsed_resume.email)
            
            if normalized_email:
                # Check if another candidate with this email already exists
                existing_candidate = None
                try:
                    existing_candidate = Candidate.objects.exclude(id=candidate.id).get(email=normalized_email)
                except Candidate.DoesNotExist:
                    pass
                
                if existing_candidate:
                    # Another candidate with this email exists - link resume to existing candidate
                    logger.warning(
                        f"[RESUME {resume_id}] Candidate {candidate.id} has email '{normalized_email}' that already exists for candidate {existing_candidate.id}. "
                        f"Linking resume to existing candidate {existing_candidate.id}."
                    )
                    # Update resume to point to existing candidate
                    resume.candidate = existing_candidate
                    resume.save()
                    candidate = existing_candidate
                else:
                    # Email is unique, update candidate
                    candidate.email = normalized_email
                    try:
                        candidate.save()
                    except IntegrityError as exc:
                        logger.error(
                            "[RESUME %s] Duplicate candidate email detected while updating candidate %s",
                            resume_id,
                            candidate.id,
                            exc_info=True,
                        )
                        raise ValueError("Resume parsing failed: فایل رزومه تکراری ست") from exc
                    logger.info(f"[RESUME {resume_id}] Updated candidate {candidate.id} email from {old_email} to {normalized_email}")
            else:
                logger.warning(f"[RESUME {resume_id}] Invalid email format extracted: '{parsed_resume.email}', skipping email update")
        
        # If batch has a job, create JobScore and apply auto-reject rules
        if job:
            job_scoring_start = time.time()
            logger.info(f"[RESUME {resume_id}] [JOB SCORING] Starting job scoring and filtering for candidate {candidate.id} and job {job.id} (title: {job.title}) at {time.strftime('%Y-%m-%d %H:%M:%S')}")
            
            try:
                # Apply auto-reject rules
                filter_start = time.time()
                logger.info(f"[RESUME {resume_id}] [JOB SCORING] Applying auto-reject filters at {time.strftime('%Y-%m-%d %H:%M:%S')}")
                is_rejected, rejection_reason = apply_auto_reject_rules(candidate, job)
                filter_time = time.time() - filter_start
                logger.info(f"[RESUME {resume_id}] [JOB SCORING] Auto-reject filters completed in {filter_time:.2f} seconds - rejected={is_rejected}, reason={rejection_reason}")
                
                # Calculate initial score
                score_start = time.time()
                logger.info(f"[RESUME {resume_id}] [JOB SCORING] Calculating initial score at {time.strftime('%Y-%m-%d %H:%M:%S')}")
                score = calculate_initial_score(candidate, job)
                score_time = time.time() - score_start
                logger.info(f"[RESUME {resume_id}] [JOB SCORING] Score calculation completed in {score_time:.2f} seconds - calculated score: {score}")
                
                # Create or update JobScore
                db_save_start = time.time()
                logger.info(f"[RESUME {resume_id}] [JOB SCORING] Saving JobScore to database at {time.strftime('%Y-%m-%d %H:%M:%S')}")
                # Set initial category based on auto_rejected status
                initial_category = 'rejected' if is_rejected else 'shortlisted'
                
                job_score, created = JobScore.objects.get_or_create(
                    candidate=candidate,
                    job=job,
                    defaults={
                        'score': score,
                        'auto_rejected': is_rejected,
                        'rejection_reason': rejection_reason,
                        'category': initial_category
                    }
                )
                
                if not created:
                    job_score.score = score
                    job_score.auto_rejected = is_rejected
                    job_score.rejection_reason = rejection_reason
                    # Only update category if it's still the default (shortlisted) and now rejected
                    if is_rejected and job_score.category == 'shortlisted':
                        job_score.category = 'rejected'
                    job_score.save()
                    logger.info(f"[RESUME {resume_id}] [JOB SCORING] Updated JobScore for candidate {candidate.id} and job {job.id}")
                else:
                    logger.info(f"[RESUME {resume_id}] [JOB SCORING] Created JobScore for candidate {candidate.id} and job {job.id}")
                
                db_save_time = time.time() - db_save_start
                
                job_scoring_time = time.time() - job_scoring_start
                TimelineEvent.objects.create(
                    candidate=candidate,
                    event_type='scored',
                    description=f'Scored for job: {job.title}',
                    metadata={
                        'job_id': job.id,
                        'score': score,
                        'auto_rejected': is_rejected,
                        'duration_seconds': round(job_scoring_time, 2)
                    }
                )
                logger.info(f"[RESUME {resume_id}] [JOB SCORING] Job scoring completed successfully in {job_scoring_time:.2f} seconds at {time.strftime('%Y-%m-%d %H:%M:%S')}")
            except Exception as scoring_error:
                logger.error(f"[RESUME {resume_id}] [JOB SCORING] Failed to score candidate {candidate.id} for job {job.id}: {str(scoring_error)}", exc_info=True)
                # Don't fail the whole process if scoring fails, just log it
                pass
        
        file_item.status = 'completed'
        file_item.save()
        
        # Thread-safe counter update
        with lock:
            counters['successful'] += 1
            batch.processed_files += 1
            batch.save()
        
        file_processing_time = time.time() - file_processing_start
        timing_logger.info(f"[TIMING] Successfully processed file item {file_item.id} in {file_processing_time:.2f} seconds ({file_processing_time*1000:.0f}ms)")
        logger.info(f"[FILE ITEM {file_item.id}] File processing completed successfully at {time.strftime('%Y-%m-%d %H:%M:%S')} (total time: {file_processing_time:.2f}s)")
        return True
        
    except Exception as e:
        error_message = str(e)
        file_item.status = 'failed'
        file_item.error_message = error_message
        file_item.save()
        logger.error(f"Failed to process file item {file_item.id}: {error_message}", exc_info=True)
        
        # Thread-safe counter update
        with lock:
            counters['failed'] += 1
            batch.processed_files += 1
            batch.save()
        
        return False
    finally:
        # Close database connections for this thread
        connections.close_all()


def process_batch_service(batch_id):
    """
    Process a batch of uploaded files using 50 threads for concurrent processing
    
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
    logger.info(f"Starting processing for batch {batch_id} (job: {batch.job.id if batch.job else 'None'}) with 50 threads")
    
    file_items = list(batch.file_items.all())
    batch.total_files = len(file_items)
    batch.save()
    
    if batch.total_files == 0:
        logger.warning(f"Batch {batch_id} has no files to process")
        batch.status = 'completed'
        batch.save()
        return
    
    # Thread-safe counters
    counters = {'successful': 0, 'failed': 0}
    lock = Lock()
    
    try:
        # Use ThreadPoolExecutor with 50 workers to process 50 CVs simultaneously
        with ThreadPoolExecutor(max_workers=50) as executor:
            # Submit all file items to the thread pool
            future_to_file_item = {
                executor.submit(_process_single_file_item, file_item, batch, counters, lock): file_item
                for file_item in file_items
            }
            
            # Wait for all tasks to complete
            for future in as_completed(future_to_file_item):
                file_item = future_to_file_item[future]
                try:
                    success = future.result()
                    if success:
                        logger.info(f"Thread completed processing file item {file_item.id}")
                    else:
                        logger.warning(f"Thread completed processing file item {file_item.id} with errors")
                except Exception as e:
                    logger.error(f"Thread processing file item {file_item.id} raised exception: {str(e)}", exc_info=True)
                    # Update counters for unexpected exceptions
                    with lock:
                        counters['failed'] += 1
                        batch.processed_files += 1
                        batch.save()
        
        batch.status = 'completed'
        batch.save()
        logger.info(f"Batch {batch_id} processing completed: {counters['successful']} successful, {counters['failed']} failed")
        
    except Exception as e:
        batch.status = 'failed'
        batch.save()
        logger.error(f"Batch {batch_id} processing failed with exception: {str(e)}", exc_info=True)
        raise

