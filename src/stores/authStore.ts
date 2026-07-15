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
  pendingRole: Role | null;
}

const initialState: AuthState = {
  token: null,
  user: null,
  pendingMode: 'login',
  pendingRole: null,
};

export const useAuthStore = create<AuthState>()(
  persist(() => initialState, { name: 'de9de9-entreprise-auth' }),
);

/** Actions are decoupled from the hook so non-React code (interceptors, handlers) can call them. */
export const authActions = {
  /** Record whether the user is logging in or signing up (set on the login screen). */
  setMode: (pendingMode: AuthMode): void => {
    useAuthStore.setState({ pendingMode });
  },
  /** Record which persona was chosen on the /role screen. */
  setPendingRole: (pendingRole: Role): void => {
    useAuthStore.setState({ pendingRole });
  },
  login: (token: string, user: AuthUser): void => {
    useAuthStore.setState({ token, user });
  },
  logout: (): void => {
    useAuthStore.setState({ token: null, user: null, pendingRole: null, pendingMode: 'login' });
  },
};
