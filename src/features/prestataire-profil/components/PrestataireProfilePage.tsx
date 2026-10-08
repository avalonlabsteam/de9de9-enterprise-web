import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Users, ChevronRight, UserPlus, HeartHandshake } from 'lucide-react';
import { useT, useL } from '@/lib/i18n';
import { ProfilPage } from '@/features/profil/components/ProfilPage';
import { ContratPartenariat } from './ContratPartenariat';
import { RecruterSheet } from './RecruterSheet';
import { HandicapSheet, type HandicapOnglet } from './HandicapSheet';
import { RecruterSentModal } from './RecruterSentModal';
import { HandicapSentModal } from './HandicapSentModal';

/**
 * The prestataire's profile: the shared page, with « Mon effectif » as its own
 * row and, under the rows, what only a prestataire has — the two requests to
 * de9de9 and the partnership contract.
 */
export function PrestataireProfilePage() {
  const t = useT();
  const L = useL();
  const navigate = useNavigate();

  const [recruterOpen, setRecruterOpen] = useState(false);
  const [handicapOpen, setHandicapOpen] = useState(false);
  const [handicapOnglet, setHandicapOnglet] = useState<HandicapOnglet>('nouvelle');
  const [recruterSent, setRecruterSent] = useState(false);
  const [handicapSent, setHandicapSent] = useState(false);

  // `?handicap=demandes`: an alert about a handicap request lands on « Mes demandes » (see `cheminOf`).
  // The address only opens the sheet: at the first tap in it the page takes over and the address is
  // cleared — left there, the sheet would open again at every return to this page.
  const [params, setParams] = useSearchParams();
  const depuisAlerte = params.get('handicap') === 'demandes';
  const handicapActif: HandicapOnglet = depuisAlerte ? 'suivi' : handicapOnglet;
  const setHandicap = (open: boolean, onglet: HandicapOnglet) => {
    setHandicapOpen(open);
    setHandicapOnglet(onglet);
    if (!depuisAlerte) return;
    const p = new URLSearchParams(params);
    p.delete('handicap');
    setParams(p, { replace: true });
  };

  return (
    <ProfilPage
      titre={t('profilTitle')}
      espace={L('Espace prestataire', 'مساحة المهني')}
      kycPath="/onboarding/kyc"
      rows={[
        {
          key: 'effectif',
          icon: Users,
          label: L('Mon effectif', 'فريق عملي'),
          onClick: () => navigate('/prestataire/effectif'),
        },
      ]}
    >
      {/* Recruter / Handicap actions */}
      <div className="flex flex-col gap-3">
        <ActionRow
          icon={<UserPlus className="size-5" />}
          title={t('recruter')}
          hint={L("Renfort d'effectif · pros de9de9", 'تعزيز الفريق · محترفو de9de9')}
          onClick={() => setRecruterOpen(true)}
        />
        <ActionRow
          icon={<HeartHandshake className="size-5" />}
          title={t('handicap')}
          hint={L('Rejoignez la liste — de9de9 vous recontacte', 'انضم إلى القائمة — سيتواصل معك de9de9')}
          onClick={() => setHandicapOpen(true)}
        />
      </div>

      {/* Contrat de partenariat — as de9de9 recorded it */}
      <ContratPartenariat />

      <RecruterSheet
        open={recruterOpen}
        onOpenChange={setRecruterOpen}
        onSent={() => setRecruterSent(true)}
      />
      <HandicapSheet
        open={handicapOpen || depuisAlerte}
        onOpenChange={(open) => setHandicap(open, handicapActif)}
        onglet={handicapActif}
        onOngletChange={(onglet) => setHandicap(true, onglet)}
        onSent={() => setHandicapSent(true)}
      />
      <RecruterSentModal open={recruterSent} onOpenChange={setRecruterSent} />
      <HandicapSentModal open={handicapSent} onOpenChange={setHandicapSent} />
    </ProfilPage>
  );
}

function ActionRow({
  icon,
  title,
  hint,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3.5 rounded-lg bg-card p-4 text-start shadow-soft transition-shadow hover:shadow-lift dark:ring-1 dark:ring-border"
    >
      <span className="flex size-11 flex-none items-center justify-center rounded-[12px] bg-de9-teal-tint text-de9-teal">
        {icon}
      </span>
      <span className="flex-1">
        <span className="block text-[14px] font-bold text-de9-ink">{title}</span>
        <span className="block text-[12.5px] text-de9-gray">{hint}</span>
      </span>
      <ChevronRight className="size-4 flex-none text-de9-gray rtl:rotate-180" />
    </button>
  );
}
