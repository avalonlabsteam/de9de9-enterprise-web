import { z } from 'zod';

/**
 * `GET /client/calendrier?du=YYYY-MM-DD&au=YYYY-MM-DD` — the client's visits
 * over a range: a count per day (`jours`, for the month grid) and the visits
 * themselves (`evenements`). `tronque` says the list was cut short.
 */

export const calendrierJourSchema = z.object({
  date: z.string(),
  total: z.number().default(0),
  confirmees: z.number().default(0),
  realisees: z.number().default(0),
});
export type CalendrierJour = z.infer<typeof calendrierJourSchema>;

export const calendrierEvenementSchema = z.object({
  /** The visit. */
  id: z.string(),
  commandeId: z.string().nullish(),
  commandeReference: z.string().nullish(),
  titre: z.string(),
  service: z.string().nullish(),
  categorieCode: z.string().nullish(),
  categorie: z.string().nullish(),
  icone: z.string().nullish(),
  /** The provider's name. */
  prestataire: z.string().nullish(),
  /** When it starts (ISO); `date` is its day, in Algiers time. */
  debut: z.string().nullish(),
  date: z.string(),
  heureLabel: z.string().nullish(),
  jourLabel: z.string().nullish(),
  adresse: z.string().nullish(),
  statut: z.string().nullish(),
  statutLabel: z.string().nullish(),
  recurrent: z.boolean().default(false),
  occurrence: z
    .object({ numero: z.number().nullish(), total: z.number().nullish(), label: z.string().nullish() })
    .nullish(),
  equipe: z
    .array(z.object({ id: z.string().nullish(), nom: z.string(), initiales: z.string().nullish() }))
    .default([]),
});
export type CalendrierEvenement = z.infer<typeof calendrierEvenementSchema>;

export const calendrierSchema = z.object({
  du: z.string(),
  au: z.string(),
  jours: z.array(calendrierJourSchema).default([]),
  evenements: z.array(calendrierEvenementSchema).default([]),
  /** More visits than the answer holds: narrow the range to see them all. */
  tronque: z.boolean().default(false),
});
export type Calendrier = z.infer<typeof calendrierSchema>;
