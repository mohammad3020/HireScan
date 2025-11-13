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

# Try to import PDF/DOCX text extraction libraries
try:
    import PyPDF2
    HAS_PYPDF2 = True
except ImportError:
    HAS_PYPDF2 = False

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


def _extract_text_from_file(file_path: str) -> str:
    """
    Extract text from PDF or DOCX file
    
    Args:
        file_path: Path to the file
        
    Returns:
        Extracted text as string
    """
    file_ext = Path(file_path).suffix.lower()
    
    if file_ext == '.pdf':
        if not HAS_PYPDF2:
            raise ImportError("PyPDF2 is required for PDF text extraction. Install it with: pip install PyPDF2")
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
        if not HAS_DOCX:
            raise ImportError("python-docx is required for DOCX text extraction. Install it with: pip install python-docx")
        try:
            doc = Document(file_path)
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
            return text
        except Exception as e:
            raise ValueError(f"Error reading DOCX: {str(e)}")
    
    else:
        raise ValueError(f"Text extraction not supported for file type: {file_ext}")


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
    extract_text: bool = None,
    **kwargs
) -> Dict[str, Any]:
    """
    Process a file with a prompt using OpenRouter API
    
    Args:
        file_path: Path to the file (absolute or relative)
        prompt_name: Name of the prompt file without .md extension
        model: LLM model name. Examples:
               - "anthropic/claude-3.5-sonnet" (recommended)
               - "anthropic/claude-3-opus"
               - "openai/gpt-4"
               - "openai/gpt-4-turbo"
               - "google/gemini-pro"
               - "google/gemini-pro-1.5"
               - "meta-llama/llama-3-70b-instruct"
               - "mistralai/mistral-large"
               See https://openrouter.ai/models for full list
        extract_text: If True, extract text from PDF/DOCX and send as text instead of file.
                     If None (default), auto-detect: try file first, fallback to text for PDFs.
                     If False, always send as file (may fail for PDFs).
        **kwargs: Optional OpenRouter API parameters:
            - temperature (float): Controls randomness (0.0-2.0)
            - max_tokens (int): Maximum tokens to generate
            - response_format (dict): Format like {"type": "json_object"} for JSON responses
            - top_p (float): Nucleus sampling parameter
            - stop (list): Stop sequences
            - timeout (int): Request timeout in seconds (default: 60)
    
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
    
    # Load prompt template
    prompt_template = load_prompt(prompt_name)
    
    # Check file type
    file_ext = Path(file_path).suffix.lower()
    is_pdf_or_docx = file_ext in ['.pdf', '.docx', '.doc']
    
    # Determine if we should extract text
    if extract_text is None:
        # Auto-detect: For PDFs, prefer text extraction (more reliable)
        extract_text = is_pdf_or_docx
    
    # Prepare messages based on extraction method
    if extract_text and is_pdf_or_docx:
        # Extract text and send as text content
        try:
            file_text = _extract_text_from_file(file_path)
            # Format prompt with extracted text (if prompt has {resume_text} placeholder)
            if "{resume_text}" in prompt_template:
                full_prompt = prompt_template.format(resume_text=file_text)
            else:
                # Append text to prompt
                full_prompt = f"{prompt_template}\n\nResume text:\n{file_text}"
            
            messages = [
                {
                    "role": "system",
                    "content": "You are an expert AI assistant. Process the provided resume text according to the instructions and return valid JSON when requested."
                },
                {
                    "role": "user",
                    "content": full_prompt
                }
            ]
        except (ImportError, ValueError) as e:
            # If text extraction fails, fall back to file upload
            print(f"⚠️  Warning: Text extraction failed ({e}), trying file upload instead...")
            extract_text = False
    
    if not extract_text:
        # Send file as base64 data URL
        file_data_url = _file_to_base64_data_url(file_path)
        
        messages = [
            {
                "role": "system",
                "content": "You are an expert AI assistant. Process the provided file according to the instructions and return valid JSON when requested."
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": prompt_template
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": file_data_url
                        }
                    }
                ]
            }
        ]
    
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
        response = requests.post(url, headers=headers, json=payload, timeout=timeout)
        
        # If request failed, show detailed error
        if not response.ok:
            error_detail = "Unknown error"
            try:
                error_response = response.json()
                error_detail = json.dumps(error_response, indent=2)
            except:
                error_detail = response.text
            raise Exception(
                f"OpenRouter API error ({response.status_code}): {response.reason}\n"
                f"Response: {error_detail}\n"
                f"Request URL: {url}\n"
                f"Model: {model}"
            )
        
        result = response.json()
        
        # Extract content from response
        content = result.get("choices", [{}])[0].get("message", {}).get("content", "{}")
        
        # Try to parse as JSON if it's a string
        if isinstance(content, str):
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                # Try to extract JSON from markdown code blocks if present
                json_match = re.search(r'```(?:json)?\s*(\{.*?\}|\[.*?\])\s*```', content, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group(1))
                # If no JSON found, return the raw content wrapped in a dict
                return {"content": content, "raw_response": result}
        
        return result
        
    except requests.exceptions.RequestException as e:
        raise Exception(f"OpenRouter API error: {str(e)}")
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse JSON from OpenRouter response: {str(e)}")

