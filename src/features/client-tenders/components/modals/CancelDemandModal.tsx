import { AlertTriangle } from 'lucide-react';
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

export function CancelDemandModal({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const L = useL();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div className="mx-auto mt-2 grid size-[66px] place-items-center rounded-full bg-de9-red text-white">
          <AlertTriangle className="size-8" />
        </div>
        <DialogHeader className="items-center text-center">
          <DialogTitle className="text-center text-de9-red">
            {L('Annuler la demande ?', 'إلغاء الطلب؟')}
          </DialogTitle>
          <DialogDescription className="text-center text-xs font-semibold">
            {L(
              'Cette action est définitive. Votre appel d’offres sera annulé.',
              'هذا الإجراء نهائي. سيتم إلغاء طلب العروض الخاص بك.',
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {L('Revenir', 'رجوع')}
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {L("Confirmer l'annulation", 'تأكيد الإلغاء')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
