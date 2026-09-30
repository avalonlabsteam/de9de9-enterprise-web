import { useLangStore, type Lang } from '@/stores/langStore';
import { tonePill } from '@/lib/tones';
import type { Categorie } from '../schemas/alerte';

/** The chip labels — fixed; the API sends only the code (common guide §1.2). */
export const CATEGORIE_LABEL: Record<Categorie, [fr: string, ar: string]> = {
  demandes: ['Demandes', 'الطلبات'],
  commandes: ['Commandes', 'الطلبيات'],
  factures: ['Factures', 'الفواتير'],
  credits: ['Crédits', 'الرصيد'],
  kyc: ['KYC', 'التوثيق'],
  equipe: ['Équipe', 'الفريق'],
  compte: ['Compte', 'الحساب'],
  b2c: ['Particuliers', 'الخواص'],
  avis: ['Avis', 'التقييمات'],
  autre: ['Autres', 'أخرى'],
};

/**
 * `ton` is a meaning (common guide §1.3): action · alerte · succes · info, in
 * the app's palette — the same tints as every other tone of the API.
 */
export const tonTile = (ton: string): string => tonePill(ton === 'alerte' ? 'danger' : ton);

const TON_EDGE: Record<string, string> = {
  action: 'border-s-violet-500',
  alerte: 'border-s-de9-red',
  succes: 'border-s-de9-teal',
  info: 'border-s-de9-blue',
};
export const tonEdge = (ton: string): string => TON_EDGE[ton] ?? TON_EDGE.info;

/** How long a live alert's toast stays (common guide §7.1). */
export const toastDuration = (ton: string): number => (ton === 'action' || ton === 'alerte' ? 8_000 : 4_000);

/** A bilingual string outside React (toasts, live events). */
export const lNow = (fr: string, ar: string): string => (useLangStore.getState().lang === 'ar' ? ar : fr);

/**
 * « il y a 5 min », « hier » — printed by the app from `creeLe`; a week on,
 * the date itself.
 */
export function depuisLabel(iso: string, lang: Lang, now = Date.now()): string {
  const at = Date.parse(iso);
  if (Number.isNaN(at)) return '';
  const seconds = (at - now) / 1000;
  const past = Math.abs(seconds);
  if (past < 45) return lang === 'ar' ? 'الآن' : "à l'instant";
  const locale = lang === 'ar' ? 'ar-DZ' : 'fr';
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' });
  if (past < 3_600) return rtf.format(Math.round(seconds / 60), 'minute');
  if (past < 86_400) return rtf.format(Math.round(seconds / 3_600), 'hour');
  if (past < 7 * 86_400) return rtf.format(Math.round(seconds / 86_400), 'day');
  return new Date(at).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** « 99+ » above 99. */
export const badgeCount = (n: number): string => (n > 99 ? '99+' : String(n));
