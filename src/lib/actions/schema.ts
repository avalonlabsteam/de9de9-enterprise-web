import { z } from 'zod';

/**
 * The button object every screen of the API carries (`ClientActionDto`), on the
 * client side (Suivi) and the prestataire side (missions, demandes de devis)
 * alike, with the pills, sheets and viewers around it. One algorithm presses
 * them all — see ./run.ts — never a per-code rule.
 *
 * `ton` is a meaning — attention · info · action · succes · valide · danger ·
 * neutre — mapped to the palette in src/lib/tones.ts. Fields are tolerant: an
 * unknown code draws neutrally rather than failing the screen.
 */

const text = z.string().nullish();

/** A label with its meaning — the pills, tags and the « À VOUS » ball. */
export const toneTagSchema = z.object({
  code: text,
  label: z.string(),
  ton: text,
});
export type ToneTag = z.infer<typeof toneTagSchema>;

/** A stepper rung: `fait` (ticked) · `en_cours` · `alerte` (current, red) · `a_venir` (grey). */
export const etapeSchema = z.object({
  code: text,
  label: z.string(),
  etat: z.string(),
});
export type Etape = z.infer<typeof etapeSchema>;

/** One field of a confirmation sheet; its value goes in the body under `code`. */
export const champSchema = z.object({
  code: z.string(),
  /** choix_unique · date_chips · note_etoiles · texte · date · montant_dzd · lecture_seule · fichier */
  type: z.string(),
  label: text,
  requis: z.boolean().default(false),
  options: z.array(z.object({ label: z.string(), valeur: z.unknown() })).default([]),
  placeholder: text,
  /** `montant_dzd`: the lowest amount · `texte`: the longest text · `fichier`: at most this many files (1 when null). */
  min: z.number().nullish(),
  max: z.number().nullish(),
  /** The prefilled value (the current amount, `yyyy-MM-dd`…) — for `lecture_seule`, the line to print. */
  valeur: z.unknown().optional(),
  /** The helper line under the field. */
  aide: text,
  /** `fichier`: the picker's button, accepted types and size cap per file. */
  bouton: text,
  accepte: text,
  maxOctets: z.number().nullish(),
});
export type Champ = z.infer<typeof champSchema>;

export const confirmSchema = z.object({
  icone: text,
  titre: z.string(),
  texte: text,
  champs: z.array(champSchema).default([]),
  boutonAnnuler: z.string().default('Revenir'),
  boutonConfirmer: z.string().default('Confirmer'),
  /** primaire · succes · danger */
  tonConfirmer: text,
});
export type Confirm = z.infer<typeof confirmSchema>;

/** The viewer's frame: title, facts and status chip around the file (or alone, for a motif). */
export const visionneuseSchema = z.object({
  titre: z.string(),
  lignes: z.array(z.object({ label: z.string(), valeur: z.string() })).default([]),
  aucunFichier: text,
  statut: toneTagSchema.nullish(),
});
export type Visionneuse = z.infer<typeof visionneuseSchema>;

export const actionSchema = z.object({
  code: z.string(),
  label: z.string(),
  /** primaire · succes · contour · neutre · danger · lien_danger · ajout */
  style: text,
  icone: text,
  /**
   * What the press opens instead of (or before) a call: formulaire_modifier ·
   * support · document · factures · motif · details_occurrence · intervenants ·
   * profil_ouvrier · mission.
   */
  ouvre: text,
  method: text,
  /** A full path from the host (`/api/v1/…`), not from the base URL. */
  href: text,
  contentType: text,
  corps: z.record(z.string(), z.unknown()).nullish(),
  /** `uuid_par_confirmation` → an `Idempotency-Key` per confirmed press. */
  idempotence: text,
  /**
   * How to read a 2xx: `demande` · `mission` · `demande_devis` → the answer
   * carries the new screen · `recharger` → GET the screen again.
   */
  reponse: text,
  confirm: confirmSchema.nullish(),
  /** Reused (English) routes: the French sentence per error code, `*` as fallback. */
  erreurs: z.record(z.string(), z.string()).nullish(),
  apercuHref: text,
  /** Set when the button is greyed out: the reason to print. */
  indisponible: text,
  visionneuse: visionneuseSchema.nullish(),
});
export type ApiAction = z.infer<typeof actionSchema>;

/** What « Contacter de9de9 » opens: one button per channel. */
export const supportSchema = z.object({
  titre: z.string(),
  texte: text,
  canaux: z
    .array(z.object({ code: text, label: z.string(), href: z.string(), principal: z.boolean().default(false) }))
    .default([]),
});
export type Support = z.infer<typeof supportSchema>;

/** The toast a 2xx may carry (« Facture envoyée ! »). */
export const messageSchema = z.object({ titre: z.string(), texte: text });

/** Any 2xx body that carries a message, screen or not. */
export const messageOnlySchema = z.object({ message: messageSchema.nullish() });
