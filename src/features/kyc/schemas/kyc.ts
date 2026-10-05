import { z } from 'zod';

/**
 * KYC: a company files its three legal documents; de9de9 validates or refuses
 * each piece, and the dossier follows — verified once the three are validated,
 * rejected when a refused one has to be replaced. There is no submit step: a
 * filed piece waits for de9de9 at once. The company comes from the access
 * token — no company id in any URL on the company app.
 */

export const KYC_KINDS = ['KycRc', 'KycNif', 'KycNis'] as const;
export const kycKindSchema = z.enum(KYC_KINDS);
export type KycKind = z.infer<typeof kycKindSchema>;

export const kycStatutSchema = z.enum(['pending', 'verified', 'rejected']);
export type KycStatut = z.infer<typeof kycStatutSchema>;

/** Where one piece stands. An uploaded file is `a_verifier` until de9de9 rules on it. */
export const kycPieceStatutSchema = z.enum(['manquant', 'a_verifier', 'valide', 'refuse']);
export type KycPieceStatut = z.infer<typeof kycPieceStatutSchema>;

/** One of the three rows, always sent in the order RC, NIF, NIS. */
export const kycDocumentSchema = z.object({
  documentId: z.string().nullish(),
  kind: kycKindSchema,
  kindLabel: z.string().optional(),
  fileName: z.string().nullish(),
  /** Needs the bearer header — never a bare `<img src>`. */
  url: z.string().nullish(),
  /** The same file served inline: a preview rather than a download. */
  urlApercu: z.string().nullish(),
  uploadedAt: z.string().nullish(),
  present: z.boolean().default(false),
  /** Absent from an API that predates the per-piece verdicts. */
  statut: kycPieceStatutSchema.optional().catch(undefined),
  statutLabel: z.string().nullish(),
  /** Why de9de9 refused this piece, shown to the company. */
  motif: z.string().nullish(),
  revueLe: z.string().nullish(),
  /** False once validated, and on a filed piece while it waits for its verdict: an upload answers 409. */
  remplacable: z.boolean().nullish(),
  contentType: z.string().nullish(),
  sizeBytes: z.number().nullish(),
});
export type KycDocument = z.infer<typeof kycDocumentSchema>;

export const kycDocumentsSchema = z.array(kycDocumentSchema);

export const kycDossierSchema = z.object({
  companyId: z.string().optional(),
  nom: z.string().optional(),
  statut: kycStatutSchema,
  statutLabel: z.string().optional(),
  /** The rejection reason, shown to the company. */
  motif: z.string().nullish(),
  revueLe: z.string().nullish(),
  identifiantsComplets: z.boolean().optional(),
  rc: z.string().nullish(),
  nif: z.string().nullish(),
  nis: z.string().nullish(),
  documents: kycDocumentsSchema.default([]),
  /** Since when pieces have been waiting for de9de9. */
  soumisLe: z.string().nullish(),
  /** At least one piece is waiting for de9de9 — true from the first upload. */
  enRevue: z.boolean().optional(),
  /** The review as the company may see it: « 2 / 3 validés ». */
  progression: z
    .object({ valides: z.number().default(0), total: z.number().default(3), libelle: z.string().nullish() })
    .nullish(),
});
export type KycDossier = z.infer<typeof kycDossierSchema>;

/** 10 MB per file, 20 MB per request — the API refuses more (413). */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_REQUEST_BYTES = 20 * 1024 * 1024;
