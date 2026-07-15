import { CREDITS_PER_DZD } from '@/types/client'

/** Format a DZD amount with thin spaces, e.g. 180000 → "180 000 DZD". */
export function formatDzd(amount: number): string {
  return `${amount.toLocaleString('fr-DZ').replace(/,/g, ' ')} DZD`
}

/** Format a credit amount, e.g. 2350000 → "2 350 000 crédits". */
export function formatCredits(credits: number): string {
  return `${credits.toLocaleString('fr-DZ').replace(/,/g, ' ')} crédits`
}

/** Credits → DZD equivalent string. */
export function creditsToDzd(credits: number): string {
  return formatDzd(Math.round(credits / CREDITS_PER_DZD))
}

/** Format an ISO date string for the active language. */
export function formatDate(iso: string, lang: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-DZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
