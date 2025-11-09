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
}

export const useReviewDashboard = (jobId: number) => {
  return useQuery({
    queryKey: ['review', jobId],
    queryFn: async () => {
      const response = await apiClient.get<ReviewDashboard>('/review/review/', {
        params: { jobId },
      });
      return response.data;
    },
    enabled: !!jobId,
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

