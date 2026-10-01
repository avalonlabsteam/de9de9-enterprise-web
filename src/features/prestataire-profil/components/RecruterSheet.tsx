import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { OngletBar } from '@/components/common/OngletBar';
import { useL } from '@/lib/i18n';
import { useDemandesPros } from '../api/contractuels';
import { RECRUTER_VIDE, demandeOuverte } from '../schemas/contractuels';
import { RecruterDemandes } from './RecruterDemandes';
import { RecruterForm } from './RecruterForm';

type Onglet = 'nouvelle' | 'suivi';

/**
 * « Recruter des sous-traitants » — the company asks de9de9 for pros of the
 * de9de9 app, and follows what it asked: a new demande, and the ones already
 * sent with the pros placed on them.
 */
export function RecruterSheet({
  open,
  onOpenChange,
  onSent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSent: () => void;
}) {
  const L = useL();
  const [onglet, setOnglet] = useState<Onglet>('nouvelle');
  // Held here, above the sheet's content: a sheet closed by mistake reopens on what was typed.
  const [valeurs, setValeurs] = useState(RECRUTER_VIDE);
  // The demandes still waited on, for the tab's count — asked only once the sheet opens.
  const ouvertes = useDemandesPros(open).data?.filter((s) => demandeOuverte(s.demande)).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-h-[90vh] max-w-[560px] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{L('Recruter des sous-traitants', 'توظيف مقاولين من الباطن')}</SheetTitle>
          <SheetDescription>
            {L("Renfort d'effectif · pros de9de9", 'تعزيز الفريق · محترفو de9de9')}
          </SheetDescription>
        </SheetHeader>

        <OngletBar
          className="px-4"
          active={onglet}
          onSelect={(code) => setOnglet(code === 'suivi' ? 'suivi' : 'nouvelle')}
          onglets={[
            { code: 'nouvelle', label: L('Nouvelle demande', 'طلب جديد') },
            { code: 'suivi', label: L('Mes demandes', 'طلباتي'), count: ouvertes || undefined },
          ]}
        />

        {onglet === 'nouvelle' ? (
          <RecruterForm
            valeurs={valeurs}
            onChange={setValeurs}
            onSent={() => {
              onOpenChange(false);
              setValeurs(RECRUTER_VIDE);
              onSent();
            }}
          />
        ) : (
          <RecruterDemandes />
        )}
      </SheetContent>
    </Sheet>
  );
}
