import { z } from 'zod';

/**
 * `GET /client/demandes/{id}` — « Suivi d'une demande », from « En attente » to the
 * last invoice of the commande it became. The backend decides every state,
 * label, colour and button; the app only draws what it receives.
 *
 * `ton` (and `balle.ton`, `statut.ton`) is a meaning — attention · info ·
 * action · succes · valide · danger · neutre — mapped to the palette in
 * src/lib/tones.ts. Fields are tolerant: an unknown code draws neutrally
 * rather than failing the screen.
 */

const text = z.string().nullish();

/** A label with its meaning — the pills, tags and the « À VOUS » ball. */
export const toneTagSchema = z.object({
  code: text,
  label: z.string(),
  ton: text,
});
export type ToneTag = z.infer<typeof toneTagSchema>;

/** A stepper rung: `fait` (ticked) · `en_cours` · `a_venir` (grey). */
export const etapeSchema = z.object({
  code: text,
  label: z.string(),
  etat: z.string(),
});
export type Etape = z.infer<typeof etapeSchema>;

// ------------------------------------------------------------ buttons (§4)

/** One field of a confirmation sheet; its value goes in the body under `code`. */
export const champSchema = z.object({
  code: z.string(),
  /** choix_unique · date_chips · note_etoiles · texte · fichier */
  type: z.string(),
  label: text,
  requis: z.boolean().default(false),
  options: z.array(z.object({ label: z.string(), valeur: z.unknown() })).default([]),
  placeholder: text,
  min: z.number().nullish(),
  max: z.number().nullish(),
  /** `fichier`: the picker's button, accepted types and size cap. */
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

/** The document viewer's frame: title, facts and status chip around the file. */
export const visionneuseSchema = z.object({
  titre: z.string(),
  lignes: z.array(z.object({ label: z.string(), valeur: z.string() })).default([]),
  aucunFichier: text,
  statut: toneTagSchema.nullish(),
});
export type Visionneuse = z.infer<typeof visionneuseSchema>;

/**
 * Every button of the screen (`ClientActionDto`). One algorithm handles them
 * all — see lib/suiviActions.ts — never a per-code rule.
 */
export const actionSchema = z.object({
  code: z.string(),
  label: z.string(),
  /** primaire · succes · contour · neutre · danger · lien_danger · ajout */
  style: text,
  icone: text,
  /** formulaire_modifier · support · document · factures */
  ouvre: text,
  method: text,
  /** A full path from the host (`/api/v1/…`), not from the base URL. */
  href: text,
  contentType: text,
  corps: z.record(z.string(), z.unknown()).nullish(),
  /** `uuid_par_confirmation` → an `Idempotency-Key` per confirmed press. */
  idempotence: text,
  /** `demande` → the answer carries the new screen · `recharger` → GET it again. */
  reponse: text,
  confirm: confirmSchema.nullish(),
  /** Reused (English) routes: the French sentence per error code, `*` as fallback. */
  erreurs: z.record(z.string(), z.string()).nullish(),
  apercuHref: text,
  /** Set when the button is greyed out: the reason to print. */
  indisponible: text,
  visionneuse: visionneuseSchema.nullish(),
});
export type SuiviAction = z.infer<typeof actionSchema>;

// ------------------------------------------------------------ header & blocks

const categorieSchema = z.object({
  code: text,
  label: z.string(),
  icone: text,
  famille: text,
  couleur: text,
  modifiable: z.boolean().optional(),
});

export const enteteSchema = z.object({
  titre: z.string(),
  service: text,
  categorie: categorieSchema.nullish(),
  recurrent: z.boolean().default(false),
  frequence: text,
  frequenceLabel: text,
  wilaya: text,
  commune: text,
  date: text,
  dateLabel: text,
  creeLe: text,
  statut: toneTagSchema,
  annulee: z.boolean().default(false),
  actionRequise: z.boolean().default(false),
  commandeId: text,
  commandeReference: text,
});

export const prestataireSchema = z.object({
  titre: text,
  nom: z.string(),
  initiales: text,
  couleur: text,
  note: z.number().nullish(),
  noteLabel: text,
  experienceLabel: text,
  sousTitre: text,
});
export type PrestataireCarte = z.infer<typeof prestataireSchema>;

export const prochaineActionSchema = z.object({
  code: text,
  titre: z.string(),
  texte: text,
  ton: text,
  balle: toneTagSchema.nullish(),
  etapes: z.array(etapeSchema).nullish(),
  /** The visit row the block is about — to highlight / scroll to. */
  occurrenceId: text,
});

// ------------------------------------------------------------ brief (§5)

const optionSchema = z.object({ code: z.string(), label: z.string(), valeur: z.number().nullish() });
export type BriefOption = z.infer<typeof optionSchema>;

export const briefSchema = z.object({
  modifiable: z.boolean().default(false),
  /** Sent back as `version` — a stale one answers 409 `concurrency_conflict`. */
  version: z.number(),
  formulaire: z
    .object({ titre: z.string(), bouton: z.string(), avertissement: text })
    .default({ titre: 'Modifier la demande', bouton: 'Enregistrer les modifications' }),
  categorie: categorieSchema.nullish(),
  services: z
    .object({
      modifiable: z.boolean().default(true),
      options: z
        .array(z.object({ code: z.string(), label: z.string(), selectionne: z.boolean().default(false) }))
        .default([]),
    })
    .default({ modifiable: true, options: [] }),
  description: text,
  wilaya: text,
  delai: z
    .object({
      /** null → no preset matches the stored date; `label` then reads « Le 27/05/2026 ». */
      code: text,
      label: text,
      dateSouhaitee: text,
      dateLabel: text,
      options: z.array(optionSchema).default([]),
    })
    .nullish(),
  budget: z.object({ maxDzd: z.number().nullish(), label: text, minDzd: z.number().nullish() }).nullish(),
  typeBesoin: z
    .object({ code: text, valeur: z.number().nullish(), label: text, options: z.array(optionSchema).default([]) })
    .nullish(),
  frequence: z
    .object({ code: text, valeur: z.number().nullish(), label: text, options: z.array(optionSchema).default([]) })
    .nullish(),
  criteresSelection: text,
  documents: z
    .object({
      ajoutPossible: z.boolean().default(false),
      suppressionPossible: z.boolean().default(false),
      indication: text,
      fichiers: z
        .array(
          z.object({
            id: text,
            nom: z.string(),
            url: text,
            contentType: text,
            tailleOctets: z.number().nullish(),
            ajouteLe: text,
          }),
        )
        .default([]),
    })
    .nullish(),
});
export type Brief = z.infer<typeof briefSchema>;

// ------------------------------------------------------------ devis (§7)

export const devisCarteSchema = z.object({
  devisId: z.string(),
  prestataire: prestataireSchema,
  certifications: text,
  montantTitre: text,
  montantDzd: z.number().nullish(),
  montantLabel: text,
  montantCredits: z.number().nullish(),
  /** Always null today — hide the line. */
  delaiLabel: text,
  validiteLabel: text,
  note: text,
  anterieurAuBrief: z.boolean().default(false),
  anterieurAuBriefLabel: text,
  voir: actionSchema.nullish(),
  /** null → an expired offer: greyed out, cannot be selected. */
  choisir: actionSchema.nullish(),
  etat: toneTagSchema.nullish(),
});
export type DevisCarte = z.infer<typeof devisCarteSchema>;

export const devisBlocSchema = z.object({
  consigne: text,
  bouton: z
    .object({ label: z.string(), inactifSansSelection: z.boolean().default(true) })
    .default({ label: 'Confirmer le prestataire', inactifSansSelection: true }),
  cartes: z.array(devisCarteSchema).default([]),
});

// ------------------------------------------------------------ commande (§8)

export const factureSchema = z.object({
  id: text,
  reference: text,
  statut: toneTagSchema,
  montantDzd: z.number().nullish(),
  montantLabel: text,
  montantCredits: z.number().nullish(),
  credits: z.object({ etat: text, icone: text, label: z.string() }).nullish(),
  fichier: actionSchema.nullish(),
  actions: z.array(actionSchema).default([]),
});
export type Facture = z.infer<typeof factureSchema>;

export const occurrenceSchema = z.object({
  id: z.string(),
  date: text,
  /** « Date à fixer » while de9de9 has not fixed it. */
  dateLabel: text,
  heureLabel: text,
  /** en_cours · a_venir · historique — a hint for sections. */
  groupe: text,
  statut: toneTagSchema,
  demandeeParLeClient: z.boolean().default(false),
  info: z.object({ icone: text, texte: z.string(), ton: text }).nullish(),
  facture: factureSchema.nullish(),
  actions: z.array(actionSchema).default([]),
});
export type Occurrence = z.infer<typeof occurrenceSchema>;

export const commandeSchema = z.object({
  id: text,
  reference: text,
  cadence: text,
  section: z
    .object({ titre: z.string(), icone: text, motif: text, vide: text })
    .default({ titre: 'Visite' }),
  occurrences: z.array(occurrenceSchema).default([]),
  /** Hidden when null; greyed out (with its reason) when `indisponible` is set. */
  ajouterOccurrence: actionSchema.nullish(),
  /** Offered once every visit not cancelled is paid. */
  avis: z
    .object({
      etat: text,
      label: text,
      titre: text,
      texte: text,
      note: z.number().nullish(),
      ancreOccurrenceId: text,
      action: actionSchema.nullish(),
    })
    .nullish(),
});
export type Commande = z.infer<typeof commandeSchema>;

// ------------------------------------------------------------ support (§9)

export const supportSchema = z.object({
  titre: z.string(),
  texte: text,
  canaux: z
    .array(z.object({ code: text, label: z.string(), href: z.string(), principal: z.boolean().default(false) }))
    .default([]),
});
export type Support = z.infer<typeof supportSchema>;

// ------------------------------------------------------------ the screen

export const demandeSuiviSchema = z.object({
  id: z.string(),
  titreEcran: text,
  entete: enteteSchema,
  /** Three rungs before the contract; null once contracted. */
  stepper: z.object({ etapes: z.array(etapeSchema).default([]) }).nullish(),
  prestataire: prestataireSchema.nullish(),
  prochaineAction: prochaineActionSchema.nullish(),
  /** The buttons at the bottom, in screen order. */
  actions: z.array(actionSchema).default([]),
  brief: briefSchema.nullish(),
  devis: devisBlocSchema.nullish(),
  commande: commandeSchema.nullish(),
  support: supportSchema.nullish(),
});
export type DemandeSuivi = z.infer<typeof demandeSuiviSchema>;

/** A `reponse: "demande"` answer: an optional toast and the whole new screen. */
export const actionReponseSchema = z.object({
  message: z.object({ titre: z.string(), texte: text }).nullish(),
  demande: demandeSuiviSchema,
});

/** Any 2xx body that carries a message (e.g. « Contestation envoyée »), screen or not. */
export const messageOnlySchema = z.object({
  message: z.object({ titre: z.string(), texte: text }).nullish(),
});
