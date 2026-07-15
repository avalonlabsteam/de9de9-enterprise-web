import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useL } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/common/EmptyState';
import { WorkerAvatar } from '@/components/common/WorkerAvatar';
import { useProsWithJobs } from '../api/annonces';
import { useAnnonceDraftStore } from '../stores/annonceDraftStore';

export function AssignAnnoncePage() {
  const L = useL();
  const navigate = useNavigate();
  const { data, isPending, isError } = useProsWithJobs();
  const storeSelected = useAnnonceDraftStore((s) => s.selectedProIds);
  const setSelectedProIds = useAnnonceDraftStore((s) => s.setSelectedProIds);
  const [selected, setSelected] = useState<string[]>(storeSelected);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const validate = () => {
    setSelectedProIds(selected);
    navigate(-1);
  };

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-5">
      <header className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          aria-label={L('Retour', 'رجوع')}
        >
          <ArrowLeft className="size-5 rtl:rotate-180" />
        </Button>
        <div>
          <h1 className="text-[22px] font-black text-de9-ink">{L("Affecter l'annonce", 'تعيين الإعلان')}</h1>
          <p className="mt-0.5 text-[13px] text-de9-gray">
            {L(
              'Sélectionnez le ou les professionnels qui auront cette annonce.',
              'اختر المحترف أو المحترفين الذين سيحصلون على هذا الإعلان.',
            )}
          </p>
        </div>
      </header>

      {isPending && (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-secondary" />
          ))}
        </div>
      )}

      {isError && (
        <EmptyState
          title={L('Impossible de charger les professionnels', 'تعذّر تحميل المحترفين')}
          description={L('Réessayez plus tard.', 'أعد المحاولة لاحقًا.')}
        />
      )}

      {data && data.length === 0 && (
        <EmptyState title={L('Aucun professionnel disponible', 'لا يوجد محترف متاح')} />
      )}

      {data && data.length > 0 && (
        <div className="flex flex-col gap-2">
          {data.map((p) => {
            const checked = selected.includes(p.id);
            return (
              <label
                key={p.id}
                className="flex cursor-pointer items-center gap-3 rounded-2xl border border-de9-line bg-card px-4 py-3 transition-colors hover:bg-de9-row"
              >
                <WorkerAvatar worker={{ name: p.name }} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-bold text-de9-ink">{p.name}</p>
                  <p className="truncate text-[12px] text-de9-gray">{p.role}</p>
                </div>
                <Checkbox checked={checked} onCheckedChange={() => toggle(p.id)} />
              </label>
            );
          })}
        </div>
      )}

      <div className="sticky bottom-0 -mx-4 border-t border-de9-line bg-card/95 px-4 py-3 backdrop-blur">
        <Button className="w-full" onClick={validate}>
          {L('Valider', 'تأكيد')} ({selected.length})
        </Button>
      </div>
    </div>
  );
}
