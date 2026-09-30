import type { FicheBody, WorkerProfile } from '../schemas/worker';

/** The five fields of « Fiche — éditable ». */
export type FicheField = 'role' | 'heures' | 'tarif' | 'whatsApp' | 'skill';
export type Drafts = Partial<Record<FicheField, string>>;

/** The fiche as the inputs show it. */
export const shownOf = (p: WorkerProfile): Record<FicheField, string> => ({
  role: p.role ?? '',
  heures: p.heuresParSemaine?.toString() ?? '',
  tarif: p.tarifHoraireDzd?.toString() ?? '',
  whatsApp: p.whatsApp ?? '',
  skill: p.skill ?? '',
});

/**
 * The WHOLE fiche to PUT — the save replaces all five fields: the profile's
 * own values (the rate in credits, as stored), with the edited fields over
 * them. The field at fault when a typed value is not acceptable.
 */
export function ficheBody(p: WorkerProfile, drafts: Drafts): { body: FicheBody } | { invalid: FicheField } {
  const body: FicheBody = {
    role: p.role ?? null,
    weeklyHours: p.heuresParSemaine ?? null,
    hourlyRateCredits: p.tarifHoraireCredits ?? null,
    whatsAppPhone: p.whatsApp ?? null,
    skill: p.skill ?? null,
  };
  for (const [field, raw] of Object.entries(drafts) as [FicheField, string][]) {
    const v = raw.trim();
    if (field === 'heures') {
      const n = Number(v);
      if (v !== '' && (!Number.isInteger(n) || n < 0 || n > 168)) return { invalid: field };
      body.weeklyHours = v === '' ? null : n;
    } else if (field === 'tarif') {
      const n = Number(v.replace(',', '.'));
      if (v !== '' && (!Number.isFinite(n) || n < 0)) return { invalid: field };
      // The API counts in credits: 1 DA = 10 crédits.
      body.hourlyRateCredits = v === '' ? null : Math.round(n * 10);
    } else if (field === 'role') body.role = v || null;
    else if (field === 'whatsApp') body.whatsAppPhone = v || null;
    else body.skill = v || null;
  }
  return { body };
}
