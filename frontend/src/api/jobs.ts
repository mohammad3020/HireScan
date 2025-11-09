import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';

export interface Department {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: number;
  title: string;
  description: string;
  department: number | null;
  department_name?: string;
  salary_min: string | null;
  salary_max: string | null;
  required_skills: string[];
  auto_reject_rules: Record<string, any>;
  created_by: number;
  created_by_username?: string;
  created_at: string;
  updated_at: string;
}

export interface JobListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Job[];
}

export const useJobs = (params?: { department?: number; search?: string }) => {
  return useQuery({
    queryKey: ['jobs', params],
    queryFn: async () => {
      const response = await apiClient.get<JobListResponse>('/jobs/jobs/', { params });
      return response.data;
    },
  });
};

export const useJob = (id: number) => {
  return useQuery({
    queryKey: ['jobs', id],
    queryFn: async () => {
      const response = await apiClient.get<Job>(`/jobs/jobs/${id}/`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Job>) => {
      const response = await apiClient.post<Job>('/jobs/jobs/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};

export const useUpdateJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Job> }) => {
      const response = await apiClient.patch<Job>(`/jobs/jobs/${id}/`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs', variables.id] });
    },
  });
};

export const useDeleteJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/jobs/jobs/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};

export const useDepartments = () => {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await apiClient.get<Department[]>('/jobs/departments/');
      return response.data;
    },
  });
};

