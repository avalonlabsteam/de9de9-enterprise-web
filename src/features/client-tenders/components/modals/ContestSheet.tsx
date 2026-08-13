import { useState } from 'react';
import { FileWarning } from 'lucide-react';
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
import { PieceSlot, type PieceFile } from '@/components/common/PieceSlot';
import { CONTEST_MOTIFS, type ContestInput } from '../../schemas/tender';

export function ContestSheet({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (input: ContestInput) => void;
}) {
  const L = useL();
  const [motif, setMotif] = useState<(typeof CONTEST_MOTIFS)[number] | null>(null);
  const [proof, setProof] = useState<PieceFile | null>(null);

  const reset = () => {
    setMotif(null);
    setProof(null);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader className="items-center text-center">
          <div className="mx-auto mt-2 grid size-[66px] place-items-center rounded-full bg-de9-red text-white">
            <FileWarning className="size-8" />
          </div>
          <SheetTitle className="text-center text-de9-red">
            {L('Contester la facture', 'الاعتراض على الفاتورة')}
          </SheetTitle>
          <SheetDescription className="text-center text-xs font-semibold">
            {L('Indiquez le motif de votre contestation.', 'حدّد سبب اعتراضك.')}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
          <div className="flex flex-col gap-2">
            {CONTEST_MOTIFS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMotif(m)}
                className={cn(
                  'rounded-lg px-3.5 py-3 text-start text-[13px] font-bold transition-shadow',
                  motif === m
                    ? 'bg-accent text-de9-teal-dark shadow-soft'
                    : 'bg-card text-de9-ink shadow-soft hover:shadow-lift dark:ring-1 dark:ring-border',
                )}
              >
                {m}
              </button>
            ))}
          </div>

          <PieceSlot
            label={L('Joindre une preuve', 'إرفاق دليل')}
            hint={L('PDF ou photo (optionnel)', 'PDF أو صورة (اختياري)')}
            value={proof}
            onChange={setProof}
            fileName="preuve.pdf"
          />
        </div>

        <SheetFooter>
          <Button
            className="w-full bg-de9-red text-white hover:bg-de9-red/90"
            disabled={!motif}
            onClick={() => {
              if (!motif) return;
              onConfirm({ motif, proof });
              reset();
              onOpenChange(false);
            }}
          >
            {L('Envoyer la contestation', 'إرسال الاعتراض')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
