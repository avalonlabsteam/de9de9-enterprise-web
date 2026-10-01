import { useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  UsersRound,
  Wallet,
  CalendarClock,
  Loader,
  CheckCheck,
  ChevronRight,
  Megaphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { useT, useL } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useAuthedImage } from '@/lib/useAuthedImage';
import { useAccueilStore } from '@/stores/accueilStore';
import { uiActions } from '@/stores/uiStore';
import { useKycState } from '@/features/kyc/api/kyc';
import type { AnnonceCard } from '@/features/auth/schemas/accueil';

const formatDa = (n: number) => n.toLocaleString('fr-FR');

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();

/** Deg Deg prestataire home: company card left, KPIs + « Mes annonces » right. */
export function DashboardPage() {
  const t = useT();
  const L = useL();
  const navigate = useNavigate();
  // The home is built by the backend and delivered with the sign-in / switch
  // answer; the store holds it. There is no home route to retry.
  // Same source as the header pill, so the card and the pill never disagree.
  const kyc = useKycState();
  const data = useAccueilStore((s) => (s.accueil?.role === 'prestataire' ? s.accueil.prestataire : null));

  return (
    <div className="mx-auto flex max-w-[880px] flex-col gap-5">
      {!data && (
        <EmptyState
          title={L("Accueil indisponible", 'الصفحة الرئيسية غير متاحة')}
          description={L(
            'Reconnectez-vous pour recharger votre espace.',
            'أعد تسجيل الدخول لتحديث مساحتك.',
          )}
        />
      )}

      {data && (
        <>
          <div className="grid gap-4 lg:grid-cols-[306px_minmax(0,1fr)]">
            {/* Company card — logo, name, counter trio */}
            <Card>
              <CardContent className="flex flex-col items-center px-5 py-7 text-center">
                <CompanyLogo name={data.entreprise.nom} logoUrl={data.entreprise.logoUrl} />
                <div className="mt-4 flex items-center justify-center gap-2">
                  <span className="truncate text-[26px] font-bold text-de9-ink">
                    {data.entreprise.nom}
                  </span>
                  {kyc.verified && <BadgeCheck className="size-5 flex-none text-de9-teal" />}
                </div>
                <p className="text-sm font-medium text-de9-gray">
                  {kyc.verified
                    ? L('Entreprise vérifiée', 'مؤسسة موثّقة')
                    : kyc.inReview
                      ? L('Vérification en cours', 'التحقق جارٍ')
                      : kyc.rejected
                        ? L('Vérification refusée', 'تم رفض التوثيق')
                        : L('Non vérifiée', 'غير موثّقة')}
                </p>
                {data.entreprise.certifie && (
                  <span className="mt-2 rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-de9-teal-dark">
                    {L('Certifié de9de9', 'معتمد de9de9')}
                  </span>
                )}

                <div className="mt-6 flex w-full justify-between px-1">
                  <CompanyStat
                    value={data.compteurs.aVenir}
                    label={t('statAvenir')}
                    circle="bg-de9-blue-soft"
                    icon={<CalendarClock className="size-5" />}
                  />
                  <CompanyStat
                    value={data.compteurs.enCours}
                    label={t('statEnCours')}
                    circle="bg-de9-orange"
                    icon={<Loader className="size-5" />}
                  />
                  <CompanyStat
                    value={data.compteurs.completes}
                    label={t('statComplete')}
                    circle="bg-de9-teal"
                    icon={<CheckCheck className="size-5" />}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Right column — KPI pair + annonces */}
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <KpiCard
                  label={t('chiffreAffaire')}
                  icon={<Wallet className="size-5" />}
                  onClick={() => navigate('/prestataire/stats')}
                >
                  <p className="mt-3 text-2xl font-bold text-de9-ink">
                    {formatDa(data.chiffreAffaires.totalDzd)} DA
                  </p>
                </KpiCard>
                <KpiCard
                  label={t('monEquipe')}
                  icon={<UsersRound className="size-5" />}
                  onClick={() => navigate('/prestataire/effectif')}
                >
                  <p className="mt-3 text-2xl font-bold text-de9-ink">{data.equipe.total}</p>
                  <span className="mt-1 block text-[12px] text-de9-gray">
                    {L(
                      `${data.equipe.ouvriers} ouvriers · ${data.equipe.contractuels} contractuels`,
                      `${data.equipe.ouvriers} عمال · ${data.equipe.contractuels} متعاقدون`,
                    )}
                  </span>
                </KpiCard>
              </div>

              <Card className="flex-1">
                <CardContent className="px-6 py-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <h2 className="text-[16px] font-bold text-de9-ink">{t('mesAnnonces')}</h2>
                      <Megaphone className="size-5 text-de9-teal" />
                    </div>
                    {data.annonces.length > 0 && (
                      <button
                        type="button"
                        onClick={() => navigate('/prestataire/annonces')}
                        className="flex items-center gap-1 text-[13px] font-semibold text-de9-teal-dark"
                      >
                        {L('Tout voir', 'عرض الكل')}
                        <ChevronRight className="size-4" />
                      </button>
                    )}
                  </div>

                  {data.annonces.length === 0 ? (
                    <div className="mt-3 flex flex-col items-start gap-3">
                      <p className="text-[13px] text-de9-slate">
                        {L(
                          "Aucun service publié pour l'instant.",
                          'لا توجد خدمات منشورة حاليًا.',
                        )}
                      </p>
                      {/* The directory card is filled by de9de9: there is no company route to write it. */}
                      <Button variant="outline" className="h-10 text-[14px]" onClick={uiActions.openSupport}>
                        {L('Demander à de9de9 de compléter ma fiche', 'اطلب من de9de9 إكمال بطاقتي')}
                      </Button>
                    </div>
                  ) : (
                    <ul className="mt-2 flex flex-col divide-y divide-border">
                      {data.annonces.map((annonce, i) => (
                        <AnnonceRow key={`${annonce.sousCategorieCode ?? annonce.service}-${i}`} annonce={annonce} />
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <B2cNotice b2c={data.b2c} />
        </>
      )}

    </div>
  );
}

/** The logo is an authenticated URL; initials stand in until (or unless) it loads. */
function CompanyLogo({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  const src = useAuthedImage(logoUrl);
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="size-[100px] flex-none rounded-full object-cover"
      />
    );
  }
  return (
    <span className="grid size-[100px] flex-none place-items-center rounded-full bg-de9-blue text-[28px] font-extrabold text-white">
      {initialsOf(name)}
    </span>
  );
}

/** One service of the company's directory profile. */
function AnnonceRow({ annonce }: { annonce: AnnonceCard }) {
  return (
    <li className="flex items-center gap-3 py-3">
      <span className="grid size-10 flex-none place-items-center rounded-full bg-secondary text-[18px]">
        {annonce.icone ?? '🧰'}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-de9-ink">{annonce.service}</p>
        <p className="truncate text-[12px] text-de9-slate">{annonce.prixLabel ?? 'Sur devis'}</p>
      </div>
      <div className="flex flex-none gap-1.5">
        {annonce.canaux.map((canal) => (
          <span
            key={canal}
            className={cn(
              'rounded-full px-2 py-0.5 text-[11px] font-bold',
              canal === 'B2C' ? 'bg-de9-blue-soft text-white' : 'bg-accent text-de9-teal-dark',
            )}
          >
            {canal}
          </span>
        ))}
      </div>
    </li>
  );
}

/**
 * The B2C side is the de9de9 consumer app. It can be off (`en_attente`,
 * `suspendu`) or simply unreadable right now — and then its counters and
 * revenue are null, never 0, so the screen says so instead of showing a zero.
 */
function B2cNotice({ b2c }: { b2c: { statut: string; donneesDisponibles: boolean } | undefined }) {
  const L = useL();
  if (!b2c) return null;

  if (b2c.statut === 'suspendu') {
    return (
      <p className="rounded-lg bg-destructive/10 px-4 py-3 text-[13px] font-semibold text-destructive">
        {L(
          'Votre activité sur l’app de9de9 est suspendue. Contactez le support.',
          'تم تعليق نشاطك على تطبيق de9de9. اتصل بالدعم.',
        )}
      </p>
    );
  }
  if (b2c.statut === 'en_attente') {
    return (
      <p className="rounded-lg bg-accent px-4 py-3 text-[13px] text-de9-teal-dark">
        {L('Visible sur l’app de9de9 après vérification.', 'ستظهر على تطبيق de9de9 بعد التوثيق.')}
      </p>
    );
  }
  if (!b2c.donneesDisponibles) {
    return (
      <p className="text-[12px] text-de9-gray">
        {L(
          'Données B2C indisponibles — les chiffres ci-dessus ne comptent que le B2B.',
          'بيانات B2C غير متاحة — الأرقام أعلاه تخص B2B فقط.',
        )}
      </p>
    );
  }
  return null;
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
  icon: React.ReactNode;
}) {
  return (
    <div className="flex w-[84px] flex-col items-center gap-1.5">
      <span className={cn('grid size-10 place-items-center rounded-full text-white', circle)}>
        {icon}
      </span>
      <span className="text-sm font-medium text-de9-ink">{label}</span>
      <span className="text-[30px] font-bold leading-tight text-de9-ink">{value}</span>
    </div>
  );
}

function KpiCard({
  label,
  icon,
  onClick,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg bg-card px-6 py-5 text-start shadow-soft transition-shadow hover:shadow-lift dark:ring-1 dark:ring-border"
    >
      <span className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-de9-ink">{label}</span>
        <span className="flex-none text-de9-teal">{icon}</span>
      </span>
      {children}
    </button>
  );
}
