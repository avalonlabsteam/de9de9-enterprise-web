import { z } from 'zod';

// The prestataire home is served by `GET /prestataire/accueil` — see
// schemas/accueil.ts. What remains here is the stats screen.

export const monthlyPointSchema = z.object({
  month: z.string(),
  ratio: z.number(),
});
export type MonthlyPoint = z.infer<typeof monthlyPointSchema>;

export const categorieRowSchema = z.object({
  label: z.string(),
  valueDzd: z.number(),
});
export type CategorieRow = z.infer<typeof categorieRowSchema>;

export const statsSchema = z.object({
  chiffreAffaireDa: z.number(),
  trendPct: z.number(),
  revenueDzd: z.number(),
  missions: z.number(),
  rating: z.number(),
  winRatePct: z.number(),
  monthly: z.array(monthlyPointSchema),
  parCategorie: z.array(categorieRowSchema),
});
export type Stats = z.infer<typeof statsSchema>;
