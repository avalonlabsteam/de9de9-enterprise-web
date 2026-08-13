import { cn } from '@/lib/utils';
import type { BadgeKind } from '@/lib/statusModel';
import { projectionLabel, type Projection, type StatusCode, ballOf } from '@/lib/statusModel';

/** Theme-aware tint per urgency kind (literal classes for the Tailwind scanner). */
const KIND_CLASSES: Record<BadgeKind, string> = {
  action: 'bg-de9-red-soft text-de9-red',
  wait: 'bg-de9-orange/20 text-de9-orange-deep',
  setup: 'bg-de9-blue-tint text-de9-blue',
  done: 'bg-de9-teal-soft text-de9-teal-dark',
  info: 'bg-accent text-accent-foreground',
  cancelled: 'bg-secondary text-de9-gray',
};

export function StatusBadge({
  label,
  kind = 'info',
  className,
}: {
  label: string;
  kind?: BadgeKind;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold',
        KIND_CLASSES[kind],
        className,
      )}
    >
      {label}
    </span>
  );
}

/** Map a status's "ball" to a badge kind (who must act → how urgent it reads). */
function kindForBall(code: StatusCode): BadgeKind {
  const ball = ballOf(code);
  if (code === 'cancelled') return 'cancelled';
  if (ball === 'done') return 'done';
  if (ball === 'client') return 'action';
  if (ball === 'de9' || ball === 'pro') return 'wait';
  return 'info';
}

/** Render a status's projection label for a given viewpoint. */
export function ProjectionBadge({
  code,
  projection,
  date,
  className,
}: {
  code: StatusCode;
  projection: Projection;
  date?: string;
  className?: string;
}) {
  return (
    <StatusBadge
      label={projectionLabel(code, projection, date)}
      kind={kindForBall(code)}
      className={className}
    />
  );
}
