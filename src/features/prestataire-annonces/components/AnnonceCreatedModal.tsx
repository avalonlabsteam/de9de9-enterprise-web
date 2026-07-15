import { CheckCircle2 } from 'lucide-react';
import { useL } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function AnnonceCreatedModal({
  open,
  onOpenChange,
  onSeeAnnonces,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSeeAnnonces: () => void;
}) {
  const L = useL();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="mb-2 flex size-14 items-center justify-center rounded-full bg-[#E6F6EC] text-[#2E9E5B] dark:bg-[#123322] dark:text-[#5FCF8A]">
            <CheckCircle2 className="size-8" />
          </div>
          <DialogTitle className="text-[18px]">{L('Annonce publiée !', 'تم نشر الإعلان !')}</DialogTitle>
          <DialogDescription>
            {L(
              'Votre annonce est désormais visible dans « Mes annonces ».',
              'إعلانك مرئي الآن ضمن « إعلاناتي ».',
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button className="w-full" onClick={onSeeAnnonces}>
            {L('Voir mes annonces', 'عرض إعلاناتي')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
