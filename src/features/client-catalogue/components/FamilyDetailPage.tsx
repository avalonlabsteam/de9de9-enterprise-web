import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { useL } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { useKycState } from '@/features/kyc/api/kyc';
import { useCategorie } from '../api/nouvelleDemande';
import { useCatalogueStore, catalogueActions } from '../stores/catalogueStore';
import { CategorieVisual } from './CategorieVisual';

/**
 * « Nouvelle demande », screen 2: the services of the tapped category
 * (`GET /catalogue/{code}`). The ticked codes become `subCategoryCodes`.
 */
export function FamilyDetailPage() {
  const { id: code } = useParams<{ id: string }>();
  const L = useL();
  const navigate = useNavigate();

  const categorie = useCategorie(code);
  const kyc = useKycState();
  const selectedSubs = useCatalogueStore((s) => s.selectedSubs);

  // Opening another category clears the ticks (a search hit already set its own).
  useEffect(() => {
    if (code) catalogueActions.selectFamily(code);
  }, [code]);

  const cat = categorie.data;
  const count = selectedSubs.length;

  const goPublish = () => {
    if (!code || count === 0) return;
    if (!kyc.verified) {
      navigate('/client/kyc');
      return;
    }
    navigate(`/client/publish/${encodeURIComponent(code)}`);
  };

  if (categorie.isPending) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
        <div className="mb-6 h-16 animate-pulse rounded-2xl bg-secondary" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-secondary" />
          ))}
        </div>
      </div>
    );
  }

  if (categorie.isError || !cat) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <EmptyState
          title={L('Catégorie introuvable', 'الفئة غير موجودة')}
          description={L('Cette catégorie n’existe pas ou plus.', 'هذه الفئة غير موجودة.')}
          action={
            <Button variant="outline" size="sm" onClick={() => navigate('/client')}>
              {L('Retour au catalogue', 'العودة إلى الكتالوج')}
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 pb-28 sm:px-6">
      <button
        type="button"
        onClick={() => navigate('/client')}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-de9-gray hover:text-de9-ink"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {L('Catalogue', 'الكتالوج')}
      </button>

      <header className="mb-6 flex items-center gap-4">
        <span
          aria-hidden
          className="grid size-[68px] shrink-0 place-items-center rounded-2xl bg-de9-row dark:ring-1 dark:ring-border"
        >
          <CategorieVisual icone={cat.icone} iconClassName="size-[54px]" emojiClassName="text-[32px]" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-de9-ink sm:text-2xl">
            {L(cat.libelle, cat.libelleAr ?? cat.libelle)}
          </h1>
          <p className="mt-0.5 text-sm text-de9-gray">
            {L('Sélectionnez un ou plusieurs services', 'اختر خدمة واحدة أو أكثر')}
          </p>
        </div>
      </header>

      {cat.services.length === 0 ? (
        <EmptyState title={L('Aucun service dans cette catégorie', 'لا توجد خدمات في هذه الفئة')} />
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {cat.services.map((service) => {
            const checked = selectedSubs.includes(service.code);
            return (
              <li key={service.code}>
                <button
                  type="button"
                  aria-pressed={checked}
                  onClick={() => catalogueActions.toggleSub(service.code)}
                  className={cn(
                    'flex h-full w-full items-center gap-3 rounded-lg p-3.5 text-start shadow-soft transition-shadow hover:shadow-lift',
                    checked ? 'bg-accent ring-2 ring-de9-teal' : 'bg-card dark:ring-1 dark:ring-border',
                  )}
                >
                  <span
                    className={cn(
                      'grid size-[22px] flex-none place-items-center rounded-full border-2 transition-colors',
                      checked ? 'border-de9-teal bg-de9-teal text-white' : 'border-de9-line bg-card',
                    )}
                  >
                    {checked && <Check className="size-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold break-words text-de9-ink">
                      {service.libelle}
                    </span>
                    <span className="block text-xs text-de9-gray">
                      {service.avecPrestataires > 0
                        ? L(
                            `${service.avecPrestataires} prestataire${service.avecPrestataires > 1 ? 's' : ''}`,
                            `${service.avecPrestataires} مقدّم خدمة`,
                          )
                        : // Still allowed: de9de9 sources a provider for it.
                          L('de9de9 vous trouve un prestataire', 'de9de9 يجد لك مقدّم خدمة')}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Sticky CTA */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-background via-background/95 to-transparent px-4 pt-10 pb-4 sm:px-6">
        <div className="pointer-events-auto mx-auto w-full max-w-3xl">
          <Button size="lg" className="h-13 w-full rounded-xl text-[15px]" disabled={count === 0} onClick={goPublish}>
            {count > 0
              ? `${L('Publier un appel d’offres', 'نشر طلب عروض')} (${count})`
              : L('Publier un appel d’offres', 'نشر طلب عروض')}
          </Button>
        </div>
      </div>
    </div>
  );
}
