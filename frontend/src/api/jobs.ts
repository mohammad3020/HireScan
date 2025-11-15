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
  location: string;
  employment_type: string;
  experience_level: string;
  salary_min: string | null;
  salary_max: string | null;
  required_skills: Array<{ name: string; priority: string }> | string[];
  experience_min_years: number | null;
  experience_min_years_auto_reject: boolean;
  age_range_min: number | null;
  age_range_max: number | null;
  age_range_auto_reject: boolean;
  gender: string;
  gender_auto_reject: boolean;
  military_status: string;
  military_auto_reject: boolean;
  education_level: string;
  education_level_auto_reject: boolean;
  education_major: string[];
  education_major_auto_reject: boolean;
  preferred_universities_enabled: boolean;
  preferred_universities_auto_reject: boolean;
  preferred_universities: string[];
  target_companies_enabled: boolean;
  target_companies: string[];
  demographic_requirements?: {
    age_range: {
      min: number | null;
      max: number | null;
      auto_reject: boolean;
    };
    gender: string;
    gender_auto_reject: boolean;
    military_status: string;
    military_auto_reject: boolean;
    education_level: string;
    education_level_auto_reject: boolean;
    education_major: string[];
    education_major_auto_reject: boolean;
    preferred_universities_enabled: boolean;
    preferred_universities_auto_reject: boolean;
    preferred_universities: string[];
    target_companies_enabled: boolean;
    target_companies: string[];
  };
  auto_reject_rules: Record<string, any>;
  created_by: number;
  created_by_email?: string;
  created_at: string;
  updated_at: string;
}

export interface JobListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Job[];
}

export interface DepartmentListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Department[];
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
      const response = await apiClient.post<Job>('/jobs/jobs/new/', data);
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
      const response = await apiClient.get<DepartmentListResponse | Department[]>('/jobs/departments/');
      const data = response.data;
      // Handle both paginated response and direct array
      if (Array.isArray(data)) {
        return data;
      }
      // If it's a paginated response, return the results array
      if (data && typeof data === 'object' && 'results' in data) {
        return (data as DepartmentListResponse).results;
      }
      return [];
    },
  });
};

