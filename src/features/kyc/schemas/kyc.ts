import { z } from 'zod';

/**
 * KYC: a company files its three legal documents and submits them; de9de9
 * verifies or rejects the dossier as a whole. The company comes from the access
 * token — no company id in any URL on the company app.
 */

export const KYC_KINDS = ['KycRc', 'KycNif', 'KycNis'] as const;
export const kycKindSchema = z.enum(KYC_KINDS);
export type KycKind = z.infer<typeof kycKindSchema>;

export const kycStatutSchema = z.enum(['pending', 'verified', 'rejected']);
export type KycStatut = z.infer<typeof kycStatutSchema>;

/** One of the three rows, always sent in the order RC, NIF, NIS. */
export const kycDocumentSchema = z.object({
  documentId: z.string().nullish(),
  kind: kycKindSchema,
  kindLabel: z.string().optional(),
  fileName: z.string().nullish(),
  /** Needs the bearer header — never a bare `<img src>`. */
  url: z.string().nullish(),
  uploadedAt: z.string().nullish(),
  present: z.boolean().default(false),
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
  soumisLe: z.string().nullish(),
});
export type KycDossier = z.infer<typeof kycDossierSchema>;

/** 10 MB per file, 20 MB per request — the API refuses more (413). */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_REQUEST_BYTES = 20 * 1024 * 1024;
