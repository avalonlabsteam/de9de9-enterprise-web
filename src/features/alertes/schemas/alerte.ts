import { z } from 'zod';

/**
 * Real-time alerts (guide 11 / 11b / 11c) — one `Alerte` object, the same in
 * `GET /alertes` and in the hub's `alerte` event. The backend has written the
 * French title and sentence, picked the tone and icon, and built where a tap
 * goes for this side (`cible.chemin`). The app counts, words and routes nothing.
 */

/** The ten chips — always these, in this order. */
export const CATEGORIES = [
  'demandes',
  'commandes',
  'factures',
  'credits',
  'kyc',
  'equipe',
  'compte',
  'b2c',
  'avis',
  'autre',
] as const;
export type Categorie = (typeof CATEGORIES)[number];

const cibleSchema = z.object({
  /** `client` · `prestataire` — always the side the alert was read on. */
  app: z.string(),
  /** A screen code (`cli.facture`, `pro.mission`, `kyc`…); `aucun` = no navigation. */
  ecran: z.string().default('aucun'),
  params: z.record(z.string(), z.string()).default({}),
  /** The web path on that side, query encoded; null exactly when `ecran` is `aucun`. */
  chemin: z.string().nullish(),
});

export const alerteSchema = z.object({
  /** The dedupe key: the live push and a catch-up can deliver the same one twice. */
  id: z.string(),
  /** Stable event code (`facture.deposee`) — for extras only, never to word or route. */
  code: z.string().default(''),
  categorie: z.string().default('autre'),
  titre: z.string(),
  texte: z.string().nullish(),
  /** action · alerte · succes · info — a meaning, drawn in the app's palette. */
  ton: z.string().default('info'),
  icone: z.string().default('info'),
  /** UTC, ISO 8601 — the sort key and the catch-up cursor. */
  creeLe: z.string(),
  lu: z.boolean().default(false),
  luLe: z.string().nullish(),
  acteur: z
    .object({ type: z.string(), companyId: z.string().nullish(), nom: z.string().nullish() })
    .nullish(),
  cible: cibleSchema,
});
export type Alerte = z.infer<typeof alerteSchema>;

/** The bell's numbers — `GET /alertes/compteurs`, both mark-read answers, the hub's `compteurs`. */
export const compteursSchema = z.object({
  app: z.string(),
  /** The badge. Never counted locally. */
  nonLues: z.number().default(0),
  /** One count per chip; the sum is `nonLues`. */
  parCategorie: z.record(z.string(), z.number()).default({}),
  /** Only for a company holding both sides: what only the other side has unread. */
  autreCote: z.object({ app: z.string(), nonLues: z.number().default(0) }).nullish(),
});
export type Compteurs = z.infer<typeof compteursSchema>;

/** A page of `GET /alertes`, newest first. Rows are parsed one by one (see `parseRows`). */
export const alertesPageSchema = z.object({
  meta: z.object({ has_more_pages: z.boolean().default(false) }).default({ has_more_pages: false }),
  data: z.array(z.unknown()).default([]),
});

/** `POST /alertes/lues` — « Tout marquer comme lu ». */
export const marquerToutesSchema = z.object({
  marquees: z.number().default(0),
  compteurs: compteursSchema,
});

/** `session` — the session must end or change side. */
export const sessionEventSchema = z.object({
  raison: z.string(),
  message: z.string().nullish(),
});

/** One unreadable row must not take the whole bell down: it is dropped. */
export function parseRows(rows: unknown[]): Alerte[] {
  const out: Alerte[] = [];
  for (const row of rows) {
    const parsed = alerteSchema.safeParse(row);
    if (parsed.success) out.push(parsed.data);
    else if (import.meta.env.DEV) console.error('[alertes] unreadable row', parsed.error.issues);
  }
  return out;
}
