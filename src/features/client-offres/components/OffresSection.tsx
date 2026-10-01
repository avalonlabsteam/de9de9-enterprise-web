import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Loader2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useL } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { CategorieVisual } from '@/features/client-catalogue/components/CategorieVisual';
import { useOffres } from '../api/offres';
import type { OffreCarte } from '../schemas/offres';
import { PrestataireIdentite } from './OffreParts';

const chip = (active: boolean) =>
  cn(
    'rounded-full px-3 py-1 text-[12px] font-bold transition-colors',
    active ? 'bg-de9-blue text-white' : 'bg-card text-de9-slate shadow-soft hover:text-de9-ink dark:ring-1 dark:ring-border',
  );

function Couverture({ offre }: { offre: OffreCarte }) {
  const [failed, setFailed] = useState(false);
  if (offre.couvertureUrl && !failed) {
    return <img src={offre.couvertureUrl} alt="" loading="lazy" onError={() => setFailed(true)} className="h-32 w-full object-cover" />;
  }
  return (
    <span aria-hidden className="grid h-32 w-full place-items-center bg-secondary" style={offre.hex ? { backgroundColor: `${offre.hex}22` } : undefined}>
      <CategorieVisual icone={offre.icone} iconClassName="size-20" emojiClassName="text-[34px]" />
    </span>
  );
}

function OffreCard({ offre }: { offre: OffreCarte }) {
  const L = useL();
  return (
    <Link
      to={`/client/offres/${encodeURIComponent(offre.id)}`}
      className="group flex h-full flex-col overflow-hidden rounded-[15px] bg-card shadow-soft transition-shadow hover:shadow-lift dark:ring-1 dark:ring-border"
    >
      <Couverture offre={offre} />
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <p className="text-[14.5px] font-bold break-words text-de9-ink group-hover:underline">{offre.titre}</p>
        <PrestataireIdentite prestataire={offre.prestataire} />
        {offre.services.length > 0 && <p className="line-clamp-2 text-[12.5px] text-de9-slate">{offre.services.join(' · ')}</p>}
        {offre.zonesLabel && (
          <p className="flex items-center gap-1 text-[12px] text-de9-gray">
            <MapPin className="size-3.5 flex-none" />
            <span className="truncate">{offre.zonesLabel}</span>
          </p>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="text-[13px] font-bold text-de9-ink">{offre.prixLabel}</span>
          <span className="inline-flex flex-none items-center gap-0.5 text-[12.5px] font-bold text-de9-blue">
            {offre.voir?.label ?? L("Voir l'offre", 'عرض العرض')}
            <ChevronRight className="size-4 rtl:rotate-180" />
          </span>
        </div>
      </div>
    </Link>
  );
}

/**
 * « Offres des prestataires » — under the services of a category: the B2B
 * annonces published in it, with the service and wilaya chips the backend
 * sends. The section is an extra: while it loads, when the route is not served
 * or when the call fails, the page stays the one it was.
 */
export function OffresSection({ categorie }: { categorie: string }) {
  const L = useL();
  const [sousCategorie, setSousCategorie] = useState<string | null>(null);
  const [wilaya, setWilaya] = useState<number | null>(null);
  const query = useOffres({ categorie, sousCategorie, wilaya });

  const pages = query.data?.pages ?? [];
  const tete = pages[0];
  if (!tete) return null;
  const offres = pages.flatMap((page) => page.offres);
  const filtre = sousCategorie !== null || wilaya !== null;
  // Nothing published in the category: no section — de9de9 sources a prestataire, as before.
  if (offres.length === 0 && !filtre) return null;

  return (
    <section className="mt-9">
      <h2 className="text-[17px] font-extrabold text-de9-ink">{tete.titre ?? L('Offres des prestataires', 'عروض مقدّمي الخدمات')}</h2>

      {(tete.filtres.services.length > 0 || tete.filtres.wilayas.length > 0) && (
        <div className="mt-3 flex flex-col gap-2">
          {tete.filtres.services.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tete.filtres.services.map((s) => (
                // A second press on the chip in force clears it.
                <button key={s.code} type="button" aria-pressed={sousCategorie === s.code} onClick={() => setSousCategorie(sousCategorie === s.code ? null : s.code)} className={chip(sousCategorie === s.code)}>
                  {s.label}
                </button>
              ))}
            </div>
          )}
          {tete.filtres.wilayas.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tete.filtres.wilayas.map((w) => (
                <button key={w.code} type="button" aria-pressed={wilaya === w.code} onClick={() => setWilaya(wilaya === w.code ? null : w.code)} className={chip(wilaya === w.code)}>
                  {w.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {offres.length === 0 ? (
        <div className="mt-4 rounded-xl bg-card px-4 py-6 text-center shadow-soft dark:ring-1 dark:ring-border">
          <p className="text-[13.5px] font-semibold text-de9-ink">{tete.vide?.titre ?? L('Aucune offre publiée pour ce service', 'لا يوجد عرض منشور لهذه الخدمة')}</p>
          <p className="mt-1 text-[12.5px] text-de9-gray">{tete.vide?.texte ?? L('de9de9 vous trouve un prestataire.', 'de9de9 يجد لك مقدّم خدمة.')}</p>
        </div>
      ) : (
        <ul className={cn('mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2', query.isPlaceholderData && 'opacity-60')}>
          {offres.map((offre) => (
            <li key={offre.id}>
              <OffreCard offre={offre} />
            </li>
          ))}
        </ul>
      )}

      {query.hasNextPage && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={() => void query.fetchNextPage()} disabled={query.isFetchingNextPage}>
            {query.isFetchingNextPage && <Loader2 className="size-4 animate-spin" />}
            {L('Afficher plus', 'عرض المزيد')}
          </Button>
        </div>
      )}
    </section>
  );
}
