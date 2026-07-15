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
        <DialogHeader>
          <DialogTitle>{L('Annuler la demande ?', 'إلغاء الطلب؟')}</DialogTitle>
          <DialogDescription>
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
