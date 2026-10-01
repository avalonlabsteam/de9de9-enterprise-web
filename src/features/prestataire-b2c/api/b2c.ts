import { keepPreviousData, useInfiniteQuery, useQuery, type QueryClient } from '@tanstack/react-query';
import type { z } from 'zod';
import {
  badgeCountsSchema,
  clientPostSchema,
  exploreTaskSchema,
  historiqueSchema,
  jobDetailsSchema,
  legacyPageSchema,
  myCategoriesSchema,
  myOfferSchema,
  myZonesSchema,
  solicitationSchema,
  type JobDetails,
  type LegacyPage,
} from '../schemas/b2c';
import type { JobAction } from '../lib/jobs';
import { legacyGet, legacyPatch, legacyPost, LegacyRefusal, parsePage } from './legacy';
import { B2cSessionRefused } from './session';

/**
 * « B2C · Particuliers » reads and writes the de9de9 app itself, as the pro
 * the company is there (guides 16a / 16b). Every key sits under `['b2c', …]`,
 * so a logout's `queryClient.clear()` drops them all.
 */

const PRO = '/api/v1/ProfessionalRepository';
/** Always ≥ 1 for both: 0 is a 500 with no body on the de9de9 app. */
const LIMIT = 20;

export const b2cKeys = {
  recues: ['b2c', 'recues'] as const,
  confirmes: ['b2c', 'confirmes'] as const,
  historique: ['b2c', 'historique'] as const,
  job: (id: string) => ['b2c', 'job', id] as const,
  counts: ['b2c', 'counts'] as const,
  categories: ['b2c', 'categories'] as const,
  zones: ['b2c', 'zones'] as const,
  explore: (filters: ExploreFilters) => ['b2c', 'explore', filters] as const,
  post: (id: string) => ['b2c', 'post', id] as const,
  offers: ['b2c', 'offers'] as const,
};

/**
 * Seats share one account and a web-only company gets no live event for a new
 * booking (blocker B15): an open tab polls every minute and on window focus.
 */
const LIVE = { refetchInterval: 60_000, refetchOnWindowFocus: true, staleTime: 15_000 } as const;

/** A refusal is an answer, not a failure to retry. */
const retry = (count: number, error: unknown): boolean =>
  !(error instanceof LegacyRefusal) && !(error instanceof B2cSessionRefused) && count < 1;

function pagedQuery<T>(url: string, params: Record<string, unknown>, row: z.ZodType<T>) {
  return {
    initialPageParam: 1,
    queryFn: async ({ pageParam }: { pageParam: number }): Promise<LegacyPage<T>> =>
      parsePage(await legacyGet(url, { ...params, page: pageParam, limit: LIMIT }), row),
    getNextPageParam: (last: LegacyPage<T>) => (last.hasMore ? last.page + 1 : undefined),
    retry,
  };
}

/** « Commandes reçues » — the bookings still new or under negotiation, newest first. */
export function useSolicitations() {
  return useInfiniteQuery({
    queryKey: b2cKeys.recues,
    ...pagedQuery(`${PRO}/solicitations`, { statuses: [0] }, solicitationSchema),
    ...LIVE,
  });
}

/**
 * « Services confirmés » (`status=2`) and the history (`5`, `6`, `7`):
 * bookings and accepted offers merged by the server, each row tagged `type`.
 * `status` is always sent — without it every status comes back.
 */
export function useHistorique(view: 'confirmes' | 'historique') {
  return useInfiniteQuery({
    queryKey: b2cKeys[view],
    ...pagedQuery('/api/v1/User/my-historique', { status: view === 'confirmes' ? [2] : [5, 6, 7] }, historiqueSchema),
    ...LIVE,
  });
}

export async function fetchJob(id: string): Promise<JobDetails> {
  return jobDetailsSchema.parse(await legacyGet(`${PRO}/${encodeURIComponent(id)}/job-details`));
}

/** One booking or one offer — the id is tried as a booking first. */
export function useJobDetails(id: string | null) {
  return useQuery({
    queryKey: b2cKeys.job(id ?? ''),
    enabled: !!id,
    queryFn: () => fetchJob(id ?? ''),
    retry,
    refetchOnWindowFocus: true,
  });
}

export interface TabCounts {
  recues: number | null;
  confirmes: number | null;
  /** The company's pending offers (`badge-counts.opport`). */
  offres: number | null;
}

async function total(url: string, params: Record<string, unknown>): Promise<number | null> {
  try {
    // The de9de9 badge misses the consumer's counter-proposals (blocker B28): count the list itself.
    return legacyPageSchema.parse(await legacyGet(url, { ...params, page: 1, limit: 1 })).meta.total;
  } catch {
    return null;
  }
}

/** The tab counters. Each is null when its call failed — printed as nothing, never as 0. */
export function useTabCounts(enabled: boolean) {
  return useQuery({
    queryKey: b2cKeys.counts,
    enabled,
    queryFn: async (): Promise<TabCounts> => {
      const [recues, confirmes, badges] = await Promise.all([
        total(`${PRO}/solicitations`, { statuses: [0] }),
        total('/api/v1/User/my-historique', { status: [2] }),
        legacyGet('/api/v1/User/badge-counts').then(
          (data) => badgeCountsSchema.parse(data).opport,
          () => null,
        ),
      ]);
      return { recues, confirmes, offres: badges };
    },
    retry,
    ...LIVE,
  });
}

/** The chips of « Voir les offres » — once per session. */
export function useMyCategories() {
  return useQuery({
    queryKey: b2cKeys.categories,
    queryFn: async () => myCategoriesSchema.parse(await legacyGet(`${PRO}/my-categories`)).categories,
    staleTime: Infinity,
    retry,
  });
}

/** One chip per wilaya: the explore filter takes wilaya ids only. */
export function useMyZones() {
  return useQuery({
    queryKey: b2cKeys.zones,
    queryFn: async () => {
      const { zones } = myZonesSchema.parse(await legacyGet(`${PRO}/my-zones`));
      const byWilaya = new Map<number, string>();
      for (const z of zones) if (!byWilaya.has(z.wilayaId)) byWilaya.set(z.wilayaId, z.wilayaName);
      return [...byWilaya].map(([wilayaId, wilayaName]) => ({ wilayaId, wilayaName }));
    },
    staleTime: Infinity,
    retry,
  });
}

export interface ExploreFilters {
  categoryIds: number[];
  wilayaIds: number[];
  searchWord: string;
}

/**
 * « Voir les offres » — the consumers' open posts in the company's categories
 * and zones. Search and chips filter on the server; the previous result stays
 * on screen while the next one loads.
 */
export function useExploreTasks(filters: ExploreFilters, enabled: boolean) {
  const { categoryIds, wilayaIds, searchWord } = filters;
  return useInfiniteQuery({
    queryKey: b2cKeys.explore(filters),
    enabled,
    placeholderData: keepPreviousData,
    ...pagedQuery(
      `${PRO}/explore-tasks`,
      { categoryIds, wilayaIds, ...(searchWord ? { searchWord } : {}) },
      exploreTaskSchema,
    ),
    ...LIVE,
  });
}

/** One post, and the company's own offer on it. A post that is gone answers a refusal. */
export function useClientPost(id: string | null) {
  return useQuery({
    queryKey: b2cKeys.post(id ?? ''),
    enabled: !!id,
    queryFn: async () => clientPostSchema.parse(await legacyGet(`${PRO}/client-post/${encodeURIComponent(id ?? '')}`)),
    retry,
  });
}

/** « Offres envoyées » — every offer, whatever its outcome, newest first. */
export function useMyOffers() {
  return useInfiniteQuery({
    queryKey: b2cKeys.offers,
    ...pagedQuery(`${PRO}/my-offers`, {}, myOfferSchema),
    ...LIVE,
  });
}

/** `POST …/apply-to-client`. `description` is always a string: null is a 500 there (blocker B19). */
export function applyToPost(body: {
  clientPostId: string;
  price: number;
  dueDate: string;
  dueTime: string;
  description: string;
}): Promise<unknown> {
  // Cash, always: the price is settled offline between the particulier and the company.
  return legacyPost(`${PRO}/apply-to-client`, { ...body, paymentMethod: 0 });
}

/**
 * One press on a job. Bookings go through `ProfessionalOrders`, offers through
 * `ClientPosts`; cancel and terminate take either id and find out themselves.
 */
export function sendJobAction(id: string, type: string, action: JobAction, body?: unknown): Promise<unknown> {
  const key = encodeURIComponent(id);
  const offer = type === 'offer';
  switch (action) {
    case 'accept':
      return legacyPost(`/api/v1/ProfessionalOrders/${key}/pro-accept-orders`);
    case 'decline':
      return legacyPost(`/api/v1/ProfessionalOrders/${key}/pro-decline-order`);
    case 'acceptModification':
      return legacyPost(`/api/v1/${offer ? 'ClientPosts' : 'ProfessionalOrders'}/${key}/accept-modification`);
    case 'modify':
      return legacyPatch(`/api/v1/${offer ? 'ClientPosts' : 'ProfessionalOrders'}/${key}/pro-modify`, body);
    case 'cancel':
      return legacyPost(`/api/v1/cancel/${key}/pro`);
    case 'terminate':
      return legacyPost(`/api/v1/services/${key}/terminate-pro`);
  }
}

/**
 * After any answer, success or refusal: every list, the open detail and the
 * counters — another seat may have acted. The chips never change mid-session.
 */
export function refreshB2c(queryClient: QueryClient, opts: { explore?: boolean } = {}): void {
  void queryClient.invalidateQueries({
    queryKey: ['b2c'],
    predicate: (q) => {
      const part = q.queryKey[1];
      if (part === 'categories' || part === 'zones') return false;
      return opts.explore !== false || part !== 'explore';
    },
  });
}
