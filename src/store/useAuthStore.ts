import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type UserRole = 'ADMIN' | 'MANAGER' | 'USER';

export interface User {
  id_korisnik: number;
  username: string;
  level: UserRole;
  prodavnica: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      setLoading: (loading) => set({ isLoading: loading }),
      checkSession: async () => {
        set({ isLoading: true });
        try {
          const response = await fetch('/api/auth/me');
          if (response.ok) {
            const data = await response.json();
            // Map the API response structure to our User interface
            // API returns: { user: { id, username, level } } or similar
            // We need to make sure we handle the mapping correctly.
            // Based on previous files, response structure is { user: { id, username, level } }
            // Note: API might need update to return prodavnica as well.
            const userData: User = {
                id_korisnik: data.user.id,
                username: data.user.username,
                level: data.user.level,
                prodavnica: data.user.prodavnica || 1, // Fallback if API not updated yet
            };
            set({ user: userData, isAuthenticated: true });
          } else {
            set({ user: null, isAuthenticated: false });
          }
        } catch (error) {
          console.error('Session check failed', error);
          set({ user: null, isAuthenticated: false });
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage), // Use sessionStorage for auth persistence
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
