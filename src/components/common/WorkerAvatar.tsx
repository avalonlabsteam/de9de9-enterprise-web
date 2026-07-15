import { cn } from '@/lib/utils';

export interface AvatarWorker {
  name: string;
  colorHex?: string;
}

/** Derive up-to-2 initials from a worker name; falls back to a neutral glyph. */
function initialsOf(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((p) => p && p !== '—');
  if (parts.length === 0) return '—';
  const first = parts[0]?.[0] ?? '';
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + second).toUpperCase();
}

const DE9_GRAY = '#8A94A0';

export function WorkerAvatar({
  worker,
  size = 32,
  className,
}: {
  worker: AvatarWorker;
  size?: number;
  className?: string;
}) {
  const bg = worker.colorHex && worker.colorHex.trim() ? worker.colorHex : DE9_GRAY;
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white select-none',
        className,
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: bg,
        fontSize: Math.max(10, Math.round(size * 0.4)),
      }}
      aria-hidden="true"
    >
      {initialsOf(worker.name)}
    </span>
  );
}
