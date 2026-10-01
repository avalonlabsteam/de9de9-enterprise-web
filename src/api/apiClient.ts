import axios, { type InternalAxiosRequestConfig } from "axios";
import { authActions, useAuthStore } from "@/stores/authStore";
import { sessionEpoch } from "@/stores/sessionEpoch";
import { refreshSchema } from "@/features/auth/schemas/auth";
import { stripNulls } from "./stripNulls";

// Always the real API — the app no longer has a mock switch.
export const apiClient = axios.create({
  // Called directly: its CORS policy allows the dev server (localhost:5173)
  // and the production front. VITE_API_URL overrides it (see .env.example).
  baseURL: import.meta.env.VITE_API_URL ?? "https://api.entreprise.de9de9.dz/api/v1",
  timeout: 15_000,
});

// The one exception, in development only and opt-in (VITE_DEMO_ANNONCES=1):
// the annonce routes of guides 19 are a design the API does not serve yet, so
// an in-browser stand-in answers `/prestataire/annonces…` and the screens can
// be used. Every other call stays real; a production build drops this block.
if (import.meta.env.DEV && import.meta.env.VITE_DEMO_ANNONCES === "1") {
  const real = axios.getAdapter(apiClient.defaults.adapter);
  const demo = import("./mock/annoncesDemo").then((m) =>
    m.annoncesDemoAdapter(real, apiClient.defaults.baseURL),
  );
  apiClient.defaults.adapter = async (config) => (await demo)(config);
}

/**
 * A request as the interceptors see it: whether it already went through the
 * refresh dance once, and which session (epoch) sent it.
 */
type RetriedConfig = InternalAxiosRequestConfig & {
  _retried?: boolean;
  _epoch?: number;
};

// Pull the token from the store at request time (never from a captured closure).
apiClient.interceptors.request.use((config: RetriedConfig) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  // Kept on a replay: the retried call still belongs to the session that sent it.
  config._epoch ??= sessionEpoch();
  return config;
});

/**
 * Calls that open or check a session rather than use one: their 401 is a
 * verdict for the caller (wrong password, `needsRelogin`), not an expired
 * access token to refresh.
 */
const SELF_SETTLING_ROUTE =
  /\/auth\/(login|register|google|apple|refresh|validate-token)$/;

/**
 * What a refresh attempt came to. Only `rejected` — the API refused the
 * refresh token — ends the session; `unavailable` (no network, timeout, 5xx,
 * an unreadable answer) leaves the refresh token for the next call to try.
 */
type RefreshResult =
  | { kind: "ok"; token: string }
  | { kind: "rejected" }
  | { kind: "unavailable" };

/**
 * One refresh at a time: several calls answering 401 together must not each
 * spend the refresh token — they all wait on the first one's promise.
 */
let refreshing: Promise<RefreshResult> | null = null;

async function refreshAccessToken(): Promise<RefreshResult> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) return { kind: "rejected" };
  const epoch = sessionEpoch();
  let data: unknown;
  try {
    // A bare axios instance: this call must not go through the interceptors
    // that would try to refresh it in turn.
    const res = await axios.post(
      `${apiClient.defaults.baseURL ?? ""}/auth/refresh`,
      { refreshToken },
      { timeout: 15_000 },
    );
    data = res.data;
  } catch (error) {
    // Signed out or into another account meanwhile: that session is not ours to end.
    if (sessionEpoch() !== epoch) return { kind: "unavailable" };
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    if (status !== 400 && status !== 401 && status !== 403) return { kind: "unavailable" };
    // Refused because the pair was already renewed meanwhile (validate-token,
    // another tab): the session is alive — replay with the current token.
    const current = useAuthStore.getState();
    if (current.refreshToken !== refreshToken && current.token) {
      return { kind: "ok", token: current.token };
    }
    return { kind: "rejected" };
  }
  // Same here: new tokens for a session that is gone must not overwrite the current one.
  if (sessionEpoch() !== epoch) return { kind: "unavailable" };
  const parsed = refreshSchema.safeParse(stripNulls(data));
  if (!parsed.success) return { kind: "unavailable" };
  const user = useAuthStore.getState().user;
  if (!user) return { kind: "rejected" };
  authActions.login(
    parsed.data.accessToken,
    user,
    parsed.data.refreshToken ?? refreshToken,
  );
  return { kind: "ok", token: parsed.data.accessToken };
}

/** When the access token expires (ms since epoch), from its `exp` claim — null when unreadable. */
function expiresAt(token: string): number | null {
  try {
    const payload = token.split(".")[1] ?? "";
    const claims = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: unknown };
    return typeof claims.exp === "number" ? claims.exp * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * Renew an access token that is expired or about to be, before a connection
 * that cannot go through the 401 dance below — the alerts hub's socket, which
 * the server closes with its token. A refused refresh ends the session, as it
 * does for a REST call.
 */
export async function refreshIfNeeded(): Promise<void> {
  const { token, refreshToken } = useAuthStore.getState();
  if (!token || !refreshToken) return;
  const exp = expiresAt(token);
  if (exp === null || exp - Date.now() > 60_000) return;
  refreshing ??= refreshAccessToken().finally(() => {
    refreshing = null;
  });
  if ((await refreshing).kind === "rejected") authActions.logout();
}

apiClient.interceptors.response.use(
  (response) => {
    // `null` → absent, so the schemas' optional / default fields hold (see
    // stripNulls). Files (blobs) and non-JSON bodies go through untouched.
    response.data = stripNulls(response.data);
    return response;
  },
  async (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const config = error.config as RetriedConfig | undefined;
      // A sign-in answering 401 means wrong credentials for that form, not an
      // expired session: no refresh, no replay, no logout — the caller settles it.
      if (config?.url && SELF_SETTLING_ROUTE.test(config.url)) {
        return Promise.reject(error);
      }
      // Sent under a session since replaced (sign-in, switch, logout): its 401
      // says nothing about the current one. Refreshing would replay it as the
      // new account, and a logout would end a session it never belonged to.
      if (config?._epoch !== undefined && config._epoch !== sessionEpoch()) {
        return Promise.reject(error);
      }
      // An expired access token is not a logout: trade the refresh token for a
      // new one and replay the call. Only once per request.
      if (config && !config._retried && useAuthStore.getState().refreshToken) {
        config._retried = true;
        refreshing ??= refreshAccessToken().finally(() => {
          refreshing = null;
        });
        const result = await refreshing;
        if (result.kind === "ok") return apiClient.request(config);
        // The refresh never got a verdict: keep the tokens, let the caller show
        // its error, and let the next call try the refresh again.
        if (result.kind === "unavailable") return Promise.reject(error);
      }
      authActions.logout();
    }
    return Promise.reject(
      error instanceof Error ? error : new Error(String(error)),
    );
  },
);
