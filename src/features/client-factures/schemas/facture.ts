import { z } from 'zod';
import { actionSchema, toneTagSchema } from '@/lib/actions/schema';

/**
 * The client's « Factures » (guide 34 §6): `GET /client/factures` — the four
 * tabs with their counts and one page of cards — and `GET /client/factures/{id}`
 * — one invoice's screen, its buttons ready to press. Every label is the API's,
 * in French. The plain `GET /factures` is not read: it carries neither a title
 * nor the `version` an approval must send back.
 *
 * Fields are tolerant: an empty value arrives as a missing key (see
 * `stripNulls`), and what this build does not print is not listed.
 */

const text = z.string().nullish();

/** The tabs, in screen order — also the values of `statut`. */
export const ONGLETS = ['toutes', 'a_approuver', 'approuvees', 'contestees'] as const;
export const ongletSchema = z.enum(ONGLETS);
export type FactureOnglet = z.infer<typeof ongletSchema>;

/** « Occurrence 2 / 12 » on a recurring commande. */
const occurrenceSchema = z.object({ label: z.string() });

// ------------------------------------------------------------ the list

export const factureSchema = z.object({
  id: z.string(),
  /** « F-2019.2 » — what a client quotes to support. */
  reference: text,
  /** The client's own request title, else the catalogue service. */
  titre: z.string(),
  /** The category's emoji. */
  icone: text,
  /** « 18 000 DA ». */
  montantLabel: z.string(),
  /** The visit's day, « 18/06/2026 ». */
  dateLabel: text,
  /** a_approuver · contestee · confirmee */
  statut: z.string(),
  statutLabel: z.string(),
  /** bloques · deduits, with the pill's words — absent while the invoice waits: nothing has moved yet. */
  credits: z.object({ etat: text, label: z.string() }).nullish(),
  occurrence: occurrenceSchema.nullish(),
});
export type Facture = z.infer<typeof factureSchema>;

export const facturesPageSchema = z.object({
  /** Their counts ignore the selected tab. */
  onglets: z.array(z.object({ code: z.string(), label: z.string(), count: z.number().default(0) })).default([]),
  meta: z
    .object({ current_page: z.number().default(1), has_more_pages: z.boolean().default(false) })
    .default({ current_page: 1, has_more_pages: false }),
  data: z.array(factureSchema).default([]),
});

// ------------------------------------------------------------ one invoice

/** A file of the invoice — private: both addresses are fetched with the token, never linked. */
const fichierSchema = z.object({
  id: z.string(),
  nom: z.string(),
  /** « Facture » · « Pièce jointe » · « Preuve ». */
  roleLabel: text,
  /** pdf · image · document */
  type: text,
  tailleLabel: text,
  apercuHref: z.string(),
  telechargerHref: z.string(),
});
export type FactureFichier = z.infer<typeof fichierSchema>;

/** A « label · valeur » row: emetteur · date · credits_bloques · credits_deduits · statut. */
const ligneSchema = z.object({
  code: z.string(),
  label: z.string(),
  valeur: z.string(),
  ton: text,
  icone: text,
  /** The status chip, on the statut row only. */
  pastille: toneTagSchema.nullish(),
});

/** The contest in progress, or de9de9's ruling on the last one. */
const contestationSchema = z.object({
  titre: z.string(),
  motif: text,
  dateLabel: text,
  /** The frozen-credits sentence, or the ruling's text. */
  texte: z.string(),
  /** « La facture attend de nouveau votre approbation. » */
  note: text,
  icone: text,
  ton: text,
  /** The proofs the client attached. */
  preuves: z.array(fichierSchema).default([]),
});

export const factureEcranSchema = z.object({
  id: z.string(),
  /** « Facture — {card title} · {date} ». */
  enTete: z.object({ titre: z.string() }),
  document: z.object({
    emetteur: z.string(),
    /** « de9de9 · Alger ». */
    sousTitre: text,
    /** « Facture F-2019.2 ». */
    etiquette: z.string(),
    montantTitre: z.string().default('Montant'),
    montantLabel: z.string(),
    /** The sentence to print while the prestataire has not attached the invoice file. */
    aucunFichier: text,
  }),
  /** The invoice file first, then the prestataire's attachments. */
  fichiers: z.array(fichierSchema).default([]),
  lignes: z.array(ligneSchema).default([]),
  contestation: contestationSchema.nullish(),
  occurrence: occurrenceSchema.nullish(),
  /** `href` is the demande's screen (`/api/v1/client/demandes/{id}`), absent when there is none behind the commande. */
  commande: z.object({ label: z.string(), href: text }).nullish(),
  /** What « Partager » hands the share sheet; absent without an invoice file. */
  partage: z
    .object({ titre: text, texte: text, fichierHref: z.string(), nomFichier: z.string(), contentType: text })
    .nullish(),
  /** approuver · contester while it waits, then telecharger · partager when the file exists. */
  actions: z.array(actionSchema).default([]),
});
export type FactureEcran = z.infer<typeof factureEcranSchema>;
