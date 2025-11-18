"""
Standalone AI service for processing files with prompts using OpenRouter API
"""
import os
import base64
import json
import re
from pathlib import Path
from typing import Dict, Any, Optional
import requests

# Try to import DOCX text extraction library (for DOCX files only)
# PDF files are sent directly to OpenRouter as base64 data URL
try:
    from docx import Document
    HAS_DOCX = True
except ImportError:
    HAS_DOCX = False


def load_prompt(prompt_name: str) -> str:
    """
    Load prompt template from ai/prompts/{prompt_name}.md
    
    Args:
        prompt_name: Name of the prompt file without .md extension
        
    Returns:
        Prompt content as string
        
    Raises:
        FileNotFoundError: If prompt file doesn't exist
    """
    # Get the directory where this file is located
    current_dir = Path(__file__).parent
    prompts_dir = current_dir / 'prompts'
    prompt_path = prompts_dir / f"{prompt_name}.md"
    
    if not prompt_path.exists():
        raise FileNotFoundError(f"Prompt file not found: {prompt_path}")
    
    with open(prompt_path, 'r', encoding='utf-8') as f:
        return f.read()


def _get_mime_type(file_path: str) -> str:
    """
    Get MIME type based on file extension
    
    Args:
        file_path: Path to the file
        
    Returns:
        MIME type string
    """
    ext = Path(file_path).suffix.lower()
    mime_types = {
        '.pdf': 'application/pdf',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.doc': 'application/msword',
    }
    return mime_types.get(ext, 'application/octet-stream')


def _extract_text_from_docx(file_path: str) -> str:
    """
    Extract text from DOCX file (PDF files are sent directly to OpenRouter)
    
    Args:
        file_path: Path to the DOCX file
        
    Returns:
        Extracted text as string
    """
    file_ext = Path(file_path).suffix.lower()
    
    if file_ext not in ['.doc', '.docx']:
        raise ValueError(f"Text extraction only supported for DOCX files. File type: {file_ext}")
    
    if not HAS_DOCX:
        raise ImportError("python-docx is required for DOCX text extraction. Install it with: pip install python-docx")
    
    try:
        doc = Document(file_path)
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        return text
    except Exception as e:
        raise ValueError(f"Error reading DOCX: {str(e)}")


def _file_to_base64_data_url(file_path: str) -> str:
    """
    Convert file to base64 data URL
    
    Args:
        file_path: Path to the file (absolute or relative)
        
    Returns:
        Base64 data URL string
    """
    file_path_obj = Path(file_path)
    if not file_path_obj.exists():
        raise FileNotFoundError(f"File not found: {file_path}")
    
    # Read file as binary
    with open(file_path_obj, 'rb') as f:
        file_content = f.read()
    
    # Encode to base64
    base64_content = base64.b64encode(file_content).decode('utf-8')
    
    # Get MIME type
    mime_type = _get_mime_type(file_path)
    
    # Return data URL
    return f"data:{mime_type};base64,{base64_content}"


def process_file_with_prompt(
    file_path: str,
    prompt_name: str,
    model: str,
    resume_text: str = None,
    prompt_override: Optional[str] = None,
    pdf_engine: Optional[str] = None,
    **kwargs
) -> Dict[str, Any]:
    """
    Process a file with a prompt using OpenRouter API
    
    All files are sent directly to OpenRouter:
    - PDF files: sent as base64 data URL (OpenRouter handles parsing)
    - DOCX files: text is extracted and sent as text (OpenRouter doesn't support DOCX natively)
    
    Args:
        file_path: Path to the file (absolute or relative)
        prompt_name: Name of the prompt file without .md extension
        model: LLM model name. Examples:
               - "openai/gpt-5" (default, recommended)
               - "openai/gpt-4"
               - "openai/gpt-4-turbo"
               - "anthropic/claude-3.5-sonnet"
               - "anthropic/claude-3-opus"
               - "google/gemini-pro"
               - "google/gemini-pro-1.5"
               - "meta-llama/llama-3-70b-instruct"
               - "mistralai/mistral-large"
               See https://openrouter.ai/models for full list
        resume_text: Pre-extracted text from the resume. If provided, this will be used for DOCX files.
        prompt_override: Optional custom prompt text to override the prompt file.
        pdf_engine: PDF processing engine for OpenRouter:
                   - None (default): Use OpenRouter's default engine
                   - "pdf-text": Free, best for well-structured PDFs
                   - "mistral-ocr": Paid, best for scanned documents or PDFs with images
                   - "native": Use model's native file processing capabilities
        **kwargs: Optional OpenRouter API parameters:
            - temperature (float): Controls randomness (0.0-2.0)
            - max_tokens (int): Maximum tokens to generate
            - response_format (dict): Format like {"type": "json_object"} for JSON responses
            - top_p (float): Nucleus sampling parameter
            - stop (list): Stop sequences
            - timeout (int): Request timeout in seconds (default: 60)
            - plugins (list): Additional plugins (will be merged with PDF plugin if pdf_engine is set)
    
    Returns:
        OpenRouter API response as dictionary (parsed JSON)
        
    Raises:
        ValueError: If OPENROUTER_API_KEY is not set
        FileNotFoundError: If file or prompt doesn't exist
        Exception: If OpenRouter API request fails
    """
    # Get API key from environment
    api_key = os.getenv('OPENROUTER_API_KEY')
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY is not set in environment variables")
    
    # Load prompt template (allow overrides for custom context)
    prompt_template = prompt_override if prompt_override is not None else load_prompt(prompt_name)
    
    # Check file type
    file_ext = Path(file_path).suffix.lower()
    is_pdf = file_ext == '.pdf'
    is_docx = file_ext in ['.docx', '.doc']
    
    # Process files: PDF sent directly, DOCX text extracted
    if is_pdf:
        # Send PDF directly to OpenRouter as base64 data URL
        print("📄 Processing method: Sending PDF directly to OpenRouter")
        file_data_url = _file_to_base64_data_url(file_path)
        filename = Path(file_path).name
        
        messages = [
            {
                "role": "system",
                "content": "You are an expert AI assistant specialized in parsing resumes. Extract all information from the provided PDF resume and return ONLY valid JSON. Do not include any explanatory text, only the JSON object."
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": prompt_template
                    },
                    {
                        "type": "file",
                        "file": {
                            "filename": filename,
                            "file_data": file_data_url
                        }
                    }
                ]
            }
        ]
        
        # Configure PDF processing engine via plugins if specified
        if pdf_engine:
            # Get or initialize plugins list
            if 'plugins' not in kwargs:
                kwargs['plugins'] = []
            elif not isinstance(kwargs['plugins'], list):
                kwargs['plugins'] = [kwargs['plugins']]
            
            # Check if file-parser plugin already exists
            file_parser_plugin = None
            for i, plugin in enumerate(kwargs['plugins']):
                if isinstance(plugin, dict) and plugin.get('id') == 'file-parser':
                    file_parser_plugin = kwargs['plugins'][i]
                    break
            
            # Add or update file-parser plugin
            if file_parser_plugin:
                file_parser_plugin['pdf'] = {'engine': pdf_engine}
            else:
                kwargs['plugins'].append({
                    'id': 'file-parser',
                    'pdf': {
                        'engine': pdf_engine
                    }
                })
            print(f"📄 Using PDF engine: {pdf_engine}")
    
    elif is_docx:
        # Extract text from DOCX and send as text (OpenRouter doesn't support DOCX natively)
        print("📄 Processing method: Extracting text from DOCX and sending to OpenRouter")
        
        # Use pre-extracted text if provided, otherwise extract
        if resume_text:
            file_text = resume_text
        else:
            file_text = _extract_text_from_docx(file_path)
        
        # Format prompt with extracted text
        if "{resume_text}" in prompt_template:
            full_prompt = prompt_template.format(resume_text=file_text)
        else:
            full_prompt = f"{prompt_template}\n\nResume text:\n{file_text}"
        
        # Check prompt length and warn if too long
        prompt_length = len(full_prompt)
        if prompt_length > 200000:  # ~200k chars = ~50k tokens
            print(f"⚠️  Warning: Prompt is very long ({prompt_length} chars). This might cause issues.")
        
        messages = [
            {
                "role": "system",
                "content": "You are an expert AI assistant specialized in parsing resumes. Extract all information from the resume text and return ONLY valid JSON. Do not include any explanatory text, only the JSON object."
            },
            {
                "role": "user",
                "content": full_prompt
            }
        ]
    
    else:
        raise ValueError(f"Unsupported file type: {file_ext}. Supported types: PDF, DOCX, DOC")
    
    # Prepare API request
    base_url = os.getenv('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1')
    url = f"{base_url}/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/hirescan",
        "X-Title": "HireScan",
    }
    
    # Extract timeout from kwargs if provided, default to 60
    timeout = kwargs.pop('timeout', 60)
    
    # Prepare payload
    payload = {
        "model": model,
        "messages": messages,
        **kwargs  # Include any additional parameters (temperature, max_tokens, etc.)
    }
    
    try:
        # Make API request
        import time
        import logging
        logger = logging.getLogger(__name__)
        api_logger = logging.getLogger('openrouter.api')
        
        request_start_time = time.time()
        request_timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
        
        # Log request details
        file_ext = Path(file_path).suffix.lower()
        file_size = Path(file_path).stat().st_size if Path(file_path).exists() else 0
        file_size_kb = file_size / 1024
        
        # Prepare request log data (without full file content)
        request_log_data = {
            'timestamp': request_timestamp,
            'action': 'SEND_REQUEST',
            'file_path': str(file_path),
            'file_name': Path(file_path).name,
            'file_extension': file_ext,
            'file_size_kb': round(file_size_kb, 2),
            'model': model,
            'pdf_engine': pdf_engine if pdf_engine else 'default',
            'processing_method': 'direct_file_upload' if is_pdf else 'text_extraction',
            'url': url,
            'parameters': {
                'temperature': kwargs.get('temperature'),
                'max_tokens': kwargs.get('max_tokens'),
                'response_format': kwargs.get('response_format'),
                'timeout': timeout,
            },
            'plugins': kwargs.get('plugins'),
        }
        
        # Log request
        api_logger.info(f"REQUEST | {json.dumps(request_log_data, indent=None, ensure_ascii=False)}")
        logger.info(f"[OPENROUTER API] Sending request to OpenRouter API at {request_timestamp} (model: {model})")
        print(f"[OPENROUTER API] Sending request to OpenRouter API at {request_timestamp} (model: {model})")
        
        response = requests.post(url, headers=headers, json=payload, timeout=timeout)
        
        request_end_time = time.time()
        request_duration = request_end_time - request_start_time
        response_timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
        
        # Log response details
        response_data = {}
        try:
            response_data = response.json() if response.ok else {}
        except:
            pass
        
        choice = response_data.get("choices", [{}])[0] if response_data.get("choices") else {}
        message = choice.get("message", {}) if choice else {}
        content = message.get("content", "")
        content_length = len(content) if isinstance(content, str) else 0
        usage = response_data.get("usage", {})
        
        response_log_data = {
            'timestamp': response_timestamp,
            'action': 'RECEIVE_RESPONSE',
            'file_path': str(file_path),
            'file_name': Path(file_path).name,
            'model': model,
            'status_code': response.status_code,
            'request_duration_seconds': round(request_duration, 2),
            'response_size': {
                'content_length': content_length,
                'content_length_kb': round(content_length / 1024, 2),
            },
            'usage': {
                'prompt_tokens': usage.get('prompt_tokens'),
                'completion_tokens': usage.get('completion_tokens'),
                'total_tokens': usage.get('total_tokens'),
            },
            'finish_reason': choice.get('finish_reason'),
            'success': response.ok,
        }
        
        # Log response
        api_logger.info(f"RESPONSE | {json.dumps(response_log_data, indent=None, ensure_ascii=False)}")
        logger.info(f"[OPENROUTER API] Received response from OpenRouter API at {response_timestamp} (request duration: {request_duration:.2f}s, status: {response.status_code})")
        print(f"[OPENROUTER API] Received response from OpenRouter API at {response_timestamp} (request duration: {request_duration:.2f}s, status: {response.status_code})")
        
        # If request failed, show detailed error
        if not response.ok:
            error_detail = "Unknown error"
            try:
                error_response = response.json()
                error_detail = json.dumps(error_response, indent=2)
                
                # Check if error is about file upload not supported
                error_message = ""
                if isinstance(error_response, dict):
                    error_obj = error_response.get('error', {})
                    if isinstance(error_obj, dict):
                        error_message = error_obj.get('message', '')
                        # Check metadata for raw error
                        metadata = error_obj.get('metadata', {})
                        if isinstance(metadata, dict):
                            raw_error = metadata.get('raw', '')
                            if raw_error and 'does not support file' in raw_error:
                                raise ValueError(
                                    f"Model '{model}' does not support file uploads. "
                                    f"Please use a model that supports file uploads such as: "
                                    f"openai/gpt-4o, openai/gpt-4-turbo, anthropic/claude-3.5-sonnet, "
                                    f"or anthropic/claude-3-opus. "
                                    f"Current model: {model}"
                                )
                        elif 'does not support file' in error_message:
                            raise ValueError(
                                f"Model '{model}' does not support file uploads. "
                                f"Please use a model that supports file uploads such as: "
                                f"openai/gpt-4o, openai/gpt-4-turbo, anthropic/claude-3.5-sonnet, "
                                f"or anthropic/claude-3-opus. "
                                f"Current model: {model}"
                            )
            except ValueError:
                # Re-raise ValueError for file upload errors
                raise
            except:
                error_detail = response.text
            
            raise Exception(
                f"OpenRouter API error ({response.status_code}): {response.reason}\n"
                f"Response: {error_detail}\n"
                f"Request URL: {url}\n"
                f"Model: {model}"
            )
        
        result = response.json()
        
        # Check if response has choices
        if not result.get("choices") or len(result.get("choices", [])) == 0:
            print(f"DEBUG: OpenRouter response has no choices. Full response: {json.dumps(result, indent=2)}")
            raise ValueError("AI service returned response with no choices")
        
        choice = result.get("choices", [{}])[0]
        
        # Check for finish_reason
        finish_reason = choice.get("finish_reason")
        if finish_reason:
            print(f"DEBUG: OpenRouter finish_reason: {finish_reason}")
            if finish_reason == "length":
                print("DEBUG: WARNING - Response was truncated due to max_tokens limit. Consider increasing max_tokens.")
            elif finish_reason == "content_filter":
                print("DEBUG: ERROR - Response was filtered by content filter")
                raise ValueError("AI service response was filtered by content filter")
            elif finish_reason == "error":
                print(f"DEBUG: ERROR - OpenRouter returned error finish_reason. Full response: {json.dumps(result, indent=2)}")
                raise ValueError("AI service returned error finish_reason")
        
        # Extract content from response
        content = choice.get("message", {}).get("content", "{}")
        
        # Log full response structure for debugging
        print(f"DEBUG: Full OpenRouter response structure: {list(result.keys())}")
        print(f"DEBUG: Choices count: {len(result.get('choices', []))}")
        if result.get('choices'):
            print(f"DEBUG: First choice keys: {list(result['choices'][0].keys())}")
            print(f"DEBUG: Message keys: {list(result['choices'][0].get('message', {}).keys())}")
        
        # Try to parse as JSON if it's a string
        if isinstance(content, str):
            # Log the raw content for debugging (first 1000 chars and last 500 chars)
            content_len = len(content)
            print(f"DEBUG: Raw AI response content length: {content_len} characters")
            print(f"DEBUG: First 1000 chars: {content[:1000]}")
            if content_len > 1000:
                print(f"DEBUG: Last 500 chars: {content[-500:]}")
            
            # Check if content looks like an error message (more robust check)
            # Only check short strings that might be just "error" (avoid false positives with valid JSON)
            content_stripped = content.strip()
            if len(content_stripped) < 50:  # Only check short strings
                # Remove all quotes, whitespace, and brackets to normalize
                content_normalized = re.sub(r'[\'"\s\{\}\[\]]', '', content_stripped.lower())
                # Check if the normalized content is EXACTLY "error" (not starts with, to avoid false positives)
                if content_normalized == 'error':
                    print(f"DEBUG: Detected error string in response: {repr(content)}")
                    print(f"DEBUG: Full response for debugging: {json.dumps(result, indent=2, default=str)}")
                    # Check if there's error info in the response structure
                    error_info = result.get('error', {})
                    if error_info:
                        error_msg = error_info.get('message', error_info.get('type', str(error_info)))
                        raise ValueError(f"AI service returned error: {error_msg}")
                    raise ValueError(f"AI service returned error response. OpenRouter response: {json.dumps(result, indent=2, default=str)}")
            
            # Check if content starts with error indicators
            content_lower = content_stripped.lower()
            if content_lower.startswith('error') or content_lower.startswith('"error"') or content_lower.startswith("'error'"):
                print(f"DEBUG: Content starts with error indicator: {content[:200]}")
                print(f"DEBUG: Full response for debugging: {json.dumps(result, indent=2)}")
            
            try:
                parsed = json.loads(content)
                # Validate that parsed data is a dict (not just a string or other type)
                if not isinstance(parsed, dict):
                    print(f"DEBUG: Parsed content is not a dict: {type(parsed)}, content: {content[:200]}")
                    raise ValueError(f"AI service returned non-dict response: {type(parsed)}. Content: {content[:200]}")
                # Check if parsed data contains error field
                if parsed.get('error'):
                    error_msg = parsed.get('message', parsed.get('error', 'Unknown error'))
                    print(f"DEBUG: Parsed data contains error field: {error_msg}")
                    print(f"DEBUG: Full parsed error data: {json.dumps(parsed, indent=2)}")
                    raise ValueError(f"AI service returned error: {error_msg}")
                # Validate that it has expected resume structure
                if not any(key in parsed for key in ['personal_info', 'education', 'experience', 'skills']):
                    print(f"DEBUG: Warning - Parsed JSON doesn't have expected resume structure. Keys: {list(parsed.keys())}")
                    # Don't fail, might still be valid
                print(f"DEBUG: Successfully parsed JSON response with keys: {list(parsed.keys())}")
                return parsed
            except json.JSONDecodeError as e:
                print(f"DEBUG: JSON decode error: {str(e)}, attempting to extract from markdown blocks")
                # Try to extract JSON from markdown code blocks if present
                json_match = re.search(r'```(?:json)?\s*(\{.*?\}|\[.*?\])\s*```', content, re.DOTALL)
                if json_match:
                    try:
                        extracted_json = json_match.group(1)
                        print(f"DEBUG: Extracted JSON from markdown block (first 200 chars): {extracted_json[:200]}")
                        parsed = json.loads(extracted_json)
                        if not isinstance(parsed, dict):
                            raise ValueError(f"Extracted JSON is not a dict: {type(parsed)}")
                        if parsed.get('error'):
                            error_msg = parsed.get('message', parsed.get('error', 'Unknown error'))
                            raise ValueError(f"AI service returned error: {error_msg}")
                        return parsed
                    except json.JSONDecodeError as inner_e:
                        print(f"DEBUG: Failed to parse extracted JSON: {str(inner_e)}")
                        pass
                
                # If response_format was json_object, this is a critical error
                # Check payload for response_format
                response_format = payload.get('response_format', {})
                if response_format.get('type') == 'json_object':
                    print(f"DEBUG: Expected json_object format but got invalid JSON. Content: {content[:500]}")
                    raise ValueError(
                        f"Failed to parse JSON response (expected json_object format). "
                        f"Content preview: {content[:500]}"
                    )
                
                # For non-json_object responses, return error dict
                print(f"DEBUG: Failed to parse JSON from AI response. Content preview: {content[:500]}")
                raise ValueError(
                    f"Failed to parse JSON from AI response. "
                    f"Content preview: {content[:500]}. "
                    f"Error: {str(e)}"
                )
        
        # If content is not a string, it should already be parsed
        if isinstance(content, dict):
            if content.get('error'):
                error_msg = content.get('message', content.get('error', 'Unknown error'))
                raise ValueError(f"AI service returned error: {error_msg}")
            return content
        
        # Fallback: return result as-is if it's already a dict
        if isinstance(result, dict):
            return result
        
        raise ValueError(f"Unexpected response format from AI service: {type(result)}")
        
    except requests.exceptions.RequestException as e:
        raise Exception(f"OpenRouter API error: {str(e)}")
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse JSON from OpenRouter response: {str(e)}")

