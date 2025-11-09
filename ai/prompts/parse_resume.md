# Parse Resume Prompt

Parse the following resume text and extract structured information. Return a JSON object with the following structure:

```json
{{
  "name": "Full name of the candidate",
  "email": "Email address",
  "phone": "Phone number (if available)",
  "linkedin_url": "LinkedIn profile URL (if available)",
  "github_url": "GitHub profile URL (if available)",
  "summary": "Professional summary or objective",
  "experiences": [
    {{
      "company": "Company name",
      "role": "Job title/role",
      "start_date": "YYYY-MM-DD or YYYY-MM",
      "end_date": "YYYY-MM-DD or YYYY-MM or null if current",
      "is_current": true/false,
      "description": "Job description and achievements"
    }}
  ],
  "education": [
    {{
      "institution": "School/University name",
      "degree": "Degree name",
      "field": "Field of study",
      "start_date": "YYYY-MM-DD or YYYY-MM",
      "end_date": "YYYY-MM-DD or YYYY-MM or null if current",
      "is_current": true/false
    }}
  ],
  "skills": [
    {{
      "name": "Skill name",
      "category": "Category (e.g., programming, soft skills, tools)",
      "proficiency": "beginner|intermediate|advanced|expert"
    }}
  ],
  "certifications": [
    {{
      "name": "Certification name",
      "issuer": "Issuing organization",
      "date": "YYYY-MM-DD or YYYY-MM"
    }}
  ],
  "languages": [
    {{
      "language": "Language name",
      "proficiency": "native|fluent|conversational|basic"
    }}
  ]
}}
```

Resume text:
{resume_text}

Extract all available information and return only valid JSON. If a field is not available, use null or an empty array/string as appropriate.

