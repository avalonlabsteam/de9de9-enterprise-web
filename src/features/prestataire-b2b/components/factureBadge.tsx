import type { BadgeKind } from '@/lib/statusModel';
import type { B2bJob, FactureStatus } from '../schemas/b2b';

export interface FactureBadgeInfo {
  fr: string;
  ar: string;
  kind: BadgeKind;
}

const FACTURE_BADGE: Record<FactureStatus, FactureBadgeInfo> = {
  none: { fr: 'Aucune facture', ar: 'لا توجد فاتورة', kind: 'info' },
  envoyee: { fr: 'Facture déposée', ar: 'تم إيداع الفاتورة', kind: 'wait' },
  recue: { fr: 'Facture déposée', ar: 'تم إيداع الفاتورة', kind: 'wait' },
  contestee: { fr: 'Facture contestée', ar: 'فاتورة متنازع عليها', kind: 'action' },
  approuvee: { fr: 'Facture approuvée', ar: 'فاتورة موافق عليها', kind: 'done' },
};

/** Facture badge per §7.12 — "Payée" once the mission is settled. */
export function factureBadge(job: B2bJob): FactureBadgeInfo {
  if (job.status === 'paid') return { fr: 'Payée', ar: 'مدفوعة', kind: 'done' };
  return FACTURE_BADGE[job.factureStatus];
}
