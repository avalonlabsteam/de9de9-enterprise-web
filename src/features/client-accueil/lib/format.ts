import type { BadgeKind } from '@/lib/statusModel';
import type { DemandeRecente } from '@/features/auth/schemas/accueil';

/** 180000 -> « 180 000 » — append ' DA' at the call site. */
export const formatDa = (n: number) => n.toLocaleString('fr-FR');

export const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();

/**
 * `creeLe` as a short fr-FR date (12/09/2026) — numeric, so it reads the same
 * in both languages. A bare yyyy-mm-dd is read in UTC so it never slips a day.
 */
export function shortDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  return date.toLocaleDateString('fr-FR', {
    dateStyle: 'short',
    timeZone: dateOnly ? 'UTC' : undefined,
  });
}

/** The backend sends `statutLabel` in French; this is its Arabic, per step. */
const STATUT_AR: Record<string, string> = {
  S1: 'قيد الانتظار',
  S2: 'تم التواصل',
  S3: 'عرض السعر قيد الإعداد',
  S4: 'تم التعيين',
  S5: 'تم التعاقد',
};

export function statutLabelAr(demande: DemandeRecente): string {
  if (demande.annulee) return 'ملغاة';
  return STATUT_AR[demande.statut] ?? demande.statutLabel;
}

/** Same tints as « Mes demandes »: setup steps blue, contracted teal, cancelled neutral. */
export function demandeBadgeKind(demande: DemandeRecente): BadgeKind {
  if (demande.annulee) return 'cancelled';
  return demande.statut === 'S5' ? 'done' : 'setup';
}
