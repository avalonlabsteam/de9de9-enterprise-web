import axios from 'axios';
import { keepPreviousData, useInfiniteQuery, useQuery, type QueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@/api/apiClient';
import { apiUrl } from '@/api/hostUrl';
import { annonceKey, annoncesKey, annoncesListeKey, zonesB2cKey } from './keys';
import {
  annonceCarteSchema,
  annonceSchema,
  annoncesListeSchema,
  categorieB2cSchema,
  documentsReponseSchema,
  etapesRefusSchema,
  photosReponseSchema,
  referentielB2bSchema,
  referentielB2cSchema,
  soumissionSchema,
  zonesB2cSchema,
  type Annonce,
  type AnnonceAction,
  type AnnonceCarte,
  type EtapeRefus,
} from '../schemas/annonces';

/**
 * « Mes annonces » — token-scoped routes: no company id anywhere, the company
 * is the token's. One named route per action; every write carries the
 * annonce's `version`, and a stale one answers 409 `concurrency_conflict`.
 */

const BASE = '/prestataire/annonces';
const key = (id: string) => encodeURIComponent(id);

export { annonceKey, annoncesKey, annoncesListeKey, zonesB2cKey };

/** An answer the API gave is final: only a call that never landed is tried again. */
const retry = (count: number, error: unknown): boolean =>
  !(axios.isAxiosError(error) && error.response) && !(error instanceof z.ZodError) && count < 1;

// The annonces are a design the backend has not deployed yet: the screens fall back on what exists.
export { isRouteAbsente } from '@/api/problem';

/** The blocks a refusal names — 422 `annonce_incomplete` carries them beside the problem. */
export function etapesOf(error: unknown): EtapeRefus[] {
  if (!axios.isAxiosError(error)) return [];
  const parsed = etapesRefusSchema.safeParse((error.response?.data as { etapes?: unknown } | undefined)?.etapes);
  return parsed.success ? parsed.data : [];
}

// ----------------------------------------------------------------- the list

export interface ListeFiltre {
  /** `b2c` · `b2b` · null = « Toutes » */
  type: string | null;
  /** A status chip · null = every status but « Archivées » */
  statut: string | null;
}

async function fetchListe({ type, statut }: ListeFiltre, page: number) {
  const data = annoncesListeSchema.parse(
    (
      await apiClient.get(BASE, {
        params: { ...(type ? { type } : {}), ...(statut ? { statut } : {}), page, pageSize: 20 },
      })
    ).data,
  );
  const annonces: AnnonceCarte[] = [];
  for (const row of data.annonces) {
    const parsed = annonceCarteSchema.safeParse(row);
    if (parsed.success) annonces.push(parsed.data);
    else if (import.meta.env.DEV) console.error('[annonces] unreadable card', parsed.error.issues);
  }
  return { ...data, annonces };
}

/** The list screen: pills, chips, banners and cards — everything the backend built for this kind and status. */
export function useAnnonces(filtre: ListeFiltre) {
  return useInfiniteQuery({
    queryKey: [...annoncesListeKey, filtre.type ?? '', filtre.statut ?? ''],
    initialPageParam: 1,
    // Another pill or chip: the cards on screen stay (dimmed) until the next ones arrive.
    placeholderData: keepPreviousData,
    queryFn: ({ pageParam }) => fetchListe(filtre, pageParam),
    getNextPageParam: (last) => (last.page * last.pageSize < last.total ? last.page + 1 : undefined),
    retry,
    refetchOnWindowFocus: true,
  });
}

// --------------------------------------------------------------- one annonce

export async function fetchAnnonce(id: string): Promise<Annonce> {
  return annonceSchema.parse((await apiClient.get(`${BASE}/${key(id)}`)).data);
}

export function useAnnonce(id: string | undefined) {
  return useQuery({
    queryKey: annonceKey(id ?? ''),
    enabled: !!id,
    queryFn: () => fetchAnnonce(id ?? ''),
    retry,
  });
}

/** After an answer that is the annonce: it replaces the one held; the list's counts move. */
export function annonceRecue(queryClient: QueryClient, annonce: Annonce): void {
  queryClient.setQueryData(annonceKey(annonce.id), annonce);
  void queryClient.invalidateQueries({ queryKey: annoncesListeKey });
}

// ------------------------------------------------------------------- B2B

export interface ZoneInput {
  wilayaCode: number;
  /** null = the whole wilaya. */
  communeCode: number | null;
}

/** `POST` / `PUT /prestataire/annonces/b2b` — a full replacement: a member left out is cleared. */
export interface CorpsB2b {
  titre: string;
  categoryCode: string;
  sousCategories: string[];
  zones: ZoneInput[];
  tarif: { mode: string; minDzd: number | null; maxDzd: number | null; unite: string | null };
  delaiDemarrageJours: number | null;
  capacite: string | null;
  references: string | null;
  certifications: string[];
  description: string | null;
  /**
   * The whole object, `null` for an empty input: it replaces every link. Left
   * out, nothing changes — so it is not sent when the form has no link inputs.
   */
  liensSociaux?: Record<string, string | null>;
}

export function useReferentielB2b() {
  return useQuery({
    queryKey: [...annoncesKey, 'b2b', 'referentiel'],
    queryFn: async () => referentielB2bSchema.parse((await apiClient.get(`${BASE}/b2b/referentiel`)).data),
    retry,
  });
}

/** The first save creates the draft (201); the later ones replace it, with the version read. */
export async function enregistrerB2b(corps: CorpsB2b, existante: { id: string; version: number } | null): Promise<Annonce> {
  const res = existante
    ? await apiClient.put(`${BASE}/b2b/${key(existante.id)}`, { ...corps, version: existante.version })
    : await apiClient.post(`${BASE}/b2b`, corps);
  return annonceSchema.parse(res.data);
}

// ------------------------------------------------------------------- B2C

export interface LigneB2c {
  legacyCategoryServiceId?: number | null;
  legacyServiceTaskId?: number | null;
  /** A free line: stored and shown on the annonce, never in the app's search. */
  libelleLibre?: string;
  prixDzd: number;
  /** null = the annonce's default unit. */
  unite: number | null;
}

/** `PUT /prestataire/annonces/b2c/{id}` — the category is locked and is not in the body; zones and photos have their own routes. */
export interface CorpsB2c {
  uniteDefaut: number | null;
  remise: number;
  lignes: LigneB2c[];
  reponseIds: string[];
  /** Only the available ranges; 0 = dimanche … 6 = samedi; `"HH:mm"`, whole hours. */
  disponibilites: { jour: number; debut: string; fin: string }[];
  description: string | null;
}

export function useReferentielB2c() {
  return useQuery({
    queryKey: [...annoncesKey, 'b2c', 'referentiel'],
    queryFn: async () => referentielB2cSchema.parse((await apiClient.get(`${BASE}/b2c/referentiel`)).data),
    retry,
  });
}

export function useCategorieB2c(legacyCategoryId: number | null | undefined) {
  return useQuery({
    queryKey: [...annoncesKey, 'b2c', 'categorie', legacyCategoryId ?? 0],
    enabled: legacyCategoryId != null,
    queryFn: async () =>
      categorieB2cSchema.parse((await apiClient.get(`${BASE}/b2c/referentiel/categories/${legacyCategoryId ?? 0}`)).data),
    retry,
  });
}

/** The draft is born when the category is chosen — the one member required, locked afterwards. */
export async function creerB2c(legacyCategoryId: number): Promise<Annonce> {
  return annonceSchema.parse((await apiClient.post(`${BASE}/b2c`, { legacyCategoryId })).data);
}

export async function remplacerB2c(id: string, version: number, corps: CorpsB2c): Promise<Annonce> {
  return annonceSchema.parse((await apiClient.put(`${BASE}/b2c/${key(id)}`, { ...corps, version })).data);
}

export function useZonesB2c(enabled: boolean) {
  return useQuery({
    queryKey: zonesB2cKey,
    enabled,
    queryFn: async () => zonesB2cSchema.parse((await apiClient.get(`${BASE}/b2c/zones`)).data),
    retry,
  });
}

/** The whole list, with the zones' OWN version — two seats may edit it at once. */
export async function remplacerZonesB2c(version: number, zones: ZoneInput[]) {
  return zonesB2cSchema.parse(
    (
      await apiClient.put(`${BASE}/b2c/zones`, {
        version,
        // `communeCode` absent = the whole wilaya.
        zones: zones.map((z) => (z.communeCode === null ? { wilayaCode: z.wilayaCode } : z)),
      })
    ).data,
  );
}

// ---------------------------------------------------------------- photos

/** Several files in one request: the client's 15 s would cut a slow uplink off. */
const UPLOAD_TIMEOUT_MS = 5 * 60_000;

export async function ajouterPhotos(id: string, version: number, files: File[]) {
  const form = new FormData();
  form.append('version', String(version));
  for (const file of files) form.append('files', file);
  return photosReponseSchema.parse(
    (await apiClient.post(`${BASE}/${key(id)}/photos`, form, { timeout: UPLOAD_TIMEOUT_MS })).data,
  );
}

/** The first id is the cover. */
export async function ordonnerPhotos(id: string, version: number, photoIds: string[]) {
  return photosReponseSchema.parse((await apiClient.put(`${BASE}/${key(id)}/photos/ordre`, { version, photoIds })).data);
}

export async function supprimerPhoto(id: string, photoId: string, version: number) {
  return photosReponseSchema.parse(
    (await apiClient.delete(`${BASE}/${key(id)}/photos/${key(photoId)}`, { params: { version } })).data,
  );
}

// ------------------------------------------------------------- documents

/** PDFs of a B2B annonce: the same multipart as the photos, and the same `version`. */
export async function ajouterDocuments(id: string, version: number, files: File[]) {
  const form = new FormData();
  form.append('version', String(version));
  for (const file of files) form.append('files', file);
  return documentsReponseSchema.parse(
    (await apiClient.post(`${BASE}/${key(id)}/documents`, form, { timeout: UPLOAD_TIMEOUT_MS })).data,
  );
}

export async function supprimerDocument(id: string, documentId: string, version: number) {
  return documentsReponseSchema.parse(
    (await apiClient.delete(`${BASE}/${key(id)}/documents/${key(documentId)}`, { params: { version } })).data,
  );
}

// ----------------------------------------------------------- transitions

/** « Soumettre à de9de9 » / « Publier »: to the review — or straight online when de9de9 switched the review off. */
export async function soumettre(id: string, version: number) {
  return soumissionSchema.parse((await apiClient.post(`${BASE}/${key(id)}/soumettre`, { version })).data);
}

export type ResultatAction =
  | { kind: 'annonce'; annonce: Annonce }
  | { kind: 'soumise'; annonce: Annonce; confirmation: z.infer<typeof soumissionSchema>['confirmation'] }
  | { kind: 'copie'; annonce: Annonce }
  | { kind: 'supprimee' };

/**
 * One button of `actions[]`, sent as the backend described it. « Supprimer »
 * is a DELETE with the version in the query (204); « Dupliquer » has no body
 * and answers the new draft (201); « Soumettre » answers the annonce and its
 * confirmation; every other one answers the annonce.
 */
export async function executerAction(action: AnnonceAction, version: number): Promise<ResultatAction> {
  const url = apiUrl(action.href ?? '');
  if ((action.method ?? 'POST').toUpperCase() === 'DELETE') {
    await apiClient.delete(url, { params: { version } });
    return { kind: 'supprimee' };
  }
  if (action.code === 'dupliquer') {
    return { kind: 'copie', annonce: annonceSchema.parse((await apiClient.post(url)).data) };
  }
  const { data } = await apiClient.post<unknown>(url, { version });
  if (action.code === 'soumettre') {
    const { annonce, confirmation } = soumissionSchema.parse(data);
    return { kind: 'soumise', annonce, confirmation };
  }
  return { kind: 'annonce', annonce: annonceSchema.parse(data) };
}
