import { z } from 'zod';

/** Mirrors the LocalizedText shape from the catalogue seed. */
export const localizedTextSchema = z.object({
  fr: z.string(),
  ar: z.string(),
});

export const serviceSubSchema = z.object({
  id: z.string(),
  name: localizedTextSchema,
});

export const familySchema = z.object({
  id: z.string(),
  colorKey: z.enum(['noir', 'bleu', 'vert', 'rouge']),
  icon: z.string(),
  name: localizedTextSchema,
  subs: z.array(serviceSubSchema),
});

export const familiesSchema = z.array(familySchema);

export const kycStatusSchema = z.object({
  validated: z.boolean(),
});

export type Family = z.infer<typeof familySchema>;
export type KycStatus = z.infer<typeof kycStatusSchema>;
