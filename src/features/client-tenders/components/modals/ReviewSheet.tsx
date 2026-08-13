import { useState } from 'react';
import { Star } from 'lucide-react';
import { useL } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { ReviewInput } from '../../schemas/tender';

export function ReviewSheet({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (input: ReviewInput) => void;
}) {
  const L = useL();
  const [note, setNote] = useState(0);
  const [comment, setComment] = useState('');

  const reset = () => {
    setNote(0);
    setComment('');
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
          <div className="mx-auto mt-2 grid size-[66px] place-items-center rounded-full bg-de9-teal text-white">
            <Star className="size-8" />
          </div>
          <SheetTitle className="text-center text-de9-teal-dark">
            {L('Évaluer la prestation', 'تقييم الخدمة')}
          </SheetTitle>
          <SheetDescription className="text-center text-xs font-semibold">
            {L('Votre retour nous aide à améliorer le service.', 'ملاحظاتك تساعدنا على تحسين الخدمة.')}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
          <div>
            <Label className="mb-2 block">{L('Votre note', 'تقييمك')}</Label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={`${n}`}
                  onClick={() => setNote(n)}
                  className="p-0.5"
                >
                  <Star
                    className={cn(
                      'size-8 transition-colors',
                      n <= note ? 'fill-de9-orange-deep text-de9-orange-deep' : 'text-de9-line',
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="review-comment" className="mb-2 block">
              {L('Commentaire (optionnel)', 'تعليق (اختياري)')}
            </Label>
            <Textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <SheetFooter>
          <Button
            className="w-full bg-de9-teal text-white shadow-glow hover:bg-de9-teal-dark"
            disabled={note < 1}
            onClick={() => {
              if (note < 1) return;
              onConfirm({ note, comment: comment.trim() || undefined });
              reset();
              onOpenChange(false);
            }}
          >
            {L('Envoyer mon avis', 'إرسال تقييمي')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
