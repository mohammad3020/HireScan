"""
OpenRouter API client for AI operations
"""
import os
import requests
import json
from django.conf import settings
from typing import Dict, List, Any, Optional


class OpenRouterClient:
    """Client for interacting with OpenRouter API"""
    
    def __init__(self):
        self.api_key = settings.OPENROUTER_API_KEY
        self.base_url = settings.OPENROUTER_BASE_URL
        self.model = settings.OPENROUTER_MODEL
        
        if not self.api_key:
            raise ValueError("OPENROUTER_API_KEY is not set in environment variables")
    
    def _make_request(self, model: str, messages: List[Dict[str, str]], **kwargs) -> Dict[str, Any]:
        """Make a request to OpenRouter API"""
        import logging
        logger = logging.getLogger(__name__)
        
        url = f"{self.base_url}/chat/completions"
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/hirescan",  # Optional
            "X-Title": "HireScan",  # Optional
        }
        
        payload = {
            "model": model,
            "messages": messages,
            **kwargs
        }
        
        # Log request details (without sensitive data)
        logger.info(f"OpenRouter API request - Model: {model}, Messages count: {len(messages)}")
        if messages:
            for idx, msg in enumerate(messages):
                msg_content = msg.get('content', '')
                if isinstance(msg_content, str):
                    msg_len = len(msg_content)
                elif isinstance(msg_content, list):
                    # Handle multimodal content
                    msg_len = sum(len(str(item.get('text', ''))) for item in msg_content if isinstance(item, dict))
                else:
                    msg_len = len(str(msg_content))
                logger.info(f"Message {idx} ({msg.get('role', 'unknown')}) length: {msg_len} characters")
                if idx == 0 and msg_len > 10000:
                    logger.debug(f"First message preview (first 500 chars): {str(msg_content)[:500]}")
        
        try:
            import time
            request_start_time = time.time()
            request_timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
            logger.info(f"[OPENROUTER API] Sending request to OpenRouter API at {request_timestamp} (model: {model})")
            
            response = requests.post(url, headers=headers, json=payload, timeout=60)
            response.raise_for_status()
            
            request_end_time = time.time()
            request_duration = request_end_time - request_start_time
            response_timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
            logger.info(f"[OPENROUTER API] Received response from OpenRouter API at {response_timestamp} (request duration: {request_duration:.2f}s, status: {response.status_code})")
            
            result = response.json()
            
            # Log response details
            logger.info(f"OpenRouter API response - Status: {response.status_code}")
            if result.get('choices'):
                content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                logger.info(f"Response content length: {len(str(content))} characters")
                logger.debug(f"Response content preview: {str(content)[:500]}")
            
            return result
        except requests.exceptions.RequestException as e:
            logger.error(f"OpenRouter API request failed: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_detail = e.response.json()
                    logger.error(f"Error response: {json.dumps(error_detail, indent=2)}")
                except:
                    logger.error(f"Error response text: {e.response.text[:500]}")
            raise Exception(f"OpenRouter API error: {str(e)}")
    
    def parse_resume(self, resume_text: str, prompt_template: str) -> Dict[str, Any]:
        """
        Parse a resume using OpenRouter API
        
        Args:
            resume_text: The text content of the resume
            prompt_template: The prompt template for parsing
            
        Returns:
            Parsed resume data as dictionary
        """
        import logging
        logger = logging.getLogger(__name__)
        
        # Format the prompt with resume text
        # Use safe formatting to avoid KeyError if resume_text contains braces
        # Check if prompt has {resume_text} placeholder, otherwise append text
        if "{resume_text}" in prompt_template:
            try:
                # Use string replacement instead of format() to avoid KeyError with braces
                full_prompt = prompt_template.replace("{resume_text}", resume_text)
            except Exception as e:
                # If replacement fails, just append the text
                full_prompt = f"{prompt_template}\n\nResume text:\n{resume_text}"
        else:
            # Append resume text to prompt if no placeholder found
            full_prompt = f"{prompt_template}\n\nResume text:\n{resume_text}"
        
        # Check prompt length
        prompt_length = len(full_prompt)
        logger.info(f"Full prompt length: {prompt_length} characters")
        if prompt_length > 200000:  # ~200k chars = ~50k tokens
            logger.warning(f"Prompt is very long ({prompt_length} chars). This might cause issues.")
        
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
        
        # Calculate max_tokens based on prompt length (already calculated above)
        # Estimate tokens: ~3 chars per token (conservative for mixed Persian/English)
        estimated_input_tokens = int(prompt_length / 3)
        # For JSON response, we need significant tokens (resume data can be large)
        # Minimum 16000, but scale with input
        estimated_max_tokens = max(16000, int(estimated_input_tokens * 0.5) + 4000)
        # Cap at reasonable maximum (most models support up to 32k-128k output)
        estimated_max_tokens = min(estimated_max_tokens, 32000)
        logger.info(f"Calculated max_tokens: {estimated_max_tokens} for prompt length: {prompt_length} chars (~{estimated_input_tokens} input tokens)")
        
        # Check if model supports json_object format
        # GPT-4, GPT-5, Claude, and models with "json" in name support json_object format
        model_lower = self.model.lower()
        supports_json = (
            "json" in model_lower or 
            "gpt-4" in model_lower or 
            "gpt-5" in model_lower or 
            "claude" in model_lower
        )
        
        request_kwargs = {
            "temperature": 0.3,  # Lower temperature for more consistent JSON
            "max_tokens": estimated_max_tokens,
        }
        
        if supports_json:
            request_kwargs["response_format"] = {"type": "json_object"}
            logger.info("Using json_object response format")
        else:
            logger.info("Model may not support json_object format, using default")
        
        response = self._make_request(
            model=self.model,
            messages=messages,
            **request_kwargs
        )
        
        # Extract the content from the response
        # Check if response has choices
        if not response.get("choices") or len(response.get("choices", [])) == 0:
            logger.error(f"OpenRouter response has no choices. Full response: {json.dumps(response, indent=2)}")
            raise ValueError("Resume parsing failed: OpenRouter API returned response with no choices")
        
        choice = response.get("choices", [{}])[0]
        
        # Check for finish_reason
        finish_reason = choice.get("finish_reason")
        if finish_reason:
            logger.info(f"OpenRouter finish_reason: {finish_reason}")
            if finish_reason == "length":
                logger.warning("Response was truncated due to max_tokens limit. Consider increasing max_tokens.")
            elif finish_reason == "content_filter":
                logger.error("Response was filtered by content filter")
                raise ValueError("Resume parsing failed: Response was filtered by content filter")
            elif finish_reason == "error":
                logger.error(f"OpenRouter returned error finish_reason. Full response: {json.dumps(response, indent=2)}")
                raise ValueError("Resume parsing failed: OpenRouter API returned error finish_reason")
        
        content = choice.get("message", {}).get("content", "{}")
        
        # Log response for debugging
        logger.info(f"OpenRouter parse_resume response - Content type: {type(content)}, Length: {len(str(content))}")
        logger.debug(f"Content preview: {str(content)[:1000]}")
        
        # Check for simple error strings BEFORE trying to parse JSON
        if isinstance(content, str):
            content_stripped = content.strip()
            if len(content_stripped) < 50:
                import re
                content_normalized = re.sub(r'[\'"\s\{\}\[\]]', '', content_stripped.lower())
                if content_normalized == 'error':
                    logger.error(f"OpenRouter returned error string: {repr(content)}")
                    logger.error(f"Full response: {json.dumps(response, indent=2)}")
                    raise ValueError(f"Resume parsing failed: OpenRouter API returned error response: {content}")
            
            # Check if content starts with error
            if content_stripped.lower().startswith('error') or content_stripped.startswith('"error"') or content_stripped.startswith("'error'"):
                logger.error(f"Content starts with error: {content[:200]}")
                logger.error(f"Full response: {json.dumps(response, indent=2)}")
                # Don't raise here, might be valid JSON with error field
        
        try:
            parsed = json.loads(content)
            # Check if parsed data contains error field
            if isinstance(parsed, dict):
                if parsed.get('error'):
                    error_msg = parsed.get('message', parsed.get('error', 'Unknown error'))
                    logger.error(f"Parsed JSON contains error field: {error_msg}")
                    logger.error(f"Full parsed data: {json.dumps(parsed, indent=2)}")
                    raise ValueError(f"Resume parsing failed: {error_msg}")
                # Check if it's a valid resume structure (should have at least personal_info or education or experience)
                if not any(key in parsed for key in ['personal_info', 'education', 'experience', 'skills']):
                    logger.warning(f"Parsed JSON doesn't have expected resume structure. Keys: {list(parsed.keys())}")
                    # Don't fail here, might still be valid
                return parsed
            else:
                logger.error(f"Parsed content is not a dict: {type(parsed)}")
                # If it's a string, log it for debugging
                if isinstance(parsed, str):
                    logger.error(f"JSON parsing returned a string instead of dict. Content was a JSON-encoded string: {parsed[:500]}")
                    logger.error(f"Original content preview: {content[:500]}")
                raise ValueError(f"Resume parsing failed: Expected dict, got {type(parsed)}")
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {str(e)}")
            logger.error(f"Content that failed to parse: {content[:1000]}")
            
            # Try to extract JSON from markdown code blocks if present
            import re
            json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', content, re.DOTALL)
            if json_match:
                try:
                    extracted = json.loads(json_match.group(1))
                    logger.info("Successfully extracted JSON from markdown code block")
                    if isinstance(extracted, dict) and extracted.get('error'):
                        error_msg = extracted.get('message', extracted.get('error', 'Unknown error'))
                        raise ValueError(f"Resume parsing failed: {error_msg}")
                    return extracted
                except json.JSONDecodeError as inner_e:
                    logger.error(f"Failed to parse extracted JSON: {str(inner_e)}")
                    pass
            
            # Try to find JSON object in content (more flexible regex)
            json_obj_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', content, re.DOTALL)
            if json_obj_match:
                try:
                    extracted = json.loads(json_obj_match.group(0))
                    logger.info("Successfully extracted JSON using flexible regex")
                    if isinstance(extracted, dict) and extracted.get('error'):
                        error_msg = extracted.get('message', extracted.get('error', 'Unknown error'))
                        raise ValueError(f"Resume parsing failed: {error_msg}")
                    return extracted
                except json.JSONDecodeError:
                    pass
            
            # If we get here, we couldn't parse the JSON
            logger.error(f"Could not parse JSON from response. Content preview: {content[:1000]}")
            raise ValueError(f"Resume parsing failed: Failed to parse JSON from OpenRouter response. Error: {str(e)}. Content preview: {content[:500]}")
    
    def rank_candidates(self, job_description: str, candidates_data: List[Dict[str, Any]], prompt_template: str) -> List[Dict[str, Any]]:
        """
        Rank candidates for a job using OpenRouter API
        
        Args:
            job_description: The job description text
            candidates_data: List of candidate data dictionaries
            prompt_template: The prompt template for ranking
            
        Returns:
            Ranked list of candidates with scores
        """
        # Format the prompt with job description and candidates
        candidates_json = json.dumps(candidates_data, indent=2)
        full_prompt = prompt_template.format(
            job_description=job_description,
            candidates_data=candidates_json
        )
        
        messages = [
            {
                "role": "system",
                "content": "You are an expert at ranking candidates for job positions. Always return valid JSON with a ranked list."
            },
            {
                "role": "user",
                "content": full_prompt
            }
        ]
        
        # Check if model supports json_object format
        model_lower = self.model.lower()
        supports_json = (
            "json" in model_lower or 
            "gpt-4" in model_lower or 
            "gpt-5" in model_lower or 
            "claude" in model_lower
        )
        
        response = self._make_request(
            model=self.model,
            messages=messages,
            response_format={"type": "json_object"} if supports_json else None
        )
        
        # Extract the content from the response
        content = response.get("choices", [{}])[0].get("message", {}).get("content", "{}")
        
        try:
            result = json.loads(content)
            # Return the ranked candidates list
            if isinstance(result, dict) and "ranked_candidates" in result:
                return result["ranked_candidates"]
            elif isinstance(result, list):
                return result
            else:
                raise ValueError("Unexpected response format from ranking API")
        except json.JSONDecodeError:
            # Try to extract JSON from markdown code blocks if present
            import re
            json_match = re.search(r'```(?:json)?\s*(\[.*?\]|\{.*?\})\s*```', content, re.DOTALL)
            if json_match:
                parsed = json.loads(json_match.group(1))
                if isinstance(parsed, dict) and "ranked_candidates" in parsed:
                    return parsed["ranked_candidates"]
                elif isinstance(parsed, list):
                    return parsed
            raise ValueError(f"Failed to parse JSON from OpenRouter response: {content}")

