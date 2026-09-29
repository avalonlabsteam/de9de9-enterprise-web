import { z } from 'zod';

/**
 * The prestataire home. The backend builds it and delivers it inside the
 * sign-in / switch answer as `accueil.prestataire` — the app never calls a home
 * route, it renders what the answer carries.
 *
 * Nullable is meaningful here, not sloppy: when the de9de9 consumer app can't
 * be read (`b2c.donneesDisponibles === false`) the B2C counters and revenue
 * come back `null` and the totals are B2B only. The screen must show that as a
 * hint, never as a 0.
 */

const compteurSplitSchema = z.object({
  aVenir: z.number(),
  enCours: z.number(),
  completes: z.number(),
});
export type CompteurSplit = z.infer<typeof compteurSplitSchema>;

export const compteursSchema = compteurSplitSchema.extend({
  b2b: compteurSplitSchema.nullish(),
  b2c: compteurSplitSchema.nullish(),
});

/** One « Mes annonces » card: a service on the company's directory profile. */
export const annonceCardSchema = z.object({
  service: z.string(),
  sousCategorieCode: z.string().optional(),
  categorieCode: z.string().optional(),
  categorie: z.string().optional(),
  /** Emoji of the service's category, rendered as text in the icon tile. */
  icone: z.string().nullish(),
  /** « À partir de 4 000 DA » or « Sur devis » — a day rate. */
  prixLabel: z.string().nullish(),
  prixMinDzd: z.number().nullish(),
  prixUnite: z.string().nullish(),
  /** `B2B`, `B2C`, or both — one pill per value. */
  canaux: z.array(z.string()).default([]),
});
export type AnnonceCard = z.infer<typeof annonceCardSchema>;

/** `pending` · `verified` · `rejected`. */
export const kycStatutSchema = z.string();

export const accueilSchema = z.object({
  entreprise: z.object({
    id: z.string().optional(),
    nom: z.string(),
    /** Authenticated file URL — fetch it with the bearer token, see `useAuthedImage`. */
    logoUrl: z.string().nullish(),
    verifie: z.boolean().default(false),
    kycStatut: kycStatutSchema.optional(),
    certifie: z.boolean().optional(),
    nomUtilisateur: z.string().nullish(),
  }),
  activeRole: z.enum(['client', 'prestataire']).optional(),
  availableRoles: z.array(z.string()).default([]),
  compteurs: compteursSchema,
  annonces: z.array(annonceCardSchema).default([]),
  equipe: z.object({
    /** The company's own active workers. */
    ouvriers: z.number().default(0),
    /** de9de9 app pros currently placed with the company. */
    contractuels: z.number().default(0),
    total: z.number(),
  }),
  chiffreAffaires: z.object({
    totalDzd: z.number(),
    b2bDzd: z.number().nullish(),
    /** The prestataire's 85 % share of `b2bDzd`. */
    b2bNetDzd: z.number().nullish(),
    b2cDzd: z.number().nullish(),
  }),
  b2c: z
    .object({
      /** `actif` · `en_attente` · `suspendu`. */
      statut: z.string(),
      donneesDisponibles: z.boolean().default(true),
    })
    .optional(),
});
export type Accueil = z.infer<typeof accueilSchema>;

// ------------------------------------------------------------ client home

/**
 * `S1` En attente · `S2` Contacté · `S3` Devis en cours · `S4` Assigné ·
 * `S5` Contractualisé. A cancelled request (or one whose deadline passed before
 * a contract) has `annulee: true` and `statutLabel` « Annulée ».
 */
export const demandeRecenteSchema = z.object({
  id: z.string(),
  titre: z.string(),
  categorieCode: z.string().optional(),
  categorie: z.string().optional(),
  /** Emoji of the request's category, rendered as text. */
  icone: z.string().nullish(),
  statut: z.string(),
  statutLabel: z.string(),
  annulee: z.boolean().default(false),
  creeLe: z.string(),
});
export type DemandeRecente = z.infer<typeof demandeRecenteSchema>;

/**
 * The client home, as `accueil.client`. Every block defaults to empty so a
 * trimmed answer never fails the whole sign-in parse — the backend guarantees
 * the block, but a sign-in must not hinge on a counter.
 */
export const clientAccueilSchema = z.object({
  entreprise: z.object({
    id: z.string().optional(),
    nom: z.string(),
    /** Authenticated file URL — fetch it with the bearer token. */
    logoUrl: z.string().nullish(),
    /** The blue badge: KYC verified by de9de9. */
    verifie: z.boolean().default(false),
    kycStatut: z.string().optional(),
    nomUtilisateur: z.string().nullish(),
  }),
  activeRole: z.enum(['client', 'prestataire']).optional(),
  availableRoles: z.array(z.string()).default([]),
  compteurs: z
    .object({
      /** Ordered and not planned yet (V0), or planned for a later day (V1–V3). */
      aVenir: z.number().default(0),
      /** Due today / overdue, done on site, invoice to approve or contested. */
      enCours: z.number().default(0),
      /** Invoice approved (V6) or paid (V7). */
      completes: z.number().default(0),
      /** The client's own action — « À approuver » when > 0. */
      facturesAApprouver: z.number().default(0),
    })
    .default({ aVenir: 0, enCours: 0, completes: 0, facturesAApprouver: 0 }),
  credits: z
    .object({
      soldeCredits: z.number().default(0),
      /** Frozen behind a contested invoice until de9de9 resolves it. */
      bloquesCredits: z.number().default(0),
      /** solde − bloqués: what can still be spent. */
      disponiblesCredits: z.number().default(0),
      /** The same in DA (1 DA = 10 credits) — the one to print. */
      disponiblesDzd: z.number().default(0),
    })
    .default({ soldeCredits: 0, bloquesCredits: 0, disponiblesCredits: 0, disponiblesDzd: 0 }),
  demandes: z
    .object({
      /** Requests not contracted and not cancelled. */
      enCours: z.number().default(0),
      /** Latest five, newest first. */
      recentes: z.array(demandeRecenteSchema).default([]),
    })
    .default({ enCours: 0, recentes: [] }),
  depenses: z
    .object({
      /** Invoices approved or paid, whole history. */
      totalDzd: z.number().default(0),
      /** Invoices waiting for the client's approval. */
      aApprouverDzd: z.number().default(0),
    })
    .default({ totalDzd: 0, aApprouverDzd: 0 }),
});
export type ClientAccueil = z.infer<typeof clientAccueilSchema>;

// ---------------------------------------------------------------- envelope

/**
 * `accueil`, as every sign-in (`/auth/login`, `/auth/google`, `/auth/apple`,
 * `/auth/register`), the app-start check (`/auth/validate-token`) and
 * `/auth/switch-role` carry it — never `/auth/refresh`, which only renews the
 * token (keep showing the home you have). `role` always equals
 * `user.activeRole` and says which block below is filled.
 */
export const accueilEnvelopeSchema = z.object({
  role: z.enum(['client', 'prestataire']),
  prestataire: accueilSchema.nullish(),
  client: clientAccueilSchema.nullish(),
});
export type AccueilEnvelope = z.infer<typeof accueilEnvelopeSchema>;

/** The company name to show in the shell, whichever side the session is on. */
export function companyNameOf(accueil: AccueilEnvelope | null | undefined): string | undefined {
  if (!accueil) return undefined;
  return accueil.role === 'prestataire'
    ? accueil.prestataire?.entreprise.nom
    : accueil.client?.entreprise.nom;
}
