import { z } from 'zod';

/**
 * « Nouvelle demande », screens 1 and 2: the category grid with its « Top du
 * mois » and search (`GET /client/nouvelle-demande`), then the services of the
 * tapped category (`GET /catalogue/{code}`). Screen 3's pickers ride along in
 * `formulaire`, so the form never hard-codes them.
 */

/** A category tile. `imageUrl` is public (a bare `<img src>`); null → the emoji. */
export const categorieTileSchema = z.object({
  code: z.string(),
  libelle: z.string(),
  libelleAr: z.string().nullish(),
  icone: z.string().nullish(),
  /** The family badge on the tile: its label and colour. */
  famille: z.string().nullish(),
  familleLabel: z.string().nullish(),
  hex: z.string().nullish(),
  imageUrl: z.string().nullish(),
  nombreServices: z.number().default(0),
  servicesDisponibles: z.number().nullish(),
  topRang: z.number().nullish(),
});
export type CategorieTile = z.infer<typeof categorieTileSchema>;

/** A search hit: a service — tapping it opens its category with it pre-ticked. */
export const rechercheHitSchema = z.object({
  code: z.string(),
  libelle: z.string(),
  categorieCode: z.string(),
  categorie: z.string().nullish(),
  icone: z.string().nullish(),
});
export type RechercheHit = z.infer<typeof rechercheHitSchema>;

/** A picker option. `valeur` is what the send body wants where the API reads an enum as a number. */
export const formOptionSchema = z.object({
  code: z.string(),
  label: z.string(),
  valeur: z.number().nullish(),
});
export type FormOption = z.infer<typeof formOptionSchema>;

export const formulaireSchema = z.object({
  delais: z.array(formOptionSchema).default([]),
  typesBesoin: z.array(formOptionSchema).default([]),
  frequences: z.array(formOptionSchema).default([]),
});
export type Formulaire = z.infer<typeof formulaireSchema>;

export const nouvelleDemandeSchema = z.object({
  entreprise: z
    .object({
      nom: z.string().nullish(),
      verifiee: z.boolean().optional(),
      kycStatut: z.string().nullish(),
      /** false: de9de9 suspended the company's B2B access — `blocage` takes the grid's place (guide 21 §13). */
      accesB2b: z.boolean().optional(),
      blocage: z.string().nullish(),
    })
    .nullish(),
  totalCategories: z.number().nullish(),
  /** Chosen by de9de9, in order — the row is hidden when empty. */
  topDuMois: z.array(categorieTileSchema).default([]),
  categories: z.array(categorieTileSchema).default([]),
  /** Only with `?q=`. */
  recherche: z.array(rechercheHitSchema).default([]),
  formulaire: formulaireSchema.default({ delais: [], typesBesoin: [], frequences: [] }),
});
export type NouvelleDemande = z.infer<typeof nouvelleDemandeSchema>;

export const serviceSchema = z.object({
  code: z.string(),
  libelle: z.string(),
  /** 0 = nobody listed yet: still allowed, de9de9 sources it. */
  avecPrestataires: z.number().default(0),
});
export type Service = z.infer<typeof serviceSchema>;

export const categorieDetailSchema = z.object({
  code: z.string(),
  libelle: z.string(),
  libelleAr: z.string().nullish(),
  icone: z.string().nullish(),
  famille: z.string().nullish(),
  hex: z.string().nullish(),
  nombreServices: z.number().nullish(),
  servicesDisponibles: z.number().nullish(),
  services: z.array(serviceSchema).default([]),
});
export type CategorieDetail = z.infer<typeof categorieDetailSchema>;
