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

export interface ParsedResume {
  id: number;
  raw_text: string;
  parsed_data: Record<string, any>;
  parsed_at: string;
  updated_at?: string;
  // Personal info
  full_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  date_of_birth?: string;
  marital_status?: string;
  military_service?: string;
  // Links
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  website_url?: string;
  // Summary (from parse_resume sample.md)
  summary?: string;
  // AI Review and Salary (from AI parsing JSON response)
  ai_review?: string;
  expected_salary?: string;
  // Related objects
  educations?: Education[];
  experiences?: Experience[];
  technical_skills?: TechnicalSkill[];
  soft_skills?: SoftSkill[];
  projects?: Project[];
  awards?: Award[];
  languages?: Language[];
  courses?: Course[];
  publications?: Publication[];
  // Legacy
  skills?: Skill[];
}

export interface Education {
  id: number;
  degree: string;
  field: string;
  institution: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  gpa?: string;
  honors?: string;
  thesis?: string;
  relevant_courses?: string[];
  order?: number;
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
  is_currently_employed?: boolean;
  reasoning?: string;
  responsibilities?: string[];
  order?: number;
  // Legacy fields
  role?: string;
  is_current?: boolean;
  description?: string;
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
export interface Skill {
  id: number;
  name: string;
  category: string;
  proficiency: string;
}

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

