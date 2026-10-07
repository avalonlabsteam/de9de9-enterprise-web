import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronRight, File, FileImage, FileText } from 'lucide-react';
import { useL } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { tonePill, toneText } from '@/lib/tones';
import { toProblem } from '@/api/problem';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { useMouvement } from '../api/portefeuille';
import { routeForLien } from '../lib/liens';
import type { Fichier, Lien } from '../schemas/portefeuille';
import { FichierViewer } from './FichierViewer';

/** The badge on the dark card is white; its text takes the tone. */
const BADGE_TEXT: Record<string, string> = {
  valide: 'text-emerald-700',
  danger: 'text-red-600',
  attention: 'text-amber-700',
  info: 'text-sky-700',
  succes: 'text-teal-700',
};
const DARK_TONE: Record<string, string> = {
  danger: 'text-red-300',
  attention: 'text-amber-300',
  succes: 'text-teal-300',
  valide: 'text-emerald-300',
  info: 'text-sky-300',
};

/** One side of the before → after card. */
function SoldeCote({
  cote,
  end,
}: {
  cote: { label: string; creditsLabel: string; dzdLabel?: string | null; ton?: string | null };
  end?: boolean;
}) {
  return (
    <div className={cn('flex min-w-0 flex-1 flex-col', end && 'items-end text-end')}>
      <span className="text-[12px] text-de9-gray">{cote.label}</span>
      <span className={cn('text-[15px] font-bold tabular-nums', cote.ton ? toneText(cote.ton) : 'text-de9-ink')} dir="ltr">
        {cote.creditsLabel}
      </span>
      {cote.dzdLabel && <span className="text-[12px] text-de9-slate">{cote.dzdLabel}</span>}
    </div>
  );
}

function FichierThumb({ type }: { type?: string | null }) {
  if (type === 'image') return <FileImage className="size-6" />;
  if (type === 'pdf') return <FileText className="size-6" />;
  return <File className="size-6" />;
}

/**
 * « Détail du mouvement » — `GET /client/portefeuille/mouvements/{id}`. The
 * summary card, the before → after card, the rows, the documents and the note,
 * each printed as sent.
 */
export function MouvementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const L = useL();
  const navigate = useNavigate();
  const location = useLocation();
  const query = useMouvement(id);
  const [viewer, setViewer] = useState<Fichier | null>(null);

  // Back keeps the list as it was; a deep link has no list behind it.
  const back = () => (location.key !== 'default' ? navigate(-1) : navigate('/client/wallet'));
  const open = (lien: Lien) => {
    const route = routeForLien(lien);
    if (route) navigate(route);
  };

  const header = (
    <header className="flex items-center gap-3">
      <Button variant="outline" size="icon" onClick={back} aria-label={L('Retour', 'رجوع')}>
        <ArrowLeft className="size-4 rtl:rotate-180" />
      </Button>
      <h1 className="text-xl font-extrabold text-de9-ink">{L('Détail du mouvement', 'تفاصيل الحركة')}</h1>
    </header>
  );

  if (query.isPending) {
    return (
      <div className="mx-auto flex max-w-[720px] flex-col gap-4">
        {header}
        <div className="h-44 animate-pulse rounded-2xl bg-secondary" />
        <div className="h-24 animate-pulse rounded-2xl bg-secondary" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    const problem = toProblem(query.error);
    return (
      <div className="mx-auto flex max-w-[720px] flex-col gap-4">
        {header}
        <EmptyState
          title={problem.status === 404 ? (problem.detail ?? 'Ce mouvement est introuvable.') : L('Impossible de charger le mouvement', 'تعذّر تحميل الحركة')}
          action={
            <Button variant="outline" size="sm" onClick={() => navigate('/client/wallet')}>
              {L('Retour au portefeuille', 'العودة إلى المحفظة')}
            </Button>
          }
        />
      </div>
    );
  }

  const m = query.data;

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-4 pb-12">
      {header}

      {/* Summary — the dark card */}
      <div className="rounded-2xl bg-gradient-to-br from-[#223042] to-[#0f172a] p-5 text-white shadow-lift">
        {m.badge && (
          <span className={cn('inline-block rounded-full bg-white px-2.5 py-1 text-[11.5px] font-bold', BADGE_TEXT[m.badge.ton ?? ''] ?? 'text-slate-700')}>
            {m.badge.label}
          </span>
        )}
        <p className={cn('mt-3 text-[28px] font-extrabold tabular-nums', DARK_TONE[m.montant.ton ?? ''] ?? 'text-white')} dir="ltr">
          {m.montant.label}
        </p>
        {m.montant.dzdLabel && <p className="text-[12.5px] text-white/65">{m.montant.dzdLabel}</p>}
        {m.enTete.length > 0 && (
          <dl className="mt-4 flex flex-col gap-1.5 border-t border-white/10 pt-3">
            {m.enTete.map((ligne) => (
              <div key={ligne.code ?? ligne.label} className="flex justify-between gap-4 text-[13px]">
                <dt className="text-white/60">{ligne.label}</dt>
                <dd className="text-end font-semibold tabular-nums">{ligne.valeur}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      {/* Before → after: the balance, or (a freeze / a release) the frozen total */}
      {m.solde && (
        <Card>
          <CardContent className="flex flex-col gap-3 py-4">
            <div className="flex items-center gap-3">
              <SoldeCote cote={m.solde.avant} />
              <ArrowRight className="size-4 flex-none text-de9-gray rtl:rotate-180" aria-hidden />
              <SoldeCote cote={m.solde.apres} end />
            </div>
            {m.solde.note && <p className="rounded-lg bg-secondary px-3 py-2 text-[12.5px] text-de9-slate">{m.solde.note}</p>}
          </CardContent>
        </Card>
      )}

      {/* « label · valeur » rows */}
      {m.details.length > 0 && (
        <Card>
          <CardContent className="divide-y divide-border px-4 py-1">
            {m.details.map((ligne) => (
              <div key={ligne.code ?? ligne.label} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3 text-[13px]">
                <span className="text-de9-gray">{ligne.label}</span>
                <span className="flex items-center gap-2">
                  <span className={cn('text-end font-semibold', ligne.ton ? toneText(ligne.ton) : 'text-de9-ink')}>{ligne.valeur}</span>
                  {ligne.lien && (
                    <button
                      type="button"
                      onClick={() => ligne.lien && open(ligne.lien)}
                      className="inline-flex items-center gap-0.5 rounded-full bg-accent px-2.5 py-1 text-[11.5px] font-bold text-de9-teal-dark"
                    >
                      {ligne.lien.label}
                      <ChevronRight className="size-3.5 rtl:rotate-180" />
                    </button>
                  )}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      {m.sections.map((section) => (
        <section key={section.code ?? section.titre} className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[14px] font-bold text-de9-ink">{section.titre}</h2>
            {section.lien && (
              <button
                type="button"
                onClick={() => section.lien && open(section.lien)}
                className="inline-flex items-center gap-0.5 text-[12.5px] font-semibold text-de9-teal-dark hover:underline"
              >
                {section.lien.label}
                <ChevronRight className="size-3.5 rtl:rotate-180" />
              </button>
            )}
          </div>
          {section.fichier ? (
            <button
              type="button"
              onClick={() => section.fichier && setViewer(section.fichier)}
              className="flex items-center gap-3 rounded-xl bg-card p-3.5 text-start shadow-soft transition-shadow hover:shadow-lift dark:ring-1 dark:ring-border"
            >
              <span className={cn('grid size-12 flex-none place-items-center rounded-lg', tonePill(section.fichier.type === 'pdf' ? 'danger' : 'info'))}>
                <FichierThumb type={section.fichier.type} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-bold text-de9-ink">{section.fichier.titre}</span>
                {section.fichier.sousTitre && <span className="block text-[12.5px] text-de9-slate">{section.fichier.sousTitre}</span>}
              </span>
              {section.fichier.actionLabel && (
                <span className="flex-none text-[12.5px] font-semibold text-de9-teal-dark">{section.fichier.actionLabel}</span>
              )}
            </button>
          ) : (
            section.vide && <p className="rounded-xl bg-secondary/60 px-4 py-4 text-[13px] text-de9-slate">{section.vide}</p>
          )}
        </section>
      ))}

      {m.note && <p className="text-center text-[12.5px] text-de9-slate">{m.note}</p>}

      {viewer && <FichierViewer fichier={viewer} onClose={() => setViewer(null)} />}
    </div>
  );
}
