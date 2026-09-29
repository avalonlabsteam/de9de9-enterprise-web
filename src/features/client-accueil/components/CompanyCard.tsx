import type { ReactNode } from 'react';
import { BadgeCheck, CalendarClock, CheckCheck, Loader } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useL, useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useAuthedImage } from '@/lib/useAuthedImage';
import type { ClientAccueil } from '@/features/auth/schemas/accueil';
import { initialsOf } from '../lib/format';

/** Company identity and the counter trio, as on the prestataire home. */
export function CompanyCard({
  entreprise,
  compteurs,
}: {
  entreprise: ClientAccueil['entreprise'];
  compteurs: ClientAccueil['compteurs'];
}) {
  const t = useT();
  const L = useL();

  return (
    <Card>
      <CardContent className="flex flex-col items-center px-5 py-6 text-center">
        <CompanyLogo name={entreprise.nom} logoUrl={entreprise.logoUrl} />
        {entreprise.nomUtilisateur && (
          <p className="mt-4 max-w-full truncate text-sm font-medium text-de9-slate">
            {L(`Bonjour ${entreprise.nomUtilisateur}`, `مرحبًا ${entreprise.nomUtilisateur}`)}
          </p>
        )}
        <div
          className={cn(
            'flex max-w-full items-center justify-center gap-2',
            entreprise.nomUtilisateur ? 'mt-0.5' : 'mt-4',
          )}
        >
          <h2 className="min-w-0 truncate text-[22px] font-bold text-de9-ink">{entreprise.nom}</h2>
          {entreprise.verifie && (
            <>
              <BadgeCheck aria-hidden className="size-5 flex-none text-de9-blue" />
              <span className="sr-only">{L('Entreprise vérifiée', 'مؤسسة موثّقة')}</span>
            </>
          )}
        </div>

        <div className="mt-6 flex w-full justify-between px-1">
          <CompanyStat
            value={compteurs.aVenir}
            label={t('statAvenir')}
            circle="bg-de9-blue-soft"
            icon={<CalendarClock className="size-5" />}
          />
          <CompanyStat
            value={compteurs.enCours}
            label={t('statEnCours')}
            circle="bg-de9-orange"
            icon={<Loader className="size-5" />}
          />
          <CompanyStat
            value={compteurs.completes}
            label={t('statComplete')}
            circle="bg-de9-teal"
            icon={<CheckCheck className="size-5" />}
          />
        </div>
      </CardContent>
    </Card>
  );
}

/** The logo is an authenticated URL; initials stand in until (or unless) it loads. */
function CompanyLogo({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  const src = useAuthedImage(logoUrl);
  if (src) {
    return <img src={src} alt={name} className="size-20 flex-none rounded-full object-cover" />;
  }
  return (
    <span className="grid size-20 flex-none place-items-center rounded-full bg-de9-blue text-[24px] font-extrabold text-white">
      {initialsOf(name)}
    </span>
  );
}

function CompanyStat({
  value,
  label,
  circle,
  icon,
}: {
  value: number;
  label: string;
  circle: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex w-[84px] flex-col items-center gap-1.5">
      <span className={cn('grid size-10 place-items-center rounded-full text-white', circle)}>
        {icon}
      </span>
      <span className="text-sm font-medium text-de9-ink">{label}</span>
      <span className="text-[28px] font-bold leading-tight text-de9-ink">{value}</span>
    </div>
  );
}
