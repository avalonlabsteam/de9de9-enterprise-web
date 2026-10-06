import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PrestataireCarte } from '../../schemas/suivi';

/** A provider's identity: initials in its colour, name, and « ★ 4.7 · 12 ans ». */
export function PrestataireIdentity({ p, className }: { p: PrestataireCarte; className?: string }) {
  return (
    <div className={cn('flex min-w-0 items-center gap-3', className)}>
      <span
        className="grid size-11 flex-none place-items-center rounded-full bg-de9-teal text-[14px] font-extrabold text-primary-foreground"
        style={p.couleur ? { backgroundColor: p.couleur } : undefined}
        aria-hidden
      >
        {p.initiales ?? p.nom.slice(0, 2).toUpperCase()}
      </span>
      <div className="min-w-0">
        <p className="truncate text-[15px] font-bold text-de9-ink">{p.nom}</p>
        {p.sousTitre && (
          <p className="flex items-center gap-1 text-[12.5px] text-de9-slate">
            {p.note != null && <Star className="size-3.5 flex-none fill-amber-400 text-amber-400" />}
            <span className="truncate">{p.sousTitre}</span>
          </p>
        )}
      </div>
    </div>
  );
}
