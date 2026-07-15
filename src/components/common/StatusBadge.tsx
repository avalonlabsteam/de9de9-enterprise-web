import { cn } from '@/lib/utils';
import type { BadgeKind } from '@/lib/statusModel';
import { projectionLabel, type Projection, type StatusCode, ballOf } from '@/lib/statusModel';

/** Theme-aware tint per urgency kind (literal classes for the Tailwind scanner). */
const KIND_CLASSES: Record<BadgeKind, string> = {
  action: 'bg-[#FDECEC] text-de9-red dark:bg-[#331A1C] dark:text-[#FF7A80]',
  wait: 'bg-[#FEF6E9] text-[#B9781A] dark:bg-[#33280F] dark:text-[#E0A82E]',
  setup: 'bg-[#EAF2FD] text-[#2F7FD0] dark:bg-[#17293A] dark:text-[#5BB6F0]',
  done: 'bg-[#E6F6EC] text-[#2E9E5B] dark:bg-[#123322] dark:text-[#5FCF8A]',
  info: 'bg-[#E5F7F4] text-de9-teal-dark dark:bg-[#14322E] dark:text-[#65CBC4]',
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
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold',
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
