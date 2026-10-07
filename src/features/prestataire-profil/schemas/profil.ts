import { z } from 'zod';

/**
 * « Contracter des personnes en situation de handicap » — the company sends a
 * request (`POST /handicap/inscription`); de9de9 calls back, then places people
 * on it. The company is read from the token: its id never travels.
 */

/** What the form holds — every input's text. */
export interface HandicapValeurs {
  contact: string;
  poste: string;
  zone: string;
  nombre: string;
  telephone: string;
  email: string;
  commentaire: string;
}
export const HANDICAP_VIDE: HandicapValeurs = {
  contact: '',
  poste: '',
  zone: '',
  nombre: '',
  telephone: '',
  email: '',
  commentaire: '',
};

/** The API's limits. The form holds to them: past one, the refusal comes back in English. */
export const HANDICAP_MAX = {
  contact: 160,
  poste: 160,
  zone: 96,
  nombre: 10_000,
  telephone: 32,
  email: 256,
  commentaire: 2000,
} as const;

/** The body `POST /handicap/inscription` reads — a blank optional input is left out. */
export function handicapBody(v: HandicapValeurs) {
  return {
    contactName: v.contact.trim(),
    jobType: v.poste.trim(),
    wilaya: v.zone.trim() || undefined,
    // A JSON number: "5" is refused. Left out, the API counts one position.
    positionsCount: v.nombre.trim() ? Number(v.nombre) : undefined,
    // Left out, de9de9 calls the number the company has on file.
    contactPhone: v.telephone.trim() || undefined,
    contactEmail: v.email.trim() || undefined,
    comment: v.commentaire.trim() || undefined,
  };
}
export type HandicapBody = ReturnType<typeof handicapBody>;

const text = z.string().nullish();

/** Someone de9de9 placed on a request: the name and the job, no phone — de9de9 makes the introduction. */
const personneSchema = z.object({
  fullName: z.string(),
  jobType: text,
  placedAt: text,
});

/** `a_contacter` · `contactee` · `en_cours` · `pourvue` — the API sends the code, the label is the app's. */
const maDemandeSchema = z.object({
  id: z.string(),
  jobType: z.string(),
  /** de9de9 can lower or raise it after a call. */
  positionsCount: z.number().default(1),
  wilaya: text,
  commune: text,
  comment: text,
  registeredAt: text,
  /** Those placed who still work there — the length of `personnes`. */
  placedCount: z.number().default(0),
  statut: z.string(),
  personnes: z.array(personneSchema).default([]),
});
export type MaDemandeHandicap = z.infer<typeof maDemandeSchema>;

/** `GET /handicap/inscription` — a bare array, newest first. */
export const mesDemandesSchema = z.array(maDemandeSchema);

/** Not every position is filled: these are the requests still waited on. */
export const demandeEnAttente = (d: MaDemandeHandicap) => d.statut !== 'pourvue';
