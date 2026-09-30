import { apiClient } from '@/api/apiClient';
import {
  alertesPageSchema,
  compteursSchema,
  marquerToutesSchema,
  parseRows,
  type Alerte,
  type Categorie,
  type Compteurs,
} from '../schemas/alerte';
import { alertesActions, alertesGeneration, newestCreeLe, useAlertesStore, vueKey, type Vue } from '../stores/alertesStore';

/**
 * The company app's alerts: `/alertes`, no company id — the token's company
 * and side (common guide §3.1).
 */

const PAGE_SIZE = 25;
/** Rows that committed just after a later one still come back; ids dedupe the rest. */
const OVERLAP_MS = 120_000;

interface Page {
  rows: Alerte[];
  hasMore: boolean;
}

async function fetchAlertes(params: {
  nonLues?: boolean;
  categorie?: Categorie | null;
  depuis?: string;
  page?: number;
  pageSize?: number;
}): Promise<Page> {
  const { nonLues, categorie, depuis, page, pageSize } = params;
  const res = await apiClient.get('/alertes', {
    params: {
      ...(nonLues !== undefined ? { nonLues } : {}),
      ...(categorie ? { categorie } : {}),
      ...(depuis ? { depuis } : {}),
      ...(page ? { page } : {}),
      pageSize: pageSize ?? PAGE_SIZE,
    },
  });
  const body = alertesPageSchema.parse(res.data);
  return { rows: parseRows(body.data), hasMore: body.meta.has_more_pages };
}

export async function fetchCompteurs(): Promise<Compteurs> {
  return compteursSchema.parse((await apiClient.get('/alertes/compteurs')).data);
}

/** Idempotent; 404 when the alert is gone or belongs to the other side. */
export async function postLue(id: string): Promise<Compteurs> {
  return compteursSchema.parse((await apiClient.post(`/alertes/${encodeURIComponent(id)}/lue`)).data);
}

/** « Tout marquer comme lu » — the whole side, or one chip. No cap. */
export async function postLues(categorie: Categorie | null) {
  return marquerToutesSchema.parse((await apiClient.post('/alertes/lues', categorie ? { categorie } : {})).data);
}

let catchingUp: { gen: number; run: Promise<number> } | null = null;

/**
 * Read what was missed (common guide §5): at every start and every reconnect —
 * nothing is queued for an app that was away. The first load replaces the
 * list; later ones ask for what came after the newest row held. Resolves with
 * how many rows were new — the caller toasts once for all of them, never row
 * by row.
 */
export function catchUp(): Promise<number> {
  const gen = alertesGeneration();
  if (catchingUp?.gen === gen) return catchingUp.run;
  const run = runCatchUp(gen)
    .catch((error: unknown) => {
      if (import.meta.env.DEV) console.warn('[alertes] catch-up failed', error);
      return 0;
    })
    .finally(() => {
      if (catchingUp?.run === run) catchingUp = null;
    });
  catchingUp = { gen, run };
  return run;
}

async function runCatchUp(gen: number): Promise<number> {
  const stale = () => alertesGeneration() !== gen;
  let added = 0;
  const newest = newestCreeLe();
  if (!newest) {
    const first = await fetchAlertes({ page: 1 });
    if (stale()) return 0;
    alertesActions.replace(first.rows, first.hasMore);
  } else {
    const depuis = new Date(Date.parse(newest) - OVERLAP_MS).toISOString();
    const missed = await fetchAlertes({ depuis, pageSize: 200 });
    if (stale()) return 0;
    if (missed.hasMore) {
      // Away too long: start over from the first page.
      const first = await fetchAlertes({ page: 1 });
      if (stale()) return 0;
      alertesActions.replace(first.rows, first.hasMore);
    } else {
      added = missed.rows.filter((a) => alertesActions.add(a)).length;
    }
  }
  const compteurs = await fetchCompteurs();
  if (stale()) return 0;
  alertesActions.setCompteurs(compteurs);
  return added;
}

const loading = new Map<string, Promise<void>>();

/**
 * A page of the drawer's view: the first one (on opening, on a chip, when
 * another seat read something) or the next one (infinite scroll).
 */
export function loadVue(vue: Vue, which: 'first' | 'next'): Promise<void> {
  const key = vueKey(vue);
  const page = which === 'first' ? 1 : (useAlertesStore.getState().pages[key]?.page ?? 0) + 1;
  const inFlight = loading.get(`${key}#${page}`);
  if (inFlight) return inFlight;
  const gen = alertesGeneration();
  const run = fetchAlertes({
    nonLues: vue.onglet === 'non_lues' ? true : undefined,
    categorie: vue.categorie,
    page,
  })
    .then(({ rows, hasMore }) => {
      if (alertesGeneration() === gen) alertesActions.addPage(vue, rows, page, hasMore);
    })
    .finally(() => loading.delete(`${key}#${page}`));
  loading.set(`${key}#${page}`, run);
  return run;
}
