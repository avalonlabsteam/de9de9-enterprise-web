import { useMemo, useState } from 'react';
import { useL } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

/** dd/mm/yyyy for display, ISO (yyyy-mm-dd) as the value sent to the backend. */
function candidateDates(): { iso: string; label: string }[] {
  const out: { iso: string; label: string }[] = [];
  const base = new Date();
  for (const offset of [7, 14, 30, 60]) {
    const d = new Date(base);
    d.setDate(d.getDate() + offset);
    const iso = d.toISOString().slice(0, 10);
    const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    out.push({ iso, label });
  }
  return out;
}

export function AddRecurrenceSheet({
  open,
  onOpenChange,
  mode,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'reschedule';
  onConfirm: (date: string) => void;
}) {
  const L = useL();
  const dates = useMemo(() => candidateDates(), []);
  const [selected, setSelected] = useState<string | null>(null);

  const title =
    mode === 'add'
      ? L('Ajouter une récurrence', 'إضافة تكرار')
      : L("Reprogrammer l'occurrence", 'إعادة جدولة الموعد');

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) setSelected(null);
        onOpenChange(o);
      }}
    >
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {L('Choisissez une date proposée.', 'اختر تاريخاً مقترحاً.')}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          <p className="mb-2 text-[13px] font-bold text-de9-ink">
            {L('Date proposée', 'التاريخ المقترح')}
          </p>
          <div className="flex flex-wrap gap-2">
            {dates.map((d) => (
              <button
                key={d.iso}
                type="button"
                onClick={() => setSelected(d.iso)}
                className={cn(
                  'rounded-full border px-3.5 py-2 text-[13px] font-bold transition-colors',
                  selected === d.iso
                    ? 'border-de9-teal-dark bg-[#E5F7F4] text-de9-teal-dark dark:bg-[#14322E]'
                    : 'border-de9-line bg-card text-de9-ink hover:border-de9-teal',
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <SheetFooter>
          <Button
            className="w-full bg-de9-teal-dark text-white hover:bg-de9-teal-dark/90"
            disabled={!selected}
            onClick={() => {
              if (!selected) return;
              onConfirm(selected);
              setSelected(null);
              onOpenChange(false);
            }}
          >
            {mode === 'add'
              ? L("Ajouter l'occurrence", 'إضافة الموعد')
              : L('Reprogrammer', 'إعادة الجدولة')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
