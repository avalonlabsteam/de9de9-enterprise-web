import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useT, useL } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { FAMILY_BY_ID } from '@/lib/catalogue';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CategoryChip, CategoryIcon } from '@/components/common/CategoryChip';
import { PieceSlot, type PieceFile } from '@/components/common/PieceSlot';
import { EmptyState } from '@/components/common/EmptyState';
import { usePublishTender } from '../api/tenders';
import {
  DELAIS,
  RECURRENCES,
  WILAYAS,
  tenderPublishFormSchema,
  type TenderPublishForm,
} from '../schemas/tender';

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3.5 py-1.5 text-[13px] font-bold transition-colors',
        active
          ? 'border-de9-teal-dark bg-de9-teal-dark text-white'
          : 'border-de9-line bg-card text-de9-slate hover:border-de9-teal',
      )}
    >
      {children}
    </button>
  );
}

export function PublishTenderPage() {
  const t = useT();
  const L = useL();
  const navigate = useNavigate();
  const { familyId = '' } = useParams();
  const family = FAMILY_BY_ID[familyId];

  const [selectedSubs, setSelectedSubs] = useState<string[]>([]);
  const [attachment, setAttachment] = useState<PieceFile | null>(null);
  const publish = usePublishTender();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TenderPublishForm>({
    resolver: zodResolver(tenderPublishFormSchema),
    defaultValues: {
      description: '',
      wilaya: '',
      delai: '',
      budget: '',
      type: 'ponctuel',
      recurrence: undefined,
      critere: '',
    },
  });

  const type = useWatch({ control, name: 'type' });

  if (!family) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <EmptyState
          title={L('Famille introuvable', 'العائلة غير موجودة')}
          description={L('Cette catégorie n’existe pas.', 'هذه الفئة غير موجودة.')}
        />
      </div>
    );
  }

  const toggleSub = (name: string) => {
    setSelectedSubs((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name],
    );
  };

  const onSubmit = (form: TenderPublishForm) => {
    const serviceName = selectedSubs.length > 0 ? selectedSubs.join(' · ') : family.name.fr;
    publish.mutate(
      {
        familyId: family.id,
        serviceName,
        description: form.description,
        wilaya: form.wilaya,
        delai: form.delai,
        budgetDzd: form.budget ? Number(form.budget) : undefined,
        type: form.type,
        recurrence: form.type === 'recurrent' ? form.recurrence : undefined,
        critere: form.critere?.trim() || undefined,
        attachments: attachment ? [attachment] : [],
      },
      {
        onSuccess: () => {
          toast.success(t('confirmTitle'));
          navigate(`/client/publish/${family.id}/confirm`);
        },
        onError: () => toast.error(L('Échec de l’envoi', 'فشل الإرسال')),
      },
    );
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <header className="mb-5 flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)} aria-label="Retour">
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-xl font-extrabold text-de9-ink">{t('ficheTitle')}</h1>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Famille & catégorie */}
        <Card>
          <CardContent className="py-4">
            <Label className="mb-2 block">{t('familleLabel')}</Label>
            <div className="mb-3 flex items-center gap-3">
              <CategoryIcon colorKey={family.colorKey} icon={family.icon} />
              <div>
                <CategoryChip colorKey={family.colorKey} label={family.name.fr} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {family.subs.map((sub) => (
                <Chip
                  key={sub.id}
                  active={selectedSubs.includes(sub.name.fr)}
                  onClick={() => toggleSub(sub.name.fr)}
                >
                  {sub.name.fr}
                </Chip>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <div>
          <Label htmlFor="description" className="mb-2 block">
            {t('descLabel')}
          </Label>
          <Controller
            control={control}
            name="description"
            render={({ field }) => <Textarea id="description" rows={4} {...field} />}
          />
          {errors.description && (
            <p className="mt-1 text-[12px] text-de9-red">
              {L('Champ requis', 'حقل مطلوب')}
            </p>
          )}
        </div>

        {/* Wilaya */}
        <div>
          <Label className="mb-2 block">{t('wilayaLabel')}</Label>
          <Controller
            control={control}
            name="wilaya"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={L('Choisir une wilaya', 'اختر ولاية')} />
                </SelectTrigger>
                <SelectContent>
                  {WILAYAS.map((w) => (
                    <SelectItem key={w} value={w}>
                      {w}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.wilaya && (
            <p className="mt-1 text-[12px] text-de9-red">{L('Champ requis', 'حقل مطلوب')}</p>
          )}
        </div>

        {/* Délai */}
        <div>
          <Label className="mb-2 block">{t('delaiLabel')}</Label>
          <Controller
            control={control}
            name="delai"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={L('Choisir un délai', 'اختر أجلاً')} />
                </SelectTrigger>
                <SelectContent>
                  {DELAIS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.delai && (
            <p className="mt-1 text-[12px] text-de9-red">{L('Champ requis', 'حقل مطلوب')}</p>
          )}
        </div>

        {/* Budget */}
        <div>
          <Label htmlFor="budget" className="mb-2 block">
            {t('budgetLabel')}
          </Label>
          <Controller
            control={control}
            name="budget"
            render={({ field }) => (
              <Input
                id="budget"
                type="number"
                inputMode="numeric"
                placeholder="DZD"
                value={field.value ?? ''}
                onChange={field.onChange}
              />
            )}
          />
        </div>

        {/* Type de besoin */}
        <div>
          <Label className="mb-2 block">{t('typeLabel')}</Label>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <div className="flex gap-2">
                <Chip active={field.value === 'ponctuel'} onClick={() => field.onChange('ponctuel')}>
                  {t('ponctuel')}
                </Chip>
                <Chip active={field.value === 'recurrent'} onClick={() => field.onChange('recurrent')}>
                  {t('recurrent')}
                </Chip>
              </div>
            )}
          />
        </div>

        {/* Fréquence (récurrent) */}
        {type === 'recurrent' && (
          <div>
            <Label className="mb-2 block">{t('freqLabel')}</Label>
            <Controller
              control={control}
              name="recurrence"
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {RECURRENCES.map((r) => (
                    <Chip key={r} active={field.value === r} onClick={() => field.onChange(r)}>
                      {r}
                    </Chip>
                  ))}
                </div>
              )}
            />
          </div>
        )}

        {/* Documents joints */}
        <div>
          <Label className="mb-2 block">{t('docsLabel')}</Label>
          <PieceSlot
            label={t('docsLabel')}
            hint={L('PDF ou photo', 'PDF أو صورة')}
            value={attachment}
            onChange={setAttachment}
            fileName="cahier-des-charges.pdf"
          />
        </div>

        {/* Critères */}
        <div>
          <Label htmlFor="critere" className="mb-2 block">
            {t('critLabel')}
          </Label>
          <Controller
            control={control}
            name="critere"
            render={({ field }) => (
              <Textarea
                id="critere"
                rows={3}
                placeholder={L('Prix, délai, certifications…', 'السعر، الأجل، الشهادات…')}
                value={field.value ?? ''}
                onChange={field.onChange}
              />
            )}
          />
        </div>

        <Button
          type="submit"
          disabled={publish.isPending}
          className="mt-1 h-11 bg-de9-teal-dark text-white hover:bg-de9-teal-dark/90"
        >
          {publish.isPending ? L('Envoi…', 'جارٍ الإرسال…') : t('submitPublish')}
        </Button>
      </form>
    </div>
  );
}
