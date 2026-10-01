import type { ReactNode } from 'react';
import { BadgeCheck, CalendarClock, CheckCheck, Loader } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useL, useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useAuthedImage } from '@/lib/useAuthedImage';
import type { ClientAccueil } from '@/features/auth/schemas/accueil';
import { initialsOf } from '../lib/format';

/**
 * Company identity and the counter trio. A strip across the home once it has
 * the width (40rem): identity at the start, the three counters at the end. A
 * strip is only as tall as what it holds — as a column beside the rest of the
 * home, the card stretched to that column's height and stood half empty.
 * Narrower, it is the centred card of a phone.
 */
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
    <Card className="@container">
      <CardContent className="flex flex-col items-center gap-6 px-5 py-6 text-center @[40rem]:flex-row @[40rem]:px-6 @[40rem]:py-5 @[40rem]:text-start">
        <div className="flex max-w-full min-w-0 flex-col items-center gap-4 @[40rem]:flex-1 @[40rem]:flex-row">
          <CompanyLogo name={entreprise.nom} logoUrl={entreprise.logoUrl} />
          <div className="max-w-full min-w-0">
            {entreprise.nomUtilisateur && (
              <p className="truncate text-sm font-medium text-de9-slate">
                {L(`Bonjour ${entreprise.nomUtilisateur}`, `مرحبًا ${entreprise.nomUtilisateur}`)}
              </p>
            )}
            <div className="mt-0.5 flex max-w-full items-center justify-center gap-2 @[40rem]:justify-start">
              <h2 className="min-w-0 truncate text-[22px] font-bold text-de9-ink">{entreprise.nom}</h2>
              {entreprise.verifie && (
                <>
                  <BadgeCheck aria-hidden className="size-5 flex-none text-de9-blue" />
                  <span className="sr-only">{L('Entreprise vérifiée', 'مؤسسة موثّقة')}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex w-full justify-between px-1 @[40rem]:w-auto @[40rem]:flex-none @[40rem]:gap-7 @[40rem]:border-s @[40rem]:border-border @[40rem]:px-0 @[40rem]:ps-7">
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
  const size = 'size-20 flex-none rounded-full @[40rem]:size-16';
  if (src) {
    return <img src={src} alt={name} className={cn(size, 'object-cover')} />;
  }
  return (
    <span className={cn(size, 'grid place-items-center bg-de9-blue text-[24px] font-extrabold text-white @[40rem]:text-[20px]')}>
      {initialsOf(name)}
    </span>
  );
}

/** Stacked on the phone card (icon, label, figure); beside its icon on the strip (figure over label). */
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
    <div className="flex w-[84px] flex-col items-center gap-1.5 @[40rem]:w-auto @[40rem]:flex-row @[40rem]:gap-3">
      <span className={cn('grid size-10 flex-none place-items-center rounded-full text-white', circle)}>
        {icon}
      </span>
      <span className="flex flex-col items-center gap-1.5 @[40rem]:flex-col-reverse @[40rem]:items-start @[40rem]:gap-0">
        <span className="text-sm font-medium whitespace-nowrap text-de9-ink @[40rem]:text-[12.5px] @[40rem]:text-de9-slate">
          {label}
        </span>
        <span className="text-[28px] leading-tight font-bold text-de9-ink tabular-nums @[40rem]:text-[22px]">{value}</span>
      </span>
    </div>
  );
}
