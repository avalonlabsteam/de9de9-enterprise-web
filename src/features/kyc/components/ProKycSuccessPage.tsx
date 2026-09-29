import { Navigate } from 'react-router-dom';
import { useT, useL } from '@/lib/i18n';
import { useKycState } from '../api/kyc';
import { KycSuccess } from './KycSuccess';

export function ProKycSuccessPage() {
  const t = useT();
  const L = useL();
  const { verified, inReview } = useKycState();
  // Rejected, or never filed: nothing was sent that this page could confirm.
  if (!verified && !inReview) return <Navigate to="/onboarding/kyc" replace />;
  return verified ? (
    <KycSuccess
      variant="verified"
      title={t('kycOkTitle')}
      body={L('Vous pouvez maintenant publier vos annonces.', 'يمكنك الآن نشر إعلاناتك.')}
      ctaLabel={t('kycGoDashboard')}
      ctaTo="/prestataire"
    />
  ) : (
    <KycSuccess
      variant="pending"
      title={t('kycSentTitle')}
      body={L('Votre dossier KYC est en cours de revue…', 'ملف التحقق الخاص بك قيد المراجعة…')}
      ctaLabel={t('kycGoDashboard')}
      ctaTo="/prestataire"
    />
  );
}
