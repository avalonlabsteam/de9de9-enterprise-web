import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Phone, Search, ShieldAlert, ShieldCheck, X } from 'lucide-react';
import { useL } from '@/lib/i18n';
import { useLangStore } from '@/stores/langStore';
import { uiActions } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CategoryIcon } from '@/components/common/CategoryChip';
import { EmptyState } from '@/components/common/EmptyState';
import { TOP_FAMILY_IDS } from '@/lib/catalogue';
import type { Family } from '../schemas/catalogue';
import { useFamilies } from '../api/useCatalogue';
import { useKyc } from '../api/useCatalogue';
import { useCatalogueStore, catalogueActions } from '../stores/catalogueStore';

interface Match {
  familyId: string;
  family: Family;
  kind: 'family' | 'sub';
  label: string;
}

export function CataloguePage() {
  const L = useL();
  const lang = useLangStore((s) => s.lang);
  const navigate = useNavigate();
  const catSearch = useCatalogueStore((s) => s.catSearch);

  const familiesQuery = useFamilies();
  const kycQuery = useKyc('client');

  const families = familiesQuery.data ?? [];

  const matches = useMemo<Match[]>(() => {
    const q = catSearch.trim().toLowerCase();
    if (!q) return [];
    const out: Match[] = [];
    for (const fam of families) {
      const famName = lang === 'ar' ? fam.name.ar : fam.name.fr;
      if (fam.name.fr.toLowerCase().includes(q) || fam.name.ar.toLowerCase().includes(q)) {
        out.push({ familyId: fam.id, family: fam, kind: 'family', label: famName });
      }
      for (const sub of fam.subs) {
        if (sub.name.fr.toLowerCase().includes(q) || sub.name.ar.toLowerCase().includes(q)) {
          out.push({
            familyId: fam.id,
            family: fam,
            kind: 'sub',
            label: lang === 'ar' ? sub.name.ar : sub.name.fr,
          });
        }
      }
    }
    return out;
  }, [catSearch, families, lang]);

  const searching = catSearch.trim().length > 0;
  const validated = kycQuery.data?.validated ?? false;

  const nameOf = (fam: Family) => (lang === 'ar' ? fam.name.ar : fam.name.fr);
  const topFamilies = families.filter((f) => (TOP_FAMILY_IDS as readonly string[]).includes(f.id));

  const openFamily = (id: string) => {
    catalogueActions.setCatSearch('');
    catalogueActions.selectFamily(id);
    navigate(`/client/family/${id}`);
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 pb-24 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-de9-ink sm:text-3xl">
          {L('Que recherchez-vous ?', 'عمّاذا تبحث؟')}
        </h1>
        <p className="mt-1 text-sm text-de9-gray">
          {L('16 familles de services B2B', '16 عائلة من خدمات B2B')}
        </p>
      </header>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-de9-gray" />
        <Input
          value={catSearch}
          onChange={(e) => catalogueActions.setCatSearch(e.target.value)}
          placeholder={L('Rechercher un service…', 'ابحث عن خدمة…')}
          className="h-11 ps-9 pe-9"
          aria-label={L('Rechercher un service', 'ابحث عن خدمة')}
        />
        {searching && (
          <button
            type="button"
            onClick={() => catalogueActions.setCatSearch('')}
            className="absolute top-1/2 end-2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-de9-gray hover:bg-secondary"
            aria-label={L('Effacer', 'مسح')}
          >
            <X className="size-4" />
          </button>
        )}

        {searching && (
          <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-de9-line bg-card shadow-lg">
            {matches.length > 0 ? (
              <ul className="max-h-80 overflow-y-auto py-1">
                {matches.map((m, i) => (
                  <li key={`${m.familyId}-${m.kind}-${i}`}>
                    <button
                      type="button"
                      onClick={() => openFamily(m.familyId)}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-start hover:bg-secondary"
                    >
                      <CategoryIcon colorKey={m.family.colorKey} icon={m.family.icon} className="size-9 text-[16px]" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-de9-ink">{m.label}</p>
                        {m.kind === 'sub' && (
                          <p className="truncate text-xs text-de9-gray">{nameOf(m.family)}</p>
                        )}
                      </div>
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold',
                          m.kind === 'family'
                            ? 'bg-secondary text-de9-ink'
                            : 'bg-primary/10 text-primary',
                        )}
                      >
                        {m.kind === 'family' ? L('Catégorie', 'فئة') : L('Service', 'خدمة')}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
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

      {/* KYC gate banner */}
      {!kycQuery.isPending && (
        validated ? (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
            <ShieldCheck className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              {L('Entreprise vérifiée', 'المؤسسة موثّقة')}
            </p>
          </div>
        ) : (
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
                  {L('Vérification requise', 'التحقق مطلوب')}
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300/90">
                  {L(
                    'Validez RC · NIF · NIS pour publier un appel d’offres.',
                    'قم بتوثيق RC · NIF · NIS لنشر طلب عروض.',
                  )}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="shrink-0 self-start bg-amber-600 text-white hover:bg-amber-600/90 sm:self-auto"
              onClick={() => navigate('/client/kyc')}
            >
              {L('Compléter la vérification', 'إكمال التحقق')}
            </Button>
          </div>
        )
      )}

      {/* Loading / error */}
      {familiesQuery.isPending ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-secondary" />
          ))}
        </div>
      ) : familiesQuery.isError ? (
        <EmptyState
          title={L('Impossible de charger le catalogue', 'تعذّر تحميل الكتالوج')}
          description={L('Vérifiez votre connexion et réessayez.', 'تحقّق من اتصالك وحاول مجددًا.')}
          action={
            <Button variant="outline" size="sm" onClick={() => familiesQuery.refetch()}>
              {L('Réessayer', 'إعادة المحاولة')}
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          {/* Top catégories */}
          {topFamilies.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-bold text-de9-ink">
                {L('Top catégories du mois', 'أفضل الفئات لهذا الشهر')}
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {topFamilies.map((fam) => (
                  <FamilyCard key={fam.id} fam={fam} name={nameOf(fam)} onClick={() => openFamily(fam.id)} />
                ))}
              </div>
            </section>
          )}

          {/* Toutes les catégories */}
          <section>
            <h2 className="mb-3 text-sm font-bold text-de9-ink">
              {L('Toutes les catégories', 'كل الفئات')}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {families.map((fam) => (
                <FamilyCard key={fam.id} fam={fam} name={nameOf(fam)} onClick={() => openFamily(fam.id)} />
              ))}
            </div>
          </section>

          {/* Je cherche autre chose */}
          <section>
            <Card className="border-dashed">
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

function FamilyCard({ fam, name, onClick }: { fam: Family; name: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-start gap-3 rounded-2xl border border-de9-line bg-card p-4 text-start transition-colors hover:border-primary/40 hover:bg-secondary/50"
    >
      <CategoryIcon colorKey={fam.colorKey} icon={fam.icon} />
      <span className="line-clamp-2 text-sm font-semibold text-de9-ink">{name}</span>
    </button>
  );
}
