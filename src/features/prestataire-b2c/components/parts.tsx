import type { ReactNode } from 'react';
import { CalendarDays, Loader2, MapPin, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useL } from '@/lib/i18n';
import { tonePill } from '@/lib/tones';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { legacyErrorMessage } from '../api/legacy';
import { actionLabel, actionsFor, type JobAction, type JobState, type Pill } from '../lib/jobs';
import { useJobFlow } from '../lib/jobFlow';

const initialsOf = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();

/** The particulier: their photo, or their initials. */
export function ClientAvatar({ name, photo, className }: { name: string; photo?: string; className?: string }) {
  const cls = cn('size-10 flex-none rounded-full', className);
  if (photo) return <img src={photo} alt="" className={cn(cls, 'object-cover')} />;
  return (
    <span className={cn(cls, 'grid place-items-center bg-de9-blue-tint text-[13px] font-bold text-de9-blue')}>
      {initialsOf(name) || '?'}
    </span>
  );
}

export function StatePill({ pill, className }: { pill: Pill; className?: string }) {
  const L = useL();
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold', tonePill(pill.ton), className)}>
      {L(...pill.label)}
    </span>
  );
}

/** « 📍 Kouba » · « 🗓 04/10/2026 · 14:30 » · the price, on one wrapping line. */
export function Facts({ lieu, date, prix }: { lieu?: string; date?: string; prix?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-de9-gray">
      {lieu && (
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-3.5 flex-none text-de9-teal" /> {lieu}
        </span>
      )}
      {date && (
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="size-3.5 flex-none text-de9-teal" /> <span dir="ltr">{date}</span>
        </span>
      )}
      {prix && <span className="ms-auto font-bold text-de9-ink tabular-nums">{prix}</span>}
    </div>
  );
}

/** The consumer's rating of a finished job, 1–5. */
export function Rating({ value, comment }: { value?: number; comment?: string }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-1">
      <span className="inline-flex items-center gap-0.5" aria-label={`${value}/5`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className={cn('size-4', i <= value ? 'fill-de9-orange text-de9-orange' : 'text-de9-line')} />
        ))}
      </span>
      {comment && <p className="text-xs text-de9-slate">« {comment} »</p>}
    </div>
  );
}

const ACTION_VARIANT: Record<JobAction, 'default' | 'outline' | 'destructive'> = {
  accept: 'default',
  acceptModification: 'default',
  terminate: 'default',
  modify: 'outline',
  decline: 'outline',
  cancel: 'outline',
};

/** The buttons a job's state offers (primary first), each pressed through the page's flow. */
export function JobActions({ id, state, className }: { id: string; state: JobState; className?: string }) {
  const L = useL();
  const flow = useJobFlow();
  const actions = actionsFor(state);
  if (actions.length === 0) return null;
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {actions.map((action) => (
        <Button
          key={action}
          size="sm"
          variant={ACTION_VARIANT[action]}
          disabled={flow.isBusy(id)}
          onClick={() => flow.press(id, state, action)}
          className={cn('flex-1', (action === 'decline' || action === 'cancel') && 'text-destructive')}
        >
          {flow.isBusy(id, action) && <Loader2 className="size-4 animate-spin" />}
          {L(...actionLabel(action, state))}
        </Button>
      ))}
    </div>
  );
}

export function CardSkeletons({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={cn('h-40 animate-pulse rounded-lg bg-card/60 shadow-soft dark:ring-1 dark:ring-border', className)} />
      ))}
    </div>
  );
}

/** A list that could not load: what happened, and a real « Réessayer » button. */
export function LoadError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const L = useL();
  return (
    <EmptyState
      title={L('Impossible de charger', 'تعذّر التحميل')}
      description={legacyErrorMessage(error, L) || undefined}
      action={
        <Button variant="outline" size="sm" onClick={onRetry}>
          {L('Réessayer', 'إعادة المحاولة')}
        </Button>
      }
    />
  );
}

export function MoreButton({ query }: { query: { hasNextPage: boolean; isFetchingNextPage: boolean; fetchNextPage: () => unknown } }) {
  const L = useL();
  if (!query.hasNextPage) return null;
  return (
    <div className="mt-5 flex justify-center">
      <Button variant="outline" onClick={() => void query.fetchNextPage()} disabled={query.isFetchingNextPage}>
        {query.isFetchingNextPage && <Loader2 className="size-4 animate-spin" />}
        {L('Afficher plus', 'عرض المزيد')}
      </Button>
    </div>
  );
}

/** A labelled line of a detail sheet. */
export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="flex-none text-[13px] text-de9-gray">{label}</dt>
      <dd className="min-w-0 text-end text-[13px] font-semibold break-words text-de9-ink">{children}</dd>
    </div>
  );
}
