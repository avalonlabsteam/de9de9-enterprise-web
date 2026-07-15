import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, CalendarDays, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useL } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectionBadge, StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { ballOf } from '@/lib/statusModel';
import type { B2bJob } from '../schemas/b2b';
import { useB2bJobs } from '../api/b2b';
import { factureBadge } from './factureBadge';

type FilterKey = 'toutes' | 'action' | 'attente' | 'terminees';

const FILTERS: { key: FilterKey; fr: string; ar: string }[] = [
  { key: 'toutes', fr: 'Toutes', ar: 'الكل' },
  { key: 'action', fr: 'Action requise', ar: 'إجراء مطلوب' },
  { key: 'attente', fr: 'En attente', ar: 'قيد الانتظار' },
  { key: 'terminees', fr: 'Terminées', ar: 'منتهية' },
];

/** Pro-centric bucket for a mission from its status ball. */
function bucketOf(job: B2bJob): Exclude<FilterKey, 'toutes'> {
  const ball = ballOf(job.status);
  if (job.status === 'cancelled' || ball === 'done') return 'terminees';
  if (ball === 'pro') return 'action';
  return 'attente';
}

function Loading() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-40 animate-pulse rounded-2xl border border-de9-line bg-card/60" />
      ))}
    </div>
  );
}

function chipCls(active: boolean): string {
  return cn(
    'rounded-full border px-3.5 py-1.5 text-[12px] font-bold transition-colors',
    active
      ? 'border-de9-teal bg-de9-teal text-white'
      : 'border-de9-line bg-card text-de9-gray hover:text-de9-ink',
  );
}

export function B2bPage() {
  const L = useL();
  const navigate = useNavigate();
  const { data, isPending, isError } = useB2bJobs();
  const [filter, setFilter] = useState<FilterKey>('toutes');

  const items = useMemo(() => {
    if (!data) return [];
    if (filter === 'toutes') return data;
    return data.filter((j) => bucketOf(j) === filter);
  }, [data, filter]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 pb-24">
      <header className="mb-5">
        <h1 className="text-[22px] font-black text-de9-ink">{L('B2B · Entreprises', 'B2B · شركات')}</h1>
        <p className="mt-1 text-[14px] text-de9-gray">
          {L(
            'Missions assignées par de9de9 (clients entreprises)',
            'مهام مُسندة من de9de9 (عملاء شركات)',
          )}
        </p>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={chipCls(filter === f.key)}
            onClick={() => setFilter(f.key)}
          >
            {L(f.fr, f.ar)}
          </button>
        ))}
      </div>

      {isPending ? (
        <Loading />
      ) : isError ? (
        <EmptyState
          title={L('Impossible de charger les missions', 'تعذّر تحميل المهام')}
          description={L('Veuillez réessayer.', 'يرجى المحاولة مرة أخرى.')}
        />
      ) : items.length === 0 ? (
        <EmptyState title={L('Aucune mission dans cette catégorie', 'لا توجد مهمة في هذه الفئة')} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((job) => {
            const fb = factureBadge(job);
            return (
              <Card
                key={job.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate('/prestataire/b2b/' + job.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate('/prestataire/b2b/' + job.id);
                  }
                }}
                className="cursor-pointer transition-shadow hover:shadow-md"
              >
                <CardHeader className="gap-1">
                  <div className="flex items-center gap-2 text-[13px] font-bold text-de9-gray">
                    <Building2 className="size-4 flex-none" />
                    <span className="truncate">{job.clientEntreprise}</span>
                  </div>
                  <CardTitle className="text-[15px]">{job.serviceName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-[13px] text-de9-gray">
                    <CalendarDays className="size-3.5 flex-none" />
                    <span>{job.occurrenceLabel}</span>
                    <span className="text-de9-line">·</span>
                    <span>{job.dateLabel}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <ProjectionBadge code={job.status} projection="pro" />
                    <StatusBadge label={L(fb.fr, fb.ar)} kind={fb.kind} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <button
        type="button"
        aria-label={L('Créer une annonce B2B', 'إنشاء إعلان B2B')}
        onClick={() => navigate('/prestataire/annonce/create?type=b2b')}
        className="fixed bottom-24 end-6 z-30 inline-flex size-14 items-center justify-center rounded-full bg-[#2F7FD0] text-white shadow-lg transition-transform hover:scale-105 active:scale-95 hover:bg-[#2a72bd]"
      >
        <Plus className="size-6" />
      </button>
    </div>
  );
}
