import { useL } from '@/lib/i18n';
import { KycForm } from './KycForm';

export function ProKycPage() {
  const L = useL();
  return (
    <KycForm
      kycKey="pres:1"
      successPath="/onboarding/kyc/success"
      subtitle={L(
        "La vérification KYC débloque la publication d'annonces et la création de comptes professionnels.",
        'يفتح التحقق من الهوية نشر الإعلانات وإنشاء الحسابات المهنية.',
      )}
    />
  );
}
