import { useNavigate } from 'react-router-dom';
import { TrendingUp, Wallet, Briefcase, Star, Trophy, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { useT, useL } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useStats } from '../api/dashboard';
import type { Stats } from '../schemas/dashboard';

const formatDa = (n: number) => n.toLocaleString('fr-FR');

export function StatsPage() {
  const t = useT();
  const L = useL();
  const navigate = useNavigate();
  const { data, isPending, isError } = useStats();

  return (
    <div className="mx-auto flex max-w-[880px] flex-col gap-5">
      <h1 className="text-[20px] font-extrabold text-de9-ink">{t('statsTitle')}</h1>

      {isError && (
        <EmptyState
          title={L('Impossible de charger les statistiques', 'تعذّر تحميل الإحصائيات')}
          description={L('Veuillez réessayer plus tard.', 'يرجى المحاولة لاحقًا.')}
        />
      )}

      {isPending && !isError && <StatsSkeleton />}

      {data && (
        <>
          {/* CA card */}
          <div className="rounded-lg bg-de9-teal p-5 text-primary-foreground shadow-glow">
            <p className="text-sm font-semibold text-primary-foreground/85">{t('chiffreAffaire')}</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
              <span className="text-[28px] font-extrabold leading-tight">
                {formatDa(data.chiffreAffaireDa)} DA
              </span>
              <span className="text-[13px] font-bold text-primary-foreground/90">
                ▲ +{data.trendPct}% {L('ce mois', 'هذا الشهر')}
              </span>
            </div>
          </div>

          {/* Monthly bar chart */}
          <Card>
            <CardContent className="py-5">
              <p className="mb-4 text-[14px] font-bold text-de9-ink">
                {L('Revenus mensuels', 'الإيرادات الشهرية')}
              </p>
              <MonthlyChart monthly={data.monthly} />
            </CardContent>
          </Card>

          {/* CA par catégorie */}
          <Card>
            <CardContent className="py-5">
              <p className="mb-4 text-[14px] font-bold text-de9-ink">
                {L('CA par catégorie', 'رقم الأعمال حسب الفئة')}
              </p>
              <CategorieBars rows={data.parCategorie} />
            </CardContent>
          </Card>

          {/* KPI tiles */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiTile
              icon={<Wallet className="size-4" />}
              label={L('Revenue', 'الإيراد')}
              value={`${formatDa(data.revenueDzd)} DZD`}
            />
            <KpiTile
              icon={<Briefcase className="size-4" />}
              label={L('Missions', 'المهام')}
              value={String(data.missions)}
            />
            <KpiTile
              icon={<Star className="size-4" />}
              label={L('Rating', 'التقييم')}
              value={`${data.rating}/5`}
            />
            <KpiTile
              icon={<Trophy className="size-4" />}
              label={L('Win-rate', 'نسبة الفوز')}
              value={`${data.winRatePct}%`}
            />
          </div>

          {/* Voir par employé */}
          <button
            type="button"
            onClick={() => navigate('/prestataire/effectif')}
            className="flex w-full items-center gap-3.5 rounded-lg bg-card p-4 text-start shadow-soft transition-shadow hover:shadow-lift dark:ring-1 dark:ring-border"
          >
            <span className="flex size-10 flex-none items-center justify-center rounded-[12px] bg-de9-teal-tint text-de9-teal">
              <TrendingUp className="size-5" />
            </span>
            <span className="flex-1 text-[14px] font-bold text-de9-ink">
              {L('Voir par employé', 'عرض حسب الموظف')}
            </span>
            <ChevronRight className="size-4 flex-none text-de9-gray rtl:rotate-180" />
          </button>
        </>
      )}
    </div>
  );
}

function MonthlyChart({ monthly }: { monthly: Stats['monthly'] }) {
  return (
    <div className="flex h-40 items-end justify-between gap-2">
      {monthly.map((m) => (
        <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex w-full flex-1 items-end">
            <div
              className="w-full rounded-t-md bg-de9-teal"
              style={{ height: `${Math.max(4, Math.round(m.ratio * 100))}%` }}
            />
          </div>
          <span className="text-[11.5px] font-medium text-de9-gray">{m.month}</span>
        </div>
      ))}
    </div>
  );
}

function CategorieBars({ rows }: { rows: Stats['parCategorie'] }) {
  const max = Math.max(1, ...rows.map((r) => r.valueDzd));
  return (
    <div className="flex flex-col gap-3.5">
      {rows.map((r) => (
        <div key={r.label} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] font-semibold text-de9-ink">{r.label}</span>
            <span className="text-[12.5px] font-bold text-de9-slate">
              {formatDa(r.valueDzd)} DA
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-sm bg-background">
            <div
              className="h-full rounded-sm bg-de9-teal"
              style={{ width: `${Math.round((r.valueDzd / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function KpiTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1.5 py-4">
        <span className="flex items-start justify-between gap-2">
          <span className="text-sm font-semibold text-de9-gray">{label}</span>
          <span className={cn('flex-none text-de9-teal')}>{icon}</span>
        </span>
        <span className="text-2xl font-bold text-de9-ink">{value}</span>
      </CardContent>
    </Card>
  );
}

function StatsSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-5">
      <div className="h-[104px] rounded-lg bg-card shadow-soft dark:ring-1 dark:ring-border" />
      <div className="h-[220px] rounded-lg bg-card shadow-soft dark:ring-1 dark:ring-border" />
      <div className="h-[180px] rounded-lg bg-card shadow-soft dark:ring-1 dark:ring-border" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="h-[104px] rounded-lg bg-card shadow-soft dark:ring-1 dark:ring-border" />
        <div className="h-[104px] rounded-lg bg-card shadow-soft dark:ring-1 dark:ring-border" />
        <div className="h-[104px] rounded-lg bg-card shadow-soft dark:ring-1 dark:ring-border" />
        <div className="h-[104px] rounded-lg bg-card shadow-soft dark:ring-1 dark:ring-border" />
      </div>
    </div>
  );
}
