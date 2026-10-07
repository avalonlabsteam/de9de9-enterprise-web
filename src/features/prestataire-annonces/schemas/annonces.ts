import { z } from 'zod';

/**
 * « Mes annonces » (guides 19, 19a, 19b) — the two kinds of annonce a
 * prestataire writes: B2C (the de9de9 app's own categories and services) and
 * B2B (the Entreprise catalogue). One list, one status machine, one set of
 * photo and transition routes for both.
 *
 * The guides are a DESIGN: the member names are the proposed wire shape. Every
 * member the screens can do without is therefore optional, and codes are
 * strings, never enums — a rename or a new value must not blank a screen.
 */

const text = z.string().nullish();
const num = z.number().nullish();

/** `{ code, label, ton }` — a status, a publication badge. */
const tagSchema = z.object({ code: z.string(), label: z.string(), ton: text });
export type Tag = z.infer<typeof tagSchema>;

/** A button of an annonce: drawn only when listed, in the order sent. `modifier` has no call. */
export const annonceActionSchema = z.object({
  code: z.string(),
  label: z.string(),
  /** `contour` · `danger` */
  style: text,
  method: text,
  /** A full path from the host (`/api/v1/…`). */
  href: text,
  confirm: z.object({ titre: z.string(), texte: text, bouton: text }).nullish(),
});
export type AnnonceAction = z.infer<typeof annonceActionSchema>;

export const photoSchema = z.object({
  id: z.string(),
  /** An anonymous, cacheable address: used as given in a bare `<img>`, never rebuilt. */
  url: z.string(),
  couverture: z.boolean().default(false),
});
export type Photo = z.infer<typeof photoSchema>;

/** Every photo call answers the list and the annonce's new version. */
export const photosReponseSchema = z.object({ version: z.number(), photos: z.array(photoSchema).default([]) });

/** A PDF of a B2B annonce — a brochure, a price list, a certificate. Never mixed with the photos. */
export const documentSchema = z.object({
  id: z.string(),
  nom: z.string(),
  /** Absolute and public, like a photo's: a plain link to a new tab, never a frame. */
  url: z.string(),
  tailleOctets: z.number().nullish(),
  contentType: z.string().nullish(),
  ajouteLe: z.string().nullish(),
});
export type AnnonceDocument = z.infer<typeof documentSchema>;

/** Every document call answers the list and the annonce's new version — the one the photo calls and the PUT share. */
export const documentsReponseSchema = z.object({ version: z.number(), documents: z.array(documentSchema).default([]) });

/** The company's pages, one member per network (`facebook`, `instagram`…): null where none is given. */
export const liensSociauxSchema = z.record(z.string(), z.string().nullable());

// ----------------------------------------------------------------- the list

export const annonceCarteSchema = z.object({
  id: z.string(),
  /** `b2c` · `b2b` */
  type: z.string(),
  typeChip: z.object({ code: text, label: z.string() }).nullish(),
  titre: z.string(),
  sousTitre: text,
  prixLabel: text,
  couvertureUrl: text,
  /** B2C: the de9de9 category's picture — the tile when there is no photo. */
  categoriePhotoUrl: text,
  /** B2B: the category's emoji and family colour — the tile when there is no photo. */
  icone: text,
  hex: text,
  statut: tagSchema,
  /**
   * B2C only, once « Publiée »: where the annonce stands on the de9de9 app — `en_attente` ·
   * `echec` · `en_ligne`, drawn from `label` + `ton`. Null on anything else.
   */
  publication: tagSchema.nullish(),
  version: z.number().default(1),
  actions: z.array(annonceActionSchema).default([]),
});
export type AnnonceCarte = z.infer<typeof annonceCarteSchema>;

const compteSchema = z.object({ code: z.string(), label: z.string(), count: z.number().default(0) });

export const typeCreationSchema = z.object({
  code: z.string(),
  titre: z.string(),
  sousTitre: text,
  /** « 8 annonces restantes » · « Limite atteinte » */
  quota: text,
  disponible: z.boolean().default(true),
});
export type TypeCreation = z.infer<typeof typeCreationSchema>;

export const annoncesListeSchema = z.object({
  titre: text,
  /** The kind pills, with their count bubble. */
  types: z.array(compteSchema).default([]),
  /** The status chips — counts inside the selected kind. */
  statuts: z.array(compteSchema).default([]),
  creer: z.object({ label: z.string(), types: z.array(typeCreationSchema).default([]) }).nullish(),
  /** Banners, printed in order above the cards. */
  bandeaux: z.array(z.object({ code: text, ton: text, texte: z.string() })).default([]),
  annonces: z.array(z.unknown()).default([]),
  page: z.number().default(1),
  pageSize: z.number().default(20),
  total: z.number().default(0),
  vide: z.object({ titre: z.string(), texte: text }).nullish(),
});

// --------------------------------------------------------------- one annonce

const communs = {
  id: z.string(),
  typeChip: z.object({ code: text, label: z.string() }).nullish(),
  /** Sent back with every write on the annonce (photos included): a stale one is a 409. */
  version: z.number().default(1),
  statut: tagSchema,
  /** The status strip — one backend sentence. */
  bandeau: z.object({ ton: text, texte: z.string() }).nullish(),
  /** de9de9's reason, on Refusée / Suspendue. */
  motif: text,
  titre: z.string(),
  description: text,
  photos: z.array(photoSchema).default([]),
  /** Drafts: which blocks / steps are complete. */
  etapes: z.array(z.object({ code: z.string(), label: text, complete: z.boolean().default(false) })).default([]),
  actions: z.array(annonceActionSchema).default([]),
};

export const zoneSchema = z.object({
  wilayaCode: z.number(),
  wilaya: text,
  /** Absent = the whole wilaya. */
  communeCode: num,
  commune: text,
});
export type Zone = z.infer<typeof zoneSchema>;

/** A B2B annonce: one offer in ONE catalogue category (guide 19b). */
export const annonceB2bSchema = z.object({
  ...communs,
  type: z.literal('b2b'),
  categorie: z
    .object({
      code: z.string(),
      libelle: z.string(),
      icone: text,
      familleLabel: text,
      hex: text,
      /** true once submitted: the category can no longer change. */
      verrouillee: z.boolean().default(false),
    })
    .nullish(),
  sousCategories: z.array(z.object({ code: z.string(), libelle: z.string() })).default([]),
  zones: z.array(zoneSchema).default([]),
  tarif: z
    .object({ mode: text, minDzd: num, maxDzd: num, unite: text, label: text })
    .nullish(),
  delaiDemarrageJours: num,
  delaiLabel: text,
  capacite: text,
  references: text,
  certifications: z.array(z.string()).default([]),
  liensSociaux: liensSociauxSchema.nullish(),
  documents: z.array(documentSchema).default([]),
  demandesIssues: z.object({ count: z.number().default(0), label: text }).nullish(),
});
export type AnnonceB2b = z.infer<typeof annonceB2bSchema>;

/** A B2C annonce: one category of the de9de9 app = one activity of the company's pro account there (guide 19a). */
export const annonceB2cSchema = z.object({
  ...communs,
  type: z.literal('b2c'),
  sousTitre: text,
  /** The same badge as on the card. `raison`: why a send failed — the strip (`bandeau`) words it too. */
  publication: tagSchema.extend({ raison: text }).nullish(),
  categorie: z
    .object({ legacyCategoryId: z.number(), libelle: z.string(), libelleAr: text, groupe: text, photoUrl: text })
    .nullish(),
  /** The app's `PricingType`, 0..10 — one unit for the whole annonce. */
  uniteDefaut: num,
  uniteDefautLabel: text,
  remise: z.number().default(0),
  lignes: z
    .array(
      z.object({
        id: text,
        legacyCategoryServiceId: num,
        legacyServiceTaskId: num,
        estLibre: z.boolean().default(false),
        libelle: z.string(),
        prixDzd: num,
        /** Absent = the annonce's default unit. */
        unite: num,
        uniteDifferente: z.boolean().default(false),
        prixLabel: text,
      }),
    )
    .default([]),
  reponseIds: z.array(z.string()).default([]),
  /** Ready to print. */
  questionnaire: z.array(z.object({ question: z.string(), reponses: z.array(z.string()).default([]) })).default([]),
  disponibilites: z
    .array(z.object({ jour: z.number(), jourLabel: text, debut: z.string(), fin: z.string() }))
    .default([]),
  /** The company's shared B2C zones, summed up — they are edited on their own route. */
  zones: z.object({ resume: text, communesCouvertes: num, note: text }).nullish(),
});
export type AnnonceB2c = z.infer<typeof annonceB2cSchema>;

export const annonceSchema = z.discriminatedUnion('type', [annonceB2bSchema, annonceB2cSchema]);
export type Annonce = z.infer<typeof annonceSchema>;

/** `POST …/soumettre` — the annonce, and the confirmation to print. */
export const soumissionSchema = z.object({
  annonce: annonceSchema,
  confirmation: z.object({ titre: z.string(), texte: text, bouton: text }).nullish(),
});
export type Confirmation = NonNullable<z.infer<typeof soumissionSchema>['confirmation']>;

/** The blocks a refusal names (422 `annonce_incomplete`). */
export const etapesRefusSchema = z.array(z.object({ code: z.string(), message: text })).default([]);
export type EtapeRefus = z.infer<typeof etapesRefusSchema>[number];

// ------------------------------------------------------- B2B form's reference

export const referentielB2bSchema = z.object({
  kyc: z.object({ verifie: z.boolean().default(true) }).default({ verifie: true }),
  limites: z
    .object({
      titreMax: z.number().default(120),
      descriptionMin: z.number().default(30),
      descriptionMax: z.number().default(2000),
      capaciteMax: z.number().default(200),
      referencesMax: z.number().default(1000),
      certificationsMax: z.number().default(12),
      certificationMax: z.number().default(120),
      zonesMax: z.number().default(300),
      photosMax: z.number().default(8),
      photoMaxOctets: z.number().default(5_242_880),
      lienSocialMax: z.number().default(300),
      documentsMax: z.number().default(5),
      documentMaxOctets: z.number().default(8_388_608),
      documentTypes: z.string().default('application/pdf'),
    })
    .default({
      titreMax: 120, descriptionMin: 30, descriptionMax: 2000, capaciteMax: 200, referencesMax: 1000,
      certificationsMax: 12, certificationMax: 120, zonesMax: 300, photosMax: 8, photoMaxOctets: 5_242_880,
      lienSocialMax: 300, documentsMax: 5, documentMaxOctets: 8_388_608, documentTypes: 'application/pdf',
    }),
  /** The networks the form asks a page for, in order. Empty on an API that does not take the links yet: no block then. */
  reseauxSociaux: z.array(z.object({ code: z.string(), label: z.string(), exemple: text })).default([]),
  tarif: z
    .object({
      modes: z.array(z.object({ code: z.string(), label: z.string() })).default([]),
      unites: z.array(z.object({ code: z.string(), label: z.string() })).default([]),
    })
    .default({ modes: [], unites: [] }),
  /** Active categories only, in catalogue order. */
  categories: z
    .array(
      z.object({
        code: z.string(),
        libelle: z.string(),
        libelleAr: text,
        icone: text,
        famille: text,
        familleLabel: text,
        hex: text,
        imageUrl: text,
        services: z
          .array(
            z.object({
              code: z.string(),
              libelle: z.string(),
              /** Already in another LIVE annonce of the company. */
              dejaAnnoncee: z.boolean().default(false),
              annonce: z.object({ id: text, titre: text }).nullish(),
            }),
          )
          .default([]),
      }),
    )
    .default([]),
});
export type ReferentielB2b = z.infer<typeof referentielB2bSchema>;
export type CategorieB2b = ReferentielB2b['categories'][number];

// ------------------------------------------------------ B2C wizard's reference

const uniteSchema = z.object({ code: z.number(), label: z.string() });

export const referentielB2cSchema = z.object({
  groupes: z
    .array(
      z.object({
        id: z.number(),
        libelle: z.string(),
        libelleAr: text,
        photoUrl: text,
        /** Every category of the group is locked. */
        verrouille: z.boolean().default(false),
        categories: z
          .array(
            z.object({
              id: z.number(),
              libelle: z.string(),
              libelleAr: text,
              photoUrl: text,
              /** A non-archived B2C annonce of the company already holds it. */
              dejaUtilisee: z.boolean().default(false),
              annonceId: text,
              /** Santé, Chauffeur: locked in v1. */
              indisponible: z.boolean().default(false),
              indisponibleMotif: text,
            }),
          )
          .default([]),
      }),
    )
    .default([]),
  /** The app's `PricingType`. */
  unites: z.array(uniteSchema).default([]),
  limites: z
    .object({
      lignesMax: z.number().default(60),
      lignesLibresMax: z.number().default(5),
      descriptionMin: z.number().default(30),
      descriptionMax: z.number().default(2000),
      photosMax: z.number().default(8),
      photoMaxOctets: z.number().default(5_242_880),
      plagesParJourMax: z.number().default(3),
      zonesMax: z.number().default(300),
    })
    .default({
      lignesMax: 60, lignesLibresMax: 5, descriptionMin: 30, descriptionMax: 2000,
      photosMax: 8, photoMaxOctets: 5_242_880, plagesParJourMax: 3, zonesMax: 300,
    }),
});
export type ReferentielB2c = z.infer<typeof referentielB2cSchema>;

/** Steps 3 and 5 in one call: the category's services → tasks, and every question of it. */
export const categorieB2cSchema = z.object({
  services: z
    .array(
      z.object({
        /** legacyCategoryServiceId */
        id: z.number(),
        libelle: z.string(),
        libelleAr: text,
        taches: z.array(z.object({ id: z.number(), libelle: z.string(), libelleAr: text })).default([]),
      }),
    )
    .default([]),
  questions: z
    .array(
      z.object({
        id: z.string(),
        enonce: z.string(),
        enonceAr: text,
        /** false = one answer (radio) · true = several (checkboxes). */
        choixMultiple: z.boolean().default(false),
        /** Absent = category-level: always shown. Else shown only while that task is ticked. */
        tacheId: num,
        reponses: z.array(z.object({ id: z.string(), libelle: z.string(), libelleAr: text })).default([]),
      }),
    )
    .default([]),
});
export type CategorieB2c = z.infer<typeof categorieB2cSchema>;

/** The company's ONE list of B2C zones — shared by all its B2C annonces, with its own version. */
export const zonesB2cSchema = z.object({
  version: z.number().default(0),
  zones: z.array(zoneSchema).default([]),
  communesCouvertes: num,
  /** How many B2C annonces a save applies to. */
  annoncesConcernees: z.number().default(0),
  max: z.number().default(300),
  note: text,
  /** The company's B2B coverage, for « Reprendre mes zones B2B » — suggested by the guide, absent until it is served. */
  zonesB2b: z.array(zoneSchema).default([]),
});
export type ZonesB2c = z.infer<typeof zonesB2cSchema>;
