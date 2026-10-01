import { BadgeCheck, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthedImage } from '@/lib/useAuthedImage';
import type { OffrePrestataire } from '../schemas/offres';

/** The prestataire's logo, or its initials on its own colour. */
function Logo({ prestataire, className }: { prestataire: OffrePrestataire; className?: string }) {
  const src = useAuthedImage(prestataire.logoUrl);
  if (src) return <img src={src} alt="" className={cn('flex-none rounded-full object-cover', className)} />;
  return (
    <span
      aria-hidden
      className={cn('grid flex-none place-items-center rounded-full bg-de9-blue text-[13px] font-bold text-white', className)}
      style={prestataire.couleur ? { backgroundColor: prestataire.couleur } : undefined}
    >
      {prestataire.initiales || prestataire.nom.charAt(0).toUpperCase()}
    </span>
  );
}

/**
 * Who offers: name, logo, rating and badges — all a client company is shown of
 * a prestataire. Its contacts never are: a demande stays routed by de9de9.
 */
export function PrestataireIdentite({ prestataire, grand }: { prestataire: OffrePrestataire; grand?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Logo prestataire={prestataire} className={grand ? 'size-12' : 'size-9'} />
      <div className="min-w-0">
        <p className={cn('truncate font-bold text-de9-ink', grand ? 'text-[15px]' : 'text-[13px]')}>{prestataire.nom}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-de9-gray">
          {prestataire.noteLabel && (
            <span className="inline-flex items-center gap-1">
              <Star className="size-3 fill-de9-orange text-de9-orange" />
              {prestataire.noteLabel}
            </span>
          )}
          {prestataire.badges.map((badge) => (
            <span key={badge.code ?? badge.label} className="inline-flex items-center gap-0.5 font-semibold text-de9-teal-dark">
              <BadgeCheck className="size-3" />
              {badge.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
