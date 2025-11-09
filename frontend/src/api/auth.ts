import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
}

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await apiClient.post<AuthResponse>('/auth/token/', credentials);
      return response.data;
    },
    onSuccess: (data) => {
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
};

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('access_token');
};

