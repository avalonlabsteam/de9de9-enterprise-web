import { useL } from '@/lib/i18n';
import { KycForm } from './KycForm';

export function ClientKycPage() {
  const L = useL();
  return (
    <KycForm
      kycKey="client"
      successPath="/client/kyc/success"
      subtitle={L(
        'Importez RC · NIF · NIS pour débloquer la publication.',
        'قم بتحميل السجل التجاري · NIF · NIS لفتح النشر.',
      )}
    />
  );
}
