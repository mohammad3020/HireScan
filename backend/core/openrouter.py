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
        self.parse_model = settings.OPENROUTER_PARSE_MODEL
        self.rank_model = settings.OPENROUTER_RANK_MODEL
        
        if not self.api_key:
            raise ValueError("OPENROUTER_API_KEY is not set in environment variables")
    
    def _make_request(self, model: str, messages: List[Dict[str, str]], **kwargs) -> Dict[str, Any]:
        """Make a request to OpenRouter API"""
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
        
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=60)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
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
        # Format the prompt with resume text
        full_prompt = prompt_template.format(resume_text=resume_text)
        
        messages = [
            {
                "role": "system",
                "content": "You are an expert at parsing resumes and extracting structured information. Always return valid JSON."
            },
            {
                "role": "user",
                "content": full_prompt
            }
        ]
        
        response = self._make_request(
            model=self.parse_model,
            messages=messages,
            response_format={"type": "json_object"} if "json" in self.parse_model.lower() else None
        )
        
        # Extract the content from the response
        content = response.get("choices", [{}])[0].get("message", {}).get("content", "{}")
        
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            # Try to extract JSON from markdown code blocks if present
            import re
            json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', content, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(1))
            raise ValueError(f"Failed to parse JSON from OpenRouter response: {content}")
    
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
        
        response = self._make_request(
            model=self.rank_model,
            messages=messages,
            response_format={"type": "json_object"} if "json" in self.rank_model.lower() else None
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

