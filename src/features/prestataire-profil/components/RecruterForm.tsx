import { useState, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { toProblem, type ApiProblem } from '@/api/problem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/common/EmptyState';
import { useL } from '@/lib/i18n';
import { useEnvoyerDemandePros, useOptionsPros } from '../api/contractuels';
import type { CategoriePros, RecruterValeurs } from '../schemas/contractuels';

/** The choice of no service / no wilaya in particular: nothing is sent for that field. */
const TOUT = 'tout';
const NOMBRE_MAX = 50;
const NOTE_MAX = 2000;

type Champ = keyof RecruterValeurs;

/** A `field` of a 400 → the input that shows its sentence. */
const CHAMP_OF: Record<string, Champ> = {
  categoryId: 'categorie',
  serviceId: 'service',
  wilayaId: 'wilaya',
  requestedCount: 'nombre',
  note: 'note',
};

const idOf = (value: string): number | undefined => (value && value !== TOUT ? Number(value) : undefined);

/**
 * « Recruter des sous-traitants » — the demande for N pros of the de9de9 app
 * (`POST /prestataire/contractuels/demandes`). Catégorie → sous-catégorie and
 * the zone are the de9de9 app's own lists; only the category and the number
 * are required.
 */
export function RecruterForm({
  valeurs,
  onChange,
  onSent,
}: {
  valeurs: RecruterValeurs;
  onChange: (valeurs: RecruterValeurs) => void;
  onSent: () => void;
}) {
  const L = useL();
  const options = useOptionsPros();
  const envoyer = useEnvoyerDemandePros();
  const [erreurs, setErreurs] = useState<Partial<Record<Champ, string>>>({});
  const [refus, setRefus] = useState<string | null>(null);

  const set = (patch: Partial<RecruterValeurs>) => {
    onChange({ ...valeurs, ...patch });
    // What is being fixed no longer shows its error.
    setErreurs((e) => Object.fromEntries(Object.entries(e).filter(([champ]) => !(champ in patch))));
    setRefus(null);
  };

  /** Why a call failed, in the user's words: the server's French `detail` when it gives one. */
  const phrase = (problem: ApiProblem): string => {
    if (problem.code === 'prestataire_side_required' || problem.status === 403) {
      return L("Basculez sur l'espace prestataire pour envoyer cette demande.", 'انتقل إلى مساحة مقدّم الخدمة لإرسال هذا الطلب.');
    }
    if (problem.detail) return problem.detail;
    if (problem.code === 'network') return L('Connexion impossible. Réessayez.', 'تعذّر الاتصال. أعد المحاولة.');
    return L('Réessayez dans un instant.', 'أعد المحاولة بعد لحظة.');
  };

  if (options.isPending) {
    return (
      <div className="flex animate-pulse flex-col gap-4 px-4 pb-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-lg bg-secondary" />
        ))}
      </div>
    );
  }

  // The lists are the de9de9 app's, read live: when it does not answer there is nothing to pick from.
  if (options.isError) {
    return (
      <EmptyState
        className="py-8"
        title={L('Listes indisponibles', 'القوائم غير متاحة')}
        description={phrase(toProblem(options.error))}
        action={
          <Button variant="outline" size="sm" onClick={() => void options.refetch()} disabled={options.isFetching}>
            {options.isFetching && <Loader2 className="size-4 animate-spin" />}
            {L('Réessayer', 'إعادة المحاولة')}
          </Button>
        }
      />
    );
  }

  const { categories, wilayas } = options.data;
  const categorie = categories.find((c) => String(c.id) === valeurs.categorie);

  // Already ordered by group then name: consecutive categories of one group share its header.
  const groupes: { nom: string; categories: CategoriePros[] }[] = [];
  for (const c of categories) {
    const nom = L(c.groupe ?? '', c.groupeAr ?? c.groupe ?? '');
    const dernier = groupes[groupes.length - 1];
    if (dernier && dernier.nom === nom) dernier.categories.push(c);
    else groupes.push({ nom, categories: [c] });
  }

  const submit = () => {
    const e: Partial<Record<Champ, string>> = {};
    if (!categorie) e.categorie = L('Choisissez une catégorie.', 'اختر فئة.');
    const nombre = Number(valeurs.nombre);
    if (valeurs.nombre.trim() === '' || !Number.isInteger(nombre) || nombre < 1 || nombre > NOMBRE_MAX) {
      e.nombre = L(`Indiquez un nombre de 1 à ${NOMBRE_MAX}.`, `أدخل عددًا من 1 إلى ${NOMBRE_MAX}.`);
    }
    setErreurs(e);
    setRefus(null);
    if (!categorie || e.nombre) return;

    envoyer.mutate(
      {
        categoryId: categorie.id,
        serviceId: idOf(valeurs.service),
        wilayaId: idOf(valeurs.wilaya),
        requestedCount: nombre,
        note: valeurs.note.trim() || undefined,
      },
      {
        onSuccess: onSent,
        onError: (error) => {
          const problem = toProblem(error);
          const champ = problem.field ? CHAMP_OF[problem.field] : undefined;
          if (problem.status === 400 && champ) {
            setErreurs({ [champ]: problem.detail ?? L('Valeur refusée.', 'قيمة مرفوضة.') });
            // A value the de9de9 app no longer knows: its lists are read again.
            if (champ !== 'nombre' && champ !== 'note') void options.refetch();
            return;
          }
          setRefus(phrase(problem));
        },
      },
    );
  };

  return (
    <>
      <div className="flex flex-col gap-4 px-4">
        <Field label={L('Catégorie', 'الفئة')} required error={erreurs.categorie}>
          {/* Another category has other services: the one picked before does not carry over. */}
          <Select value={valeurs.categorie} onValueChange={(v) => set({ categorie: v, service: '' })}>
            <SelectTrigger className="w-full" aria-invalid={!!erreurs.categorie}>
              <SelectValue placeholder={L('Choisir une catégorie', 'اختر فئة')} />
            </SelectTrigger>
            <SelectContent>
              {groupes.map((groupe) => (
                <SelectGroup key={groupe.nom}>
                  {groupe.nom && <SelectLabel>{groupe.nom}</SelectLabel>}
                  {groupe.categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {L(c.name, c.nameAr ?? c.name)}
                      {c.pros != null && ` · ${L(`${c.pros} pros`, `${c.pros} محترف`)}`}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label={L('Sous-catégorie', 'الفئة الفرعية')} error={erreurs.service}>
          <Select value={valeurs.service} onValueChange={(v) => set({ service: v })} disabled={!categorie}>
            <SelectTrigger className="w-full" aria-invalid={!!erreurs.service}>
              <SelectValue placeholder={L('Choisir un service', 'اختر خدمة')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TOUT}>{L('Tous les services de la catégorie', 'كل خدمات الفئة')}</SelectItem>
              {categorie?.services.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {L(s.name, s.nameAr ?? s.name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label={L('Zone', 'المنطقة')} error={erreurs.wilaya}>
          <Select value={valeurs.wilaya} onValueChange={(v) => set({ wilaya: v })}>
            <SelectTrigger className="w-full" aria-invalid={!!erreurs.wilaya}>
              <SelectValue placeholder={L('Choisir une wilaya', 'اختر ولاية')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TOUT}>{L('Toutes les wilayas', 'كل الولايات')}</SelectItem>
              {wilayas.map((w) => (
                <SelectItem key={w.id} value={String(w.id)}>
                  {w.code != null && `${w.code} · `}
                  {L(w.name, w.nameAr ?? w.name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label={L('Nombre', 'العدد')} required error={erreurs.nombre}>
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            max={NOMBRE_MAX}
            value={valeurs.nombre}
            aria-invalid={!!erreurs.nombre}
            onChange={(e) => set({ nombre: e.target.value })}
          />
        </Field>

        <Field label={L('Note', 'ملاحظة')} error={erreurs.note}>
          <Textarea
            value={valeurs.note}
            maxLength={NOTE_MAX}
            rows={3}
            aria-invalid={!!erreurs.note}
            onChange={(e) => set({ note: e.target.value })}
          />
        </Field>
      </div>

      <div className="flex flex-col gap-2 p-4">
        {refus && (
          <p role="alert" className="text-[12.5px] font-semibold text-de9-red">
            {refus}
          </p>
        )}
        <Button className="w-full" onClick={submit} disabled={envoyer.isPending}>
          {envoyer.isPending && <Loader2 className="size-4 animate-spin" />}
          {L('Envoyer la demande', 'إرسال الطلب')}
        </Button>
      </div>
    </>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[12.5px] text-de9-gray">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {error && <span className="text-[11.5px] text-de9-red">{error}</span>}
    </div>
  );
}
