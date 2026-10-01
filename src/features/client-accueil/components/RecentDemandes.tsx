import { useNavigate } from 'react-router-dom';
import { ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useL } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { ClientAccueil, DemandeRecente } from '@/features/auth/schemas/accueil';
import { useAccesB2b } from '@/features/auth/api/accueil';
import { scrollToCatalogue } from '../lib/catalogue';
import { demandeBadgeKind, shortDate, statutLabelAr } from '../lib/format';
import { CategorieVisual } from '@/features/client-catalogue/components/CategorieVisual';

/** The latest five requests, newest first, as the backend lists them. */
export function RecentDemandes({ demandes }: { demandes: ClientAccueil['demandes'] }) {
  const L = useL();
  const navigate = useNavigate();
  const recentes = demandes.recentes.slice(0, 5);
  const empty = recentes.length === 0;
  const accesB2b = useAccesB2b();

  return (
    <Card className="@container flex-1">
      <CardContent className="px-4 py-5 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="text-[16px] font-bold text-de9-ink">{L('Demandes récentes', 'الطلبات الأخيرة')}</h2>
            {!empty && (
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-bold text-de9-teal-dark">
                {L(`${demandes.enCours} en cours`, `${demandes.enCours} جارية`)}
              </span>
            )}
          </div>
          {!empty && (
            <button
              type="button"
              onClick={() => navigate('/client/tenders')}
              className="flex flex-none items-center gap-1 text-[13px] font-semibold text-de9-teal-dark"
            >
              {L('Tout voir', 'عرض الكل')}
              <ChevronRight className="size-4 rtl:rotate-180" />
            </button>
          )}
        </div>

        {empty ? (
          <div className="mt-3 flex flex-col items-start gap-3">
            <p className="text-[13px] text-de9-slate">
              {L("Aucune demande pour l'instant", 'لا توجد طلبات حاليًا')}
            </p>
            {accesB2b && (
              <Button className="h-10 gap-2 text-[14px] shadow-glow" onClick={scrollToCatalogue}>
                <Plus className="size-4" />
                {L('Créer une demande', 'إنشاء طلب')}
              </Button>
            )}
          </div>
        ) : (
          <ul className="mt-2 flex flex-col divide-y divide-border">
            {recentes.map((demande) => (
              <DemandeRow
                key={demande.id}
                demande={demande}
                onOpen={() => navigate(`/client/tender/${demande.id}`)}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/** A cancelled request stays listed but greyed, its pill neutral. */
function DemandeRow({ demande, onOpen }: { demande: DemandeRecente; onOpen: () => void }) {
  const L = useL();
  const meta = [demande.categorie, shortDate(demande.creeLe)].filter(Boolean).join(' · ');

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className={cn('group flex w-full items-center gap-3 py-3 text-start', demande.annulee && 'opacity-60')}
      >
        <span aria-hidden className="grid size-10 flex-none place-items-center rounded-full bg-secondary">
          <CategorieVisual icone={demande.icone} iconClassName="size-7" emojiClassName="text-[18px]" />
        </span>
        {/* The pill drops under the title on a narrow card so the title keeps its width. */}
        <span className="flex min-w-0 flex-1 flex-col gap-1 @lg:flex-row @lg:items-center @lg:gap-3">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-de9-ink group-hover:text-de9-teal-dark">
              {demande.titre}
            </span>
            <span className="block truncate text-[12px] text-de9-slate">{meta}</span>
          </span>
          <StatusBadge
            label={L(demande.statutLabel, statutLabelAr(demande))}
            kind={demandeBadgeKind(demande)}
            className="flex-none self-start whitespace-nowrap @lg:self-auto"
          />
        </span>
        <ChevronRight className="size-4 flex-none text-de9-gray rtl:rotate-180" />
      </button>
    </li>
  );
}
