import { z } from 'zod';

/**
 * The company's own record — `GET /companies/{id}`, the same on both sides —
 * and what its admin seat may rewrite: `PUT /companies/{id}` replaces the whole
 * profile, so every field travels, the blank ones as null.
 */

const text = z.string().nullish();

export const entrepriseSchema = z.object({
  id: z.string(),
  legalName: z.string(),
  tradeName: text,
  rc: text,
  nif: text,
  nis: text,
  articleImposition: text,
  wilaya: text,
  commune: text,
  address: text,
  contactPhone: text,
  contactEmail: text,
  /** How many pros the company declared; absent when never given. */
  proCount: z.number().nullish(),
  isPrestataire: z.boolean().default(false),
});
export type Entreprise = z.infer<typeof entrepriseSchema>;

/** `GET /auth/me` — only the seat's role is read: `…Admin` may edit the company, `…Staff` reads it. */
export const moiSchema = z.object({ role: z.string().nullish() });

/** What the form holds — every input's text. */
export interface EntrepriseValeurs {
  legalName: string;
  tradeName: string;
  rc: string;
  nif: string;
  nis: string;
  articleImposition: string;
  wilaya: string;
  commune: string;
  address: string;
  contactPhone: string;
  contactEmail: string;
  proCount: string;
}
export type EntrepriseChamp = keyof EntrepriseValeurs;

/** The API's limits. The form holds to them: past one, the refusal comes back in English. */
export const ENTREPRISE_MAX = {
  legalName: 256,
  tradeName: 256,
  rc: 64,
  nif: 32,
  nis: 32,
  articleImposition: 128,
  wilaya: 128,
  commune: 128,
  address: 512,
  contactPhone: 32,
  contactEmail: 256,
  proCount: 10_000,
} as const;

export function valeursDe(e: Entreprise): EntrepriseValeurs {
  return {
    legalName: e.legalName,
    tradeName: e.tradeName ?? '',
    rc: e.rc ?? '',
    nif: e.nif ?? '',
    nis: e.nis ?? '',
    articleImposition: e.articleImposition ?? '',
    wilaya: e.wilaya ?? '',
    commune: e.commune ?? '',
    address: e.address ?? '',
    contactPhone: e.contactPhone ?? '',
    contactEmail: e.contactEmail ?? '',
    proCount: e.proCount != null ? String(e.proCount) : '',
  };
}

const ouNull = (value: string): string | null => value.trim() || null;

/** The body `PUT /companies/{id}` reads. */
export function entrepriseBody(v: EntrepriseValeurs) {
  return {
    legalName: v.legalName.trim(),
    tradeName: ouNull(v.tradeName),
    rc: ouNull(v.rc),
    nif: ouNull(v.nif),
    nis: ouNull(v.nis),
    articleImposition: ouNull(v.articleImposition),
    wilaya: ouNull(v.wilaya),
    commune: ouNull(v.commune),
    address: ouNull(v.address),
    contactPhone: ouNull(v.contactPhone),
    contactEmail: ouNull(v.contactEmail),
    // Left out, the API keeps the number it has: it is never erased, only replaced.
    proCount: v.proCount.trim() ? Number(v.proCount) : undefined,
  };
}
export type EntrepriseBody = ReturnType<typeof entrepriseBody>;
