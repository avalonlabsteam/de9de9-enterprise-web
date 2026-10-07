import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { OngletBar } from '@/components/common/OngletBar';
import { useL } from '@/lib/i18n';
import { useMesDemandesHandicap } from '../api/profil';
import { HANDICAP_VIDE, demandeEnAttente } from '../schemas/profil';
import { HandicapDemandes } from './HandicapDemandes';
import { HandicapForm } from './HandicapForm';

export type HandicapOnglet = 'nouvelle' | 'suivi';

/**
 * « Contracter des personnes en situation de handicap » — the company joins
 * de9de9's list and follows what it sent: a new request, and the ones already
 * sent with the people placed on them. The tab is the page's to set: an alert
 * about a request opens the sheet on « Mes demandes ».
 */
export function HandicapSheet({
  open,
  onOpenChange,
  onglet,
  onOngletChange,
  onSent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onglet: HandicapOnglet;
  onOngletChange: (onglet: HandicapOnglet) => void;
  onSent: () => void;
}) {
  const L = useL();
  // Held here, above the sheet's content: a sheet closed by mistake reopens on what was typed.
  const [valeurs, setValeurs] = useState(HANDICAP_VIDE);
  // The requests still waited on, for the tab's count — asked only once the sheet opens.
  const enAttente = useMesDemandesHandicap(open).data?.filter(demandeEnAttente).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-h-[90vh] max-w-[560px] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>
            {L('Contracter des personnes en situation de handicap', 'توظيف أشخاص من ذوي الاحتياجات الخاصة')}
          </SheetTitle>
          <SheetDescription>
            {L('Rejoignez la liste — de9de9 vous recontacte', 'انضم إلى القائمة — سيتواصل معك de9de9')}
          </SheetDescription>
        </SheetHeader>

        <OngletBar
          className="px-4"
          active={onglet}
          onSelect={(code) => onOngletChange(code === 'suivi' ? 'suivi' : 'nouvelle')}
          onglets={[
            { code: 'nouvelle', label: L('Nouvelle demande', 'طلب جديد') },
            { code: 'suivi', label: L('Mes demandes', 'طلباتي'), count: enAttente || undefined },
          ]}
        />

        {onglet === 'nouvelle' ? (
          <HandicapForm
            valeurs={valeurs}
            onChange={setValeurs}
            onSent={() => {
              onOpenChange(false);
              setValeurs(HANDICAP_VIDE);
              onSent();
            }}
          />
        ) : (
          <HandicapDemandes />
        )}
      </SheetContent>
    </Sheet>
  );
}
