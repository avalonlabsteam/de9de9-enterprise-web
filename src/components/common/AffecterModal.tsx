import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@/api/apiClient';
import { cn } from '@/lib/utils';
import { useL } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

const workerSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  available: z.boolean(),
  colorHex: z.string(),
  status: z.string().optional(),
  type: z.enum(['pro', 'salarie']).optional(),
});
const workersSchema = z.array(workerSchema);
type AffecterWorker = z.infer<typeof workerSchema>;

function useWorkers(enabled: boolean) {
  return useQuery({
    queryKey: ['workers'],
    enabled,
    queryFn: async () => {
      const res = await apiClient.get('/workers');
      return workersSchema.parse(res.data);
    },
  });
}

export function AffecterModal({
  open,
  onOpenChange,
  assignedIds = [],
  onConfirm,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignedIds?: string[];
  onConfirm: (ids: string[]) => void;
  title?: string;
}) {
  const L = useL();
  const { data: workers, isPending, isError } = useWorkers(open);

  const [selected, setSelected] = useState<string[]>(assignedIds);
  const [search, setSearch] = useState('');
  const [conflictView, setConflictView] = useState(false);

  // Reset local state each time the modal opens.
  useEffect(() => {
    if (open) {
      setSelected(assignedIds);
      setSearch('');
      setConflictView(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const selectable = useMemo(
    () => (workers ?? []).filter((w) => w.status !== 'empty' && w.name !== '—'),
    [workers],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return selectable;
    return selectable.filter((w) => w.name.toLowerCase().includes(q));
  }, [selectable, search]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  const hasConflict = useMemo(
    () => selectable.some((w) => selected.includes(w.id) && w.available === false),
    [selectable, selected],
  );

  function handleAffecterClick() {
    if (hasConflict) {
      setConflictView(true);
      return;
    }
    onConfirm(selected);
    onOpenChange(false);
  }

  function confirmDespiteConflict() {
    onConfirm(selected);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title ?? L('Affecter un ou plusieurs ouvriers', 'تعيين عامل أو عدة عمال')}</DialogTitle>
          <DialogDescription>
            {conflictView
              ? L("Conflit d'horaire", 'تعارض في المواعيد')
              : L('Sélectionnez les membres à affecter à cette tâche.', 'اختر الأعضاء لتعيينهم لهذه المهمة.')}
          </DialogDescription>
        </DialogHeader>

        {conflictView ? (
          <div className="flex flex-col gap-3 py-2">
            <p className="text-sm text-muted-foreground">
              {L(
                'Ce professionnel a déjà une tâche sur ce créneau. Voulez-vous continuer malgré le conflit ?',
                'هذا المحترف لديه مهمة أخرى في هذا الموعد. هل تريد المتابعة رغم التعارض؟',
              )}
            </p>
            <div className="flex flex-col gap-2">
              {selectable
                .filter((w) => selected.includes(w.id) && w.available === false)
                .map((w) => (
                  <div key={w.id} className="flex items-center gap-2.5">
                    <WorkerAvatar worker={w} size={28} />
                    <span className="text-sm font-medium text-foreground">{w.name}</span>
                    <span className="ms-auto rounded-full bg-[#FDECEC] px-2 py-0.5 text-[11px] font-bold text-de9-red dark:bg-[#331A1C] dark:text-[#FF7A80]">
                      {L("Conflit d'horaire", 'تعارض في المواعيد')}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={L('Rechercher un membre…', 'ابحث عن عضو…')}
            />
            <div className="flex max-h-72 flex-col gap-1 overflow-y-auto">
              {isPending ? (
                <p className="py-6 text-center text-sm text-muted-foreground">{L('Chargement…', 'جارٍ التحميل…')}</p>
              ) : isError ? (
                <EmptyState
                  title={L('Impossible de charger les membres', 'تعذر تحميل الأعضاء')}
                  description={L('Réessayez plus tard.', 'حاول مرة أخرى لاحقًا.')}
                />
              ) : filtered.length === 0 ? (
                <EmptyState
                  title={L('Aucun membre trouvé', 'لم يتم العثور على أعضاء')}
                  description={L('Ajustez votre recherche.', 'عدّل بحثك.')}
                />
              ) : (
                filtered.map((w: AffecterWorker) => {
                  const checked = selected.includes(w.id);
                  return (
                    <button
                      type="button"
                      key={w.id}
                      onClick={() => toggle(w.id)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg border p-2.5 text-start transition-colors',
                        checked ? 'border-de9-teal-dark bg-de9-teal/10' : 'border-border hover:bg-muted',
                      )}
                    >
                      <Checkbox checked={checked} className="pointer-events-none" tabIndex={-1} />
                      <WorkerAvatar worker={w} size={34} />
                      <div className="flex min-w-0 flex-col">
                        <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                          <span className="truncate">{w.name}</span>
                          {w.type === 'salarie' && (
                            <span className="shrink-0 rounded-full bg-de9-teal/15 px-1.5 py-0.5 text-[10px] font-bold text-de9-teal-dark">
                              🤝 de9de9
                            </span>
                          )}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">{w.role}</span>
                      </div>
                      {w.available === false && (
                        <span className="ms-auto shrink-0 rounded-full bg-[#FEF6E9] px-2 py-0.5 text-[10px] font-bold text-[#B9781A] dark:bg-[#33280F] dark:text-[#E0A82E]">
                          {L('Occupé', 'مشغول')}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {conflictView ? (
            <>
              <Button variant="outline" onClick={() => setConflictView(false)}>
                {L('Revenir', 'رجوع')}
              </Button>
              <Button onClick={confirmDespiteConflict}>{L('Continuer', 'متابعة')}</Button>
            </>
          ) : (
            <Button onClick={handleAffecterClick} disabled={selected.length === 0}>
              {L('Affecter', 'تعيين')} ({selected.length})
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
