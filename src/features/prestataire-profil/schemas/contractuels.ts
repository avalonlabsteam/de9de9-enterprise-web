import { z } from 'zod';

/**
 * « Recruter des pros de9de9 » — the company asks de9de9 for N pros of the
 * de9de9 app; an admin places them in its équipe as contractuels. The lists of
 * the form are read live from the de9de9 app: ids travel, never names.
 */

const text = z.string().nullish();

const serviceSchema = z.object({
  id: z.number(),
  name: z.string(),
  nameAr: text,
});

const categorieSchema = z.object({
  id: z.number(),
  name: z.string(),
  nameAr: text,
  /** The section the category is listed under (« Travaux », « Beauté »…). */
  groupe: text,
  groupeAr: text,
  /** de9de9 pros holding this category. */
  pros: z.number().nullish(),
  services: z.array(serviceSchema).default([]),
});
export type CategoriePros = z.infer<typeof categorieSchema>;

const wilayaSchema = z.object({
  id: z.number(),
  /** Printed before the name (« 16 · Alger »), never sent back. */
  code: z.union([z.number(), z.string()]).nullish(),
  name: z.string(),
  nameAr: text,
});

/** `GET /prestataire/contractuels/options` — the three lists, in one call. */
export const optionsSchema = z.object({
  categories: z.array(categorieSchema).default([]),
  wilayas: z.array(wilayaSchema).default([]),
});

/** `POST /prestataire/contractuels/demandes`. */
export interface DemandeProsInput {
  categoryId: number;
  serviceId?: number;
  wilayaId?: number;
  /** 1 to 50 — a number, not a string. */
  requestedCount: number;
  note?: string;
}

/** `submitted` · `in_progress` · `fulfilled` · `closed` · `cancelled` — a status this build does not know still prints its label. */
export const demandeProsSchema = z.object({
  id: z.string(),
  categoryLabel: text,
  subcategoryLabel: text,
  wilaya: text,
  commune: text,
  requestedCount: z.number(),
  fulfilledCount: z.number().default(0),
  note: text,
  status: z.string(),
  statusLabel: text,
  createdAt: text,
});
export type DemandePros = z.infer<typeof demandeProsSchema>;

/** de9de9 has not finished with it: these are the demandes still waited on. */
export const demandeOuverte = (d: DemandePros) => d.status === 'submitted' || d.status === 'in_progress';

/** What the form holds — the selects keep ids, as strings. */
export interface RecruterValeurs {
  categorie: string;
  service: string;
  wilaya: string;
  nombre: string;
  note: string;
}
export const RECRUTER_VIDE: RecruterValeurs = { categorie: '', service: '', wilaya: '', nombre: '', note: '' };

/** A pro de9de9 placed on the demande — also a contractuel of « Mon effectif ». */
const placementSchema = z.object({
  id: text,
  displayName: z.string(),
  phone: text,
  /** `active` · `released` */
  status: z.string().default('active'),
  placedAt: text,
});

/** `GET /prestataire/contractuels/demandes` — each demande with who was placed on it. */
export const suiviDemandesSchema = z.array(
  z.object({
    demande: demandeProsSchema,
    placements: z.array(placementSchema).default([]),
  }),
);
export type SuiviDemandePros = z.infer<typeof suiviDemandesSchema>[number];
