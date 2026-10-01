import { z } from 'zod';

/**
 * Online payments (guide 17) — a client company buys credits with a CIB or
 * Edahabia card on SATIM's own page. The server asks the bank itself and
 * credits the wallet once: the app prints what it answers, and never reads a
 * result off a URL.
 */

const text = z.string().nullish();

/** `POST /client/portefeuille/paiements` — 200: where the card page is. */
export const paiementInitieSchema = z.object({
  paiementId: z.string(),
  reference: text,
  /** SATIM's page — opened in this same tab, never in a frame or a popup. */
  formUrl: z.string(),
  /** The card page can be paid until then. */
  expiresAt: z.string(),
});
export type PaiementInitie = z.infer<typeof paiementInitieSchema>;

/**
 * `ClientPaiementEnLigneDto` — the same from `/verification`, `/retour` and
 * `GET /paiements/{id}`. `statut`: initiation · en_attente · approuve · refuse ·
 * expire · echec_initiation · a_verifier.
 */
export const paiementSchema = z.object({
  id: z.string(),
  /** Our order number (« EL26000123 »). */
  reference: text,
  statut: z.string(),
  statutLabel: text,
  ton: text,
  /** Nothing will change by polling any more. */
  final: z.boolean().default(false),
  message: text,
  /** With cents on this screen: the form SATIM's success page asks for. */
  montantLabel: text,
  creditsLabel: text,
  payeur: z.object({ nom: text, email: text }).nullish(),
  /** Null until the gateway gave an order number. */
  satim: z
    .object({
      /** N° de transaction SATIM */
      orderId: text,
      /** N° de commande GuiddiniPay */
      orderNumber: text,
      /** N° d'autorisation */
      approvalCode: text,
      /** Never a full card number. */
      panMasque: text,
      /** GMT+1, ready to print. */
      dateHeure: text,
      moyen: text,
      messageBanque: text,
    })
    .nullish(),
  /** The SATIM page again — only while `en_attente` and still payable. */
  reprendreUrl: text,
  mouvementId: text,
  /** Host paths (`/api/v1/…`), only when `approuve`. `envoyerRecu` is null for de9de9 staff. */
  hrefs: z.object({ recu: text, recuApercu: text, recuBanque: text, envoyerRecu: text }).nullish(),
  numeroVertSatim: text,
  mentionNumeroVert: text,
  /** The bank did not answer this time — not an error: keep polling. */
  verificationEnCours: z.boolean().default(false),
});
export type Paiement = z.infer<typeof paiementSchema>;

/** One row of « Paiements en ligne ». */
export const paiementRowSchema = z.object({
  id: z.string(),
  reference: text,
  statut: z.string(),
  statutLabel: text,
  ton: text,
  /** Creation, GMT+1, ready to print. */
  dateLabel: text,
  montantLabel: text,
  creditsLabel: text,
  /** Every member of the company sees who paid. */
  payeurNom: text,
  final: z.boolean().default(false),
});
export type PaiementRow = z.infer<typeof paiementRowSchema>;

export const paiementsPageSchema = z.object({
  items: z.array(paiementRowSchema).default([]),
  nextCursor: text,
});

/** `POST …/recu/envoyer` — 202. */
export const recuEnvoyeSchema = z.object({ message: text });

/** `GET …/recu-banque` — fetched now, never stored: opened at once. */
export const recuBanqueSchema = z.object({ url: z.string() });
