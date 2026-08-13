import { useNavigate } from 'react-router-dom';
import { PartyPopper } from 'lucide-react';
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

export function AgrandirSentModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const L = useL();
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <span className="mx-auto mb-1 grid size-[66px] place-items-center rounded-full bg-de9-teal text-white shadow-glow">
            <PartyPopper className="size-7" />
          </span>
          <DialogTitle className="text-center text-de9-teal">
            {L('Merci pour votre demande', 'شكرًا على طلبك')}
          </DialogTitle>
          <DialogDescription className="text-center text-xs font-semibold">
            {L(
              'Notre équipe vous recontacte rapidement pour étendre votre effectif.',
              'سيتواصل معك فريقنا قريبًا لتوسيع فريق عملك.',
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            className="w-full"
            onClick={() => {
              onOpenChange(false);
              navigate('/prestataire/effectif');
            }}
          >
            {L("Retour à l'effectif", 'العودة إلى فريق العمل')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
