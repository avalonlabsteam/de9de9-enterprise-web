import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, FileText, Lock, X } from 'lucide-react';
import { toast } from 'sonner';
import { useT, useL } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { toProblem } from '@/api/problem';
import { WILAYAS } from '@/lib/catalogue';
import { queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieceSlot } from '@/components/common/PieceSlot';
import { EmptyState } from '@/components/common/EmptyState';
import { useCategorie, useNouvelleDemande } from '@/features/client-catalogue/api/nouvelleDemande';
import type { FormOption } from '@/features/client-catalogue/schemas/nouvelleDemande';
import { catalogueActions, useCatalogueStore } from '@/features/client-catalogue/stores/catalogueStore';
import { accesRefuse } from '@/features/auth/api/accueil';
import { offresKey } from '@/features/client-offres/api/offres';
import { useSendAppelOffres } from '../api/appelsOffres';
import {
  appelOffresFormSchema,
  buildAppelOffresPayload,
  type AppelOffresForm,
} from '../schemas/appelOffres';

/** Arabic for the picker labels the API sends in French, by code. */
const OPTION_AR: Record<string, string> = {
  urgent: 'عاجل (48 ساعة)',
  sous_7_jours: 'خلال 7 أيام',
  sous_15_jours: 'خلال 15 يومًا',
  sous_30_jours: 'خلال 30 يومًا',
  flexible: 'مرن',
  ponctuel: 'مرة واحدة',
  recurrent: 'عقد متكرر',
  hebdomadaire: 'أسبوعي',
  bimensuel: 'نصف شهري',
  mensuel: 'شهري',
  trimestriel: 'فصلي',
  annuel: 'سنوي',
};

/** An API field in a 400 → the form field that shows it. */
const FIELD_OF: Record<string, keyof AppelOffresForm> = {
  description: 'description',
  wilaya: 'wilaya',
  delai: 'delai',
  budgetMaxDzd: 'budget',
  cadence: 'typeBesoin',
  frequence: 'frequence',
  criteresSelection: 'criteres',
};

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
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'rounded-full px-3.5 py-1.5 text-[13px] font-bold transition-shadow',
        active
          ? 'bg-de9-teal text-white shadow-glow'
          : 'bg-card text-de9-teal-dark shadow-soft hover:shadow-lift dark:ring-1 dark:ring-border',
      )}
    >
      {children}
    </button>
  );
}

/**
 * « Nouvelle demande », screen 3: the « Appel d'offres » form. `POST /appels-offres`
 * with the ticked services, then `POST /appels-offres/{id}/media` for the
 * documents; de9de9's admins are notified as soon as it is sent.
 *
 * Opened from an offer (« Demander un devis », guide 19b §11) it is pre-filled:
 * the offer's services ticked, the wilayas narrowed to those it covers, and a
 * locked line « Prestataire souhaité ». The offer travels as `annonceId`; the
 * prestataire is not invited by this call — de9de9 does that.
 */
export function PublishTenderPage() {
  const t = useT();
  const L = useL();
  const navigate = useNavigate();
  const { familyId: code = '' } = useParams();

  const categorie = useCategorie(code);
  const pickers = useNouvelleDemande();
  const formulaire = pickers.data?.formulaire;

  // Ticked on screen 2 (or pre-ticked by a search hit); kept in the store so
  // the KYC detour does not lose them.
  const selectedSubs = useCatalogueStore((s) => s.selectedSubs);
  const offre = useCatalogueStore((s) => s.offre);
  // The offer rides with the demande only in its own category.
  const souhaite = offre?.categoryCode === code ? offre : null;
  /** 422 `annonce_non_disponible`: the offer went offline while the form was filled. */
  const [indisponible, setIndisponible] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [servicesError, setServicesError] = useState(false);
  const send = useSendAppelOffres();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<AppelOffresForm>({
    resolver: zodResolver(appelOffresFormSchema),
    defaultValues: {
      description: '',
      wilaya: '',
      delai: '',
      budget: '',
      typeBesoin: 'ponctuel',
      frequence: '',
      criteres: '',
    },
  });
  const typeBesoin = useWatch({ control, name: 'typeBesoin' });

  const optionLabel = (option: FormOption) => L(option.label, OPTION_AR[option.code] ?? option.label);
  const required = L('Champ requis', 'حقل مطلوب');

  if (categorie.isPending || pickers.isPending) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-5 h-10 w-48 animate-pulse rounded-lg bg-secondary" />
        <div className="flex flex-col gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-secondary" />
          ))}
        </div>
      </div>
    );
  }

  const cat = categorie.data;
  if (!cat) {
    return (
      <div className="mx-auto max-w-2xl py-6">
        <EmptyState
          title={L('Catégorie introuvable', 'الفئة غير موجودة')}
          description={L('Cette catégorie n’existe pas.', 'هذه الفئة غير موجودة.')}
        />
      </div>
    );
  }

  const onSubmit = (form: AppelOffresForm, sansOffre = false) => {
    // The ticks are the demand's services — and its name: there is no title field.
    const subCategoryCodes = cat.services.map((s) => s.code).filter((c) => selectedSubs.includes(c));
    if (subCategoryCodes.length === 0) {
      setServicesError(true);
      return;
    }
    setServicesError(false);

    const payload = {
      ...buildAppelOffresPayload(form, cat.code, subCategoryCodes, formulaire),
      ...(souhaite && !sansOffre ? { annonceId: souhaite.annonceId } : {}),
    };

    send.mutate(
      { payload, files },
      {
        onSuccess: ({ created, mediaFailed }) => {
          if (mediaFailed) {
            toast.warning(
              L(
                'Demande envoyée, mais les documents n’ont pas pu être joints. Transmettez-les au support.',
                'تم إرسال الطلب، لكن تعذّر إرفاق المستندات. أرسلها إلى الدعم.',
              ),
            );
          }
          catalogueActions.clearSubs();
          navigate(`/client/publish/${encodeURIComponent(cat.code)}/confirm`, {
            state: { statusLabel: created.statusLabel ?? null },
          });
        },
        onError: (error) => {
          const problem = toProblem(error);
          // B2B suspended by de9de9 meanwhile: nothing was created. The menus follow, and back to the demandes.
          if (problem.code === 'b2b_access_disabled') {
            accesRefuse('b2b');
            toast.error(problem.detail ?? L("L'accès B2B de votre entreprise est suspendu par l'administration de9de9 : vos contrats en cours se poursuivent, aucune nouvelle demande n'est possible.", 'تم تعليق وصول مؤسستك إلى B2B من طرف إدارة de9de9: عقودك الجارية مستمرة، ولا يمكن إنشاء طلبات جديدة.'), { duration: 10_000 });
            navigate('/client/tenders');
            return;
          }
          // The offer is no longer published (or no longer this client's to see): nothing was created.
          if (problem.code === 'annonce_non_disponible') {
            void queryClient.invalidateQueries({ queryKey: offresKey });
            setIndisponible(true);
            return;
          }
          const field = problem.field ? FIELD_OF[problem.field] : undefined;
          if (problem.status === 400 && field) {
            setError(field, { type: 'server', message: problem.detail ?? required });
            return;
          }
          if (problem.field === 'subCategoryCodes' || problem.field === 'categoryCode') {
            setServicesError(true);
            return;
          }
          toast.error(
            problem.status === 403
              ? L('Passez en espace client pour envoyer une demande.', 'انتقل إلى مساحة العميل لإرسال طلب.')
              : problem.code === 'company_not_client'
                ? L("L'espace client n'est pas activé pour votre entreprise.", 'مساحة العميل غير مفعّلة لشركتك.')
                : (problem.detail ?? L('Échec de l’envoi. Réessayez.', 'فشل الإرسال. أعد المحاولة.')),
          );
        },
      },
    );
  };

  /** The API's own French text for a server error; the generic label otherwise. */
  const messageOf = (error?: { type?: string; message?: string }) =>
    error ? (error.type === 'server' && error.message ? error.message : required) : null;

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-5 flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)} aria-label={L('Retour', 'رجوع')}>
          <ArrowLeft className="size-4 rtl:rotate-180" />
        </Button>
        <h1 className="text-xl font-extrabold text-de9-ink">{t('ficheTitle')}</h1>
      </header>

      <form onSubmit={handleSubmit((form) => onSubmit(form))} className="flex flex-col gap-4" noValidate>
        {/* Famille & catégorie */}
        <Card>
          <CardContent className="py-4">
            <Label className="mb-2 block">{t('familleLabel')}</Label>
            <div className="mb-3 flex items-center gap-3">
              <span aria-hidden className="grid size-11 flex-none place-items-center rounded-full bg-de9-row text-[20px]">
                {cat.icone ?? '🧰'}
              </span>
              <p className="text-sm font-bold text-de9-ink">{L(cat.libelle, cat.libelleAr ?? cat.libelle)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {cat.services.map((service) => (
                <Chip
                  key={service.code}
                  active={selectedSubs.includes(service.code)}
                  onClick={() => {
                    catalogueActions.toggleSub(service.code);
                    setServicesError(false);
                  }}
                >
                  {service.libelle}
                </Chip>
              ))}
            </div>
            {servicesError && (
              <p className="mt-2 text-[12px] text-de9-red">
                {L('Choisissez au moins un service.', 'اختر خدمة واحدة على الأقل.')}
              </p>
            )}
          </CardContent>
        </Card>

        {/* From an offer: the prestataire wished for — a locked line, de9de9 still routes the demande */}
        {souhaite && (
          <div className="flex flex-col gap-1 rounded-xl bg-de9-blue-tint px-3.5 py-3 dark:bg-de9-blue/15">
            <p className="flex items-center gap-2 text-[13.5px] font-bold text-de9-blue">
              <Lock className="size-3.5 flex-none" />
              <span className="min-w-0 break-words">{souhaite.prestataireSouhaite}</span>
            </p>
            <p className="text-[12px] text-de9-slate">
              {souhaite.note ?? L('de9de9 transmet votre demande et vous présente les devis.', 'de9de9 ينقل طلبك ويعرض عليك عروض الأسعار.')}
            </p>
          </div>
        )}

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
          {errors.description && <p className="mt-1 text-[12px] text-de9-red">{messageOf(errors.description)}</p>}
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
                  {/* From an offer: only the wilayas it covers. */}
                  {(souhaite && souhaite.wilayas.length > 0 ? souhaite.wilayas : WILAYAS).map((w) => (
                    <SelectItem key={w} value={w}>
                      {w}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.wilaya && <p className="mt-1 text-[12px] text-de9-red">{messageOf(errors.wilaya)}</p>}
        </div>

        {/* Délai — the backend turns it into the wished-for date */}
        <div>
          <Label className="mb-2 block">{t('delaiLabel')}</Label>
          <Controller
            control={control}
            name="delai"
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {(formulaire?.delais ?? []).map((option) => (
                  <Chip key={option.code} active={field.value === option.code} onClick={() => field.onChange(option.code)}>
                    {optionLabel(option)}
                  </Chip>
                ))}
              </div>
            )}
          />
          {errors.delai && <p className="mt-1 text-[12px] text-de9-red">{messageOf(errors.delai)}</p>}
        </div>

        {/* Budget — « / mois » is display only: the number is what is sent */}
        <div>
          <Label htmlFor="budget" className="mb-2 block">
            {t('budgetLabel')}
          </Label>
          <Controller
            control={control}
            name="budget"
            render={({ field }) => (
              <div className="relative">
                <Input
                  id="budget"
                  inputMode="numeric"
                  dir="ltr"
                  placeholder="150000"
                  className="pe-20"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value.replace(/\s/g, ''))}
                />
                <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-[13px] text-de9-gray">
                  {typeBesoin === 'recurrent' ? L('DA / mois', 'دج / شهر') : L('DA', 'دج')}
                </span>
              </div>
            )}
          />
          {errors.budget && (
            <p className="mt-1 text-[12px] text-de9-red">
              {errors.budget.type === 'server' ? errors.budget.message : L('Montant en DA, sans décimales.', 'المبلغ بالدينار دون كسور.')}
            </p>
          )}
        </div>

        {/* Type de besoin */}
        <div>
          <Label className="mb-2 block">{t('typeLabel')}</Label>
          <Controller
            control={control}
            name="typeBesoin"
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {(formulaire?.typesBesoin.length
                  ? formulaire.typesBesoin
                  : [
                      { code: 'ponctuel', label: t('ponctuel') },
                      { code: 'recurrent', label: t('recurrent') },
                    ]
                ).map((option) => (
                  <Chip key={option.code} active={field.value === option.code} onClick={() => field.onChange(option.code)}>
                    {optionLabel(option)}
                  </Chip>
                ))}
              </div>
            )}
          />
        </div>

        {/* Fréquence — only with a recurrent contract */}
        {typeBesoin === 'recurrent' && (
          <div>
            <Label className="mb-2 block">{t('freqLabel')}</Label>
            <Controller
              control={control}
              name="frequence"
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {(formulaire?.frequences ?? []).map((option) => (
                    <Chip key={option.code} active={field.value === option.code} onClick={() => field.onChange(option.code)}>
                      {optionLabel(option)}
                    </Chip>
                  ))}
                </div>
              )}
            />
            {errors.frequence && <p className="mt-1 text-[12px] text-de9-red">{messageOf(errors.frequence)}</p>}
          </div>
        )}

        {/* Documents joints — sent right after the demand is created */}
        <div>
          <Label className="mb-2 block">{t('docsLabel')}</Label>
          {files.length > 0 && (
            <ul className="mb-2 flex flex-col gap-2">
              {files.map((file, i) => (
                <li
                  key={`${file.name}-${i}`}
                  className="flex items-center gap-3 rounded-lg bg-card px-3.5 py-2.5 shadow-soft dark:ring-1 dark:ring-border"
                >
                  <FileText className="size-4 flex-none text-de9-teal-dark" />
                  <span className="min-w-0 flex-1 truncate text-[13px] text-de9-ink">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                    className="grid size-7 flex-none place-items-center rounded-full text-de9-gray hover:bg-secondary"
                    aria-label={L('Retirer', 'إزالة')}
                  >
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <PieceSlot
            label={files.length > 0 ? L('Ajouter un document', 'إضافة مستند') : t('docsLabel')}
            hint={L('PDF ou photo', 'PDF أو صورة')}
            accept="application/pdf,image/*"
            value={null}
            onChange={(picked) => {
              const file = picked?.file;
              if (file) setFiles((prev) => [...prev, file]);
            }}
          />
        </div>

        {/* Critères */}
        <div>
          <Label htmlFor="critere" className="mb-2 block">
            {t('critLabel')}
          </Label>
          <Controller
            control={control}
            name="criteres"
            render={({ field }) => (
              <Textarea
                id="critere"
                rows={3}
                placeholder={L('Prix, délai, certifications…', 'السعر، الأجل، الشهادات…')}
                {...field}
              />
            )}
          />
          {errors.criteres && <p className="mt-1 text-[12px] text-de9-red">{messageOf(errors.criteres)}</p>}
        </div>

        <Button
          type="submit"
          disabled={send.isPending}
          className="mt-1 h-11 bg-de9-teal text-white shadow-glow hover:bg-de9-teal-dark"
        >
          {send.isPending ? L('Envoi…', 'جارٍ الإرسال…') : t('submitPublish')}
        </Button>
      </form>

      <Dialog open={indisponible} onOpenChange={setIndisponible}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{L("Cette offre n'est plus disponible.", 'هذا العرض لم يعد متاحًا.')}</DialogTitle>
            <DialogDescription>
              {L('Vous pouvez envoyer votre demande sans prestataire souhaité : de9de9 vous trouve un prestataire.', 'يمكنك إرسال طلبك دون مقدّم خدمة مرغوب: de9de9 يجد لك مقدّم خدمة.')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIndisponible(false)}>
              {L('Revenir', 'رجوع')}
            </Button>
            <Button
              onClick={() => {
                setIndisponible(false);
                // The demande goes on, without the offer: every wilaya is a choice again.
                catalogueActions.clearOffre();
                void handleSubmit((form) => onSubmit(form, true))();
              }}
            >
              {L('Envoyer sans prestataire souhaité', 'إرسال دون مقدّم خدمة مرغوب')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
