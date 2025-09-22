import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  session: unknown | null;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setSession: (session: unknown | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      isLoading: true,
      isAuthenticated: false,
      session: null,

      // Actions
      setUser: user => {
        set({
          user,
          isAuthenticated: !!user && !user.is_banned,
        });
      },

      setSession: session => {
        set({ session });
      },

      setLoading: isLoading => {
        set({ isLoading });
      },

      logout: () => {
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      updateUser: updates => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...updates },
            isAuthenticated: !updates.is_banned && !!currentUser,
          });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: state => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      skipHydration: true, // Skip hydration during SSR
    }
  )
);

// Selectors for easier access
export const useAuth = () => {
  const { user, isLoading, isAuthenticated, session } = useAuthStore();
  return { user, isLoading, isAuthenticated, session };
};

export const useUser = () => useAuthStore(state => state.user);
export const useIsAuthenticated = () =>
  useAuthStore(state => state.isAuthenticated);
export const useIsLoading = () => useAuthStore(state => state.isLoading);

// Action hooks
export const useAuthActions = () => {
  const { setUser, setSession, setLoading, logout, updateUser } =
    useAuthStore();
  return { setUser, setSession, setLoading, logout, updateUser };
};
