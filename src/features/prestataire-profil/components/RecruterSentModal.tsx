import { CheckCircle2 } from 'lucide-react';
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

export function RecruterSentModal({
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
          <span className="mx-auto mb-1 grid size-[66px] place-items-center rounded-full bg-de9-teal text-white shadow-glow">
            <CheckCircle2 className="size-7" />
          </span>
          <DialogTitle className="text-center text-de9-teal">{L('Demande envoyée', 'تم إرسال الطلب')}</DialogTitle>
          <DialogDescription className="text-center text-xs font-semibold">
            {L(
              'Nous recherchons les sous-traitants correspondants et revenons vers vous.',
              'نبحث عن المقاولين من الباطن المناسبين وسنعاود الاتصال بك.',
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
