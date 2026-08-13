import { BadgeCheck } from 'lucide-react';
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

export function ApproveModal({
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
        <div className="mx-auto mt-2 grid size-[66px] place-items-center rounded-full bg-de9-teal text-white">
          <BadgeCheck className="size-8" />
        </div>
        <DialogHeader className="items-center text-center">
          <DialogTitle className="text-center text-de9-teal-dark">
            {L('Approuver la facture', 'الموافقة على الفاتورة')}
          </DialogTitle>
          <DialogDescription className="text-center text-xs font-semibold">
            {L(
              'En approuvant, les crédits correspondants seront déduits et le prestataire sera réglé.',
              'بالموافقة، سيتم خصم الرصيد المقابل وتسوية مستحقات مقدّم الخدمة.',
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {L('Revenir', 'رجوع')}
          </Button>
          <Button
            className="bg-de9-teal text-white shadow-glow hover:bg-de9-teal-dark"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {L("Confirmer l'approbation", 'تأكيد الموافقة')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
