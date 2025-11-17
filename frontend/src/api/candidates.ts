import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';

export interface Candidate {
  id: number;
  email: string;
  name: string;
  phone: string;
  linkedin_url: string;
  github_url: string;
  created_at: string;
  updated_at: string;
  resumes?: Resume[];
  notes?: Note[];
  timeline_events?: TimelineEvent[];
  job_scores?: JobScore[];
}

export interface Resume {
  id: number;
  candidate: number;
  candidate_name?: string;
  file: string;
  uploaded_at: string;
  parsed_data?: ParsedResume;
}

export interface Links {
  linkedin?: string;
  github?: string;
  portfolio?: string;
  website?: string;
  other?: string[];
}

export interface PersonalInfo {
  full_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  date_of_birth?: string;
  marital_status?: string;
  military_service?: string;
  links?: Links;
}

export interface TechnicalSkillItem {
  name: string;
  category?: string;
  level?: string | null;
}

export interface SkillsSummary {
  technical?: TechnicalSkillItem[];
  soft?: string[];
  skills_mentioned_in_job_title?: string[];
}

export interface Experience {
  id: number;
  job_title?: string;
  company: string;
  company_type?: string;
  location?: string;
  employment_type?: string;
  start_date: string | null;
  end_date: string | null;
  duration?: string;
  duration_months?: number | null;
  is_currently_employed?: boolean;
  reasoning?: string;
  responsibilities?: string[];
  extracted_skills?: string[];
  order?: number;
  // Legacy fields
  role?: string;
  is_current?: boolean;
  description?: string;
}

export interface Education {
  id: number;
  degree: string;
  field: string;
  institution: string;
  location?: string;
  institution_category?: string;
  graduation_year?: number | null;
  start_date?: string;
  end_date?: string;
  gpa?: string;
  honors?: string;
  thesis?: string;
  relevant_courses?: string[];
  order?: number;
}

export interface TechnicalSkill {
  id: number;
  category: string;
  name: string;
  level?: string;
}

export interface SoftSkill {
  id: number;
  name: string;
}

export interface Course {
  id: number;
  name: string;
  provider?: string;
  instructor?: string;
  completion_date?: string;
  duration?: string;
  certificate_id?: string;
  verification_link?: string;
  order?: number;
}

export interface Certification {
  id: number;
  name: string;
  issuer?: string;
  date?: string;
  description?: string;
  certificate_id?: string;
  verification_link?: string;
  order?: number;
}

export interface ExtractedResumeData {
  personal_info?: PersonalInfo;
  education: Education[];
  experience: Experience[];
  skills?: SkillsSummary;
  projects: Project[];
  awards: Award[];
  languages: Language[];
  courses: Course[];
  certifications: Certification[];
  publications: Publication[];
  interests?: Record<string, any>;
  other_sections?: Record<string, any>;
  extraction_notes?: Record<string, any>;
}

export interface FinalScores {
  experience_depth_score?: number | null;
  education_level_score?: number | null;
  overall_weighted_score?: number | null;
  seniority_match_score?: number | null;
}

export interface ScoringResults {
  final_scores?: FinalScores;
  detailed_calculations?: Record<string, any>;
  eds_breakdown?: Record<string, any>;
  els_breakdown?: Record<string, any>;
  overall_calculation?: Record<string, any>;
  seniority_match_calculation?: Record<string, any>;
  [key: string]: any;
}

export interface SeniorityFitAnalysis {
  fit_level?: string;
  explanation?: string;
  overqualified?: boolean;
  underqualified?: boolean;
}

export interface Interpretation {
  seniority_fit_analysis?: SeniorityFitAnalysis;
  strengths?: string[];
  weaknesses?: string[];
  overall_assessment?: string;
  recommendations?: string[];
}

export interface AuditTrail {
  data_completeness?: {
    positions_complete?: number;
    positions_total?: number;
    education_complete?: number;
    education_total?: number;
    missing_fields?: string[];
  };
  assumptions_made?: string[];
  edge_cases?: string[];
  warnings?: string[];
}

export interface ParsedResume {
  id: number;
  raw_text: string;
  parsed_data: Record<string, any>;
  parsed_at: string;
  updated_at?: string;
  ai_review?: string;
  expected_salary?: string;
  extracted_resume_data?: ExtractedResumeData;
  scoring_results?: ScoringResults;
  interpretation?: Interpretation;
  audit_trail?: AuditTrail;
}

export interface Project {
  id: number;
  name: string;
  role?: string;
  date?: string;
  technologies?: string[];
  description?: string;
  link?: string;
  order?: number;
}

export interface Award {
  id: number;
  title: string;
  issuer?: string;
  rank?: string;
  date?: string;
  description?: string;
  order?: number;
}

export interface Language {
  id: number;
  language: string;
  proficiency?: string;
  skills?: Record<string, any>;
  certificates?: any[];
}

export interface Publication {
  id: number;
  title: string;
  authors?: string[];
  venue?: string;
  year?: string;
  volume_pages?: string;
  doi?: string;
  link?: string;
  citations?: string;
  order?: number;
}

// Legacy interface
export interface Note {
  id: number;
  candidate: number;
  user: number;
  user_email?: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface TimelineEvent {
  id: number;
  candidate: number;
  event_type: string;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface JobScore {
  id: number;
  candidate: number;
  candidate_name?: string;
  job: number;
  job_title?: string;
  score: number;
  experience_score?: number | null; // From scoring response
  education_score?: number | null; // From scoring response
  rank: number | null;
  auto_rejected: boolean;
  rejection_reason: string;
  scored_at: string;
  updated_at: string;
}

export const useCandidates = (params?: { search?: string; email?: string }) => {
  return useQuery({
    queryKey: ['candidates', params],
    queryFn: async () => {
      const response = await apiClient.get<{ results: Candidate[] }>('/candidates/candidates/', { params });
      return response.data;
    },
  });
};

export const useCandidate = (id: number) => {
  return useQuery({
    queryKey: ['candidates', id],
    queryFn: async () => {
      const response = await apiClient.get<Candidate>(`/candidates/candidates/${id}/detail/`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useAddNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ candidateId, content }: { candidateId: number; content: string }) => {
      const response = await apiClient.post<Note>(`/candidates/candidates/${candidateId}/add_note/`, {
        content,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['candidates', variables.candidateId] });
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
    },
  });
};

export const useDeleteNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ candidateId, noteId }: { candidateId: number; noteId: number }) => {
      await apiClient.delete(`/candidates/candidates/${candidateId}/delete_note/${noteId}/`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['candidates', variables.candidateId] });
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
    },
  });
};

// CRUD Operations for Candidate
export const useUpdateCandidate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Candidate> }) => {
      const response = await apiClient.patch<Candidate>(`/candidates/candidates/${id}/`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['candidates', data.id] });
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
    },
  });
};

export const useDeleteCandidate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/candidates/candidates/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
    },
  });
};

export const useCreateCandidate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Candidate>) => {
      const response = await apiClient.post<Candidate>('/candidates/candidates/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
    },
  });
};

export interface CVUploadResponse {
  message: string;
  successful: number;
  failed: number;
  results: Array<{
    resume_id: number;
    candidate_id: number;
    status: 'success';
    parsed_resume_id: number;
  }>;
  errors: Array<{
    resume_id: number;
    candidate_id: number;
    status: 'error';
    error: string;
  }>;
  batch_id?: number;
}

export const useUploadCV = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ files, jobId }: { files: File[]; jobId?: number }) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });
      if (jobId) {
        formData.append('job_id', jobId.toString());
      }

      // Content-Type will be set automatically by axios interceptor for FormData
      const response = await apiClient.post<CVUploadResponse>('/candidates/upload-cv/', formData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate candidates and resumes queries
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
    },
  });
};

