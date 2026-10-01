import { HubConnectionBuilder, HubConnectionState, LogLevel, type HubConnection } from '@microsoft/signalr';
import { toast } from 'sonner';
import { refreshIfNeeded } from '@/api/apiClient';
import { apiUrl } from '@/api/hostUrl';
import { stripNulls } from '@/api/stripNulls';
import { appNavigate } from '@/lib/navigation';
import { queryClient } from '@/lib/queryClient';
import { accueilActions } from '@/stores/accueilStore';
import { authActions, useAuthStore } from '@/stores/authStore';
import { sessionChecked } from '@/features/auth/api/bootstrap';
import { switchRole } from '@/features/auth/api/session';
import { dossierQueryKey } from '@/features/kyc/api/kyc';
import { paiementsListeKey, portefeuilleKey } from '@/features/client-wallet/api/keys';
import { catchUp, loadVue } from './api/alertes';
import { lNow } from './lib/libelles';
import { alerteSchema, compteursSchema, sessionEventSchema, type Alerte } from './schemas/alerte';
import { alertesActions, currentApp, unreadHeld, useAlertesStore } from './stores/alertesStore';
import { notifyCaughtUp, notifyLive } from './toasts';

/**
 * The live half of the alerts (common guide §4): one SignalR connection per
 * session and side. The hub is one-way — the app only listens; reading,
 * filtering and marking read stay on REST. What the socket missed while down,
 * a catch-up reads back at every (re)connect.
 */

const RETRY_MIN_MS = 5_000;
const RETRY_MAX_MS = 60_000;

let hub: HubConnection | null = null;
/** The app shell asked for live alerts (the landing page never does). */
let wanted = false;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let retryDelay = RETRY_MIN_MS;
/** When the current connection last opened — one closed soon after waits before the next try. */
let openedAt = 0;

/** Who the connection is for. The hub's groups are fixed at connect: another user, side or company needs a new one. */
function sessionKeyOf(s: ReturnType<typeof useAuthStore.getState>): string {
  return s.token ? `${s.user?.id ?? ''}:${s.user?.role ?? ''}:${s.user?.companyId ?? ''}` : '';
}
let sessionKey = sessionKeyOf(useAuthStore.getState());

async function caughtUp(): Promise<void> {
  notifyCaughtUp(await catchUp());
}

/** What the app does besides the bell when some alerts arrive. */
function sideEffects(a: Alerte): void {
  // The KYC pill reads the sign-in's home: fold the verdict in, as a submit does.
  if (a.code === 'kyc.verifie') accueilActions.patchEntreprise({ kycStatut: 'verified', verifie: true });
  else if (a.code === 'kyc.document_refuse') accueilActions.patchEntreprise({ kycStatut: 'rejected', verifie: false });
  if (a.categorie === 'kyc') void queryClient.invalidateQueries({ queryKey: dossierQueryKey });
  // A recharge credited, a payment refused: the wallet never reloads on its own (guide 17 §11).
  if (a.categorie === 'credits') {
    void queryClient.invalidateQueries({ queryKey: portefeuilleKey });
    void queryClient.invalidateQueries({ queryKey: paiementsListeKey });
  }
}

/** `session` (common guide §9): the session ends, or moves to the other side. */
function onSession(raw: unknown): void {
  const parsed = sessionEventSchema.safeParse(stripNulls(raw));
  if (!parsed.success) return;
  const { raison, message } = parsed.data;
  if (raison === 'cote_desactive') {
    toast.info(message ?? lNow('Cet espace a été désactivé.', 'تم تعطيل هذه المساحة.'), { duration: 8_000 });
    switchRole()
      .then((accueil) => appNavigate(accueil.role === 'prestataire' ? '/prestataire' : '/client'))
      .catch(() => {
        // The server already took this connection out of the side's groups;
        // the next REST call answers 401/403 and settles the rest.
      });
    return;
  }
  if (raison === 'compte_suspendu' || raison === 'acces_retire') {
    stopHub();
    authActions.logout();
    toast.error(message ?? lNow('Votre session a pris fin.', 'انتهت جلستك.'), { duration: 10_000 });
    appNavigate(`/login?raison=${encodeURIComponent(raison)}`);
  }
}

function build(): HubConnection {
  const connection = new HubConnectionBuilder()
    .withUrl(apiUrl('/hubs/notifications'), {
      // Bearer only, no cookies: the API's CORS need not allow credentials.
      withCredentials: false,
      // Always the current token, renewed first when it is about to expire:
      // the server closes the socket with its token.
      accessTokenFactory: async () => {
        await refreshIfNeeded();
        return useAuthStore.getState().token ?? '';
      },
    })
    .withAutomaticReconnect([0, 2_000, 5_000, 10_000, 30_000])
    .configureLogging(LogLevel.Warning)
    .build();

  connection.on('alerte', (raw: unknown) => {
    if (connection !== hub) return;
    const parsed = alerteSchema.safeParse(stripNulls(raw));
    if (!parsed.success) return;
    const a = parsed.data;
    // Only ever this side's — a row for the other one means a switch is in flight.
    if (a.cible.app !== currentApp()) return;
    if (!alertesActions.add(a)) return;
    sideEffects(a);
    notifyLive(a);
  });

  connection.on('compteurs', (raw: unknown) => {
    if (connection !== hub) return;
    const parsed = compteursSchema.safeParse(stripNulls(raw));
    if (!parsed.success) return;
    alertesActions.setCompteurs(parsed.data, { infer: true });
    // Another seat read rows the open drawer still shows unread: its first page again.
    const { drawerOpen, vue } = useAlertesStore.getState();
    if (drawerOpen && parsed.data.nonLues < unreadHeld()) loadVue(vue, 'first').catch(() => undefined);
  });

  connection.on('session', (raw: unknown) => {
    if (connection === hub) onSession(raw);
  });

  connection.onreconnected(() => {
    if (connection === hub) void caughtUp();
  });

  // The token expired, or the automatic retries ran out: renew and start again —
  // after a pause when the server shut it right after it opened.
  connection.onclose(() => {
    if (connection !== hub) return;
    if (Date.now() - openedAt > 10_000) void connect(connection, false);
    else scheduleRetry(connection);
  });

  return connection;
}

async function connect(connection: HubConnection, first: boolean): Promise<void> {
  clearTimeout(retryTimer);
  if (connection !== hub || connection.state !== HubConnectionState.Disconnected) return;
  await refreshIfNeeded();
  if (connection !== hub || !useAuthStore.getState().token) return;
  try {
    await connection.start();
  } catch {
    if (connection !== hub) return;
    // Live alerts come late, not never: meanwhile the bell still loads over REST.
    if (first) void caughtUp();
    scheduleRetry(connection);
    return;
  }
  if (connection !== hub) {
    void connection.stop();
    return;
  }
  // Only a connection that then holds resets the pause (see onclose).
  if (Date.now() - openedAt > 10_000) retryDelay = RETRY_MIN_MS;
  openedAt = Date.now();
  await caughtUp();
}

function scheduleRetry(connection: HubConnection): void {
  clearTimeout(retryTimer);
  retryTimer = setTimeout(() => void connect(connection, false), retryDelay);
  retryDelay = Math.min(retryDelay * 2, RETRY_MAX_MS);
}

function startHub(): void {
  if (hub || !useAuthStore.getState().token) return;
  const connection = build();
  hub = connection;
  retryDelay = RETRY_MIN_MS;
  openedAt = 0;
  void connect(connection, true);
}

function stopHub(): void {
  clearTimeout(retryTimer);
  const connection = hub;
  hub = null;
  if (connection) void connection.stop();
}

/**
 * Follow the session (call once at startup): a sign-out stops the hub, a
 * sign-in or a side switch starts it again on an empty list — alerts and their
 * `cible` are per side, never merged across (common guide §4.5). A mere token
 * refresh keeps the connection.
 */
export function initAlertes(): void {
  useAuthStore.subscribe((state) => {
    const key = sessionKeyOf(state);
    if (key === sessionKey) return;
    sessionKey = key;
    stopHub();
    alertesActions.clear();
    if (wanted && key) startHub();
  });
}

/** From the app shell: live alerts from now on, once the app-start check said the session is good. */
export async function enableAlertes(): Promise<void> {
  wanted = true;
  await sessionChecked();
  startHub();
}
