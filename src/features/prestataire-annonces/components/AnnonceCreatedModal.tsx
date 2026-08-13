import { Megaphone } from 'lucide-react';
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
      <DialogContent className="gap-0 rounded-[18px] sm:max-w-[400px]">
        <DialogHeader className="items-center text-center">
          {/* Megaphone badge ringed by the confetti shapes from the design. */}
          <div className="relative mb-3 grid h-[110px] w-full place-items-center">
            <Confetti />
            <span className="relative grid size-[92px] place-items-center rounded-full bg-de9-teal text-white shadow-glow">
              <Megaphone className="size-11" />
            </span>
          </div>
          <DialogTitle className="text-[30px] font-extrabold text-de9-teal">
            {L('Bravo !', 'أحسنت !')}
          </DialogTitle>
          <DialogDescription className="mt-1 text-[15px] font-bold text-de9-ink">
            {L('Vous avez créé votre première annonce', 'لقد أنشأت إعلانك الأول')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6">
          <Button className="h-14 w-full rounded-[12px] text-[15px]" onClick={onSeeAnnonces}>
            {L('Voir mon annonce', 'عرض إعلاني')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Decorative triangles around the badge. */
function Confetti() {
  return (
    <span className="pointer-events-none absolute inset-0" aria-hidden>
      <span className="absolute left-[16%] top-[6%] size-0 border-x-[11px] border-b-[19px] border-x-transparent border-b-de9-teal" />
      <span className="absolute right-[22%] top-[14%] size-0 border-x-[9px] border-b-[15px] border-x-transparent border-b-de9-teal" />
      <span className="absolute left-[10%] top-[52%] size-[15px] rotate-12 rounded-[3px] border-2 border-de9-teal-soft" />
    </span>
  );
}
