import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ImagePlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useL } from '@/lib/i18n';
import { useLangStore } from '@/stores/langStore';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateAnnonce } from '../api/annonces';
import { AnnonceCreatedModal } from './AnnonceCreatedModal';
import {
  ANNONCE_CATEGORIES,
  QUESTIONNAIRE,
  TARIF_UNITS,
  WEEK_DAYS,
  categoryById,
  serviceById,
  type LocalizedText,
  type ServiceItem,
} from '../annonceCatalogue';

/** Wizard steps, in order. The progress bar fills as these advance. */
const STEPS = [
  'category',
  'service',
  'services',
  'tarifs',
  'questionnaire',
  'disponibilite',
  'description',
  'photos',
] as const;
type Step = (typeof STEPS)[number];

const DESCRIPTION_MAX = 1000;

/** Percentage positions of the category bubbles around the decorative "D". */
const BUBBLE_POS: Record<string, { x: number; y: number }> = {
  beaute: { x: 15, y: 16 },
  electronique: { x: 43, y: 10 },
  sante: { x: 70, y: 19 },
  travaux: { x: 15, y: 44 },
  cours: { x: 81, y: 43 },
  maintenance: { x: 15, y: 72 },
  evenement: { x: 43, y: 82 },
  sport: { x: 69, y: 73 },
};

interface DayAvailability {
  on: boolean;
  start: string;
  end: string;
}

/**
 * "Créez votre annonce" — guided B2C flow shown in a dialog:
 * category → service → services → tarifs → questionnaire → disponibilité →
 * description → photos, then the "Bravo !" confirmation.
 */
export function CreateAnnonceWizard({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const L = useL();
  const lang = useLangStore((s) => s.lang);
  const createAnnonce = useCreateAnnonce();

  const tr = (t: LocalizedText) => (lang === 'ar' ? t.ar : t.fr);

  const [step, setStep] = useState<Step>('category');
  const [created, setCreated] = useState(false);

  const [categoryId, setCategoryId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [unite, setUnite] = useState('');
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [allWeek, setAllWeek] = useState(false);
  const [allDay, setAllDay] = useState(false);
  const [days, setDays] = useState<Record<string, DayAvailability>>(() =>
    Object.fromEntries(WEEK_DAYS.map((d) => [d.id, { on: false, start: '09:00', end: '18:00' }])),
  );
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<{ id: string; url: string }[]>([]);

  // Object URLs are created per file; release them when the wizard unmounts.
  useEffect(() => {
    return () => photos.forEach((p) => URL.revokeObjectURL(p.url));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const category = categoryById(categoryId);
  const service = serviceById(categoryId, serviceId);

  /** Flattened, currently-checked services — drives the Tarifs rows. */
  const checkedServiceItems = useMemo<ServiceItem[]>(() => {
    if (!service) return [];
    return service.groups.flatMap((g) => g.items).filter((i) => checkedItems.includes(i.id));
  }, [service, checkedItems]);

  const stepIndex = STEPS.indexOf(step);
  const goNext = () => setStep(STEPS[Math.min(stepIndex + 1, STEPS.length - 1)]!);
  const goBack = () => {
    if (stepIndex === 0) {
      onOpenChange(false);
      return;
    }
    setStep(STEPS[stepIndex - 1]!);
  };

  const toggleItem = (id: string) =>
    setCheckedItems((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleAnswer = (questionId: string, optionId: string, mode: 'single' | 'multi') =>
    setAnswers((prev) => {
      const current = prev[questionId] ?? [];
      if (mode === 'single') {
        return { ...prev, [questionId]: current.includes(optionId) ? [] : [optionId] };
      }
      return {
        ...prev,
        [questionId]: current.includes(optionId)
          ? current.filter((x) => x !== optionId)
          : [...current, optionId],
      };
    });

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const next = Array.from(files).map((f, i) => ({
      id: `${f.name}-${f.size}-${i}-${photos.length}`,
      url: URL.createObjectURL(f),
    }));
    setPhotos((prev) => [...prev, ...next]);
  };

  const removePhoto = (id: string) =>
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.id !== id);
    });

  const publish = () => {
    if (!service || !category) return;
    createAnnonce.mutate(
      {
        title: tr(service.name),
        serviceName: `${tr(category.name)} · ${tr(service.name)}`,
        type: 'b2c',
      },
      { onSuccess: () => setCreated(true) },
    );
  };

  /** Steps 1–2 advance on selection; the rest use the footer button. */
  const showFooter = stepIndex >= 2;
  const isLastStep = step === 'photos';

  return (
    <>
      {/* Hidden while the confirmation shows, so the two dialogs never stack. */}
      <Dialog open={open && !created} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="flex max-h-[86vh] flex-col gap-0 overflow-hidden rounded-[20px] p-0 sm:max-w-[560px]"
        >
          <div className="flex-none px-7 pt-6">
            <button
              type="button"
              onClick={goBack}
              aria-label={L('Retour', 'رجوع')}
              className="mb-4 flex size-9 items-center justify-center rounded-lg text-de9-slate transition-colors hover:bg-black/5 dark:hover:bg-white/10"
            >
              <ArrowLeft className="size-5 rtl:rotate-180" />
            </button>
            <div className="h-1 w-full overflow-hidden rounded-full bg-de9-line">
              <div
                className="h-full rounded-full bg-de9-teal transition-[width] duration-300"
                style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-7 pb-6 pt-5">
            {step === 'category' && (
              <>
                <DialogTitle className="text-[26px] font-bold text-de9-ink">
                  {L('Créez votre annonce', 'أنشئ إعلانك')}
                </DialogTitle>
                <CategoryStep
                  tr={tr}
                  onPick={(id) => {
                    setCategoryId(id);
                    setStep('service');
                  }}
                />
              </>
            )}

            {step === 'service' && category && (
              <>
                <DialogTitle className="text-[26px] font-bold text-de9-ink">
                  {L('Créez votre annonce', 'أنشئ إعلانك')}
                </DialogTitle>
                <h2 className="mt-6 text-[22px] font-bold text-de9-ink">{tr(category.name)}</h2>
                <ul className="mt-4 flex flex-col gap-3">
                  {category.services.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setServiceId(s.id);
                          setCheckedItems([]);
                          setStep('services');
                        }}
                        className="flex w-full items-center gap-4 rounded-[14px] bg-card px-5 py-4 text-start shadow-soft transition-shadow hover:shadow-lift dark:ring-1 dark:ring-border"
                      >
                        <span className="text-[20px]">{s.emoji}</span>
                        <span className="text-[15px] font-bold text-de9-ink">{tr(s.name)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {step === 'services' && service && (
              <>
                <StepHeading
                  title={L('Services', 'الخدمات')}
                  subtitle={L(
                    'Choisissez les services que vous proposez.',
                    'اختر الخدمات التي تقدمها.',
                  )}
                />
                <div className="mt-5 flex flex-col gap-7">
                  {service.groups.map((g) => (
                    <div key={g.id}>
                      <h3 className="text-[15px] font-bold text-de9-ink">{tr(g.title)}</h3>
                      <ul className="mt-3 flex flex-col gap-3">
                        {g.items.map((item) => (
                          <li key={item.id}>
                            <label className="flex cursor-pointer items-start gap-3.5">
                              <Checkbox
                                checked={checkedItems.includes(item.id)}
                                onCheckedChange={() => toggleItem(item.id)}
                                className="mt-0.5 size-6 rounded-[6px]"
                              />
                              <span className="text-[14px] text-de9-ink">{tr(item.name)}</span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </>
            )}

            {step === 'tarifs' && (
              <>
                <StepHeading title={L('Tarifs', 'الأسعار')} />
                <Select value={unite} onValueChange={setUnite}>
                  <SelectTrigger
                    className="mt-5 h-14 w-full rounded-[14px] border-de9-line bg-transparent px-5 text-[15px]"
                    aria-label={L('Unité', 'الوحدة')}
                  >
                    <SelectValue placeholder={L('Unité', 'الوحدة')} />
                  </SelectTrigger>
                  <SelectContent>
                    {TARIF_UNITS.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {tr(u.label)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {checkedServiceItems.length === 0 ? (
                  <p className="mt-6 text-[13px] text-de9-gray">
                    {L(
                      'Revenez à l’étape Services pour choisir ce que vous proposez.',
                      'ارجع إلى خطوة الخدمات لاختيار ما تقدمه.',
                    )}
                  </p>
                ) : (
                  <>
                    <div className="mt-4 grid grid-cols-[minmax(0,1fr)_140px] gap-3">
                      <span className="rounded-[10px] border border-de9-line py-2.5 text-center text-[13px] font-semibold text-de9-gray">
                        {L('Service', 'الخدمة')}
                      </span>
                      <span className="rounded-[10px] border border-de9-line py-2.5 text-center text-[13px] font-semibold text-de9-gray">
                        {L('Tarif', 'السعر')}
                      </span>
                    </div>
                    <ul className="mt-4 flex flex-col gap-4">
                      {checkedServiceItems.map((item) => (
                        <li
                          key={item.id}
                          className="grid grid-cols-[minmax(0,1fr)_140px] items-center gap-3"
                        >
                          <span className="text-[14px] text-de9-ink">{tr(item.name)}</span>
                          <span className="flex items-center gap-2">
                            <Input
                              value={prices[item.id] ?? ''}
                              onChange={(e) =>
                                setPrices((prev) => ({ ...prev, [item.id]: e.target.value }))
                              }
                              inputMode="numeric"
                              placeholder="0"
                              aria-label={`${L('Tarif', 'السعر')} — ${tr(item.name)}`}
                              className="h-11 w-[86px] rounded-[10px] border-de9-line bg-transparent text-center shadow-none"
                            />
                            <span className="text-[13px] font-semibold text-de9-gray">DZD</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            )}

            {step === 'questionnaire' && (
              <>
                <StepHeading
                  title={L('Questionnaire', 'الاستبيان')}
                  subtitle={L(
                    'Répondez aux questions pour aider les clients à mieux comprendre votre expertise et compétences.',
                    'أجب عن الأسئلة لمساعدة العملاء على فهم خبرتك ومهاراتك.',
                  )}
                />
                <div className="mt-5 flex flex-col gap-8">
                  {QUESTIONNAIRE.map((q) => (
                    <div key={q.id}>
                      <h3 className="text-[14px] font-bold text-de9-ink">{tr(q.label)}</h3>
                      <ul className="mt-3.5 flex flex-col gap-3.5">
                        {q.options.map((opt) => (
                          <li key={opt.id}>
                            <label className="flex cursor-pointer items-center gap-3.5">
                              <Checkbox
                                checked={(answers[q.id] ?? []).includes(opt.id)}
                                onCheckedChange={() => toggleAnswer(q.id, opt.id, q.mode)}
                                className="size-6 rounded-[6px]"
                              />
                              <span className="text-[14px] text-de9-ink">{tr(opt.label)}</span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </>
            )}

            {step === 'disponibilite' && (
              <>
                <StepHeading
                  title={L('Disponibilité', 'التوفر')}
                  subtitle={L(
                    'Indiquez vos jours et heures de disponibilité pour permettre aux clients de réserver vos services aux moments qui vous conviennent.',
                    'حدّد أيام وساعات توفرك ليتمكن العملاء من حجز خدماتك في الأوقات المناسبة لك.',
                  )}
                />
                <div className="mt-5 flex flex-col gap-4">
                  <label className="flex cursor-pointer items-center gap-3.5">
                    <Switch checked={allWeek} onCheckedChange={setAllWeek} />
                    <span className="text-[15px] font-semibold text-de9-ink">
                      {L('Disponible 7j/7', 'متوفر 7/7')}
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-3.5">
                    <Switch checked={allDay} onCheckedChange={setAllDay} />
                    <span className="text-[15px] font-semibold text-de9-ink">
                      {L('Disponible 24h/24', 'متوفر 24/24')}
                    </span>
                  </label>

                  <ul className="mt-2 flex flex-col gap-5">
                    {WEEK_DAYS.map((d) => {
                      const value = days[d.id]!;
                      const on = allWeek || value.on;
                      return (
                        <li key={d.id}>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-[15px] font-semibold text-de9-ink">
                              {tr(d.label)}
                            </span>
                            <span className="flex items-center gap-3">
                              <Switch
                                checked={on}
                                disabled={allWeek}
                                onCheckedChange={(next) =>
                                  setDays((prev) => ({ ...prev, [d.id]: { ...value, on: next } }))
                                }
                                aria-label={tr(d.label)}
                              />
                              <span className="text-[12px] text-de9-gray">
                                {on ? L('Disponible', 'متوفر') : L('Non disponible', 'غير متوفر')}
                              </span>
                            </span>
                          </div>
                          {on && !allDay && (
                            <div className="mt-2 flex items-center gap-2 text-[13px] font-semibold text-de9-slate">
                              <input
                                type="time"
                                value={value.start}
                                onChange={(e) =>
                                  setDays((prev) => ({
                                    ...prev,
                                    [d.id]: { ...value, start: e.target.value },
                                  }))
                                }
                                aria-label={`${L('Début', 'البداية')} — ${tr(d.label)}`}
                                className="rounded-md bg-transparent underline underline-offset-4 outline-none"
                              />
                              <span>–</span>
                              <input
                                type="time"
                                value={value.end}
                                onChange={(e) =>
                                  setDays((prev) => ({
                                    ...prev,
                                    [d.id]: { ...value, end: e.target.value },
                                  }))
                                }
                                aria-label={`${L('Fin', 'النهاية')} — ${tr(d.label)}`}
                                className="rounded-md bg-transparent underline underline-offset-4 outline-none"
                              />
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </>
            )}

            {step === 'description' && (
              <>
                <StepHeading
                  title={L('Description', 'الوصف')}
                  subtitle={L(
                    'Décrivez vos services et votre expérience pour aider les clients à mieux comprendre ce que vous proposez.',
                    'صف خدماتك وخبرتك لمساعدة العملاء على فهم ما تقدمه.',
                  )}
                />
                <Textarea
                  value={description}
                  maxLength={DESCRIPTION_MAX}
                  onChange={(e) => setDescription(e.target.value)}
                  aria-label={L('Description', 'الوصف')}
                  className="mt-5 min-h-[190px] rounded-[16px] border-transparent bg-card p-5 text-[15px] shadow-soft"
                />
                <p className="mt-2 text-end text-[12px] text-de9-gray">
                  {description.length}/{DESCRIPTION_MAX}
                </p>
              </>
            )}

            {step === 'photos' && (
              <>
                <StepHeading
                  title={L('Galerie photos', 'معرض الصور')}
                  subtitle={L(
                    'Ajoutez des photos pour mettre en valeur votre travail et attirer l’attention des clients.',
                    'أضف صورًا لإبراز عملك وجذب انتباه العملاء.',
                  )}
                />
                {photos.length === 0 ? (
                  <label className="mt-5 grid h-[190px] cursor-pointer place-items-center rounded-[16px] bg-de9-teal-soft transition-[filter] hover:brightness-97">
                    <PhotoInput onFiles={addPhotos} />
                    <span className="grid size-[74px] place-items-center rounded-[16px] bg-de9-teal text-white">
                      <ImagePlus className="size-8" />
                    </span>
                  </label>
                ) : (
                  <ul className="mt-5 flex flex-wrap gap-3">
                    {photos.map((p) => (
                      <li key={p.id} className="relative">
                        <img src={p.url} alt="" className="size-[74px] rounded-[12px] object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(p.id)}
                          aria-label={L('Supprimer la photo', 'حذف الصورة')}
                          className="absolute -end-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-de9-red text-white"
                        >
                          <X className="size-3" />
                        </button>
                      </li>
                    ))}
                    <li>
                      <label className="grid size-[74px] cursor-pointer place-items-center rounded-[12px] bg-de9-teal-soft text-de9-teal transition-[filter] hover:brightness-97">
                        <PhotoInput onFiles={addPhotos} />
                        <ImagePlus className="size-7" />
                      </label>
                    </li>
                  </ul>
                )}
              </>
            )}
          </div>

          {showFooter && (
            <div className={cn('flex-none border-t border-de9-line px-7 py-4')}>
              <button
                type="button"
                onClick={isLastStep ? publish : goNext}
                disabled={createAnnonce.isPending}
                className="block h-14 w-full rounded-[14px] bg-de9-teal text-[16px] font-semibold text-white transition-[filter] hover:brightness-95 disabled:opacity-70"
              >
                {isLastStep
                  ? createAnnonce.isPending
                    ? L('Publication…', 'جارٍ النشر…')
                    : L('Publier', 'نشر')
                  : L('Suivant', 'التالي')}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AnnonceCreatedModal
        open={created}
        onOpenChange={(next) => {
          setCreated(next);
          if (!next) onOpenChange(false);
        }}
        onSeeAnnonces={onDone}
      />
    </>
  );
}

function StepHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <DialogTitle className="text-[26px] font-bold text-de9-ink">{title}</DialogTitle>
      {subtitle && (
        <p className="mt-1.5 text-[14px] font-semibold leading-relaxed text-de9-gray">{subtitle}</p>
      )}
    </div>
  );
}

/** Hidden file input shared by the empty and filled gallery states. */
function PhotoInput({ onFiles }: { onFiles: (files: FileList | null) => void }) {
  return (
    <input
      type="file"
      accept="image/*"
      multiple
      className="sr-only"
      onChange={(e) => {
        onFiles(e.target.files);
        e.target.value = '';
      }}
    />
  );
}

/** Category bubbles laid out around the decorative "D". */
function CategoryStep({
  tr,
  onPick,
}: {
  tr: (t: LocalizedText) => string;
  onPick: (id: string) => void;
}) {
  const bubble = (id: string, emoji: string, label: string) => (
    <button
      key={id}
      type="button"
      onClick={() => onPick(id)}
      className="flex w-[100px] flex-col items-center gap-1.5"
    >
      <span className="grid size-[64px] place-items-center rounded-full bg-card text-[26px] shadow-lift">
        {emoji}
      </span>
      <span className="text-center text-[12px] font-semibold leading-tight text-de9-ink">
        {label}
      </span>
    </button>
  );

  return (
    <>
      {/* Artwork layout — the bubbles ring the "D" mark. */}
      <div className="relative mx-auto mt-6 hidden aspect-[367/440] w-full max-w-[400px] sm:block">
        <DMark />
        {ANNONCE_CATEGORIES.map((c) => {
          const pos = BUBBLE_POS[c.id];
          if (!pos) return null;
          return (
            <div
              key={c.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 rtl:translate-x-1/2"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              {bubble(c.id, c.emoji, tr(c.name))}
            </div>
          );
        })}
      </div>

      {/* Small screens get a straightforward grid. */}
      <div className="mt-6 grid grid-cols-3 justify-items-center gap-y-7 sm:hidden">
        {ANNONCE_CATEGORIES.map((c) => bubble(c.id, c.emoji, tr(c.name)))}
      </div>
    </>
  );
}

/** The tinted "D" letterform sitting behind the category bubbles. */
function DMark() {
  return (
    <svg
      viewBox="0 0 340 400"
      className="absolute inset-0 size-full text-de9-teal-soft"
      aria-hidden
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M22 0h108c116 0 190 78 190 200s-74 200-190 200H22a22 22 0 0 1-22-22V22A22 22 0 0 1 22 0Zm86 92a26 26 0 0 0-26 26v164a26 26 0 0 0 26 26h20c72 0 112-42 112-108S200 92 128 92h-20Z"
      />
    </svg>
  );
}
