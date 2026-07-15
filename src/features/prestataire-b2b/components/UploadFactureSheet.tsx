import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { toast } from 'sonner';
import { useL } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { PieceSlot, type PieceFile } from '@/components/common/PieceSlot';
import { b2bUploadSchema, type B2bJob } from '../schemas/b2b';
import { useB2bAction } from '../api/b2b';

type B2bUploadValues = z.output<typeof b2bUploadSchema>;
type B2bUploadInput = z.input<typeof b2bUploadSchema>;

export function UploadFactureSheet({
  open,
  onOpenChange,
  job,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: B2bJob | null;
}) {
  const L = useL();
  const action = useB2bAction();
  const [file, setFile] = useState<PieceFile | null>(null);
  const [fileError, setFileError] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<B2bUploadInput, unknown, B2bUploadValues>({
    resolver: zodResolver(b2bUploadSchema),
    defaultValues: { montant: undefined, occRef: '' },
  });

  useEffect(() => {
    if (open) {
      reset({ montant: job?.factureAmountDzd, occRef: job?.occurrenceLabel ?? '' });
      setFile(null);
      setFileError(false);
    }
  }, [open, job, reset]);

  const onSubmit = (values: B2bUploadValues) => {
    if (!job) return;
    if (!file) {
      setFileError(true);
      return;
    }
    action.mutate(
      { id: job.id, action: 'upload', montant: values.montant },
      {
        onSuccess: () => {
          toast.success(L('Facture envoyée !', 'تم إرسال الفاتورة!'));
          onOpenChange(false);
        },
        onError: () => {
          toast.error(L("Échec de l'envoi", 'فشل الإرسال'));
        },
      },
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{L('Téléverser la facture', 'رفع الفاتورة')}</SheetTitle>
          {job && (
            <SheetDescription>
              {job.clientEntreprise} · {job.serviceName}
            </SheetDescription>
          )}
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="facture-montant">{L('Montant (DZD)', 'المبلغ (دج)')}</Label>
              <Input
                id="facture-montant"
                type="number"
                inputMode="numeric"
                min={1}
                placeholder="0"
                {...register('montant')}
              />
              {errors.montant && <p className="text-[12px] text-de9-red">{errors.montant.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="facture-ref">{L('Référence occurrence', 'مرجع التكرار')}</Label>
              <Input id="facture-ref" {...register('occRef')} />
              {errors.occRef && <p className="text-[12px] text-de9-red">{errors.occRef.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>{L('Facture', 'الفاتورة')}</Label>
              <PieceSlot
                label={L('Facture (PDF)', 'الفاتورة (PDF)')}
                hint={L('Importer le document', 'استيراد المستند')}
                value={file}
                onChange={(f) => {
                  setFile(f);
                  if (f) setFileError(false);
                }}
                fileName="facture.pdf"
              />
              {fileError && (
                <p className="text-[12px] text-de9-red">{L('Document requis', 'المستند مطلوب')}</p>
              )}
            </div>
          </div>

          <SheetFooter>
            <Button type="submit" disabled={action.isPending} className="w-full">
              {action.isPending
                ? L('Envoi…', 'جارٍ الإرسال…')
                : L('Envoyer la facture', 'إرسال الفاتورة')}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
