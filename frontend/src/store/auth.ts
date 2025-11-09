import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  user: { username: string; email: string } | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: async (username: string, _password: string) => {
        // Mock login - in real app, this would call the API
        // For now, just set authenticated state
        set({
          isAuthenticated: true,
          user: { username, email: `${username}@example.com` },
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
    }),
    {
      name: 'auth-storage',
    }
  )
);

