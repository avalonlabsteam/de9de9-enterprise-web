import { z } from 'zod';

/**
 * « Mon effectif » (guide 15) — the company's team under
 * `/companies/{companyId}/equipe` and `/equipe/{id}/profil`.
 */

const text = z.string().nullish();

/** ouvrier · contractuel_de9de9 (placed by de9de9 → « Salarié de9de9 »). Unknown kinds read as ouvrier. */
const kindSchema = z.string().default('ouvrier');

export const teamMemberSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  phone: text,
  /** Free text; « · » separates several competences. */
  skill: text,
  isActive: z.boolean().default(true),
  kind: kindSchema,
});
export type TeamMember = z.infer<typeof teamMemberSchema>;

export const teamPageSchema = z.object({
  items: z.array(teamMemberSchema).default([]),
  nextCursor: text,
  count: z.number().nullish(),
});

const workerMissionSchema = z.object({
  visiteId: z.string(),
  contractId: z.string(),
  contractRef: text,
  /** V0…V7, V5.C, VX */
  statut: text,
  prevueLe: text,
  prevueLeLabel: text,
  adresse: text,
  roleOnSite: text,
});
export type WorkerMission = z.infer<typeof workerMissionSchema>;

export const workerProfileSchema = z.object({
  id: z.string(),
  nom: z.string(),
  role: text,
  skill: text,
  /** `skill` already split — for the chips. */
  competences: z.array(z.string()).default([]),
  phone: text,
  /** Falls back to `phone`. */
  whatsApp: text,
  actif: z.boolean().default(true),
  heuresParSemaine: z.number().nullish(),
  tarifHoraireCredits: z.number().nullish(),
  /** The one to print: « 900 DA/h ». */
  tarifHoraireDzd: z.number().nullish(),
  analytics: z
    .object({
      missionsRealisees: z.number().default(0),
      satisfactionPercent: z.number().nullish(),
      delaiReponseHeures: z.number().nullish(),
    })
    .default({ missionsRealisees: 0 }),
  missionsAVenir: z.array(workerMissionSchema).default([]),
  missionsPassees: z.array(workerMissionSchema).default([]),
  kind: kindSchema,
});
export type WorkerProfile = z.infer<typeof workerProfileSchema>;

/** `PUT …/equipe/{id}/fiche` — a full replacement: a field left out is cleared. */
export interface FicheBody {
  role: string | null;
  weeklyHours: number | null;
  hourlyRateCredits: number | null;
  whatsAppPhone: string | null;
  skill: string | null;
}

/** « Ajouter un membre » — `POST /companies/{companyId}/equipe`. */
export const addMemberSchema = z.object({
  fullName: z.string().trim().min(1).max(256),
  phone: z.string().trim().max(32),
  skill: z.string().trim().max(128),
});
export type AddMemberInput = z.infer<typeof addMemberSchema>;
