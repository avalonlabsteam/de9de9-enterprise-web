import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { queryClient } from '@/lib/queryClient';
import { catalogueActions } from '@/features/client-catalogue/stores/catalogueStore';
import { accueilActions } from './accueilStore';
import { onboardingActions } from './onboardingStore';
import { rememberStorage, SESSION_STORE_KEYS } from './rememberStorage';
import { bumpSessionEpoch } from './sessionEpoch';

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
  /** Kept for the coming token refresh — only the sign-up/login answer carries it. */
  refreshToken: string | null;
  user: AuthUser | null;
  /** Transient intent captured on /login and consumed on /role → landing. */
  pendingMode: AuthMode;
}

type PersistedAuth = Pick<AuthState, 'token' | 'refreshToken' | 'user'>;

const initialState: AuthState = {
  token: null,
  refreshToken: null,
  user: null,
  pendingMode: 'login',
};

export const useAuthStore = create<AuthState>()(
  persist(() => initialState, {
    name: SESSION_STORE_KEYS.auth,
    storage: rememberStorage<PersistedAuth>(),
    // Only durable auth state is persisted — a stale persisted pendingMode
    // would reroute a later /role visit into the signup flow.
    partialize: (s): PersistedAuth => ({ token: s.token, refreshToken: s.refreshToken, user: s.user }),
    // No stored copy means signed out (another tab logged out, or the session
    // moved storage) — the default merge would keep the tokens in memory.
    merge: (persisted, current) => ({
      ...current,
      token: null,
      refreshToken: null,
      user: null,
      ...(persisted as Partial<PersistedAuth> | undefined),
    }),
  }),
);

/** Actions are decoupled from the hook so non-React code (interceptors, handlers) can call them. */
export const authActions = {
  /** Record whether the user is logging in or signing up (set on the login screen). */
  setMode: (pendingMode: AuthMode): void => {
    useAuthStore.setState({ pendingMode });
  },
  login: (token: string, user: AuthUser, refreshToken: string | null = null): void => {
    useAuthStore.setState({ token, user, refreshToken });
  },
  logout: (): void => {
    bumpSessionEpoch();
    useAuthStore.setState({ token: null, refreshToken: null, user: null, pendingMode: 'login' });
    // The home, the onboarding state and the catalogue picks belong to the
    // session that carried them.
    accueilActions.clear();
    onboardingActions.clear();
    catalogueActions.reset();
    // Query keys are not account-scoped: the next account must not read these.
    queryClient.clear();
  },
};
