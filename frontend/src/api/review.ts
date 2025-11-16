import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import type { JobScore } from './candidates';

export interface ReviewDashboard {
  job: {
    id: number;
    title: string;
  };
  kpis: {
    total_candidates: number;
    auto_rejected: number;
    average_score: number;
  };
  top_candidates: JobScore[];
  rejected_candidates: JobScore[];
  all_candidates?: Array<JobScore & {
    candidate_details?: {
      name: string;
      email: string;
      phone: string;
      linkedin_url: string;
      github_url: string;
    };
    skills?: string[];
    skillset?: string;
  }>;
}

export const useReviewDashboard = (jobId: number, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['review', jobId],
    queryFn: async () => {
      const response = await apiClient.get<ReviewDashboard>('/review/review/', {
        params: { jobId },
      });
      return response.data;
    },
    enabled: options?.enabled !== undefined ? options.enabled : !!jobId,
  });
};

export const useRefreshRanking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: number) => {
      const response = await apiClient.post(`/review/ranking/${jobId}/refresh/`);
      return response.data;
    },
    onSuccess: (_, jobId) => {
      queryClient.invalidateQueries({ queryKey: ['review', jobId] });
    },
  });
};

