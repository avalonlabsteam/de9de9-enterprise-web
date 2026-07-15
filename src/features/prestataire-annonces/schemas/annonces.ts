import { z } from 'zod';

export const annonceSchema = z.object({
  id: z.string(),
  title: z.string(),
  serviceName: z.string(),
  type: z.enum(['b2c', 'b2b']),
  active: z.boolean(),
});
export const annoncesSchema = annonceSchema.array();
export type Annonce = z.infer<typeof annonceSchema>;

/** A professional returned by GET /annonces/pros (active workers). */
export const proSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
});
export const prosSchema = proSchema.array();
export type Pro = z.infer<typeof proSchema>;

/** Calendar event, reused here to derive per-pro missions in "Missions des pros". */
export const proMissionSchema = z.object({
  id: z.string(),
  title: z.string(),
  start: z.string(),
  wilaya: z.string(),
  source: z.enum(['b2c', 'b2b']),
  assignedWorkerId: z.string().optional(),
});
export const proMissionsSchema = proMissionSchema.array();
export type ProMission = z.infer<typeof proMissionSchema>;

export const assignSchema = z.object({
  proIds: z.string().array(),
});
export type AssignInput = z.infer<typeof assignSchema>;

/** Discriminated create payload (B2C / B2B). */
export const createAnnonceSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('b2c'),
    title: z.string().min(1),
    category: z.string().min(1),
    description: z.string(),
  }),
  z.object({
    type: z.literal('b2b'),
    title: z.string().min(1),
    families: z.string().array(),
    wilayas: z.string().array(),
    capacite: z.string(),
    certifications: z.string(),
    tarification: z.enum(['devis', 'demande']),
    references: z.string(),
  }),
]);
export type CreateAnnonceInput = z.infer<typeof createAnnonceSchema>;
