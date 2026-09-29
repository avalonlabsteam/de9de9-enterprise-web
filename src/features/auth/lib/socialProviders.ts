/**
 * Google / Apple sign-in, client half. Both providers hand the app an identity
 * token in the browser, which the API then verifies — so nothing here is a
 * secret, only the public client ids, read from the environment.
 *
 * A provider with no client id configured is simply unavailable: the buttons
 * say so instead of failing on a click.
 */

interface GoogleCredentialResponse {
  credential?: string;
}

/** The subset of renderButton's options the login page uses. */
interface GoogleButtonConfig {
  type: 'standard' | 'icon';
  theme: 'outline' | 'filled_blue' | 'filled_black';
  size: 'large' | 'medium' | 'small';
  text: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape: 'rectangular' | 'pill' | 'circle' | 'square';
  width?: number;
  locale?: string;
}

interface GoogleIdentity {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
      }) => void;
      renderButton: (parent: HTMLElement, options: GoogleButtonConfig) => void;
    };
  };
}

interface AppleAuthorization {
  authorization?: { id_token?: string; code?: string };
}

interface AppleId {
  auth: {
    init: (config: {
      clientId: string;
      scope: string;
      redirectURI: string;
      usePopup: boolean;
    }) => void;
    signIn: () => Promise<AppleAuthorization>;
  };
}

declare global {
  interface Window {
    google?: GoogleIdentity;
    AppleID?: AppleId;
  }
}

export const GOOGLE_CLIENT_ID: string | undefined = import.meta.env.VITE_GOOGLE_CLIENT_ID;
export const APPLE_CLIENT_ID: string | undefined = import.meta.env.VITE_APPLE_CLIENT_ID;

const APPLE_REDIRECT_URI: string =
  import.meta.env.VITE_APPLE_REDIRECT_URI ??
  (typeof window !== 'undefined' ? window.location.origin : '');

const GOOGLE_SCRIPT = 'https://accounts.google.com/gsi/client';
const APPLE_SCRIPT =
  'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';

const loaded = new Map<string, Promise<void>>();

function loadScript(src: string): Promise<void> {
  const existing = loaded.get(src);
  if (existing) return existing;
  const promise = new Promise<void>((resolve, reject) => {
    const el = document.createElement('script');
    el.src = src;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => {
      // Not cached: a failure (offline, blocker) must not answer every later try.
      loaded.delete(src);
      el.remove();
      reject(new Error(`Script failed to load: ${src}`));
    };
    document.head.appendChild(el);
  });
  loaded.set(src, promise);
  return promise;
}

/**
 * GIS wants initialize() once per page, so its callback hands the ID token to
 * whichever rendered button is current.
 */
let googleInitialized = false;
let onGoogleCredential: ((idToken: string) => void) | null = null;

export interface GoogleButtonOptions {
  theme: 'outline' | 'filled_black';
  /** The container's width in pixels, kept within GIS's 200–400. */
  width: number;
  locale: 'fr' | 'ar';
  /** The ID token for the account the user picked. */
  onCredential: (idToken: string) => void;
  /** `google_not_configured` or `google_unavailable` (script or GIS missing). */
  onError: (error: Error) => void;
}

/**
 * Google's own « Continuer avec Google » button, drawn into `element`. Unlike
 * One Tap it shows every time, with or without a Google session, and is not
 * muted after the user closes it once. Returns the cleanup.
 */
export function renderGoogleButton(element: HTMLElement, opts: GoogleButtonOptions): () => void {
  let active = true;
  const handler = (idToken: string) => {
    if (active) opts.onCredential(idToken);
  };

  if (!GOOGLE_CLIENT_ID) {
    opts.onError(new Error('google_not_configured'));
    return () => {};
  }
  const clientId = GOOGLE_CLIENT_ID;

  loadScript(GOOGLE_SCRIPT).then(
    () => {
      if (!active) return;
      const google = window.google;
      if (!google) {
        opts.onError(new Error('google_unavailable'));
        return;
      }
      if (!googleInitialized) {
        google.accounts.id.initialize({
          client_id: clientId,
          // No credential: the popup ended without a pick — nothing to do.
          callback: (response) => {
            if (response.credential) onGoogleCredential?.(response.credential);
          },
        });
        googleInitialized = true;
      }
      onGoogleCredential = handler;
      google.accounts.id.renderButton(element, {
        type: 'standard',
        theme: opts.theme,
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        width: Math.max(200, Math.min(400, Math.round(opts.width))),
        locale: opts.locale,
      });
    },
    (cause: unknown) => {
      if (active) opts.onError(new Error('google_unavailable', { cause }));
    },
  );

  return () => {
    active = false;
    if (onGoogleCredential === handler) onGoogleCredential = null;
    element.replaceChildren();
  };
}

/** Set once Apple's script is in and AppleID.auth is initialised. */
let appleReady: AppleId | null = null;

async function loadApple(): Promise<AppleId> {
  if (appleReady) return appleReady;
  if (!APPLE_CLIENT_ID) throw new Error('apple_not_configured');
  try {
    await loadScript(APPLE_SCRIPT);
  } catch (cause) {
    throw new Error('apple_unavailable', { cause });
  }
  const apple = window.AppleID;
  if (!apple) throw new Error('apple_unavailable');
  apple.auth.init({
    clientId: APPLE_CLIENT_ID,
    scope: 'name email',
    redirectURI: APPLE_REDIRECT_URI,
    usePopup: true,
  });
  appleReady = apple;
  return apple;
}

/**
 * Load and init Apple ahead of the click: a signIn() that runs after an
 * awaited script load has lost the click, and the browser blocks its popup.
 * A failure here is retried (and reported) by the click.
 */
export function preloadAppleSignIn(): void {
  loadApple().catch(() => {});
}

/** How Apple's signIn() rejects when the user closes the popup or declines. */
const APPLE_CANCELS = new Set(['popup_closed_by_user', 'user_cancelled_authorize']);

function isAppleCancel(reason: unknown): boolean {
  const code =
    reason && typeof reason === 'object' ? (reason as { error?: unknown }).error : undefined;
  return typeof code === 'string' && APPLE_CANCELS.has(code);
}

/**
 * The Apple identity token (and the code, which some backends verify instead).
 * Call it straight from the click. Rejections end in `_cancelled` (the user
 * backed out: stay silent), `_not_configured` or `_unavailable`; the detail is
 * in the error's `cause`.
 */
export async function getAppleCredentials(): Promise<{ idToken: string; code?: string }> {
  // Preloaded: no await before signIn(), which then still runs inside the click.
  const apple = appleReady ?? (await loadApple());
  let result: AppleAuthorization;
  try {
    result = await apple.auth.signIn();
  } catch (cause) {
    throw new Error(isAppleCancel(cause) ? 'apple_cancelled' : 'apple_unavailable', { cause });
  }
  const idToken = result.authorization?.id_token;
  if (!idToken) throw new Error('apple_cancelled');
  return { idToken, code: result.authorization?.code };
}
