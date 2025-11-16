import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../api/client';

interface AuthState {
  isAuthenticated: boolean;
  user: { email: string; first_name?: string; last_name?: string } | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, password2: string, firstName?: string, lastName?: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem('access_token') : false,
      user: null,
      login: async (email: string, password: string) => {
        // Call the API to login with email
        const response = await apiClient.post('/auth/token/', {
          email,
          password,
        });
        const { access, refresh } = response.data;
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', access);
          localStorage.setItem('refresh_token', refresh);
        }
        set({
          isAuthenticated: true,
          user: { email },
        });
      },
      signup: async (email: string, password: string, password2: string, firstName?: string, lastName?: string) => {
        // Call the API to register
        const payload: any = {
          email,
          password,
          password2,
        };
        // Only include first_name and last_name if they have values
        if (firstName && firstName.trim()) {
          payload.first_name = firstName.trim();
        }
        if (lastName && lastName.trim()) {
          payload.last_name = lastName.trim();
        }
        const response = await apiClient.post('/auth/register/', payload);
        const { access, refresh, user } = response.data;
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', access);
          localStorage.setItem('refresh_token', refresh);
        }
        set({
          isAuthenticated: true,
          user: {
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
          },
        });
      },
      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
        });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      },
      checkAuth: () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        set({
          isAuthenticated: !!token,
        });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

