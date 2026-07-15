import { useEffect, useState } from 'react';
import { useL } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/common/EmptyState';
import { WorkerAvatar } from '@/components/common/WorkerAvatar';
import { useProsWithJobs } from '../api/annonces';
import { useAnnonceDraftStore } from '../stores/annonceDraftStore';

/**
 * In-page "Affecter à un professionnel" step for the create-annonce flow.
 * Rendered as a modal (NOT a separate route) so the create form's local state
 * survives — navigating to a sibling route would unmount and wipe it.
 */
export function AssignAnnonceModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const L = useL();
  const { data, isPending, isError } = useProsWithJobs();
  const storeSelected = useAnnonceDraftStore((s) => s.selectedProIds);
  const setSelectedProIds = useAnnonceDraftStore((s) => s.setSelectedProIds);
  const [selected, setSelected] = useState<string[]>(storeSelected);

  // Re-sync local checkboxes with the store each time the modal opens.
  useEffect(() => {
    if (open) setSelected(storeSelected);
  }, [open, storeSelected]);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const validate = () => {
    setSelectedProIds(selected);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{L("Affecter l'annonce", 'تعيين الإعلان')}</DialogTitle>
          <DialogDescription>
            {L(
              'Sélectionnez le ou les professionnels qui auront cette annonce.',
              'اختر المحترف أو المحترفين الذين سيحصلون على هذا الإعلان.',
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[50vh] overflow-y-auto">
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
              {data.map((p) => (
                <label
                  key={p.id}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl border border-de9-line bg-card px-4 py-3 transition-colors hover:bg-de9-row"
                >
                  <WorkerAvatar worker={{ name: p.name }} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold text-de9-ink">{p.name}</p>
                    <p className="truncate text-[12px] text-de9-gray">{p.role}</p>
                  </div>
                  <Checkbox checked={selected.includes(p.id)} onCheckedChange={() => toggle(p.id)} />
                </label>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button className="w-full" onClick={validate}>
            {L('Valider', 'تأكيد')} ({selected.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
