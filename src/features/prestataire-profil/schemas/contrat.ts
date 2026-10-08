import { z } from 'zod';

const text = z.string().nullish();

/**
 * « Contrat de partenariat » — `GET /companies/{id}/contrat-partenariat`.
 * de9de9 records the signature and files the signed PDF on its side; the
 * prestataire only reads it. There is no due date: the API holds none.
 */
export const contratSchema = z.object({
  signe: z.boolean().default(false),
  /** « Signé » · « Non signé » — the badge's words, the API's. */
  statutLabel: text,
  signeLe: text,
  fileName: text,
  /** The signed PDF: absolute, private — fetched with the token. Absent while none is filed. */
  url: text,
  sizeBytes: z.number().nullish(),
});
export type Contrat = z.infer<typeof contratSchema>;
