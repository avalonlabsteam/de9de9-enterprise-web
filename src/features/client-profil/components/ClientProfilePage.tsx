import { useNavigate } from 'react-router-dom';
import { CreditCard } from 'lucide-react';
import { useL } from '@/lib/i18n';
import { ProfilPage } from '@/features/profil/components/ProfilPage';

/** The client's profile: the shared page, with the wallet as its own row. */
export function ClientProfilePage() {
  const L = useL();
  const navigate = useNavigate();

  return (
    <ProfilPage
      titre={L('Profil', 'الملف الشخصي')}
      espace={L('Espace client', 'مساحة العميل')}
      kycPath="/client/kyc"
      rows={[
        {
          key: 'abo',
          icon: CreditCard,
          label: L('Abonnement & crédits', 'الاشتراك والرصيد'),
          onClick: () => navigate('/client/wallet'),
        },
      ]}
    />
  );
}
