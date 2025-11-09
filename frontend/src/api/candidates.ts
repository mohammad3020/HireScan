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
  experiences?: Experience[];
  skills?: Skill[];
}

export interface Experience {
  id: number;
  company: string;
  role: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  description: string;
}

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
  user_username?: string;
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
    },
  });
};

