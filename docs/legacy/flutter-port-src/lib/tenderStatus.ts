import type { TenderStatus } from '@/types/client'

/** Visual + i18n metadata for each suivi status. `hex` drives badges/steppers. */
export const STATUS_META: Record<
  TenderStatus,
  { i18nKey: string; hex: string }
> = {
  enAttente: { i18nKey: 'status.enAttente', hex: '#9AA4B2' },
  contacte: { i18nKey: 'status.contacte', hex: '#2F9BE0' },
  assigne: { i18nKey: 'status.assigne', hex: '#7C5CFC' },
  enCours: { i18nKey: 'status.enCours', hex: '#46B3AA' },
  termine: { i18nKey: 'status.termine', hex: '#3FB36B' },
}
