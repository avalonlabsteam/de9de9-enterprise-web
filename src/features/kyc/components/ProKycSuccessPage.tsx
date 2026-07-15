import { useT, useL } from '@/lib/i18n';
import { KycSuccess } from './KycSuccess';

export function ProKycSuccessPage() {
  const t = useT();
  const L = useL();
  return (
    <KycSuccess
      variant="pending"
      title={t('kycSentTitle')}
      body={L('Votre dossier KYC est en cours de revue…', 'ملف التحقق الخاص بك قيد المراجعة…')}
      ctaLabel={t('kycGoDashboard')}
      ctaTo="/prestataire"
    />
  );
}
