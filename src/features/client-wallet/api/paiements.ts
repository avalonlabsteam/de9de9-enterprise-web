import { useState } from 'react';
import axios from 'axios';
import { useInfiniteQuery, useQuery, type QueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { apiUrl } from '@/api/hostUrl';
import { downloadAuthedFile } from '@/lib/authedFile';
import { validateSession } from '@/features/auth/api/bootstrap';
import {
  paiementInitieSchema,
  paiementSchema,
  paiementsPageSchema,
  recuBanqueSchema,
  recuEnvoyeSchema,
  type Paiement,
  type PaiementInitie,
} from '../schemas/paiements';
import { paiementKey, paiementsKey, paiementsListeKey, portefeuilleKey } from './keys';

const BASE = '/client/portefeuille/paiements';

export { paiementKey, paiementsKey, paiementsListeKey };

// ------------------------------------------------------- the payment in flight

/**
 * The payment this tab sent to the bank — the return page reads it back, since
 * nothing the bank's redirect carries is trusted. sessionStorage: it stays with
 * the tab across the trip to SATIM's page.
 */
const PAIEMENT_EN_COURS_KEY = 'de9.paiementEnCours';

export function rememberPaiement(paiementId: string, reference?: string | null): void {
  try {
    sessionStorage.setItem(PAIEMENT_EN_COURS_KEY, JSON.stringify({ paiementId, reference: reference ?? null }));
  } catch {
    /* storage blocked: the return page then asks the server which payment it was */
  }
}

export function storedPaiementId(): string | null {
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem(PAIEMENT_EN_COURS_KEY) ?? 'null');
    const id = (stored as { paiementId?: unknown } | null)?.paiementId;
    return typeof id === 'string' && id ? id : null;
  } catch {
    return null;
  }
}

/** Once the payment is final (any outcome). Another payment's entry is left alone. */
export function forgetPaiement(id: string): void {
  try {
    if (storedPaiementId() === id) sessionStorage.removeItem(PAIEMENT_EN_COURS_KEY);
  } catch {
    /* nothing to forget */
  }
}

// --------------------------------------------------------------------- « Payer »

export interface InitierPaiementBody {
  /** Whole dinars — a JSON integer. */
  montantDzd: number;
  /** The SATIM page language: the app's. */
  langue: 'fr' | 'ar';
  accepteConditions: true;
}

/** A replayed answer whose SATIM page is already closed: a new key, press again. */
export class PaiementExpireError extends Error {}

/**
 * `POST /client/portefeuille/paiements`. The server waits up to 30 s for the
 * gateway, so this call outlives the client's usual 15 s. `key` is the
 * confirmation's `Idempotency-Key` — the caller owns when it changes.
 */
export async function initierPaiement(body: InitierPaiementBody, key: string): Promise<PaiementInitie> {
  const paiement = paiementInitieSchema.parse(
    (await apiClient.post(BASE, body, { timeout: 60_000, headers: { 'Idempotency-Key': key } })).data,
  );
  // A replayed 200 (`Idempotency-Replayed`) may be an old press: its card page can no longer be paid.
  if (Date.parse(paiement.expiresAt) <= Date.now()) throw new PaiementExpireError();
  return paiement;
}

// ---------------------------------------------------------------- one payment

const FAST_MS = 3_000;
const SLOW_MS = 20_000;
/** 3 s for the first minute, then 20 s, and nothing past 15 minutes. */
const FAST_FOR_MS = 60_000;
export const POLL_FOR_MS = 15 * 60_000;

/** `Retry-After` of a 429, in ms (the header is exposed cross-origin). */
function retryAfterMs(error: unknown): number | null {
  if (!axios.isAxiosError(error) || error.response?.status !== 429) return null;
  const seconds = Number((error.response.headers as Record<string, unknown>)['retry-after']);
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1_000 : SLOW_MS;
}

/**
 * The payment page's one query. `/verification` is the server-side
 * confirmation: the server asks the bank, credits the wallet when it approved
 * exactly the stored amount, and answers the payment — repeated calls converge
 * and the credit happens once. It is polled until `final`; a payment already
 * known final (opened from the list) is read as stored, without a bank call.
 */
export function usePaiement(id: string | undefined, connuFinal: boolean) {
  const [debut] = useState(() => Date.now());
  return useQuery({
    queryKey: paiementKey(id ?? ''),
    enabled: !!id,
    retry: false,
    queryFn: async ({ client, queryKey }) => {
      const held = client.getQueryData<Paiement>(queryKey);
      const stored = held ? held.final : connuFinal;
      const path = `${BASE}/${encodeURIComponent(id ?? '')}${stored ? '' : '/verification'}`;
      return paiementSchema.parse((await apiClient.get(path)).data);
    },
    refetchInterval: (query) => {
      if (query.state.data?.final) return false;
      const error = query.state.error;
      // Gone, or not this company's: nothing left to ask.
      if (axios.isAxiosError(error) && error.response?.status === 404) return false;
      const wait = retryAfterMs(error);
      if (wait !== null) return wait;
      const elapsed = Date.now() - debut;
      return elapsed < FAST_FOR_MS ? FAST_MS : elapsed < POLL_FOR_MS ? SLOW_MS : false;
    },
    refetchIntervalInBackground: false,
  });
}

/**
 * The return page without a stored id: one lookup with whatever the redirect
 * carried — a hint at most. The server searches this company only, verifies
 * with the bank, and answers the payment.
 */
export async function resoudreRetour(hints: { orderNumber?: string | null; orderId?: string | null }): Promise<Paiement> {
  const params = {
    ...(hints.orderNumber ? { orderNumber: hints.orderNumber } : {}),
    ...(hints.orderId ? { orderId: hints.orderId } : {}),
  };
  return paiementSchema.parse((await apiClient.get(`${BASE}/retour`, { params })).data);
}

/** The payments already refreshed after their credit — once each per page load. */
const credited = new Set<string>();

/**
 * A payment just turned `approuve`: the wallet (never refetched on its own)
 * and the home's credits tile are reloaded on purpose.
 */
export async function apresCredit(queryClient: QueryClient, id: string): Promise<void> {
  if (credited.has(id)) return;
  credited.add(id);
  await queryClient.resetQueries({ queryKey: portefeuilleKey, exact: true });
  void queryClient.invalidateQueries({ queryKey: paiementsListeKey });
  await validateSession();
}

// ------------------------------------------------------------------- the list

/** « Tous » · « En cours » · « Payés » — comma-separated wire values. */
export const FILTRES = { tous: '', en_cours: 'en_attente,a_verifier', payes: 'approuve' } as const;
export type Filtre = keyof typeof FILTRES;

/** « Paiements en ligne », newest first; the same cursor paging as « Mouvements ». Never polled. */
export function usePaiements(filtre: Filtre) {
  return useInfiniteQuery({
    queryKey: [...paiementsListeKey, filtre],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) =>
      paiementsPageSchema.parse(
        (
          await apiClient.get(BASE, {
            params: { ...(FILTRES[filtre] ? { statut: FILTRES[filtre] } : {}), ...(pageParam ? { cursor: pageParam } : {}) },
          })
        ).data,
      ),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

// ------------------------------------------------------------------- receipts

/** « Télécharger PDF » — our receipt, saved under the server's name. */
export const telechargerRecu = (href: string, reference: string | null | undefined): Promise<void> =>
  downloadAuthedFile(apiUrl(href), `recu-${reference ?? 'paiement'}.pdf`);

/** The receipt route of a row that carries no `hrefs` (the list). */
export const recuHrefOf = (id: string): string => `/api/v1${BASE}/${encodeURIComponent(id)}/recu`;

/** « Envoyer par e-mail » — no body, no address: it goes to the caller's own verified e-mail. */
export async function envoyerRecu(href: string): Promise<string | null> {
  return recuEnvoyeSchema.parse((await apiClient.post(apiUrl(href))).data).message ?? null;
}

/** « Reçu de la banque » — a link fetched now and never stored: open it at once. */
export async function recuBanqueUrl(href: string): Promise<string> {
  return recuBanqueSchema.parse((await apiClient.get(apiUrl(href), { timeout: 30_000 })).data).url;
}
