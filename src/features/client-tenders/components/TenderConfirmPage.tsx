import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useT, useL } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';

export function TenderConfirmPage() {
  const t = useT();
  const L = useL();
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <Card className="animate-slide-up">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <StatusBadge label={L('En attente', 'قيد الانتظار')} kind="setup" />
          <div className="flex size-16 items-center justify-center rounded-full bg-[#E5F7F4] dark:bg-[#14322E]">
            <CheckCircle2 className="size-9 text-de9-teal-dark" />
          </div>
          <h1 className="text-xl font-extrabold text-de9-ink">{t('confirmTitle')}</h1>
          <p className="max-w-sm text-[14px] text-de9-slate">{t('confirmBody')}</p>
          <Button
            className="mt-2 w-full bg-de9-teal-dark text-white hover:bg-de9-teal-dark/90"
            onClick={() => navigate('/client/tenders')}
          >
            {t('seeSuivi')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
