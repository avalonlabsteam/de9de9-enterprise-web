import { Heart } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useL } from '@/lib/i18n';

export function HandicapSentModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const L = useL();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <span className="mx-auto mb-1 flex size-12 items-center justify-center rounded-full bg-de9-teal/15 text-de9-teal-dark">
            <Heart className="size-6" />
          </span>
          <DialogTitle className="text-center">
            {L('Merci, nous vous recontacterons.', 'شكرًا، سنعاود الاتصال بك.')}
          </DialogTitle>
          <DialogDescription className="text-center">
            {L(
              'Votre demande a bien été enregistrée. de9de9 revient vers vous.',
              'تم تسجيل طلبك. سيتواصل معك de9de9.',
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button className="w-full" onClick={() => onOpenChange(false)}>
            {L('OK', 'حسنًا')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
