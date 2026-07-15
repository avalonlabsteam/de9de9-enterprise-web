import { useNavigate } from 'react-router-dom';
import { Users, Building2, ChevronRight } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { useL } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function CreatePickSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const L = useL();
  const navigate = useNavigate();

  const go = (type: 'b2c' | 'b2b') => {
    onOpenChange(false);
    navigate(`/prestataire/annonce/create?type=${type}`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-[560px] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{L("Type d'annonce", 'نوع الإعلان')}</SheetTitle>
          <SheetDescription>
            {L('Pour quel espace souhaitez-vous publier ?', 'لأي فضاء تريد النشر؟')}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 px-4 pb-6">
          <PickRow
            icon={<Users className="size-5" />}
            label={L('Annonce B2C', 'إعلان B2C')}
            hint={L('Clients particuliers', 'زبائن أفراد')}
            accent="teal"
            onClick={() => go('b2c')}
          />
          <PickRow
            icon={<Building2 className="size-5" />}
            label={L('Annonce B2B', 'إعلان B2B')}
            hint={L('Clients entreprises', 'زبائن مؤسسات')}
            accent="blue"
            onClick={() => go('b2b')}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function PickRow({
  icon,
  label,
  hint,
  accent,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  accent: 'teal' | 'blue';
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3.5 rounded-2xl border border-de9-line bg-card p-4 text-start transition-colors hover:bg-de9-row',
      )}
    >
      <span
        className={cn(
          'flex size-11 flex-none items-center justify-center rounded-xl',
          accent === 'teal'
            ? 'bg-de9-teal/15 text-de9-teal-dark'
            : 'bg-[#3B82F6]/15 text-[#3B82F6]',
        )}
      >
        {icon}
      </span>
      <span className="flex-1">
        <span className="block text-[14px] font-bold text-de9-ink">{label}</span>
        <span className="block text-[12.5px] text-de9-gray">{hint}</span>
      </span>
      <ChevronRight className="size-4 flex-none text-de9-gray rtl:rotate-180" />
    </button>
  );
}
