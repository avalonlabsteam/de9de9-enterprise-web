import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useL } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';

/**
 * What stands where a new demande would start while de9de9 suspends the
 * company's B2B access (guide 21 §13-14): the server's sentence and the way
 * back to « Mes demandes », whose contracts go on. Also what a saved link into
 * a category or the form lands on. `retour={false}` on the home, where the
 * menu beside it already leads there.
 */
export function AccesB2bSuspendu({ message, retour = true }: { message?: string | null; retour?: boolean }) {
  const L = useL();
  const navigate = useNavigate();
  return (
    <EmptyState
      icon={<Lock className="size-6" />}
      title={L('Nouvelles demandes suspendues', 'الطلبات الجديدة معلّقة')}
      description={
        message ||
        L(
          "L'accès B2B de votre entreprise est suspendu par l'administration de9de9 : vos contrats en cours se poursuivent, aucune nouvelle demande n'est possible.",
          'تم تعليق وصول مؤسستك إلى B2B من طرف إدارة de9de9: عقودك الجارية مستمرة، ولا يمكن إنشاء طلبات جديدة.',
        )
      }
      action={
        retour ? (
          <Button variant="outline" size="sm" onClick={() => navigate('/client/tenders')}>
            {L('Mes demandes', 'طلباتي')}
          </Button>
        ) : undefined
      }
    />
  );
}
