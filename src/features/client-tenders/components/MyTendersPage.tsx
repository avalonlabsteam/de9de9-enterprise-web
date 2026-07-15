import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, LifeBuoy, MapPin } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { uiActions } from '@/stores/uiStore';
import { computeDemandBadge, type BadgeKind } from '@/lib/statusModel';
import { FAMILY_BY_ID } from '@/lib/catalogue';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CategoryIcon } from '@/components/common/CategoryChip';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { useTenders } from '../api/tenders';
import type { Tender } from '../schemas/tender';
import { fmtDate } from '../lib/format';

type FilterKey = 'all' | 'action' | 'wait' | 'setup' | 'done' | 'cancelled';

function badgeFor(tender: Tender) {
  return computeDemandBadge({
    setup: tender.setup,
    occurrences: tender.occurrences,
    type: tender.type,
  });
}

/** A demand's derived badge kind bucketed to a filter chip (info → only "Tous"). */
function bucketOf(kind: BadgeKind): FilterKey | null {
  switch (kind) {
    case 'action':
      return 'action';
    case 'wait':
      return 'wait';
    case 'setup':
      return 'setup';
    case 'done':
      return 'done';
    case 'cancelled':
      return 'cancelled';
    default:
      return null;
  }
}

export function MyTendersPage() {
  const t = useT();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterKey>('all');
  const { data, isPending, isError } = useTenders();

  const chips: { key: FilterKey; label: string }[] = [
    { key: 'all', label: t('filAll') },
    { key: 'action', label: t('filAction') },
    { key: 'wait', label: t('filWait') },
    { key: 'setup', label: t('filSetup') },
    { key: 'done', label: t('filDone') },
    { key: 'cancelled', label: t('filCancelled') },
  ];

  const decorated = useMemo(
    () => (data ?? []).map((tender) => ({ tender, badge: badgeFor(tender) })),
    [data],
  );

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = { all: 0, action: 0, wait: 0, setup: 0, done: 0, cancelled: 0 };
    c.all = decorated.length;
    for (const { badge } of decorated) {
      const b = bucketOf(badge.kind);
      if (b) c[b] += 1;
    }
    return c;
  }, [decorated]);

  const visible = useMemo(
    () => (filter === 'all' ? decorated : decorated.filter(({ badge }) => bucketOf(badge.kind) === filter)),
    [decorated, filter],
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-de9-ink">{t('suiviTitle')}</h1>
          <p className="mt-0.5 text-[13px] text-de9-slate">{t('suiviHint')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => uiActions.openSupport()} aria-label="Support">
            <LifeBuoy className="size-4" />
          </Button>
          <button
            type="button"
            onClick={() => navigate('/client/profile')}
            className="flex size-9 items-center justify-center rounded-full bg-de9-ink text-[13px] font-extrabold text-background"
            aria-label="Profil"
          >
            EL
          </button>
        </div>
      </header>

      <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1">
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={() => setFilter(chip.key)}
            className={cn(
              'flex-none rounded-full border px-3.5 py-1.5 text-[13px] font-bold whitespace-nowrap transition-colors',
              filter === chip.key
                ? 'border-de9-teal-dark bg-de9-teal-dark text-white'
                : 'border-de9-line bg-card text-de9-slate hover:border-de9-teal',
            )}
          >
            {chip.label} · {counts[chip.key]}
          </button>
        ))}
      </div>

      {isPending && (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-secondary" />
          ))}
        </div>
      )}

      {isError && (
        <EmptyState
          title="Erreur de chargement"
          description="Impossible de charger vos demandes. Réessayez plus tard."
        />
      )}

      {!isPending && !isError && visible.length === 0 && <EmptyState title={t('suiviEmpty')} />}

      {!isPending && !isError && visible.length > 0 && (
        <div className="flex flex-col gap-3">
          {visible.map(({ tender, badge }) => {
            const fam = FAMILY_BY_ID[tender.familyId];
            return (
              <button
                key={tender.id}
                type="button"
                onClick={() => navigate(`/client/tender/${tender.id}`)}
                className="text-start"
              >
                <Card className="transition-colors hover:border-de9-teal">
                  <CardContent className="flex items-center gap-3.5 py-4">
                    {fam && <CategoryIcon colorKey={fam.colorKey} icon={fam.icon} />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-bold text-de9-ink">{tender.serviceName}</p>
                      <div className="mt-1 flex items-center gap-3 text-[12px] text-de9-gray">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5" />
                          {tender.wilaya}
                        </span>
                        <span>{fmtDate(tender.createdAt)}</span>
                      </div>
                      <div className="mt-2">
                        <StatusBadge label={badge.fr} kind={badge.kind} />
                      </div>
                    </div>
                    <ChevronRight className="size-5 flex-none text-de9-gray" />
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
