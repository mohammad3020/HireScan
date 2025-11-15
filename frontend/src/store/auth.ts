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
      isAuthenticated: !!localStorage.getItem('access_token'),
      user: null,
      login: async (email: string, password: string) => {
        // Call the API to login with email
        const response = await apiClient.post('/auth/token/', {
          email,
          password,
        });
        const { access, refresh } = response.data;
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        set({
          isAuthenticated: true,
          user: { email },
        });
      },
      signup: async (email: string, password: string, password2: string, firstName?: string, lastName?: string) => {
        // Call the API to register
        const response = await apiClient.post('/auth/register/', {
          email,
          password,
          password2,
          first_name: firstName || '',
          last_name: lastName || '',
        });
        const { access, refresh, user } = response.data;
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
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
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      },
      checkAuth: () => {
        const token = localStorage.getItem('access_token');
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

