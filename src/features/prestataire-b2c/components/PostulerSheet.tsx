import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { toast } from 'sonner';
import { useL } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { bidFormSchema, type OpenOffer } from '../schemas/b2c';

type BidFormValues = z.output<typeof bidFormSchema>;
type BidFormInput = z.input<typeof bidFormSchema>;
import { useSubmitBid } from '../api/b2c';

export function PostulerSheet({
  open,
  onOpenChange,
  offer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: OpenOffer | null;
}) {
  const L = useL();
  const submitBid = useSubmitBid();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BidFormInput, unknown, BidFormValues>({
    resolver: zodResolver(bidFormSchema),
    defaultValues: { prixDzd: undefined, delai: '', message: '' },
  });

  useEffect(() => {
    if (open) reset({ prixDzd: undefined, delai: '', message: '' });
  }, [open, reset]);

  const onSubmit = (values: BidFormValues) => {
    if (!offer) return;
    submitBid.mutate(
      {
        offer,
        prixDzd: values.prixDzd,
        delai: values.delai,
        message: values.message ?? '',
      },
      {
        onSuccess: () => {
          toast.success(L('Offre envoyée', 'تم إرسال العرض'));
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
          <SheetTitle>{L('Envoyer une offre', 'إرسال عرض')}</SheetTitle>
          {offer && <SheetDescription>{offer.title}</SheetDescription>}
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="postuler-prix">{L('Prix proposé (DZD)', 'السعر المقترح (دج)')}</Label>
              <Input
                id="postuler-prix"
                type="number"
                inputMode="numeric"
                min={1}
                placeholder="0"
                {...register('prixDzd')}
              />
              {errors.prixDzd && (
                <p className="text-[12px] text-de9-red">{errors.prixDzd.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="postuler-delai">{L('Délai proposé', 'المدة المقترحة')}</Label>
              <Input
                id="postuler-delai"
                placeholder={L('Ex. Sous 3 jours', 'مثال: خلال 3 أيام')}
                {...register('delai')}
              />
              {errors.delai && (
                <p className="text-[12px] text-de9-red">{errors.delai.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="postuler-message">{L('Message', 'رسالة')}</Label>
              <Textarea
                id="postuler-message"
                rows={4}
                placeholder={L('Présentez votre proposition…', 'قدّم عرضك…')}
                {...register('message')}
              />
            </div>
          </div>

          <SheetFooter>
            <Button type="submit" disabled={submitBid.isPending} className="w-full">
              {submitBid.isPending ? L('Envoi…', 'جارٍ الإرسال…') : L("Envoyer l'offre", 'إرسال العرض')}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
