import { useNavigate } from 'react-router-dom';
import { Clock, MessageCircle, Phone, Search, ShieldAlert, ShieldCheck, X } from 'lucide-react';
import { useL } from '@/lib/i18n';
import { uiActions } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import { toProblem } from '@/api/problem';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { ClientHomeSummary } from '@/features/client-accueil/components/ClientHomeSummary';
import { useKycState } from '@/features/kyc/api/kyc';
import { useCatalogueSearch, useNouvelleDemande } from '../api/nouvelleDemande';
import type { CategorieTile, RechercheHit } from '../schemas/nouvelleDemande';
import { useCatalogueStore, catalogueActions } from '../stores/catalogueStore';
import { CategorieVisual, FamilleBadge } from './CategorieVisual';

/** Search as the client types, once the typing pauses. */
const SEARCH_DEBOUNCE_MS = 250;

/**
 * « Nouvelle demande », screen 1: the client's Accueil summary, then the
 * category grid, « Top catégories du mois » and « Rechercher un service… » —
 * all from `GET /client/nouvelle-demande`.
 */
export function CataloguePage() {
  const L = useL();
  const navigate = useNavigate();
  const catSearch = useCatalogueStore((s) => s.catSearch);
  const kyc = useKycState();

  const catalogue = useNouvelleDemande();
  const term = useDebouncedValue(catSearch, SEARCH_DEBOUNCE_MS);
  const search = useCatalogueSearch(term);

  const searching = catSearch.trim().length > 0;
  const hits = search.data ?? [];
  const validated = kyc.verified;

  const categories = catalogue.data?.categories ?? [];
  const topDuMois = catalogue.data?.topDuMois ?? [];
  const total = catalogue.data?.totalCategories ?? categories.length;

  const nameOf = (tile: CategorieTile) => L(tile.libelle, tile.libelleAr ?? tile.libelle);

  const openCategory = (code: string) => {
    catalogueActions.setCatSearch('');
    catalogueActions.selectFamily(code);
    navigate(`/client/family/${encodeURIComponent(code)}`);
  };

  const openHit = (hit: RechercheHit) => {
    catalogueActions.openWithService(hit.categorieCode, hit.code);
    navigate(`/client/family/${encodeURIComponent(hit.categorieCode)}`);
  };

  const loadError = catalogue.isError ? toProblem(catalogue.error) : null;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 pb-24 sm:px-6">
      <ClientHomeSummary />

      {/* scroll-mt clears the sticky app bar when « Créer une demande » scrolls here */}
      <header id="catalogue" className="mb-6 scroll-mt-24">
        <h1 className="text-2xl font-bold text-de9-ink sm:text-3xl">
          {L('Que recherchez-vous ?', 'عمّاذا تبحث؟')}
        </h1>
        {total > 0 && (
          <p className="mt-1 text-sm text-de9-gray">
            {L(`${total} familles de services B2B`, `${total} عائلة من خدمات B2B`)}
          </p>
        )}
      </header>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="pointer-events-none absolute top-1/2 start-5 size-[18px] -translate-y-1/2 text-de9-gray" />
        <Input
          value={catSearch}
          onChange={(e) => catalogueActions.setCatSearch(e.target.value)}
          placeholder={L('Rechercher un service…', 'ابحث عن خدمة…')}
          className="h-13 rounded-full ps-12 pe-11 text-[15px] shadow-lift"
          aria-label={L('Rechercher un service', 'ابحث عن خدمة')}
        />
        {searching && (
          <button
            type="button"
            onClick={() => catalogueActions.setCatSearch('')}
            className="absolute top-1/2 end-3 grid size-7 -translate-y-1/2 place-items-center rounded-full text-de9-gray hover:bg-secondary"
            aria-label={L('Effacer', 'مسح')}
          >
            <X className="size-4" />
          </button>
        )}

        {searching && (
          <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-xl bg-card shadow-modal dark:ring-1 dark:ring-border">
            {hits.length > 0 ? (
              <ul className={cn('max-h-80 overflow-y-auto py-1', search.isFetching && 'opacity-70')}>
                {hits.map((hit) => (
                  <li key={`${hit.categorieCode}-${hit.code}`}>
                    <button
                      type="button"
                      onClick={() => openHit(hit)}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-start hover:bg-secondary"
                    >
                      <span aria-hidden className="grid size-9 flex-none place-items-center rounded-full bg-secondary text-[16px]">
                        {hit.icone ?? '🧰'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-de9-ink">{hit.libelle}</p>
                        {hit.categorie && <p className="truncate text-xs text-de9-gray">{hit.categorie}</p>}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : search.isFetching || term !== catSearch ? (
              <p className="px-4 py-5 text-center text-sm text-de9-gray">{L('Recherche…', 'جارٍ البحث…')}</p>
            ) : (
              <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
                <p className="text-sm font-bold text-de9-ink">{L('Aucun résultat', 'لا توجد نتائج')}</p>
                <Button variant="outline" size="sm" onClick={() => uiActions.openSupport()}>
                  {L('Je cherche autre chose', 'أبحث عن شيء آخر')}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* KYC gate banner — same four states as the header pill */}
      {validated ? (
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-de9-teal-soft px-4 py-2 dark:ring-1 dark:ring-border">
          <ShieldCheck className="size-5 shrink-0 text-de9-teal-dark" />
          <p className="text-sm font-semibold text-de9-teal-dark">
            {L('Entreprise vérifiée', 'المؤسسة موثّقة')}
          </p>
        </div>
      ) : kyc.inReview ? (
        // Filed: nothing to do but wait — no call to action.
        <div className="mb-6 flex items-start gap-3 rounded-xl bg-accent px-4 py-3 dark:ring-1 dark:ring-border">
          <Clock className="mt-0.5 size-5 shrink-0 text-de9-teal-dark" />
          <div>
            <p className="text-sm font-bold text-de9-teal-dark">
              {L('Vérification en cours', 'التحقق جارٍ')}
            </p>
            <p className="text-sm text-de9-teal-dark/90">
              {L(
                'Vous pourrez publier vos appels d’offres dès la validation de votre dossier.',
                'ستتمكن من نشر طلبات العروض فور اعتماد ملفك.',
              )}
            </p>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            'mb-6 flex flex-col gap-3 rounded-xl px-4 py-3 shadow-soft sm:flex-row sm:items-center sm:justify-between',
            kyc.rejected ? 'bg-destructive/10' : 'bg-de9-orange/15',
          )}
        >
          <div className="flex items-start gap-3">
            <ShieldAlert
              className={cn(
                'mt-0.5 size-5 shrink-0',
                kyc.rejected ? 'text-destructive' : 'text-de9-orange-deep',
              )}
            />
            <div>
              <p
                className={cn(
                  'text-sm font-bold',
                  kyc.rejected ? 'text-destructive' : 'text-de9-orange-deep',
                )}
              >
                {kyc.rejected
                  ? L('Dossier refusé', 'تم رفض الملف')
                  : L('Vérification requise', 'التحقق مطلوب')}
              </p>
              <p
                className={cn(
                  'text-sm',
                  kyc.rejected ? 'text-destructive/90' : 'text-de9-orange-deep/90',
                )}
              >
                {kyc.rejected
                  ? (kyc.motif ??
                    L(
                      'Corrigez la pièce concernée puis renvoyez le dossier.',
                      'صحّح الوثيقة المعنية ثم أعد إرسال الملف.',
                    ))
                  : L(
                      'Validez RC · NIF · NIS pour publier un appel d’offres.',
                      'قم بتوثيق RC · NIF · NIS لنشر طلب عروض.',
                    )}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className={cn(
              'shrink-0 self-start rounded-full text-white sm:self-auto',
              kyc.rejected
                ? 'bg-destructive hover:bg-destructive/90'
                : 'bg-de9-orange-deep hover:bg-de9-orange-deep/90',
            )}
            onClick={() => navigate('/client/kyc')}
          >
            {kyc.rejected
              ? L('Corriger le dossier', 'تصحيح الملف')
              : L('Compléter la vérification', 'إكمال التحقق')}
          </Button>
        </div>
      )}

      {/* Loading / error */}
      {catalogue.isPending ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[232px] animate-pulse rounded-xl bg-secondary" />
          ))}
        </div>
      ) : loadError ? (
        <EmptyState
          title={L('Impossible de charger le catalogue', 'تعذّر تحميل الكتالوج')}
          description={
            loadError.code === 'company_not_client'
              ? L("L'espace client n'est pas activé pour votre entreprise.", 'مساحة العميل غير مفعّلة لشركتك.')
              : loadError.code === 'network'
                ? L('Vérifiez votre connexion et réessayez.', 'تحقّق من اتصالك وحاول مجددًا.')
                : L('Réessayez dans un instant.', 'أعد المحاولة بعد لحظة.')
          }
          action={
            loadError.code === 'company_not_client' ? undefined : (
              <Button variant="outline" size="sm" onClick={() => void catalogue.refetch()}>
                {L('Réessayer', 'إعادة المحاولة')}
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-8">
          {/* Top catégories — chosen by de9de9, in order; hidden when empty */}
          {topDuMois.length > 0 && (
            <section>
              <h2 className="mb-3 text-[15px] font-bold text-de9-ink">
                {L('Top catégories du mois', 'أفضل الفئات لهذا الشهر')}
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {topDuMois.map((tile) => (
                  <FeaturedCategorieCard
                    key={tile.code}
                    tile={tile}
                    name={nameOf(tile)}
                    services={L(`${tile.nombreServices} services`, `${tile.nombreServices} خدمة`)}
                    onClick={() => openCategory(tile.code)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Toutes les catégories */}
          <section>
            <h2 className="mb-3 text-[15px] font-bold text-de9-ink">
              {L('Toutes les catégories', 'كل الفئات')}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((tile) => (
                <CategorieCard
                  key={tile.code}
                  tile={tile}
                  name={nameOf(tile)}
                  services={L(`${tile.nombreServices} services`, `${tile.nombreServices} خدمة`)}
                  onClick={() => openCategory(tile.code)}
                />
              ))}
            </div>
          </section>

          {/* Je cherche autre chose */}
          <section>
            <Card>
              <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-de9-ink">
                    {L('Je cherche autre chose', 'أبحث عن شيء آخر')}
                  </p>
                  <p className="mt-1 text-sm text-de9-gray">
                    {L(
                      'Notre équipe vous aide à trouver le bon prestataire.',
                      'يساعدك فريقنا في العثور على مقدّم الخدمة المناسب.',
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => uiActions.openSupport()}>
                    <MessageCircle className="size-4" />
                    {L('WhatsApp', 'واتساب')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => uiActions.openSupport()}>
                    <Phone className="size-4" />
                    {L('Appeler', 'اتصال')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </div>
  );
}

/** Tall « Top catégories » tile — picture stacked above the label, family badge on top. */
function FeaturedCategorieCard({
  tile,
  name,
  services,
  onClick,
}: {
  tile: CategorieTile;
  name: string;
  services: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[232px] flex-col rounded-xl bg-de9-row p-4 text-start transition-shadow hover:shadow-lift dark:ring-1 dark:ring-border"
    >
      <FamilleBadge label={tile.familleLabel} hex={tile.hex} />
      <span className="flex flex-1 items-center justify-center py-2">
        <CategorieVisual
          key={tile.imageUrl ?? tile.code}
          imageUrl={tile.imageUrl}
          icone={tile.icone}
          className="h-[124px] w-auto"
          emojiClassName="size-[124px] text-[52px]"
        />
      </span>
      <span className="text-sm font-bold text-de9-ink">{name}</span>
      <span className="mt-0.5 text-xs text-de9-gray">{services}</span>
    </button>
  );
}

/** Compact tile — label and service count on the lead edge, picture on the trail edge. */
function CategorieCard({
  tile,
  name,
  services,
  onClick,
}: {
  tile: CategorieTile;
  name: string;
  services: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex min-h-[92px] items-center rounded-xl bg-de9-row py-4 ps-4 pe-24 text-start transition-shadow hover:shadow-lift dark:ring-1 dark:ring-border"
    >
      <span className="flex min-w-0 flex-col items-start gap-1">
        <FamilleBadge label={tile.familleLabel} hex={tile.hex} />
        <span className="text-sm font-bold text-de9-ink">{name}</span>
        <span className="text-xs text-de9-gray">{services}</span>
      </span>
      <span className="pointer-events-none absolute -bottom-1 -end-2 flex items-end">
        <CategorieVisual
          key={tile.imageUrl ?? tile.code}
          imageUrl={tile.imageUrl}
          icone={tile.icone}
          className="h-[86px] w-auto"
          emojiClassName="mb-3 me-4 size-14 text-[34px]"
        />
      </span>
    </button>
  );
}
