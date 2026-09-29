import { Navigate } from 'react-router-dom';
import { useT, useL } from '@/lib/i18n';
import { useKycState } from '../api/kyc';
import { KycSuccess } from './KycSuccess';

/** A just-submitted dossier is only pending: the verified copy waits for de9de9's verdict. */
export function ClientKycSuccessPage() {
  const t = useT();
  const L = useL();
  const { verified, inReview } = useKycState();
  // Rejected, or never filed: nothing was sent that this page could confirm.
  if (!verified && !inReview) return <Navigate to="/client/kyc" replace />;
  return verified ? (
    <KycSuccess
      variant="verified"
      title={t('kycOkTitle')}
      body={L(
        'Vous pouvez maintenant publier vos appels d’offres.',
        'يمكنك الآن نشر طلبات العروض الخاصة بك.',
      )}
      ctaLabel={t('kycBrowse')}
      ctaTo="/client"
    />
  ) : (
    <KycSuccess
      variant="pending"
      title={t('kycSentTitle')}
      body={L(
        'Votre dossier est en cours de vérification. Vous pourrez publier vos appels d’offres dès sa validation.',
        'ملفك قيد التحقق. ستتمكن من نشر طلبات العروض فور اعتماده.',
      )}
      ctaLabel={t('kycBrowse')}
      ctaTo="/client"
    />
  );
}
