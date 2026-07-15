import type { CategoryColorKey } from '@/types/catalogue'

/**
 * The four-way service-family colour coding used across de9de9
 * (NOIR / BLEU / VERT / ROUGE), ported from the Flutter design system.
 *
 * Each family is tagged with one of these keys; catalogue cards and detail
 * headers derive their accent + soft background from here. A lifted `darkAccent`
 * keeps the coding legible on dark surfaces.
 */
export interface CategoryColorDef {
  key: CategoryColorKey
  label: string
  /** Accent for icons / badges / headers in light mode. */
  main: string
  /** Soft tinted background that pairs with `main` in light mode. */
  soft: string
  /** Lifted accent that stays legible on dark surfaces. */
  darkAccent: string
}

export const CATEGORY_COLORS: Record<CategoryColorKey, CategoryColorDef> = {
  noir: {
    key: 'noir',
    label: 'NOIR',
    main: '#2D3340',
    soft: '#ECEEF1',
    darkAccent: '#B6BEC8',
  },
  bleu: {
    key: 'bleu',
    label: 'BLEU',
    main: '#2F9BE0',
    soft: '#EAF2FD',
    darkAccent: '#5BB6F0',
  },
  vert: {
    key: 'vert',
    label: 'VERT',
    main: '#46B3AA',
    soft: '#E5F7F4',
    darkAccent: '#5FC9C0',
  },
  rouge: {
    key: 'rouge',
    label: 'ROUGE',
    main: '#E7464E',
    soft: '#FDECEC',
    darkAccent: '#FF6B72',
  },
}

/** Hex → rgba with alpha, for tinted dark surfaces. */
function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** Accent colour for the active theme. */
export function accentOn(key: CategoryColorKey, dark: boolean): string {
  const c = CATEGORY_COLORS[key]
  return dark ? c.darkAccent : c.main
}

/** Tinted surface that pairs with the accent for the active theme. */
export function surfaceOn(key: CategoryColorKey, dark: boolean): string {
  const c = CATEGORY_COLORS[key]
  return dark ? withAlpha(c.darkAccent, 0.16) : c.soft
}

/** Label colour for a solid category chip in the active theme. */
export function onBadgeOn(_key: CategoryColorKey, dark: boolean): string {
  return dark ? '#11151C' : '#FFFFFF'
}
