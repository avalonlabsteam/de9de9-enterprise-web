import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, MapPin, RefreshCw } from 'lucide-react';
import { useT, useL } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { BadgeKind } from '@/lib/statusModel';
import { toProblem } from '@/api/problem';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { OngletBar } from '@/components/common/OngletBar';
import { CategorieVisual } from '@/features/client-catalogue/components/CategorieVisual';
import { useClientDemandes } from '../api/demandes';
import {
  VUES,
  vueSchema,
  type DemandeBadge,
  type DemandeCard,
  type Onglet,
  type Vue,
} from '../schemas/demandes';

/** Arabic for the tab labels the backend sends in French. */
const VUE_AR: Record<Vue, string> = {
  tous: 'الكل',
  action_requise: 'إجراء مطلوب',
  facture_en_attente: 'فاتورة معلّقة',
  en_preparation: 'قيد التحضير',
  terminees: 'منتهية',
  annulees: 'ملغاة',
};

/** Shown before the first answer, so the bar does not jump in. */
const VUE_FR: Record<Vue, string> = {
  tous: 'Tous',
  action_requise: 'Action requise',
  facture_en_attente: 'Facture en attente',
  en_preparation: 'En préparation',
  terminees: 'Terminées',
  annulees: 'Annulées',
};

const STATUT_AR: Record<string, string> = {
  en_attente: 'قيد الانتظار',
  contacte: 'تم التواصل',
  devis_en_cours: 'عرض السعر قيد الإعداد',
  assigne: 'تم التعيين',
  contractualise: 'تم التعاقد',
  annulee: 'ملغاة',
};

/** Same tints as the home's recent requests: steps blue, contracted teal, cancelled neutral. */
function pillKind(card: DemandeCard): BadgeKind {
  if (card.annulee || card.statut === 'annulee') return 'cancelled';
  return card.statut === 'contractualise' ? 'done' : 'setup';
}

/** `ton` is a meaning; this is the app's colour for it. */
const TONE_CLASSES: Record<string, string> = {
  action: 'text-violet-600 dark:text-violet-300',
  danger: 'text-de9-red',
  attention: 'text-de9-orange-deep',
  info: 'text-de9-blue',
  neutre: 'text-de9-gray',
  succes: 'text-de9-teal-dark',
};

/** Lines that read as a sentence, not a status: no ● in front (per the design). */
const NO_DOT = new Set(['choisir_prestataire', 'prochaine_visite_a_confirmer', 'prochaine_visite']);

function BadgeLine({ badge }: { badge: DemandeBadge }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[12px] font-semibold',
        TONE_CLASSES[badge.ton] ?? 'text-de9-slate',
      )}
    >
      {!NO_DOT.has(badge.code) && <span aria-hidden className="size-1.5 flex-none rounded-full bg-current" />}
      {/* The label comes with its date filled in: printed as is. */}
      {badge.label.replace(/^●\s*/, '')}
    </span>
  );
}

export function MyTendersPage() {
  const t = useT();
  const L = useL();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  // The tab lives in the URL; anything unknown falls back to « Tous » rather
  // than reaching the API as a 400.
  const parsedVue = vueSchema.safeParse(params.get('vue'));
  const vue: Vue = parsedVue.success ? parsedVue.data : 'tous';
  const query = useClientDemandes(vue);

  const pages = query.data?.pages ?? [];
  const onglets: Onglet[] = pages[0]?.onglets.length
    ? pages[0].onglets
    : VUES.map((code) => ({ code, label: VUE_FR[code], count: 0 }));
  const cards = pages.flatMap((page) => page.data);
  const loaded = pages.length > 0;

  const selectVue = (next: string) => {
    const parsed = vueSchema.safeParse(next);
    if (!parsed.success) return;
    setParams(parsed.data === 'tous' ? {} : { vue: parsed.data }, { replace: true });
  };

  // A contracted card opens the same screen: `GET /client/demandes/{id}`
  // carries the commande (visits, invoices) inside it.
  const openCard = (card: DemandeCard) => navigate(`/client/tender/${card.id}`);

  const errorView = () => {
    const problem = toProblem(query.error);
    const description =
      problem.code === 'company_not_client'
        ? L(
            "L'espace client n'est pas activé pour votre entreprise.",
            'مساحة العميل غير مفعّلة لشركتك.',
          )
        : problem.status === 403
          ? L(
              'Cette page appartient à l’espace client : passez-y depuis le menu.',
              'هذه الصفحة تابعة لمساحة العميل: انتقل إليها من القائمة.',
            )
          : L('Réessayez dans un instant.', 'أعد المحاولة بعد لحظة.');
    return (
      <EmptyState
        title={L('Impossible de charger vos demandes', 'تعذّر تحميل طلباتك')}
        description={description}
        action={
          problem.code === 'company_not_client' || problem.status === 403 ? undefined : (
            <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
              {L('Réessayer', 'إعادة المحاولة')}
            </Button>
          )
        }
      />
    );
  };

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-5">
        <h1 className="text-[22px] font-extrabold text-de9-ink">{t('suiviTitle')}</h1>
        <p className="mt-0.5 text-[13px] text-de9-slate">{t('suiviHint')}</p>
      </header>

      {/* Wrapping chips, as on the other lists: nothing scrolls sideways, nothing is cut off. */}
      <OngletBar
        className="mb-5"
        active={vue}
        onSelect={selectVue}
        onglets={onglets.map((onglet) => {
          const code = vueSchema.safeParse(onglet.code);
          return {
            code: onglet.code,
            label: L(onglet.label, code.success ? VUE_AR[code.data] : onglet.label),
            // Counts ignore the selected tab; none are shown until the first answer.
            count: loaded ? onglet.count : undefined,
          };
        })}
      />

      {query.isPending && (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-secondary" />
          ))}
        </div>
      )}

      {query.isError && !loaded && errorView()}

      {loaded && cards.length === 0 && (
        <EmptyState title={L('Aucune demande', 'لا توجد طلبات')} />
      )}

      {cards.length > 0 && (
        <div className="flex flex-col gap-3">
          {cards.map((card) => (
            <button key={card.id} type="button" onClick={() => openCard(card)} className="text-start">
              <Card className={cn('transition-shadow hover:shadow-lift', card.annulee && 'opacity-60')}>
                <CardContent className="flex items-center gap-3.5 py-4">
                  <span aria-hidden className="grid size-11 flex-none place-items-center rounded-full bg-secondary">
                    <CategorieVisual icone={card.icone} iconClassName="size-8" emojiClassName="text-[20px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-base font-bold text-de9-ink">
                      <span className="truncate">{card.titre}</span>
                      {card.recurrent && (
                        <RefreshCw
                          className="size-3.5 flex-none text-de9-teal"
                          aria-label={card.frequenceLabel ?? L('Récurrente', 'متكررة')}
                        />
                      )}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-de9-slate">
                      {card.wilaya && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5 text-de9-teal" />
                          {card.wilaya}
                        </span>
                      )}
                      {card.wilaya && card.dateLabel && <span aria-hidden>·</span>}
                      {card.dateLabel && <span>{card.dateLabel}</span>}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <StatusBadge
                        label={L(card.statutLabel, STATUT_AR[card.statut] ?? card.statutLabel)}
                        kind={pillKind(card)}
                      />
                      {/* A cancelled card never carries a line: nothing left to do on it. */}
                      {card.badge && !card.annulee && <BadgeLine badge={card.badge} />}
                    </div>
                  </div>
                  <ChevronRight className="size-5 flex-none text-de9-gray rtl:rotate-180" />
                </CardContent>
              </Card>
            </button>
          ))}

          {query.hasNextPage && (
            <Button
              variant="outline"
              onClick={() => void query.fetchNextPage()}
              disabled={query.isFetchingNextPage}
              className="self-center"
            >
              {query.isFetchingNextPage ? L('Chargement…', 'جارٍ التحميل…') : L('Voir plus', 'عرض المزيد')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
