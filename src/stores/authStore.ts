import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** The Entreprise app serves two personas behind one login. */
export type Role = 'client' | 'prestataire';
export type AuthMode = 'login' | 'signup';

export interface AuthUser {
  id: string;
  name: string;
  role: Role;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  /** Transient intent captured on /login and consumed on /role → landing. */
  pendingMode: AuthMode;
}

const initialState: AuthState = {
  token: null,
  user: null,
  pendingMode: 'login',
};

export const useAuthStore = create<AuthState>()(
  persist(() => initialState, {
    name: 'de9de9-entreprise-auth',
    // Only durable auth state goes to localStorage — a stale persisted
    // pendingMode would reroute a later /role visit into the signup flow.
    partialize: (s) => ({ token: s.token, user: s.user }),
  }),
);

/** Actions are decoupled from the hook so non-React code (interceptors, handlers) can call them. */
export const authActions = {
  /** Record whether the user is logging in or signing up (set on the login screen). */
  setMode: (pendingMode: AuthMode): void => {
    useAuthStore.setState({ pendingMode });
  },
  login: (token: string, user: AuthUser): void => {
    useAuthStore.setState({ token, user });
  },
  logout: (): void => {
    useAuthStore.setState({ token: null, user: null, pendingMode: 'login' });
  },
};
