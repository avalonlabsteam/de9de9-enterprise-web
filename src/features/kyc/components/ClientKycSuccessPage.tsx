import { useT, useL } from '@/lib/i18n';
import { KycSuccess } from './KycSuccess';

export function ClientKycSuccessPage() {
  const t = useT();
  const L = useL();
  return (
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
  );
}
