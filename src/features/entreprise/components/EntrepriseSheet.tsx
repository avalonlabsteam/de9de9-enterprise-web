import { useState, type FormEvent, type ReactNode } from 'react';
import { Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { toFieldErrors, toProblem, type ApiProblem } from '@/api/problem';
import { useL } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { dirOf, useLangStore } from '@/stores/langStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/common/EmptyState';
import { WilayaSelect } from '@/features/geo/components/WilayaSelect';
import { useKycState } from '@/features/kyc/api/kyc';
import { useEnregistrerEntreprise, useEntreprise, useLectureSeule } from '../api/entreprise';
import {
  ENTREPRISE_MAX,
  entrepriseBody,
  valeursDe,
  type Entreprise,
  type EntrepriseChamp,
  type EntrepriseValeurs,
} from '../schemas/entreprise';

type Erreurs = Partial<Record<EntrepriseChamp, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const idOf = (champ: EntrepriseChamp) => `entreprise-${champ}`;

/**
 * « Informations de l'entreprise » — the company's own record, the same sheet
 * on the client and the prestataire profile. Read by any seat; rewritten by an
 * admin seat only, the whole profile at once.
 */
export function EntrepriseSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const L = useL();
  const lang = useLangStore((s) => s.lang);
  const query = useEntreprise(open);
  const lectureSeule = useLectureSeule(open);
  /** What is being typed; null while the sheet only shows the record. */
  const [edition, setEdition] = useState<EntrepriseValeurs | null>(null);

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        // Closed, the sheet forgets a form left unsaved: it reopens on the record.
        if (!next) setEdition(null);
        onOpenChange(next);
      }}
    >
      <SheetContent
        side={dirOf(lang) === 'rtl' ? 'left' : 'right'}
        aria-describedby={undefined}
        className="gap-0 bg-background p-0 outline-none data-[side=left]:w-full data-[side=right]:w-full data-[side=left]:sm:max-w-[480px] data-[side=right]:sm:max-w-[480px]"
      >
        <SheetHeader className="pe-12">
          <SheetTitle>{L("Informations de l'entreprise", 'معلومات المؤسسة')}</SheetTitle>
          {query.data && !edition && lectureSeule && (
            <SheetDescription>
              {L(
                "Seul un administrateur de l'entreprise peut les modifier.",
                'لا يمكن تعديلها إلا من طرف مسؤول المؤسسة.',
              )}
            </SheetDescription>
          )}
        </SheetHeader>

        {query.isPending && (
          <div className="flex animate-pulse flex-col gap-3 px-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 rounded-lg bg-secondary" />
            ))}
          </div>
        )}

        {query.isError && (
          <EmptyState
            title={L('Impossible de charger les informations', 'تعذّر تحميل المعلومات')}
            description={
              toProblem(query.error).code === 'network'
                ? L('Connexion impossible. Réessayez.', 'تعذّر الاتصال. أعد المحاولة.')
                : L('Réessayez dans un instant.', 'أعد المحاولة بعد لحظة.')
            }
            action={
              <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
                {L('Réessayer', 'إعادة المحاولة')}
              </Button>
            }
          />
        )}

        {query.data &&
          (edition ? (
            <Formulaire
              entreprise={query.data}
              valeurs={edition}
              onChange={setEdition}
              onDone={() => setEdition(null)}
              onStale={() => void query.refetch()}
            />
          ) : (
            <Fiche
              entreprise={query.data}
              onEdit={lectureSeule ? undefined : () => setEdition(valeursDe(query.data))}
            />
          ))}
      </SheetContent>
    </Sheet>
  );
}

// ------------------------------------------------------------ the record

function Fiche({ entreprise: e, onEdit }: { entreprise: Entreprise; onEdit?: () => void }) {
  const L = useL();
  const sections: { titre: string; lignes: [label: string, valeur: string | null | undefined, ltr?: boolean][] }[] = [
    {
      titre: L('Identité', 'الهوية'),
      lignes: [
        [L('Raison sociale', 'الاسم القانوني'), e.legalName],
        [L('Nom commercial', 'الاسم التجاري'), e.tradeName],
        // Only a company that works as a prestataire declares how many pros it has.
        ...(e.isPrestataire || e.proCount != null
          ? ([[L('Professionnels déclarés', 'عدد المحترفين المصرّح بهم'), e.proCount != null ? String(e.proCount) : null]] as [string, string | null][])
          : []),
      ],
    },
    {
      titre: L('Identifiants légaux', 'المعرّفات القانونية'),
      lignes: [
        ['RC', e.rc, true],
        ['NIF', e.nif, true],
        ['NIS', e.nis, true],
        [L("Article d'imposition", 'مادة الضريبة'), e.articleImposition, true],
      ],
    },
    {
      titre: L('Adresse', 'العنوان'),
      lignes: [
        [L('Wilaya', 'الولاية'), e.wilaya],
        [L('Commune', 'البلدية'), e.commune],
        [L('Adresse', 'العنوان'), e.address],
      ],
    },
    {
      titre: L('Contact', 'الاتصال'),
      lignes: [
        [L('Téléphone', 'الهاتف'), e.contactPhone, true],
        [L('Email', 'البريد الإلكتروني'), e.contactEmail, true],
      ],
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
        {sections.map((section) => (
          <section key={section.titre}>
            <h3 className="mb-1.5 text-[12.5px] font-semibold text-de9-gray">{section.titre}</h3>
            <dl className="divide-y divide-border rounded-lg bg-card px-4 shadow-soft dark:ring-1 dark:ring-border">
              {section.lignes.map(([label, valeur, ltr]) => (
                <div key={label} className="flex items-start justify-between gap-4 py-2.5 text-[13px]">
                  <dt className="flex-none text-de9-gray">{label}</dt>
                  <dd className={cn('min-w-0 text-end font-semibold break-words', valeur ? 'text-de9-ink' : 'font-normal text-de9-gray')}>
                    {valeur ? <bdi dir={ltr ? 'ltr' : undefined}>{valeur}</bdi> : L('Non renseigné', 'غير محدد')}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      {onEdit && (
        <div className="border-t border-border bg-background p-4">
          <Button className="w-full" onClick={onEdit}>
            <Pencil className="size-4" />
            {L('Modifier', 'تعديل')}
          </Button>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------ the form

function Formulaire({
  entreprise,
  valeurs,
  onChange,
  onDone,
  onStale,
}: {
  entreprise: Entreprise;
  valeurs: EntrepriseValeurs;
  onChange: (valeurs: EntrepriseValeurs) => void;
  onDone: () => void;
  /** The record moved under the form: read it again. */
  onStale: () => void;
}) {
  const L = useL();
  const enregistrer = useEnregistrerEntreprise();
  const kyc = useKycState();
  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [refus, setRefus] = useState<string | null>(null);

  // The API refuses a change to a number de9de9 validated, or whose paper it is reviewing: those
  // inputs are closed here rather than refused after the fact. It stays the judge of the rest.
  const numerosFermes = kyc.verified || kyc.inReview;
  const noteNumeros = kyc.verified
    ? L('RC, NIF et NIS vérifiés par de9de9 : pour une correction, contactez de9de9.', 'تم التحقق من RC و NIF و NIS من طرف de9de9: للتصحيح، تواصل مع de9de9.')
    : kyc.inReview
      ? L('RC, NIF et NIS en cours de vérification par de9de9 : non modifiables pour le moment.', 'RC و NIF و NIS قيد التحقق من طرف de9de9: لا يمكن تعديلها حاليًا.')
      : null;

  const set = (patch: Partial<EntrepriseValeurs>) => {
    onChange({ ...valeurs, ...patch });
    // What is being fixed no longer shows its error.
    setErreurs((e) => Object.fromEntries(Object.entries(e).filter(([champ]) => !(champ in patch))));
    setRefus(null);
  };

  /** Why the save did not go, when no input is at fault. */
  const phrase = (problem: ApiProblem): string => {
    if (problem.code === 'network') return L('Connexion impossible. Réessayez.', 'تعذّر الاتصال. أعد المحاولة.');
    if (problem.status === 403) {
      return L("Seul un administrateur de l'entreprise peut modifier ces informations.", 'لا يمكن تعديل هذه المعلومات إلا من طرف مسؤول المؤسسة.');
    }
    // A number locked by the KYC review: the API says which one, in French.
    if (problem.code.startsWith('kyc_') && problem.detail) return problem.detail;
    if (problem.status === 409) {
      return L('Ces informations ont changé entre-temps : elles viennent d’être relues. Vérifiez et enregistrez de nouveau.', 'تغيّرت هذه المعلومات في الأثناء: تمت إعادة قراءتها. تحقّق ثم احفظ من جديد.');
    }
    return L("L'enregistrement n'a pas abouti. Réessayez dans un instant.", 'تعذّر الحفظ. أعد المحاولة بعد لحظة.');
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const e: Erreurs = {};
    if (!valeurs.legalName.trim()) e.legalName = L('La raison sociale est obligatoire.', 'الاسم القانوني مطلوب.');
    if (valeurs.contactEmail.trim() && !EMAIL.test(valeurs.contactEmail.trim())) {
      e.contactEmail = L('Adresse e-mail invalide.', 'عنوان البريد الإلكتروني غير صالح.');
    }
    const pros = Number(valeurs.proCount);
    if (valeurs.proCount.trim() && (!Number.isInteger(pros) || pros < 1 || pros > ENTREPRISE_MAX.proCount)) {
      e.proCount = L(
        `Indiquez un nombre de 1 à ${ENTREPRISE_MAX.proCount.toLocaleString('fr-FR')}.`,
        `أدخل عددًا من 1 إلى ${ENTREPRISE_MAX.proCount}.`,
      );
    }
    setErreurs(e);
    setRefus(null);
    if (Object.keys(e).length > 0) return;

    enregistrer.mutate(entrepriseBody(valeurs), {
      onSuccess: () => {
        toast.success(L('Informations enregistrées', 'تم حفظ المعلومات'));
        onDone();
      },
      onError: (error) => {
        const problem = toProblem(error);
        // This route words its field rules in English: the input is marked, in the form's own words.
        const refuses: Erreurs = {};
        if (problem.status === 400) {
          for (const key of Object.keys(toFieldErrors(error))) {
            const champ = key.split('.')[0];
            if (champ in ENTREPRISE_MAX) refuses[champ as EntrepriseChamp] = L('Valeur refusée.', 'قيمة مرفوضة.');
          }
        }
        if (Object.keys(refuses).length > 0) return setErreurs(refuses);
        setRefus(phrase(problem));
        if (problem.status === 409 && !problem.code.startsWith('kyc_')) onStale();
      },
    });
  };

  const input = (champ: EntrepriseChamp) => ({
    id: idOf(champ),
    'aria-invalid': !!erreurs[champ],
    'aria-describedby': erreurs[champ] ? `${idOf(champ)}-erreur` : undefined,
    maxLength: champ === 'proCount' ? undefined : ENTREPRISE_MAX[champ],
    value: valeurs[champ],
    disabled: enregistrer.isPending,
  });

  return (
    <form noValidate onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4">
        <Groupe titre={L('Identité', 'الهوية')}>
          <Champ champ="legalName" label={L('Raison sociale', 'الاسم القانوني')} requis error={erreurs.legalName}>
            <Input {...input('legalName')} required autoComplete="organization" onChange={(e) => set({ legalName: e.target.value })} />
          </Champ>
          <Champ champ="tradeName" label={L('Nom commercial', 'الاسم التجاري')} error={erreurs.tradeName}>
            <Input {...input('tradeName')} onChange={(e) => set({ tradeName: e.target.value })} />
          </Champ>
          {(entreprise.isPrestataire || entreprise.proCount != null) && (
            <Champ champ="proCount" label={L('Professionnels déclarés', 'عدد المحترفين المصرّح بهم')} error={erreurs.proCount}>
              <Input
                {...input('proCount')}
                type="number"
                inputMode="numeric"
                min={1}
                max={ENTREPRISE_MAX.proCount}
                onChange={(e) => set({ proCount: e.target.value })}
              />
            </Champ>
          )}
        </Groupe>

        <Groupe titre={L('Identifiants légaux', 'المعرّفات القانونية')} note={noteNumeros}>
          {/* Long numbers: the RC on its own line, NIF and NIS side by side — none is cut. */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(['rc', 'nif', 'nis'] as const).map((champ) => (
              <div key={champ} className={champ === 'rc' ? 'sm:col-span-2' : undefined}>
                <Champ champ={champ} label={champ.toUpperCase()} error={erreurs[champ]}>
                  <Input
                    {...input(champ)}
                    dir="ltr"
                    disabled={numerosFermes || enregistrer.isPending}
                    onChange={(e) => set({ [champ]: e.target.value })}
                  />
                </Champ>
              </div>
            ))}
          </div>
          <Champ champ="articleImposition" label={L("Article d'imposition", 'مادة الضريبة')} error={erreurs.articleImposition}>
            <Input {...input('articleImposition')} dir="ltr" onChange={(e) => set({ articleImposition: e.target.value })} />
          </Champ>
        </Groupe>

        <Groupe titre={L('Adresse', 'العنوان')}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 [&_[data-slot=select-trigger]]:h-11">
              <span className="text-[12.5px] font-medium text-de9-gray">{L('Wilaya', 'الولاية')}</span>
              <WilayaSelect value={valeurs.wilaya} onChange={(nom) => set({ wilaya: nom })} />
            </div>
            <Champ champ="commune" label={L('Commune', 'البلدية')} error={erreurs.commune}>
              <Input {...input('commune')} onChange={(e) => set({ commune: e.target.value })} />
            </Champ>
          </div>
          <Champ champ="address" label={L('Adresse', 'العنوان')} error={erreurs.address}>
            <Textarea {...input('address')} rows={2} autoComplete="street-address" onChange={(e) => set({ address: e.target.value })} />
          </Champ>
        </Groupe>

        <Groupe titre={L('Contact', 'الاتصال')}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Champ champ="contactPhone" label={L('Téléphone', 'الهاتف')} error={erreurs.contactPhone}>
              <Input {...input('contactPhone')} type="tel" dir="ltr" autoComplete="tel" onChange={(e) => set({ contactPhone: e.target.value })} />
            </Champ>
            <Champ champ="contactEmail" label={L('Email', 'البريد الإلكتروني')} error={erreurs.contactEmail}>
              <Input {...input('contactEmail')} type="email" dir="ltr" autoComplete="email" onChange={(e) => set({ contactEmail: e.target.value })} />
            </Champ>
          </div>
        </Groupe>
      </div>

      <div className="flex flex-col gap-2 border-t border-border bg-background p-4">
        {refus && (
          <p role="alert" className="text-[12.5px] font-semibold text-de9-red">
            {refus}
          </p>
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onDone} disabled={enregistrer.isPending}>
            {L('Annuler', 'إلغاء')}
          </Button>
          <Button type="submit" className="flex-1" disabled={enregistrer.isPending}>
            {enregistrer.isPending && <Loader2 className="size-4 animate-spin" />}
            {L('Enregistrer', 'حفظ')}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Groupe({ titre, note, children }: { titre: string; note?: string | null; children: ReactNode }) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-4">
      <legend className="mb-2 text-[12.5px] font-semibold text-de9-gray">{titre}</legend>
      {note && <p className="-mt-1 rounded-lg bg-secondary px-3.5 py-2.5 text-[12.5px] text-de9-slate">{note}</p>}
      {children}
    </fieldset>
  );
}

function Champ({
  champ,
  label,
  requis,
  error,
  children,
}: {
  champ: EntrepriseChamp;
  label: string;
  requis?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={idOf(champ)} className="text-[12.5px] text-de9-gray">
        {label}
        {requis && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {error && (
        <span id={`${idOf(champ)}-erreur`} className="text-[11.5px] text-de9-red">
          {error}
        </span>
      )}
    </div>
  );
}
