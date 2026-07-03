import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";
import { api } from "@/lib/api";

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  setToken: (token: string, refreshToken: string) => void;
  clearError: () => void;
  initAuth: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const result = await api.auth.login(email, password);
          set({
            user: result.user,
            token: result.accessToken,
            refreshToken: result.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Login failed";
          set({ isLoading: false, error: message });
          throw error;
        }
      },

      register: async (email: string, password: string, name: string) => {
        set({ isLoading: true, error: null });
        try {
          const result = await api.auth.register({ email, password, name });
          set({
            user: result.user,
            token: result.accessToken,
            refreshToken: result.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Registration failed";
          set({ isLoading: false, error: message });
          throw error;
        }
      },

      logout: async () => {
        try {
          await api.auth.logout();
        } catch {
          // Ignore logout API errors
        }
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      refreshAuth: async () => {
        const { refreshToken: currentRefreshToken } = get();
        if (!currentRefreshToken) {
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
          });
          return;
        }

        set({ isLoading: true });
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refreshToken: currentRefreshToken }),
            }
          );

          if (!response.ok) throw new Error("Refresh failed");

          const data = await response.json();
          set({
            token: data.accessToken,
            refreshToken: data.refreshToken,
            isLoading: false,
          });
        } catch {
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      updateUser: async (data: Partial<User>) => {
        const { user } = get();
        if (!user) return;

        try {
          const updated = await api.auth.updateProfile(data);
          set({ user: updated });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Update failed";
          set({ error: message });
          throw error;
        }
      },

      setToken: (token: string, refreshToken: string) => {
        set({ token, refreshToken, isAuthenticated: true });
      },

      clearError: () => set({ error: null }),

      initAuth: async () => {
        const { token } = get();
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        set({ isLoading: true });
        try {
          const user = await api.auth.me();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch {
          await get().refreshAuth();
        }
      },
    }),
    {
      name: "jarvis-auth",
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
);
