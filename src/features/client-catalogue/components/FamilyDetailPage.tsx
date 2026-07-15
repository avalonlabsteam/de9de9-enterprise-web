import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { useL } from '@/lib/i18n';
import { useLangStore } from '@/stores/langStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CategoryIcon } from '@/components/common/CategoryChip';
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
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-secondary" />
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
        <CategoryIcon colorKey={fam.colorKey} icon={fam.icon} className="size-14 text-[26px]" />
        <div>
          <h1 className="text-xl font-bold text-de9-ink sm:text-2xl">{famName}</h1>
          <p className="mt-0.5 text-sm text-de9-gray">
            {L('Sélectionnez un ou plusieurs services', 'اختر خدمة واحدة أو أكثر')}
          </p>
        </div>
      </header>

      <ul className="space-y-2">
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
                  'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-start transition-colors',
                  checked
                    ? 'border-primary bg-primary/5'
                    : 'border-de9-line bg-card hover:bg-secondary/50',
                )}
              >
                <span
                  className={cn(
                    'grid size-5 shrink-0 place-items-center rounded-md border transition-colors',
                    checked ? 'border-primary bg-primary text-primary-foreground' : 'border-de9-line',
                  )}
                >
                  {checked && <Check className="size-3.5" />}
                </span>
                <span className="text-sm font-medium text-de9-ink">{label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-de9-line bg-card/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto w-full max-w-3xl">
          <Button
            size="lg"
            className="h-11 w-full"
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
