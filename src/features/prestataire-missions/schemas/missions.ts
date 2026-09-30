import { z } from 'zod';
import {
  actionSchema,
  etapeSchema,
  messageSchema,
  supportSchema,
  toneTagSchema,
} from '@/lib/actions/schema';

/**
 * The prestataire's B2B missions (guide 12): « B2B · Entreprises », « Détail de
 * la mission » and the worker picker. A mission is a commande seen through one
 * occurrence (a visit). The backend decides every label, pill, tone and button;
 * the app never works out a state itself.
 */

const text = z.string().nullish();

export const categorieSchema = z.object({
  code: text,
  label: z.string(),
  icone: text,
  famille: text,
  couleur: text,
});

/** « Toutes · 9 », « Action requise · 3 »… — counts over all missions, whatever the tab. */
export const ongletSchema = z.object({ code: z.string(), label: z.string(), count: z.number().default(0) });
export type Onglet = z.infer<typeof ongletSchema>;

// ------------------------------------------------------------ the list (§1)

export const missionCarteSchema = z.object({
  /** The commande → `GET /prestataire/missions/{id}`. */
  id: z.string(),
  reference: text,
  icone: text,
  categorie: categorieSchema.nullish(),
  client: text,
  balle: toneTagSchema.nullish(),
  service: text,
  occurrenceLigne: text,
  etatVisite: toneTagSchema.nullish(),
  /** null on a cancelled occurrence: no pill. */
  etatFacture: toneTagSchema.nullish(),
  etat: text,
  occurrenceId: text,
  date: text,
});
export type MissionCarte = z.infer<typeof missionCarteSchema>;

export const missionsPageSchema = z.object({
  titre: text,
  sousTitre: text,
  onglet: text,
  onglets: z.array(ongletSchema).default([]),
  missions: z.array(missionCarteSchema).default([]),
  page: z.number().default(1),
  pageSize: z.number().default(20),
  /** Cards of the selected tab. */
  total: z.number().default(0),
  vide: text,
});
export type MissionsPage = z.infer<typeof missionsPageSchema>;

// ------------------------------------------------------------ the detail (§2–5)

export const intervenantSchema = z.object({
  id: z.string(),
  nom: z.string(),
  initiales: text,
  couleur: text,
  /** ouvrier · contractuel (tag « de9de9 ») · sous_traitant (tag « Sous-traitant ») */
  type: text,
  typeLabel: text,
  role: text,
  /** « Voir le profil » — null for a sub-contractor. */
  profil: actionSchema.nullish(),
});
export type Intervenant = z.infer<typeof intervenantSchema>;

const ligneSchema = z.object({ code: text, icone: text, label: z.string(), valeur: text });

/** A row of « Autres occurrences à traiter ». */
const autreAVousSchema = z.object({ occurrenceId: z.string(), dateLabel: text, titre: z.string(), href: text });

/** A row of « Historique des occurrences ». */
const historiqueLigneSchema = z.object({
  occurrenceId: z.string(),
  dateLabel: text,
  etat: toneTagSchema.nullish(),
  href: text,
});

export const missionFactureSchema = z.object({
  id: text,
  reference: text,
  statut: toneTagSchema.nullish(),
  montantDzd: z.number().nullish(),
  montantLabel: text,
  deposeeLe: text,
  /** Your share, once the payout is recorded (V7). */
  versement: z.object({ montantLabel: text, dateLabel: text, reference: text }).nullish(),
});

export const missionDetailSchema = z.object({
  id: z.string(),
  reference: text,
  titreEcran: text,
  entete: z.object({
    icone: text,
    categorie: categorieSchema.nullish(),
    client: text,
    service: text,
    occurrenceLigne: text,
    etatFacture: toneTagSchema.nullish(),
    /** « WhatsApp · Contacter de9de9 ». */
    contact: actionSchema.nullish(),
  }),
  /** null while the commande has no visit (`premiere_visite`). */
  occurrence: z
    .object({
      id: z.string(),
      numero: z.number().nullish(),
      total: z.number().nullish(),
      numeroLabel: text,
      date: text,
      jourLabel: text,
      etatVisite: toneTagSchema.nullish(),
      etatFacture: toneTagSchema.nullish(),
    })
    .nullish(),
  affecteA: z.object({ titre: text, intervenants: z.array(intervenantSchema).default([]) }).nullish(),
  etapes: z.array(etapeSchema).default([]),
  etapesGrisees: z.boolean().default(false),
  prochaineAction: z
    .object({
      code: text,
      balle: toneTagSchema.nullish(),
      titre: z.string(),
      texte: text,
      motif: z.object({ label: z.string(), texte: z.string(), ton: text }).nullish(),
    })
    .nullish(),
  /** The buttons at the bottom, in screen order. */
  actions: z.array(actionSchema).default([]),
  details: z.object({ titre: text, lignes: z.array(ligneSchema).default([]) }).nullish(),
  facture: missionFactureSchema.nullish(),
  autresAVous: z.array(autreAVousSchema).default([]),
  historique: z.object({ titre: text, lignes: z.array(historiqueLigneSchema).default([]) }).nullish(),
  support: supportSchema.nullish(),
});
export type MissionDetail = z.infer<typeof missionDetailSchema>;

/** A `reponse: "mission"` answer: an optional toast and the whole new screen. */
export const missionReponseSchema = z.object({
  message: messageSchema.nullish(),
  mission: missionDetailSchema,
});

// ------------------------------------------------------------ the worker picker (§7)

export const candidatSchema = z.object({
  id: z.string(),
  type: text,
  /** Sent as is in `workers[]`: `{ teamMemberId }` or `{ enterpriseProId }`. */
  valeur: z.record(z.string(), z.unknown()),
  nom: z.string(),
  initiales: text,
  couleur: text,
  role: text,
  competences: text,
  /** Advice only — the route never blocks on it. Label and tone null when the visit has no date. */
  disponibilite: z.object({ code: text, label: text, ton: text }).nullish(),
  badge: toneTagSchema.nullish(),
  selectionnable: z.boolean().default(true),
  selectionne: z.boolean().default(false),
  /** Why the row cannot be picked (« KYC expiré — non affectable »). */
  raison: text,
});
export type Candidat = z.infer<typeof candidatSchema>;

export const pickerSchema = z.object({
  titre: z.string(),
  sousTitre: text,
  occurrence: z.object({ id: text, jourLabel: text, heureLabel: text }).nullish(),
  recherchePlaceholder: text,
  groupes: z
    .array(z.object({ code: text, label: z.string(), intervenants: z.array(candidatSchema).default([]) }))
    .default([]),
  vide: text,
  selectionMin: z.number().default(1),
  /** « Affecter ({n}) » — the reused `POST /visites/{id}/assign-workers`. */
  envoyer: actionSchema,
});
export type Picker = z.infer<typeof pickerSchema>;
