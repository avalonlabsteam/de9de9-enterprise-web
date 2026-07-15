import { z } from 'zod';

export const dashboardSchema = z.object({
  entreprise: z.string(),
  verified: z.boolean(),
  stats: z.object({
    avenir: z.number(),
    enCours: z.number(),
    completes: z.number(),
  }),
  equipe: z.object({
    used: z.number(),
    total: z.number(),
  }),
  chiffreAffaireDa: z.number(),
});
export type Dashboard = z.infer<typeof dashboardSchema>;

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
