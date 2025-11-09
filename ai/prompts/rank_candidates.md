# Rank Candidates Prompt

Rank the following candidates for the given job description. Analyze each candidate's qualifications, experience, and skills against the job requirements. Return a JSON object with a ranked list of candidates, each with a score (0-100) and reasoning.

Job Description:
{job_description}

Candidates Data:
{candidates_data}

Return a JSON object with the following structure:

```json
{{
  "ranked_candidates": [
    {{
      "candidate_id": <candidate_id>,
      "score": <score_0_to_100>,
      "rank": <rank_number>,
      "reasoning": "Brief explanation of why this candidate is ranked at this position",
      "strengths": ["strength1", "strength2"],
      "weaknesses": ["weakness1", "weakness2"],
      "match_percentage": <percentage_match_with_job_requirements>
    }}
  ]
}}
```

Rank candidates from highest to lowest score. Consider:
- Relevant work experience
- Required skills match
- Education background
- Years of experience
- Overall fit for the role

Return only valid JSON.

