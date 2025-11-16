import { useQuery } from '@tanstack/react-query';
import apiClient from './client';

export interface DashboardKPIs {
  total_jobs: number;
  active_jobs: number;
  total_candidates: number;
  average_score: number;
}

export interface ScoreDistribution {
  score: string;
  count: number;
}

export interface CandidatesByStatus {
  name: string;
  value: number;
  color: string;
}

export interface JobsByDepartment {
  name: string;
  job_count: number;
}

export interface CandidatesPerJob {
  name: string;
  candidates: number;
  avgScore: number;
}

export interface CandidateTrend {
  month: string;
  candidates: number;
}

export interface RecentActivity {
  id: number;
  type: 'upload' | 'scored' | 'ranked' | 'parsed';
  message: string;
  time: string;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  score_distribution: ScoreDistribution[];
  candidates_by_status: CandidatesByStatus[];
  jobs_by_department: JobsByDepartment[];
  candidates_per_job: CandidatesPerJob[];
  candidate_trend: CandidateTrend[];
  recent_activity: RecentActivity[];
}

export const useDashboard = () => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      try {
        const response = await apiClient.get<DashboardData>('/auth/dashboard/');
        return response.data;
      } catch (error) {
        console.error('[useDashboard] Error fetching dashboard:', error);
        throw error;
      }
    },
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors (client errors)
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      // Retry up to 2 times for network/server errors
      return failureCount < 2;
    },
    retryDelay: 1000,
  });
};

