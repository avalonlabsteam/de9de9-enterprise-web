import { StatusBadge } from '@/components/common/StatusBadge';
import { useL } from '@/lib/i18n';
import { useKycState } from '../api/kyc';

/**
 * Where the company's KYC stands, as a pill — beside « Vérification KYC » on
 * both profiles. The same four states as the topbar's button.
 */
export function KycBadge() {
  const L = useL();
  const kyc = useKycState();
  if (kyc.verified) return <StatusBadge label={L('Vérifiée', 'مُتحقّق')} kind="done" />;
  if (kyc.inReview) return <StatusBadge label={L('En cours', 'قيد التحقق')} kind="wait" />;
  if (kyc.rejected) return <StatusBadge label={L('À corriger', 'للتصحيح')} kind="action" />;
  return <StatusBadge label={L('À faire', 'للإنجاز')} kind="setup" />;
}
