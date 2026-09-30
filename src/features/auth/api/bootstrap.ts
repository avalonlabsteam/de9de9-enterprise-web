import { useEffect } from 'react';
import axios from 'axios';
import { apiClient } from '@/api/apiClient';
import { accueilActions } from '@/stores/accueilStore';
import { onboardingActions } from '@/stores/onboardingStore';
import { authActions, useAuthStore } from '@/stores/authStore';
import { sessionEpoch } from '@/stores/sessionEpoch';
import { companyNameOf } from '../schemas/accueil';
import { validateTokenSchema } from '../schemas/auth';

/** Wait before each new try when the API could not give a verdict. */
const RETRY_DELAYS_MS = [1_000, 2_000, 4_000];

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** The call never landed, or the API failed — a 5xx changed nothing: try again, never sign out. */
function noVerdict(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status ?? 0;
  return status === 0 || status >= 500;
}

/** 401 `{ needsRelogin: true }`: the stored session is over. */
function needsRelogin(error: unknown): boolean {
  if (!axios.isAxiosError(error) || error.response?.status !== 401) return false;
  const body = error.response.data as { needsRelogin?: unknown } | undefined;
  return body?.needsRelogin === true;
}

function applyAnswer(data: unknown): void {
  const parsed = validateTokenSchema.safeParse(data);
  if (!parsed.success) return; // unreadable: keep what is stored
  const answer = parsed.data;

  // Read now, not before the call: the api client may have refreshed the tokens meanwhile.
  const current = useAuthStore.getState();
  if (!current.token) return;
  // A refresh token in the answer means the pair was renewed; null means both still stand.
  const renewed = answer.refreshToken && answer.accessToken;
  const id = answer.user?.userId ?? current.user?.id;
  // The server's side wins: a stored role gone stale is repaired here.
  const role = answer.accueil?.role ?? answer.user?.activeRole ?? current.user?.role;
  if (id && role) {
    authActions.login(
      renewed ? (answer.accessToken as string) : current.token,
      {
        id,
        name: companyNameOf(answer.accueil) ?? current.user?.name ?? answer.user?.email ?? '',
        role,
        // A session stored before the company id was kept gets it here, at app start.
        companyId: answer.user?.companyId ?? current.user?.companyId,
      },
      renewed ? (answer.refreshToken as string) : current.refreshToken,
    );
  }
  if (answer.accueil) accueilActions.set(answer.accueil);
  if (answer.onboarding) onboardingActions.set(answer.onboarding);
}

/**
 * The app-start check. The home and the onboarding state only travel with a
 * sign-in, so a reopened app would otherwise render what the last sign-in left
 * in the store; this confirms the stored tokens — in the body, since the access
 * token may already be expired — and takes a fresh home back.
 *
 * Resolves true once the API gave a verdict, false when it could not be reached.
 */
export async function validateSession(): Promise<boolean> {
  // A sign-in, switch or logout while this runs brings fresher data than this answer.
  const epoch = sessionEpoch();
  for (let attempt = 0; ; attempt++) {
    const { token, refreshToken } = useAuthStore.getState();
    if (!token) return true;
    try {
      const res = await apiClient.post('/auth/validate-token', {
        accessToken: token,
        ...(refreshToken ? { refreshToken } : {}),
      });
      if (sessionEpoch() === epoch) applyAnswer(res.data);
      return true;
    } catch (error) {
      if (needsRelogin(error)) {
        const now = useAuthStore.getState();
        // The verdict is about the tokens that were sent. If another call
        // renewed them meanwhile, it says nothing about the live session.
        const stale = now.token !== token || now.refreshToken !== refreshToken;
        if (sessionEpoch() === epoch && !stale) authActions.logout();
        if (!stale || attempt >= RETRY_DELAYS_MS.length) return true;
        continue; // ask again, about the current tokens
      }
      if (!noVerdict(error)) return true; // any other answer is final: keep what is stored
      if (attempt >= RETRY_DELAYS_MS.length) return false;
    }
    await wait(RETRY_DELAYS_MS[attempt]);
    if (sessionEpoch() !== epoch) return true;
  }
}

/** Settled once the API gave a verdict; until then a later shell mount tries again. */
let done = false;
let running: Promise<void> | null = null;

/** Run the check once per page load, from the app shell. */
export function useSessionBootstrap(): void {
  useEffect(() => {
    if (done || running) return;
    running = validateSession().then((settled) => {
      done = settled;
      running = null;
    });
  }, []);
}
