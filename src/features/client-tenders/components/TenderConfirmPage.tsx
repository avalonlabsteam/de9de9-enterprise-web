import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useT, useL } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';

/**
 * « Appel d'offres envoyé ! » — the demand at S1. The pill is the `statusLabel`
 * the send answered with (passed as navigation state); « En attente » if the
 * page was reached otherwise.
 */
export function TenderConfirmPage() {
  const t = useT();
  const L = useL();
  const navigate = useNavigate();
  const { state } = useLocation() as { state: { statusLabel?: string | null } | null };
  const statusLabel = state?.statusLabel;

  return (
    <div className="mx-auto max-w-lg py-6">
      <Card className="animate-slide-up">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <StatusBadge
            label={statusLabel ? L(statusLabel, statusLabel === 'En attente' ? 'قيد الانتظار' : statusLabel) : L('En attente', 'قيد الانتظار')}
            kind="setup"
          />
          <div className="flex size-[66px] items-center justify-center rounded-full bg-de9-teal text-white">
            <CheckCircle2 className="size-9" />
          </div>
          <h1 className="text-xl font-extrabold text-de9-teal-dark">{t('confirmTitle')}</h1>
          <p className="max-w-sm text-xs font-semibold text-de9-slate">{t('confirmBody')}</p>
          <Button
            className="mt-2 w-full bg-de9-teal text-white shadow-glow hover:bg-de9-teal-dark"
            onClick={() => navigate('/client/tenders')}
          >
            {t('seeSuivi')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
