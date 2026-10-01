import axios from 'axios';
import { z } from 'zod';
import { apiClient } from '@/api/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { sessionEpoch } from '@/stores/sessionEpoch';
import {
  useB2cSessionStore,
  type B2cRefusal,
  type B2cRefusalKind,
  type B2cSession,
} from '@/stores/b2cSessionStore';

/** `POST /b2c/session` — 200 (guide 16 §2.1). */
const sessionSchema = z.object({
  legacyToken: z.string(),
  legacyExpiresAt: z.string(),
  legacyUserId: z.string(),
  apiBaseUrl: z.string(),
  hubUrl: z.string(),
});

/** Renewed this long before it expires. */
const RENEW_BEFORE_MS = 60_000;

/** The exchange said no: the screens read `refusal` off the store. */
export class B2cSessionRefused extends Error {
  readonly refusal: B2cRefusal;
  constructor(refusal: B2cRefusal) {
    super(refusal.code ?? refusal.kind);
    this.refusal = refusal;
  }
}

const str = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined;

/** The refusal in the order the server checks them (guide 16 §2.2). */
function refusalOf(error: unknown): B2cRefusal {
  if (!axios.isAxiosError(error) || !error.response) return { kind: 'unavailable', status: 0, code: 'network' };
  const { status, data } = error.response;
  const body = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  const code = str(body['code']);
  const detail = str(body['detail']);
  let kind: B2cRefusalKind = 'other';
  if (status === 401) kind = 'signed_out';
  else if (code === 'prestataire_side_required') kind = 'side';
  else if (status === 403) kind = 'forbidden';
  else if (code === 'kyc_required') kind = 'kyc';
  else if (code === 'b2c_suspended' || status === 423) kind = 'suspended';
  else if (code === 'legacy_account_not_ready') kind = 'not_ready';
  else if (code === 'legacy_unavailable' || status >= 500) kind = 'unavailable';
  return {
    kind,
    status,
    code,
    detail,
    kycStatus: str(body['kycStatus']),
    legacySyncStatus: str(body['legacySyncStatus']),
  };
}

let inFlight: Promise<B2cSession> | null = null;
let watching = false;

/**
 * Sign-out, another account or a side switch: the de9de9 token belongs to the
 * session that asked for it (blocker B31). Dropped at once, not at its expiry.
 */
function watchAuth(): void {
  if (watching) return;
  watching = true;
  let key = authKey();
  useAuthStore.subscribe(() => {
    const next = authKey();
    if (next === key) return;
    key = next;
    useB2cSessionStore.setState({ session: null, refusal: null });
  });
}

function authKey(): string {
  const s = useAuthStore.getState();
  return s.token ? `${s.user?.id ?? ''}:${s.user?.role ?? ''}:${s.user?.companyId ?? ''}` : '';
}

async function exchange(): Promise<B2cSession> {
  const epoch = sessionEpoch();
  let parsed: z.infer<typeof sessionSchema>;
  try {
    // Through the Entreprise client: `session_refresh_required` is refreshed and replayed there.
    parsed = sessionSchema.parse((await apiClient.post('/b2c/session')).data);
  } catch (error) {
    const refusal = error instanceof z.ZodError ? { kind: 'unavailable' as const, status: 200, code: 'invalid_response' } : refusalOf(error);
    if (sessionEpoch() === epoch) useB2cSessionStore.setState({ session: null, refusal });
    throw new B2cSessionRefused(refusal);
  }
  // Signed out or switched meanwhile: this token is not for the current session.
  if (sessionEpoch() !== epoch) throw new B2cSessionRefused({ kind: 'signed_out', status: 0 });
  const session: B2cSession = { ...parsed, apiBaseUrl: parsed.apiBaseUrl.replace(/\/+$/, ''), epoch };
  useB2cSessionStore.setState({ session, refusal: null });
  return session;
}

const usable = (s: B2cSession | null): s is B2cSession =>
  !!s && s.epoch === sessionEpoch() && Date.parse(s.legacyExpiresAt) - Date.now() > RENEW_BEFORE_MS;

/**
 * The de9de9 session, traded once and shared: every caller waiting at the same
 * time gets the same exchange. Renewed about a minute before it expires —
 * always through Entreprise, never through the de9de9 app's own refresh routes.
 */
export function ensureB2cSession(): Promise<B2cSession> {
  watchAuth();
  const { session } = useB2cSessionStore.getState();
  if (usable(session)) return Promise.resolve(session);
  inFlight ??= exchange().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

/** The de9de9 app refused this token (401): forget it, so the next call trades a new one. */
export function dropB2cSession(token: string): void {
  if (useB2cSessionStore.getState().session?.legacyToken === token) {
    useB2cSessionStore.setState({ session: null });
  }
}

/** « Réessayer » on a refusal screen: forget the verdict and ask again. */
export function retryB2cSession(): void {
  useB2cSessionStore.setState({ refusal: null });
  ensureB2cSession().catch(() => undefined);
}
