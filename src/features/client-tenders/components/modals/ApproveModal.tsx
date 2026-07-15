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
        <DialogHeader>
          <DialogTitle>{L('Approuver la facture', 'الموافقة على الفاتورة')}</DialogTitle>
          <DialogDescription>
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
            className="bg-de9-teal-dark text-white hover:bg-de9-teal-dark/90"
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
