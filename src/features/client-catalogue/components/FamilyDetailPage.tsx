import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { useL } from '@/lib/i18n';
import { useLangStore } from '@/stores/langStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CategoryIcon } from '@/components/common/CategoryChip';
import { SubArt } from '@/components/common/CategoryArt';
import { EmptyState } from '@/components/common/EmptyState';
import { useFamily, useKyc } from '../api/useCatalogue';
import { useCatalogueStore, catalogueActions } from '../stores/catalogueStore';

export function FamilyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const L = useL();
  const lang = useLangStore((s) => s.lang);
  const navigate = useNavigate();

  const familyQuery = useFamily(id);
  const kycQuery = useKyc('client');
  const selectedSubs = useCatalogueStore((s) => s.selectedSubs);

  useEffect(() => {
    if (id) catalogueActions.selectFamily(id);
  }, [id]);

  const fam = familyQuery.data;
  const count = selectedSubs.length;

  const goPublish = () => {
    if (!id || count === 0) return;
    if (!(kycQuery.data?.validated ?? false)) {
      navigate('/client/kyc');
      return;
    }
    navigate(`/client/publish/${id}`);
  };

  if (familyQuery.isPending) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
        <div className="mb-6 h-16 animate-pulse rounded-2xl bg-secondary" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-2.5 rounded-lg bg-card p-3 shadow-soft dark:ring-1 dark:ring-border"
            >
              <div className="aspect-[4/3] w-full animate-pulse rounded-md bg-secondary" />
              <div className="space-y-1.5">
                <div className="h-3 w-full animate-pulse rounded-full bg-secondary" />
                <div className="h-3 w-3/5 animate-pulse rounded-full bg-secondary" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (familyQuery.isError || !fam) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <EmptyState
          title={L('Famille introuvable', 'العائلة غير موجودة')}
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

  const famName = lang === 'ar' ? fam.name.ar : fam.name.fr;

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
        <CategoryIcon
          colorKey={fam.colorKey}
          icon={fam.icon}
          className="size-[68px] shrink-0 rounded-2xl text-[28px]"
        />
        <div>
          <h1 className="text-xl font-bold text-de9-ink sm:text-2xl">{famName}</h1>
          <p className="mt-0.5 text-sm text-de9-gray">
            {L('Sélectionnez un ou plusieurs services', 'اختر خدمة واحدة أو أكثر')}
          </p>
        </div>
      </header>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {fam.subs.map((sub) => {
          const checked = selectedSubs.includes(sub.id);
          const label = lang === 'ar' ? sub.name.ar : sub.name.fr;
          return (
            <li key={sub.id}>
              <button
                type="button"
                aria-pressed={checked}
                onClick={() => catalogueActions.toggleSub(sub.id)}
                className={cn(
                  'flex h-full w-full flex-col gap-2.5 rounded-lg p-3 text-start shadow-soft transition-shadow hover:shadow-lift',
                  checked
                    ? 'bg-accent ring-2 ring-de9-teal'
                    : 'bg-card dark:ring-1 dark:ring-border',
                )}
              >
                <span className="relative block w-full">
                  <span
                    className={cn(
                      'grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-md transition-colors',
                      checked ? 'bg-card' : 'bg-secondary',
                    )}
                  >
                    <SubArt
                      subId={sub.id}
                      colorKey={fam.colorKey}
                      icon={fam.icon}
                      fallbackClassName="size-full rounded-none bg-transparent text-[30px] text-de9-teal-dark"
                    />
                  </span>
                  <span
                    className={cn(
                      'absolute end-2 top-2 grid size-[22px] place-items-center rounded-full border-2 shadow-soft transition-colors',
                      checked ? 'border-de9-teal bg-de9-teal text-white' : 'border-de9-line bg-card',
                    )}
                  >
                    {checked && <Check className="size-3.5" />}
                  </span>
                </span>
                <span className="text-[13px] font-semibold break-words text-de9-ink sm:text-sm">
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Sticky CTA */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-background via-background/95 to-transparent px-4 pt-10 pb-4 sm:px-6">
        <div className="pointer-events-auto mx-auto w-full max-w-3xl">
          <Button
            size="lg"
            className="h-13 w-full rounded-xl text-[15px]"
            disabled={count === 0}
            onClick={goPublish}
          >
            {count > 0
              ? `${L('Publier un appel d’offres', 'نشر طلب عروض')} (${count})`
              : L('Publier un appel d’offres', 'نشر طلب عروض')}
          </Button>
        </div>
      </div>
    </div>
  );
}
