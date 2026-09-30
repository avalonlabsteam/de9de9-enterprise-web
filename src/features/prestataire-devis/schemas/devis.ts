import { z } from 'zod';
import { actionSchema, messageSchema, supportSchema, toneTagSchema } from '@/lib/actions/schema';

/**
 * The prestataire's « Demandes de devis » (guide 13): de9de9's invitations to
 * quote on a client's demande. The answer never carries the client's budget,
 * address, identity or the other bidders — the fence is the server's.
 */

const text = z.string().nullish();

export const ongletSchema = z.object({ code: z.string(), label: z.string(), count: z.number().default(0) });

// ------------------------------------------------------------ the list (§2)

export const demandeCarteSchema = z.object({
  /** The appel d'offres → `GET /prestataire/demandes-devis/{id}`. */
  id: z.string(),
  titre: z.string(),
  service: text,
  icone: text,
  /** Commune, wilaya — never the address. */
  lieu: text,
  cadenceLigne: text,
  recueLe: text,
  /** null without a deadline, and once the request is closed. */
  echeance: text,
  balle: toneTagSchema.nullish(),
  etat: toneTagSchema.nullish(),
  monDevis: z.object({ devisId: text, montantLabel: text }).nullish(),
});
export type DemandeCarte = z.infer<typeof demandeCarteSchema>;

export const demandesPageSchema = z.object({
  titre: text,
  sousTitre: text,
  onglet: text,
  onglets: z.array(ongletSchema).default([]),
  demandes: z.array(demandeCarteSchema).default([]),
  page: z.number().default(1),
  pageSize: z.number().default(20),
  total: z.number().default(0),
  vide: text,
});

// ------------------------------------------------------------ the detail (§3)

/** A file row: its name and size, and the viewer button. */
export const fichierSchema = z.object({
  id: text,
  nom: z.string(),
  taille: text,
  action: actionSchema.nullish(),
});
export type Fichier = z.infer<typeof fichierSchema>;

export const monDevisSchema = z.object({
  id: text,
  montantDzd: z.number().nullish(),
  montantLabel: text,
  validiteLabel: text,
  message: text,
  envoyeLe: text,
  modifieLe: text,
  statut: toneTagSchema.nullish(),
  pieces: z.array(fichierSchema).default([]),
  version: z.number().nullish(),
});

export const demandeDevisSchema = z.object({
  id: z.string(),
  titreEcran: text,
  entete: z.object({
    titre: z.string(),
    service: text,
    icone: text,
    lieu: text,
    cadenceLigne: text,
    recueLe: text,
    echeance: text,
  }),
  prochaineAction: z
    .object({
      code: text,
      balle: toneTagSchema.nullish(),
      titre: z.string(),
      texte: text,
      motif: z.object({ label: z.string(), texte: z.string(), ton: text }).nullish(),
    })
    .nullish(),
  /** The buttons, in screen order, primary first. */
  actions: z.array(actionSchema).default([]),
  demande: z
    .object({
      titre: text,
      lignes: z.array(z.object({ code: text, label: z.string(), valeur: text })).default([]),
      documents: z.array(fichierSchema).default([]),
    })
    .nullish(),
  messageDe9de9: z.object({ titre: text, texte: z.string(), dateLabel: text }).nullish(),
  /** null while you have not answered — the invitation placeholder is not an answer. */
  monDevis: monDevisSchema.nullish(),
  support: supportSchema.nullish(),
});
export type DemandeDevis = z.infer<typeof demandeDevisSchema>;

/** A `reponse: "demande_devis"` answer: an optional toast and the whole new screen. */
export const demandeDevisReponseSchema = z.object({
  message: messageSchema.nullish(),
  demande: demandeDevisSchema,
});
