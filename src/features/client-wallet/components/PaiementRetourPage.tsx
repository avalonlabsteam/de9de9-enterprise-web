import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useL } from '@/lib/i18n';
import { toProblem } from '@/api/problem';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { paiementKey, paiementsKey, resoudreRetour, storedPaiementId } from '../api/paiements';

const pagePath = (id: string) => `/client/wallet/paiements/${encodeURIComponent(id)}`;

/**
 * Back from the bank's card page (`/client/wallet/paiement/retour`). This page
 * only finds out WHICH payment it is, then hands over to the payment page. It
 * never reads an outcome off its address: what the redirect carries is a lookup
 * hint at most.
 */
export function PaiementRetourPage() {
  const L = useL();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  // 1. The payment this tab sent to the bank.
  const [stored] = useState(storedPaiementId);

  // 2. Otherwise one lookup, in this company only. GuiddiniPay's parameter names are not settled: take the likely ones.
  const orderNumber = params.get('orderNumber') ?? params.get('order_number');
  const orderId = params.get('orderId') ?? params.get('order_id') ?? params.get('mdOrder');
  const lookup = useQuery({
    queryKey: [...paiementsKey, 'retour', orderNumber ?? '', orderId ?? ''],
    enabled: !stored,
    retry: false,
    staleTime: Infinity,
    queryFn: async () => {
      const paiement = await resoudreRetour({ orderNumber, orderId });
      // The payment page starts from this answer, then polls on.
      queryClient.setQueryData(paiementKey(paiement.id), paiement);
      return paiement;
    },
  });

  const foundId = lookup.data?.id;
  useEffect(() => {
    if (foundId) navigate(pagePath(foundId), { replace: true });
  }, [foundId, navigate]);

  // The address then survives a refresh.
  if (stored) return <Navigate to={pagePath(stored)} replace />;

  if (lookup.isError) {
    const problem = toProblem(lookup.error);
    const introuvable = problem.status === 404;
    return (
      <div className="mx-auto max-w-[640px]">
        <EmptyState
          title={
            introuvable
              ? (problem.detail ?? L('Ce paiement est introuvable.', 'هذا الدفع غير موجود.'))
              : L('Impossible de retrouver le paiement', 'تعذّر العثور على الدفع')
          }
          description={
            introuvable
              ? undefined
              : L(
                  'Si votre carte a été débitée, votre portefeuille sera crédité dès la confirmation de la banque.',
                  'إذا تم الخصم من بطاقتك، فستُضاف الأرصدة إلى محفظتك فور تأكيد البنك.',
                )
          }
          action={
            <div className="flex gap-2">
              {!introuvable && (
                <Button size="sm" onClick={() => void lookup.refetch()}>
                  {L('Réessayer', 'إعادة المحاولة')}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => navigate('/client/wallet')}>
                {L('Retour au portefeuille', 'العودة إلى المحفظة')}
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[640px] flex-col items-center gap-3 py-16 text-center">
      <Loader2 className="size-8 animate-spin text-de9-teal" />
      <p className="text-[14px] font-semibold text-de9-ink">{L('Vérification du paiement…', 'جارٍ التحقق من الدفع…')}</p>
    </div>
  );
}
