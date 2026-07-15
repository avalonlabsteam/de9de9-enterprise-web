import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BadgeCheck,
  Plus,
  Megaphone,
  Users,
  Wallet,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { Logo } from '@/components/common/Logo';
import { useT, useL } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useDashboard } from '../api/dashboard';
import { CreatePickSheet } from './CreatePickSheet';

const formatDa = (n: number) => n.toLocaleString('fr-FR');

export function DashboardPage() {
  const t = useT();
  const L = useL();
  const navigate = useNavigate();
  const [pickOpen, setPickOpen] = useState(false);
  const { data, isPending, isError } = useDashboard();

  return (
    <div className="mx-auto flex max-w-[880px] flex-col gap-5">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Logo />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/onboarding/kyc')}
            className="inline-flex items-center gap-1.5 rounded-full border border-de9-teal/40 bg-de9-teal/10 px-3.5 py-1.5 text-[12.5px] font-bold text-de9-teal-dark transition-colors hover:bg-de9-teal/20"
          >
            <ShieldCheck className="size-3.5" />
            {t('verifCta')}
          </button>
          <Button variant="ghost" size="icon" aria-label="Notifications" className="text-de9-slate">
            <Bell className="size-5" />
          </Button>
        </div>
      </div>

      <h1 className="text-[20px] font-extrabold text-de9-ink">{t('dashTitle')}</h1>

      {isError && (
        <EmptyState
          title={L('Impossible de charger le tableau de bord', 'تعذّر تحميل لوحة القيادة')}
          description={L('Veuillez réessayer plus tard.', 'يرجى المحاولة لاحقًا.')}
        />
      )}

      {isPending && !isError && <DashboardSkeleton />}

      {data && (
        <>
          {/* Company card */}
          <Card>
            <CardContent className="flex items-center gap-4 py-5">
              <span className="flex size-12 flex-none items-center justify-center rounded-2xl bg-de9-teal/15 text-[18px] font-extrabold text-de9-teal-dark">
                {data.entreprise.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[16px] font-extrabold text-de9-ink">
                    {data.entreprise}
                  </span>
                  {data.verified && (
                    <BadgeCheck className="size-4 flex-none text-de9-teal-dark" />
                  )}
                </div>
                <p className="text-[12.5px] text-de9-gray">
                  {data.verified
                    ? L('Entreprise vérifiée', 'مؤسسة موثّقة')
                    : L('Non vérifiée', 'غير موثّقة')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Stat trio */}
          <div className="grid grid-cols-3 gap-3">
            <StatTile value={data.stats.avenir} label={t('statAvenir')} />
            <StatTile value={data.stats.enCours} label={t('statEnCours')} />
            <StatTile value={data.stats.completes} label={t('statComplete')} />
          </div>

          {/* Create annonce */}
          <Button className="h-11 w-full gap-2 text-[14px]" onClick={() => setPickOpen(true)}>
            <Plus className="size-4" />
            {t('createAnnonce')}
          </Button>

          {/* Action rows */}
          <div className="flex flex-col gap-3">
            <ActionRow
              icon={<Megaphone className="size-5" />}
              accent="teal"
              title={t('mesAnnonces')}
              trailing={
                <span className="text-[12.5px] font-bold text-de9-teal-dark">{t('toutVoir')}</span>
              }
              onClick={() => navigate('/prestataire/annonces')}
            />
            <ActionRow
              icon={<Users className="size-5" />}
              accent="teal"
              title={t('monEquipe')}
              trailing={
                <span className="text-[13px] font-bold text-de9-ink">
                  {data.equipe.used}/{data.equipe.total}
                </span>
              }
              onClick={() => navigate('/prestataire/effectif')}
            />
            <ActionRow
              icon={<Wallet className="size-5" />}
              accent="teal"
              title={t('chiffreAffaire')}
              trailing={
                <span className="text-[13px] font-extrabold text-de9-ink">
                  {formatDa(data.chiffreAffaireDa)} DA
                </span>
              }
              onClick={() => navigate('/prestataire/stats')}
            />
          </div>
        </>
      )}

      <CreatePickSheet open={pickOpen} onOpenChange={setPickOpen} />
    </div>
  );
}

function StatTile({ value, label }: { value: number; label: string }) {
  return (
    <Card className="text-center">
      <CardContent className="flex flex-col items-center gap-0.5 py-4">
        <span className="text-[22px] font-extrabold text-de9-ink">{value}</span>
        <span className="text-[12px] font-medium text-de9-gray">{label}</span>
      </CardContent>
    </Card>
  );
}

function ActionRow({
  icon,
  accent,
  title,
  trailing,
  onClick,
}: {
  icon: React.ReactNode;
  accent: 'teal';
  title: string;
  trailing: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3.5 rounded-2xl border border-de9-line bg-card p-4 text-start transition-colors hover:bg-de9-row"
    >
      <span
        className={cn(
          'flex size-10 flex-none items-center justify-center rounded-xl',
          accent === 'teal' && 'bg-de9-teal/15 text-de9-teal-dark',
        )}
      >
        {icon}
      </span>
      <span className="flex-1 text-[14px] font-bold text-de9-ink">{title}</span>
      {trailing}
      <ChevronRight className="size-4 flex-none text-de9-gray rtl:rotate-180" />
    </button>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-5">
      <div className="h-[88px] rounded-2xl border border-de9-line bg-card" />
      <div className="grid grid-cols-3 gap-3">
        <div className="h-[84px] rounded-2xl border border-de9-line bg-card" />
        <div className="h-[84px] rounded-2xl border border-de9-line bg-card" />
        <div className="h-[84px] rounded-2xl border border-de9-line bg-card" />
      </div>
      <div className="h-11 rounded-lg bg-card" />
      <div className="h-[68px] rounded-2xl border border-de9-line bg-card" />
      <div className="h-[68px] rounded-2xl border border-de9-line bg-card" />
    </div>
  );
}
