import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { queryClient } from '@/lib/queryClient';
import { accueilActions } from '@/stores/accueilStore';
import { onboardingActions } from '@/stores/onboardingStore';
import { catalogueActions } from '@/features/client-catalogue/stores/catalogueStore';
import { authActions, useAuthStore } from '@/stores/authStore';
import { setRemember } from '@/stores/rememberStorage';
import { bumpSessionEpoch, sessionEpoch } from '@/stores/sessionEpoch';
import { companyNameOf, type AccueilEnvelope } from '../schemas/accueil';
import { switchRoleResponseSchema, type SignInResponse } from '../schemas/auth';

/**
 * Open a session from a sign-in / sign-up answer: store the tokens, and store
 * the home that came with it. `fallbackName` covers the sign-up, where the
 * company is not on a home yet but the user just typed its name. `remember`
 * is « Rester connecté »: false keeps the session to this browser session.
 */
export function adoptSignIn(
  session: SignInResponse,
  fallbackName?: string,
  opts: { remember?: boolean } = {},
): void {
  // A new session must not read what the previous one cached (query keys are
  // not account-scoped), nor take a late answer meant for it.
  queryClient.clear();
  bumpSessionEpoch();
  // Before any write: the three stores persist wherever this points.
  setRemember(opts.remember ?? true);
  const accueil = session.accueil ?? null;
  authActions.login(
    session.accessToken,
    {
      id: session.user.userId,
      name: companyNameOf(accueil) ?? fallbackName ?? session.user.email ?? '',
      role: accueil?.role ?? session.user.activeRole,
    },
    session.refreshToken ?? null,
  );
  accueilActions.set(accueil);
  onboardingActions.set(session.onboarding);
  // Nor open the catalogue on the previous account's search and picks.
  catalogueActions.reset();
}

/** The other side of the company — every company holds both roles. */
export function otherRole(role: 'client' | 'prestataire'): 'client' | 'prestataire' {
  return role === 'prestataire' ? 'client' : 'prestataire';
}

/**
 * « Passer en espace client / prestataire ». No body, bearer only: the backend
 * flips the session and answers with the new access token and the other side's
 * home, already built. A null refresh token means the current one stays valid.
 *
 * A 401 here was already refreshed and replayed once by the api client (that
 * covers `session_refresh_required`); the caller handles what is left.
 */
export function useSwitchRole() {
  return useMutation({
    mutationFn: async (): Promise<AccueilEnvelope> => {
      const epoch = sessionEpoch();
      const res = await apiClient.post('/auth/switch-role');
      const { accessToken, refreshToken, user, accueil } = switchRoleResponseSchema.parse(res.data);
      // Signed out (or into another account) meanwhile: this answer must not
      // bring the old session back.
      if (sessionEpoch() !== epoch) throw new Error('session_changed');
      bumpSessionEpoch();
      const current = useAuthStore.getState();
      authActions.login(
        accessToken,
        {
          id: user?.userId ?? current.user?.id ?? '',
          name: companyNameOf(accueil) ?? current.user?.name ?? '',
          role: accueil.role,
        },
        refreshToken ?? current.refreshToken,
      );
      accueilActions.set(accueil);
      // The other side's screens must not read what this one cached.
      void queryClient.invalidateQueries();
      return accueil;
    },
  });
}
