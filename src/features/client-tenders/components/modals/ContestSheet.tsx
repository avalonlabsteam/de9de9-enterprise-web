import { useState } from 'react';
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
        <SheetHeader>
          <SheetTitle>{L('Contester la facture', 'الاعتراض على الفاتورة')}</SheetTitle>
          <SheetDescription>
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
                  'rounded-xl border px-3.5 py-3 text-start text-[13px] font-bold transition-colors',
                  motif === m
                    ? 'border-de9-teal-dark bg-[#E5F7F4] text-de9-teal-dark dark:bg-[#14322E]'
                    : 'border-de9-line bg-card text-de9-ink hover:border-de9-teal',
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
