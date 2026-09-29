import { z } from 'zod';

/**
 * `GET /client/demandes` — « Mes demandes » in one call: the six tabs with their
 * counts, and the cards of the selected tab with their pill and the line under
 * it already decided by the backend. The app only renders.
 */

export const VUES = [
  'tous',
  'action_requise',
  'facture_en_attente',
  'en_preparation',
  'terminees',
  'annulees',
] as const;
export const vueSchema = z.enum(VUES);
export type Vue = z.infer<typeof vueSchema>;

/** A tab: counts ignore the selected tab, so the bar reads the same on every tab. */
export const ongletSchema = z.object({
  code: z.string(),
  label: z.string(),
  count: z.number().default(0),
});
export type Onglet = z.infer<typeof ongletSchema>;

/**
 * The line under the pill. `ton` is a meaning (action · danger · attention ·
 * info · neutre · succes), mapped to the app's palette; `label` already has its
 * date filled in and is printed as is.
 */
export const demandeBadgeSchema = z.object({
  code: z.string(),
  label: z.string(),
  ton: z.string(),
  date: z.string().nullish(),
});
export type DemandeBadge = z.infer<typeof demandeBadgeSchema>;

export const demandeCardSchema = z.object({
  /** The demand (appel d'offres) — what the card opens when not contracted. */
  id: z.string(),
  titre: z.string(),
  service: z.string().nullish(),
  categorieCode: z.string().nullish(),
  categorie: z.string().nullish(),
  /** The category emoji, rendered as text. */
  icone: z.string().nullish(),
  recurrent: z.boolean().default(false),
  frequence: z.string().nullish(),
  frequenceLabel: z.string().nullish(),
  wilaya: z.string().nullish(),
  commune: z.string().nullish(),
  date: z.string().nullish(),
  /** The day the demand was made, already formatted (dd/mm/yyyy). */
  dateLabel: z.string().nullish(),
  creeLe: z.string().nullish(),
  dateSouhaitee: z.string().nullish(),
  /** en_attente · contacte · devis_en_cours · assigne · contractualise · annulee */
  statut: z.string(),
  statutLabel: z.string(),
  /** Grey the whole card; `badge` is then always null. */
  annulee: z.boolean().default(false),
  badge: demandeBadgeSchema.nullish(),
  /** The ball is with the client on this demand. */
  actionRequise: z.boolean().default(false),
  /** Set once contracted: the card then opens the commande. */
  commandeId: z.string().nullish(),
  commandeReference: z.string().nullish(),
});
export type DemandeCard = z.infer<typeof demandeCardSchema>;

export const pageMetaSchema = z.object({
  current_page: z.number(),
  per_page: z.number(),
  total: z.number(),
  total_pages: z.number(),
  has_more_pages: z.boolean(),
});

export const demandesPageSchema = z.object({
  onglets: z.array(ongletSchema).default([]),
  meta: pageMetaSchema,
  data: z.array(demandeCardSchema).default([]),
});
export type DemandesPage = z.infer<typeof demandesPageSchema>;
