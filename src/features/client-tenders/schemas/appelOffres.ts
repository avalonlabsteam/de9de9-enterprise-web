import { z } from 'zod';
import type { Formulaire } from '@/features/client-catalogue/schemas/nouvelleDemande';

/**
 * The « Appel d'offres » form (screen 3). Pickers hold the option *codes* from
 * `formulaire`; the page turns them into the numbers the send body wants, so a
 * change to those numbers server-side never desynchronises the form.
 */
export const appelOffresFormSchema = z
  .object({
    description: z.string().trim().min(1, 'required'),
    wilaya: z.string().min(1, 'required'),
    delai: z.string().min(1, 'required'),
    /** DA, optional. Kept as text while typed. */
    budget: z.string().trim().regex(/^\d*$/, 'integer'),
    typeBesoin: z.string().min(1, 'required'),
    frequence: z.string(),
    criteres: z.string(),
  })
  // Required with a recurrent contract, and only then (the API refuses it otherwise).
  .refine((v) => v.typeBesoin !== 'recurrent' || v.frequence !== '', {
    path: ['frequence'],
    message: 'required',
  });
export type AppelOffresForm = z.infer<typeof appelOffresFormSchema>;

/** `POST /appels-offres` — no `title`: the backend names the demand after the services picked. */
export interface AppelOffresPayload {
  categoryCode: string;
  subCategoryCodes: string[];
  description: string;
  wilaya: string;
  /** `formulaire.delais[].code`, turned into `dateSouhaitee` by the backend. */
  delai: string;
  budgetMaxDzd?: number;
  /** `formulaire.typesBesoin[].valeur` — a number. */
  cadence: number;
  /** `formulaire.frequences[].valeur`, only with the recurrent cadence. */
  frequence?: number;
  criteresSelection?: string;
}

/** 201 — the demand at S1 « En attente ». */
export const appelOffresCreatedSchema = z.object({
  id: z.string(),
  canonicalStatus: z.string().nullish(),
  statusLabel: z.string().nullish(),
  resource: z.object({ title: z.string().nullish() }).nullish(),
});
export type AppelOffresCreated = z.infer<typeof appelOffresCreatedSchema>;

/** The guide's numbers, used only if the pickers could not be loaded. */
const CADENCE_FALLBACK: Record<string, number> = { ponctuel: 1, recurrent: 2 };

/**
 * The send body from the form. `cadence` / `frequence` are the pickers'
 * numbers; `frequence` goes only with the recurrent cadence (the API refuses it
 * otherwise); `title` is left out so the backend names the demand after the
 * services; optional text is left out when blank.
 */
export function buildAppelOffresPayload(
  form: AppelOffresForm,
  categoryCode: string,
  subCategoryCodes: string[],
  formulaire: Formulaire | undefined,
): AppelOffresPayload {
  const cadence =
    formulaire?.typesBesoin.find((o) => o.code === form.typeBesoin)?.valeur ??
    CADENCE_FALLBACK[form.typeBesoin] ??
    1;
  const frequence =
    form.typeBesoin === 'recurrent'
      ? (formulaire?.frequences.find((o) => o.code === form.frequence)?.valeur ?? undefined)
      : undefined;
  const criteres = form.criteres.trim();
  return {
    categoryCode,
    subCategoryCodes,
    description: form.description.trim(),
    wilaya: form.wilaya,
    delai: form.delai,
    cadence,
    ...(form.budget ? { budgetMaxDzd: Number(form.budget) } : {}),
    ...(frequence !== undefined ? { frequence } : {}),
    ...(criteres ? { criteresSelection: criteres } : {}),
  };
}
