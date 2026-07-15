import { z } from 'zod';

export const pieceFile = z.object({ name: z.string() });
export type PieceFileValue = z.infer<typeof pieceFile>;

export const kycSubmitSchema = z.object({
  rc: pieceFile.nullable(),
  nif: pieceFile.nullable(),
  nis: pieceFile.nullable(),
});
export type KycSubmitValues = z.infer<typeof kycSubmitSchema>;

export const kycStatusSchema = z.object({ validated: z.boolean() });
export type KycStatus = z.infer<typeof kycStatusSchema>;
