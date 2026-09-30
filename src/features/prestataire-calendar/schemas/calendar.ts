import { z } from 'zod';

/**
 * `GET /prestataire/calendrier?du&au&source&salarieId` (guide 14) — the
 * company's B2B visits and B2C bookings over a window, every label ready to
 * print. `jours` counts the days that have events; `sources` counts follow the
 * salarié filter but not the source one; `salaries` is the whole roster.
 */

const text = z.string().nullish();

export const personneSchema = z.object({
  id: z.string(),
  nom: z.string(),
  initiales: text,
  couleur: text,
});
export type Personne = z.infer<typeof personneSchema>;

export const evenementSchema = z.object({
  /** The visit (b2b) or the booking (b2c). */
  id: z.string(),
  source: z.string(),
  sourceLabel: text,
  titre: z.string(),
  service: text,
  /** b2b: the client company · b2c: the particulier's first name only. */
  client: text,
  icone: text,
  debut: text,
  fin: text,
  /** Its Algiers day — the cell it sits in. */
  date: z.string(),
  heureLabel: text,
  heureFinLabel: text,
  jourLabel: text,
  lieu: text,
  adresse: text,
  /** a_venir · a_affecter · confirmee · realisee — this screen's own codes. */
  statut: text,
  statutLabel: text,
  ton: text,
  equipe: z.array(personneSchema).default([]),
  /** The first crew member's colour, else the source colour. */
  couleur: text,
  missionId: text,
  occurrenceId: text,
  reservationId: text,
});
export type Evenement = z.infer<typeof evenementSchema>;

export const calendrierSchema = z.object({
  du: z.string(),
  au: z.string(),
  source: text,
  sources: z.array(z.object({ code: z.string(), label: z.string(), count: z.number().default(0) })).default([]),
  salaries: z.array(personneSchema).default([]),
  jours: z
    .array(
      z.object({
        date: z.string(),
        total: z.number().default(0),
        b2b: z.number().default(0),
        b2c: z.number().default(0),
      }),
    )
    .default([]),
  evenements: z.array(evenementSchema).default([]),
  /** Past 500 events: only the first ones came — ask a smaller window. */
  tronque: z.boolean().default(false),
});
export type Calendrier = z.infer<typeof calendrierSchema>;
