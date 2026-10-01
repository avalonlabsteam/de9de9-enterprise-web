import { useEffect } from 'react';
import { HubConnectionBuilder, HubConnectionState, LogLevel, type HubConnection } from '@microsoft/signalr';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { stripNulls } from '@/api/stripNulls';
import { useLangStore } from '@/stores/langStore';
import { useB2cSessionStore } from '@/stores/b2cSessionStore';
import { badgeCountsSchema } from '../schemas/b2c';
import { b2cKeys, refreshB2c, type TabCounts } from './b2c';
import { ensureB2cSession } from './session';

/**
 * The de9de9 app's own hub (guide 16 §4) — every seat joins the same group,
 * the company's account. One-way: the app only listens, then reloads over
 * REST. Many things send no event at all (a new booking without a registered
 * phone, a consumer's cancel or « terminé »…), so this only makes the tabs
 * quicker: the minute's polling is what keeps them right.
 */

const RETRY_MIN_MS = 5_000;
const RETRY_MAX_MS = 60_000;

function listen(queryClient: QueryClient, hubUrl: string): () => void {
  let stopped = false;
  let retryDelay = RETRY_MIN_MS;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  /** The tabs load on their own the first time; only a later start has a gap to fill. */
  let restarted = false;

  const connection: HubConnection = new HubConnectionBuilder()
    .withUrl(hubUrl, {
      withCredentials: false,
      // The token lasts an hour and has no refresh: a new one comes from Entreprise.
      accessTokenFactory: () => ensureB2cSession().then((s) => s.legacyToken),
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Error)
    .build();

  connection.on('ProEvent', (raw: unknown) => {
    const type = (raw as { type?: unknown } | null)?.type;
    if (type === 'NewOpportunity') {
      // A consumer's new post in the company's categories.
      void queryClient.invalidateQueries({ queryKey: ['b2c', 'explore'] });
      return;
    }
    if (type === 'OfferConfirmed') {
      toast.success(useLangStore.getState().lang === 'ar' ? 'تم قبول عرضك' : 'Offre retenue');
    }
    refreshB2c(queryClient, { explore: false });
  });
  // Consumer cancels, counters and acceptances only come this way.
  connection.on('ReceiveNotification', () => refreshB2c(queryClient, { explore: false }));
  connection.on('BadgeCountsUpdated', (raw: unknown) => {
    const parsed = badgeCountsSchema.safeParse(stripNulls(raw));
    if (parsed.success) {
      queryClient.setQueryData<TabCounts>(b2cKeys.counts, (old) => (old ? { ...old, offres: parsed.data.opport } : old));
    }
  });
  connection.onreconnected(() => refreshB2c(queryClient));
  connection.onclose(() => schedule());

  const start = async () => {
    if (stopped || connection.state !== HubConnectionState.Disconnected) return;
    try {
      await connection.start();
      retryDelay = RETRY_MIN_MS;
      if (stopped) void connection.stop();
      else if (restarted) refreshB2c(queryClient);
      restarted = true;
    } catch {
      schedule();
    }
  };
  function schedule(): void {
    clearTimeout(retryTimer);
    if (stopped) return;
    retryTimer = setTimeout(() => void start(), retryDelay);
    retryDelay = Math.min(retryDelay * 2, RETRY_MAX_MS);
  }

  void start();
  return () => {
    stopped = true;
    clearTimeout(retryTimer);
    void connection.stop();
  };
}

/** Live events while « B2C · Particuliers » is open and the de9de9 session is good. */
export function useB2cLive(): void {
  const queryClient = useQueryClient();
  // Only its URL: a renewed token must not restart the connection.
  const hubUrl = useB2cSessionStore((s) => s.session?.hubUrl);
  useEffect(() => {
    if (!hubUrl) return;
    return listen(queryClient, hubUrl);
  }, [queryClient, hubUrl]);
}
