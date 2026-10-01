import { z } from 'zod';

/**
 * « Portefeuille » (client side) — read-only. Every label, sign, unit, DA
 * amount, date and tone arrives ready to print: the app never computes a
 * figure, never picks a sign or a colour from `credits`, never formats a date.
 * The thousands separator on the wire is U+202F; labels are printed as they are.
 */

const text = z.string().nullish();

/** `{ label, ouvre, href }` — `ouvre`: factures · facture · demande. `href` is a host path. */
export const lienSchema = z.object({ label: z.string(), ouvre: text, href: text });
export type Lien = z.infer<typeof lienSchema>;

/** A « Solde » / « Bloqués » tile of the card. */
export const tuileSchema = z.object({
  label: z.string(),
  icone: text,
  credits: z.number().default(0),
  valeurLabel: z.string(),
  ton: text,
  /** The helper line (« gelés par une facture contestée »). */
  aide: text,
  /** false → dim the tile. */
  actif: z.boolean().default(true),
  /** null → not tappable. */
  lien: lienSchema.nullish(),
});
export type Tuile = z.infer<typeof tuileSchema>;

export const canalSchema = z.object({
  code: text,
  label: z.string(),
  href: z.string(),
  principal: z.boolean().default(false),
});

/**
 * « Payer en ligne » (guide 17) — the CIB / Edahabia block of the sheet. Null
 * while the feature is off, for de9de9 staff, and for a company outside the
 * pilot list: the app draws the block when it is set, and decides nothing.
 */
export const enLigneSchema = z.object({
  titre: z.string(),
  texte: text,
  /** Whole dinars, both included. */
  minDzd: z.number(),
  maxDzd: z.number(),
  creditsParDzd: z.number().default(10),
  montantsSuggeres: z.array(z.object({ dzd: z.number(), label: z.string(), creditsLabel: text })).default([]),
  /** « Payé par : Nadia Benali » — the token's member, never an input. */
  payeurLabel: text,
  conditionsLabel: text,
  conditionsUrl: text,
  /** `cib` · `edahabia` */
  logos: z.array(z.string()).default([]),
  mentionNumeroVert: text,
  mentionInteroperabilite: text,
  action: z.object({ label: z.string().default('Payer'), icone: text }).default({ label: 'Payer' }),
});
export type EnLigne = z.infer<typeof enLigneSchema>;

/** « Recharger mes crédits » — drawn from the same answer; only « Payer en ligne » sends anything. */
export const feuilleRechargeSchema = z.object({
  titre: z.string(),
  sousTitre: text,
  info: text,
  canaux: z.array(canalSchema).default([]),
  virement: z.object({ icone: text, titre: z.string(), texte: text }).nullish(),
  // Additive: a block the app cannot read must not take the wallet down — the sheet is then today's sheet.
  enLigne: enLigneSchema.nullish().catch(undefined),
  /** The separator above the channels — only with `enLigne`. */
  autresMoyensTitre: text,
});
export type FeuilleRecharge = z.infer<typeof feuilleRechargeSchema>;

/** One « Mouvements » row. */
export const mouvementRowSchema = z.object({
  id: z.string(),
  /** recharge · debit · blocage · deblocage · ajustement */
  type: text,
  icone: text,
  ton: text,
  titre: z.string(),
  /** ISO — for sorting / accessibility only; print `dateLabel`. */
  date: text,
  dateLabel: z.string(),
  /** The ledger's signed value — never pick a sign or a colour from it. */
  montantCredits: z.number().nullish(),
  montantLabel: z.string(),
  href: text,
});
export type MouvementRow = z.infer<typeof mouvementRowSchema>;

/** A page of rows: `nextCursor` null on the last page; `count` is this page's rows. */
export const mouvementsPageSchema = z.object({
  items: z.array(mouvementRowSchema).default([]),
  nextCursor: text,
  count: z.number().nullish(),
});

export const portefeuilleSchema = z.object({
  carte: z.object({
    titre: z.string(),
    disponiblesCredits: z.number().nullish(),
    disponiblesDzd: z.number().nullish(),
    /** The big figure — can be negative (frozen credits above the balance). */
    disponiblesLabel: z.string(),
    disponiblesTon: text,
    solde: tuileSchema,
    bloques: tuileSchema,
    taux: text,
  }),
  /** The red banner — null → no banner. */
  alerte: z.object({ code: text, texte: z.string(), ton: text, icone: text }).nullish(),
  /** « ＋ Recharger » — opens the sheet, calls nothing. */
  recharger: z.object({ code: text, label: z.string(), style: text, icone: text, ouvre: text }).nullish(),
  feuilleRecharge: feuilleRechargeSchema.nullish(),
  /** The ℹ️ line above « Mouvements ». */
  info: text,
  mouvements: mouvementsPageSchema.extend({
    titre: z.string().default('Mouvements'),
    vide: text,
  }),
  /** The amber banner: an online payment still payable (`en_attente`) or under review (`a_verifier`). */
  paiementEnCours: z
    .object({ paiementId: z.string(), reference: text, statut: text, texte: z.string() })
    .nullish()
    .catch(undefined),
});
export type Portefeuille = z.infer<typeof portefeuilleSchema>;

// ------------------------------------------------------------ « Détail du mouvement »

/** A « label · valeur » row: `ton` colours the value, `lien` adds a pill. */
export const ligneSchema = z.object({
  code: text,
  label: z.string(),
  valeur: z.string(),
  ton: text,
  lien: lienSchema.nullish(),
});
export type Ligne = z.infer<typeof ligneSchema>;

const soldeLigneSchema = z.object({
  label: z.string(),
  credits: z.number().nullish(),
  creditsLabel: z.string(),
  dzdLabel: text,
  ton: text,
});

/** A document card: opens the viewer; files need the token (never a bare link). */
export const fichierSchema = z.object({
  documentId: text,
  titre: z.string(),
  sousTitre: text,
  nomFichier: text,
  /** pdf · image · document — picks the thumbnail. */
  type: text,
  contentType: text,
  tailleLabel: text,
  actionLabel: text,
  apercuHref: text,
  telechargerHref: text,
  visionneuse: z.object({ titre: z.string(), lignes: z.array(ligneSchema).default([]) }).nullish(),
});
export type Fichier = z.infer<typeof fichierSchema>;

export const mouvementDetailSchema = z.object({
  id: z.string(),
  type: text,
  badge: z.object({ code: text, label: z.string(), ton: text }).nullish(),
  montant: z.object({ credits: z.number().nullish(), label: z.string(), dzdLabel: text, ton: text }),
  date: text,
  reference: text,
  enTete: z.array(ligneSchema).default([]),
  /** `solde` → the balance moved · `bloques` → only the frozen total did. */
  solde: z
    .object({ mode: text, avant: soldeLigneSchema, apres: soldeLigneSchema, note: text })
    .nullish(),
  details: z.array(ligneSchema).default([]),
  sections: z
    .array(
      z.object({
        code: text,
        titre: z.string(),
        fichier: fichierSchema.nullish(),
        /** Printed in place of the card when there is no file. */
        vide: text,
        lien: lienSchema.nullish(),
      }),
    )
    .default([]),
  note: text,
});
export type MouvementDetail = z.infer<typeof mouvementDetailSchema>;
