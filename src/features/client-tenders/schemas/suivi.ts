import { z } from 'zod';
import {
  actionSchema,
  etapeSchema,
  messageOnlySchema,
  messageSchema,
  supportSchema,
  toneTagSchema,
  type ApiAction,
} from '@/lib/actions/schema';

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

// The button, pill and sheet shapes are shared with the prestataire screens.
export type { Champ, Confirm, Etape, Support, ToneTag, Visionneuse } from '@/lib/actions/schema';
export { messageOnlySchema };
export type SuiviAction = ApiAction;

const text = z.string().nullish();

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
  message: messageSchema.nullish(),
  demande: demandeSuiviSchema,
});
