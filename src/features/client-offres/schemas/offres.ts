import { z } from 'zod';

/**
 * « Offres des prestataires » (guide 19b §10) — the published B2B annonces a
 * client company may see: listed, KYC-verified prestataires, never its own
 * company. The guide is a DESIGN: every member the screens can do without is
 * optional.
 */

const text = z.string().nullish();

/** Who offers: name, logo, rating, badges — never an e-mail, a phone or a WhatsApp. */
const prestataireSchema = z.object({
  nom: z.string(),
  logoUrl: text,
  initiales: text,
  couleur: text,
  note: z.number().nullish(),
  /** « 4,6 · 12 avis » — absent without a review. */
  noteLabel: text,
  badges: z.array(z.object({ code: text, label: z.string() })).default([]),
});
export type OffrePrestataire = z.infer<typeof prestataireSchema>;

export const offreCarteSchema = z.object({
  id: z.string(),
  titre: z.string(),
  /** Absent → the category's icon on its family colour. */
  couvertureUrl: text,
  icone: text,
  hex: text,
  prestataire: prestataireSchema,
  services: z.array(z.string()).default([]),
  zonesLabel: text,
  /** « À partir de 4 000 DA / jour » · « Sur devis » */
  prixLabel: text,
  voir: z.object({ label: z.string() }).nullish(),
});
export type OffreCarte = z.infer<typeof offreCarteSchema>;

export const offresListeSchema = z.object({
  titre: text,
  /** The chips above the list. */
  filtres: z
    .object({
      services: z.array(z.object({ code: z.string(), label: z.string() })).default([]),
      wilayas: z.array(z.object({ code: z.number(), label: z.string() })).default([]),
    })
    .default({ services: [], wilayas: [] }),
  offres: z.array(z.unknown()).default([]),
  page: z.number().default(1),
  pageSize: z.number().default(20),
  total: z.number().default(0),
  vide: z.object({ titre: z.string(), texte: text }).nullish(),
});

/** What pre-fills the EXISTING demande form (guide 19b §11). */
const demandeSchema = z.object({
  annonceId: z.string(),
  categoryCode: z.string(),
  subCategoryCodes: z.array(z.string()).default([]),
  /** The wilayas the offer covers — the form's « Wilaya » choices. */
  wilayas: z.array(z.string()).default([]),
  /** « Prestataire souhaité : Cleanium » */
  prestataireSouhaite: text,
});
export type OffreDemande = z.infer<typeof demandeSchema>;

export const offreSchema = z.object({
  id: z.string(),
  titre: z.string(),
  photos: z.array(z.object({ url: z.string(), couverture: z.boolean().default(false) })).default([]),
  prestataire: prestataireSchema,
  categorie: z
    .object({ code: z.string(), libelle: z.string(), icone: text, famille: text, familleLabel: text, hex: text })
    .nullish(),
  services: z.array(z.object({ code: z.string(), libelle: z.string() })).default([]),
  zones: z
    .array(z.object({ wilayaCode: z.number(), wilaya: text, communeCode: z.number().nullish(), commune: text }))
    .default([]),
  tarifLabel: text,
  delaiLabel: text,
  capacite: text,
  certifications: z.array(z.string()).default([]),
  references: text,
  description: text,
  demander: z.object({ label: z.string(), note: text }).nullish(),
  demande: demandeSchema.nullish(),
});
export type Offre = z.infer<typeof offreSchema>;
