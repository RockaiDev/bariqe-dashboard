// stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  admin: any | null;
  token: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  setAuth: (admin: any, token?: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      admin: null,
      token: null,
      isLoading: false,
      isInitialized: false,
      setAuth: (admin, token) =>
        set((state) => ({
          isAuthenticated: true,
          admin,
          token: token || state.token,
          isLoading: false,
          isInitialized: true
        })),
      clearAuth: () =>
        set({
          isAuthenticated: false,
          admin: null,
          token: null,
          isLoading: false,
          isInitialized: true
        }),
      setLoading: (isLoading) => set({ isLoading }),
      setInitialized: (isInitialized) => set({ isInitialized }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        admin: state.admin,
        token: state.token
      }),
    }
  )
);