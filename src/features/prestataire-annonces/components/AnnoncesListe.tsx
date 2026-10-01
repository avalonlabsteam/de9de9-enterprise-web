import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, ChevronRight, Loader2, Megaphone, Plus, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useL } from '@/lib/i18n';
import { toProblem } from '@/api/problem';
import { proLoadError } from '@/lib/proErrors';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { EmptyState } from '@/components/common/EmptyState';
import { OngletBar } from '@/components/common/OngletBar';
import { isRouteAbsente, useAnnonces } from '../api/annonces';
import type { AnnonceCarte, TypeCreation } from '../schemas/annonces';
import { AnnoncesLectureSeule } from './AnnoncesLectureSeule';
import { Bandeau, Couverture, StatutBadge, TypeChip } from './parts';
import { createPath, detailPath, useAnnonceFlow } from './useAnnonceFlow';

/**
 * « Type d'annonce » — one row per kind the backend offers, with what is left
 * of its quota; a kind at its limit is shown, and cannot be picked.
 */
export function TypePickerSheet({ types, open, onOpenChange }: { types: TypeCreation[]; open: boolean; onOpenChange: (open: boolean) => void }) {
  const L = useL();
  const navigate = useNavigate();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-[560px] rounded-t-2xl bg-card">
        <SheetHeader>
          <SheetTitle>{L("Type d'annonce", 'نوع الإعلان')}</SheetTitle>
          <SheetDescription>{L('Pour quel espace souhaitez-vous publier ?', 'لأي فضاء تريد النشر؟')}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-3 px-4 pb-6">
          {types.map((type) => {
            const b2b = type.code === 'b2b';
            return (
              <button
                key={type.code}
                type="button"
                disabled={!type.disponible}
                onClick={() => {
                  onOpenChange(false);
                  navigate(createPath(type.code));
                }}
                className="flex w-full items-center gap-3.5 rounded-xl bg-card p-4 text-start shadow-soft transition-shadow hover:shadow-lift disabled:cursor-not-allowed disabled:opacity-55 dark:ring-1 dark:ring-border"
              >
                <span className={cn('grid size-11 flex-none place-items-center rounded-[12px]', b2b ? 'bg-de9-blue-tint text-de9-blue' : 'bg-de9-teal-soft text-de9-teal-dark')}>
                  {b2b ? <Building2 className="size-5" /> : <Users className="size-5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-bold text-de9-ink">{type.titre}</span>
                  {type.sousTitre && <span className="block text-[12.5px] text-de9-slate">{type.sousTitre}</span>}
                  {type.quota && <span className="mt-0.5 block text-[12px] text-de9-gray">{type.quota}</span>}
                </span>
                <ChevronRight className="size-5 flex-none text-de9-gray rtl:rotate-180" />
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** One annonce: its cover, kind, status — and ONLY the buttons the backend listed, in its order. */
function AnnonceCard({ annonce, flow }: { annonce: AnnonceCarte; flow: ReturnType<typeof useAnnonceFlow> }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-[15px] bg-card shadow-soft dark:ring-1 dark:ring-border">
      <Link to={detailPath(annonce.id)} className="group relative block focus-visible:outline-none">
        <Couverture
          url={annonce.couvertureUrl}
          photoCategorie={annonce.categoriePhotoUrl}
          icone={annonce.icone}
          hex={annonce.hex}
          className="h-36 w-full"
        />
        {annonce.typeChip && (
          <TypeChip type={annonce.type} label={annonce.typeChip.label} className="absolute end-3 top-3 shadow-soft" />
        )}
        <div className="flex flex-col gap-1 px-4 pt-3">
          <p className="text-[15px] font-bold break-words text-de9-ink group-hover:underline">{annonce.titre}</p>
          {annonce.sousTitre && <p className="truncate text-[12.5px] text-de9-gray">{annonce.sousTitre}</p>}
          {annonce.prixLabel && <p className="text-[13px] font-semibold text-de9-slate">{annonce.prixLabel}</p>}
          <div className="mt-1 flex flex-wrap gap-1.5">
            <StatutBadge tag={annonce.statut} />
            {/* The second badge — B2C only: where the annonce stands on the de9de9 app. */}
            {annonce.publication && <StatutBadge tag={annonce.publication} />}
          </div>
        </div>
      </Link>
      {annonce.actions.length > 0 ? (
        <div className="mt-auto flex flex-wrap gap-2 px-4 pt-3 pb-4">
          {annonce.actions.map((action) => (
            <Button
              key={action.code}
              size="sm"
              variant="outline"
              disabled={flow.isBusy(annonce.id)}
              onClick={() => flow.press(annonce, action)}
              className={cn('flex-1', action.style === 'danger' && 'text-destructive')}
            >
              {flow.isBusy(annonce.id, action.code) && <Loader2 className="size-4 animate-spin" />}
              {action.label}
            </Button>
          ))}
        </div>
      ) : (
        <div className="pb-4" />
      )}
    </div>
  );
}

/**
 * « Mes annonces » — every annonce of the company, both kinds, as
 * `GET /prestataire/annonces` builds the screen: the kind pills and status
 * chips with their counts, the banners, the cards and their buttons. The kind
 * and the status live in the address, so another screen can link into them.
 */
export function AnnoncesListe() {
  const L = useL();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const type = params.get('type');
  const statut = params.get('statut');
  const query = useAnnonces({ type, statut });
  const flow = useAnnonceFlow();
  // `?creer=1`: the home's « Créer une annonce » lands on the picker.
  const [picker, setPicker] = useState(params.get('creer') === '1');
  // Read once: left in the address, the picker would open again at every return to this tab.
  useEffect(() => {
    if (params.get('creer') !== '1') return;
    const p = new URLSearchParams(params);
    p.delete('creer');
    setParams(p, { replace: true });
  }, [params, setParams]);

  const pages = query.data?.pages ?? [];
  const tete = pages[0];
  const annonces = pages.flatMap((page) => page.annonces);
  const types = tete?.creer?.types ?? [];

  const select = (next: { type?: string | null; statut?: string | null }) => {
    const p = new URLSearchParams();
    const t = next.type !== undefined ? next.type : type;
    // Counts are per kind: another kind starts without a status chip.
    const s = next.type !== undefined ? null : next.statut !== undefined ? next.statut : statut;
    if (t) p.set('type', t);
    if (s) p.set('statut', s);
    setParams(p, { replace: true });
  };

  if (query.isPending) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-[15px] bg-secondary" />
        ))}
      </div>
    );
  }

  if (query.isError && !tete) {
    // The annonce routes are a design the API does not serve yet: the screen stays what it was.
    if (isRouteAbsente(query.error)) return <AnnoncesLectureSeule />;
    return (
      <EmptyState
        title={L('Impossible de charger les annonces', 'تعذّر تحميل الإعلانات')}
        description={proLoadError(toProblem(query.error), L)}
        action={
          <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
            {L('Réessayer', 'إعادة المحاولة')}
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {tete && tete.types.length > 0 && (
          <OngletBar
            onglets={tete.types}
            active={type ?? 'toutes'}
            onSelect={(code) => select({ type: code === 'toutes' ? null : code })}
          />
        )}
        {tete?.creer && (
          <Button className="gap-2 shadow-glow" onClick={() => setPicker(true)}>
            <Plus className="size-4" />
            {tete.creer.label}
          </Button>
        )}
      </div>

      {tete && tete.statuts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tete.statuts.map((chip) => (
            <button
              key={chip.code}
              type="button"
              aria-pressed={statut === chip.code}
              // A second press on the chip in force clears it.
              onClick={() => select({ statut: statut === chip.code ? null : chip.code })}
              className={cn(
                'rounded-full border px-3 py-1 text-[12px] font-bold transition-colors',
                statut === chip.code
                  ? 'border-de9-ink bg-de9-ink text-background'
                  : 'border-border bg-card text-de9-slate hover:border-de9-teal',
                chip.count === 0 && statut !== chip.code && 'opacity-60',
              )}
            >
              {chip.label} · {chip.count}
            </button>
          ))}
        </div>
      )}

      {tete?.bandeaux.map((bandeau) => (
        <Bandeau key={bandeau.code ?? bandeau.texte} ton={bandeau.ton} texte={bandeau.texte}>
          {bandeau.code === 'kyc_requis' && (
            <Link to="/onboarding/kyc" className="flex-none font-bold underline underline-offset-2">
              {L('Vérifier mon entreprise', 'وثّق مؤسستي')}
            </Link>
          )}
        </Bandeau>
      ))}

      {annonces.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="size-6" />}
          title={tete?.vide?.titre ?? L('Aucune annonce', 'لا يوجد إعلان')}
          description={tete?.vide?.texte ?? L('Créez votre première annonce.', 'أنشئ إعلانك الأول.')}
          action={
            types.length > 0 && !statut ? (
              <div className="flex flex-wrap justify-center gap-2">
                {/* Under a kind pill: that kind alone. Under « Toutes »: one button per kind. */}
                {types
                  .filter((t) => !type || t.code === type)
                  .map((t) => (
                    <Button
                      key={t.code}
                      size="sm"
                      variant={t.code === 'b2b' ? 'outline' : 'default'}
                      disabled={!t.disponible}
                      onClick={() => navigate(createPath(t.code))}
                    >
                      {t.titre}
                    </Button>
                  ))}
              </div>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className={cn('grid gap-3 sm:grid-cols-2', query.isPlaceholderData && 'opacity-60')}>
            {annonces.map((annonce) => (
              <AnnonceCard key={annonce.id} annonce={annonce} flow={flow} />
            ))}
          </div>
          {query.hasNextPage && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => void query.fetchNextPage()} disabled={query.isFetchingNextPage}>
                {query.isFetchingNextPage && <Loader2 className="size-4 animate-spin" />}
                {L('Afficher plus', 'عرض المزيد')}
              </Button>
            </div>
          )}
        </>
      )}

      <TypePickerSheet types={types} open={picker && types.length > 0} onOpenChange={setPicker} />
      {flow.dialogs}
    </div>
  );
}
