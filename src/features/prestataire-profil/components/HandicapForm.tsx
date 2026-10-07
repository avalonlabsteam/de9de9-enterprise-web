import { useState, type FormEvent, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { toFieldErrors, toProblem, type ApiProblem } from '@/api/problem';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useL } from '@/lib/i18n';
import { useHandicapJoin } from '../api/profil';
import { HANDICAP_MAX, handicapBody, type HandicapValeurs } from '../schemas/profil';

type Champ = keyof HandicapValeurs;
type Erreurs = Partial<Record<Champ, string>>;

/** A key of a 400's `errors` → the input that shows its sentence. */
const CHAMP_OF: Record<string, Champ> = {
  contactName: 'contact',
  jobType: 'poste',
  wilaya: 'zone',
  positionsCount: 'nombre',
  contactPhone: 'telephone',
  contactEmail: 'email',
  comment: 'commentaire',
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const idOf = (champ: Champ) => `handicap-${champ}`;
const noteIdOf = (champ: Champ) => `handicap-${champ}-note`;

/**
 * « Contracter des personnes en situation de handicap » — the request itself
 * (`POST /handicap/inscription`). Only the contact and the job are required;
 * without a phone de9de9 calls the number the company has on file.
 */
export function HandicapForm({
  valeurs,
  onChange,
  onSent,
}: {
  valeurs: HandicapValeurs;
  onChange: (valeurs: HandicapValeurs) => void;
  onSent: () => void;
}) {
  const L = useL();
  const join = useHandicapJoin();
  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [refus, setRefus] = useState<string | null>(null);

  const set = (patch: Partial<HandicapValeurs>) => {
    onChange({ ...valeurs, ...patch });
    // What is being fixed no longer shows its error.
    setErreurs((e) => Object.fromEntries(Object.entries(e).filter(([champ]) => !(champ in patch))));
    setRefus(null);
  };

  const nombreInvalide = L(
    `Indiquez un nombre de 1 à ${HANDICAP_MAX.nombre.toLocaleString('fr-FR')}.`,
    `أدخل عددًا من 1 إلى ${HANDICAP_MAX.nombre}.`,
  );
  const emailInvalide = L('Adresse e-mail invalide.', 'عنوان البريد الإلكتروني غير صالح.');

  /** The API words three refusals in English (a bad e-mail, a text too long, a number too high): the form's own sentence then. */
  const phraseDe = (champ: Champ, message: string): string => {
    if (!/^'|^The length of/.test(message)) return message;
    if (champ === 'nombre') return nombreInvalide;
    if (champ === 'email' && !message.startsWith('The length')) return emailInvalide;
    return L('Texte trop long.', 'النص طويل جدًا.');
  };

  /** Why the request did not go, when no input is at fault. */
  const phrase = (problem: ApiProblem): string => {
    if (problem.code === 'network') return L('Connexion impossible. Réessayez.', 'تعذّر الاتصال. أعد المحاولة.');
    // A 403 comes worded in French; a 400 that names no input of the form is the framework's own, in English.
    if (problem.detail && problem.status !== 400) return problem.detail;
    return L("La demande n'a pas pu être envoyée. Réessayez dans un instant.", 'تعذّر إرسال الطلب. أعد المحاولة بعد لحظة.');
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const e: Erreurs = {};
    // The API's own two sentences: a refusal reads the same whichever side caught it.
    if (!valeurs.contact.trim()) e.contact = L('La personne à contacter est obligatoire.', 'جهة الاتصال مطلوبة.');
    if (!valeurs.poste.trim()) e.poste = L('Le type de poste est obligatoire.', 'نوع المنصب مطلوب.');
    const nombre = Number(valeurs.nombre);
    if (valeurs.nombre.trim() && (!Number.isInteger(nombre) || nombre < 1 || nombre > HANDICAP_MAX.nombre)) {
      e.nombre = nombreInvalide;
    }
    if (valeurs.email.trim() && !EMAIL.test(valeurs.email.trim())) e.email = emailInvalide;
    setErreurs(e);
    setRefus(null);
    if (Object.keys(e).length > 0) return;

    join.mutate(handicapBody(valeurs), {
      onSuccess: onSent,
      onError: (error) => {
        const refuses: Erreurs = {};
        for (const [key, message] of Object.entries(toFieldErrors(error))) {
          const champ = CHAMP_OF[key];
          if (champ) refuses[champ] = phraseDe(champ, message);
        }
        if (Object.keys(refuses).length > 0) setErreurs(refuses);
        else setRefus(phrase(toProblem(error)));
      },
    });
  };

  /** Ties an input to its label and to the line printed under it. */
  const lie = (champ: Champ, hint = false) => ({
    id: idOf(champ),
    'aria-invalid': !!erreurs[champ],
    'aria-describedby': erreurs[champ] || hint ? noteIdOf(champ) : undefined,
  });

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 px-4">
        <Field champ="contact" label={L('Contact', 'جهة الاتصال')} error={erreurs.contact}>
          <Input
            {...lie('contact')}
            required
            autoComplete="name"
            maxLength={HANDICAP_MAX.contact}
            value={valeurs.contact}
            onChange={(e) => set({ contact: e.target.value })}
          />
        </Field>

        <Field champ="poste" label={L('Poste', 'المنصب')} error={erreurs.poste}>
          <Input
            {...lie('poste')}
            required
            maxLength={HANDICAP_MAX.poste}
            value={valeurs.poste}
            onChange={(e) => set({ poste: e.target.value })}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field champ="zone" label={L('Zone (optionnelle)', 'المنطقة (اختيارية)')} error={erreurs.zone}>
            <Input
              {...lie('zone')}
              maxLength={HANDICAP_MAX.zone}
              placeholder="Alger"
              value={valeurs.zone}
              onChange={(e) => set({ zone: e.target.value })}
            />
          </Field>

          <Field champ="nombre" label={L('Nombre (optionnel)', 'العدد (اختياري)')} error={erreurs.nombre}>
            <Input
              {...lie('nombre')}
              type="number"
              inputMode="numeric"
              min={1}
              max={HANDICAP_MAX.nombre}
              value={valeurs.nombre}
              onChange={(e) => set({ nombre: e.target.value })}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            champ="telephone"
            label={L('Téléphone (optionnel)', 'الهاتف (اختياري)')}
            hint={L('Sans numéro, de9de9 appelle celui de votre entreprise.', 'بدون رقم، يتصل de9de9 برقم مؤسستك.')}
            error={erreurs.telephone}
          >
            <Input
              {...lie('telephone', true)}
              type="tel"
              dir="ltr"
              autoComplete="tel"
              maxLength={HANDICAP_MAX.telephone}
              value={valeurs.telephone}
              onChange={(e) => set({ telephone: e.target.value })}
            />
          </Field>

          <Field champ="email" label={L('Email (optionnel)', 'البريد الإلكتروني (اختياري)')} error={erreurs.email}>
            <Input
              {...lie('email')}
              type="email"
              dir="ltr"
              autoComplete="email"
              maxLength={HANDICAP_MAX.email}
              value={valeurs.email}
              onChange={(e) => set({ email: e.target.value })}
            />
          </Field>
        </div>

        <Field champ="commentaire" label={L('Commentaire (optionnel)', 'تعليق (اختياري)')} error={erreurs.commentaire}>
          <Textarea
            {...lie('commentaire')}
            maxLength={HANDICAP_MAX.commentaire}
            rows={3}
            value={valeurs.commentaire}
            onChange={(e) => set({ commentaire: e.target.value })}
          />
        </Field>
      </div>

      <div className="flex flex-col gap-2 p-4">
        {refus && (
          <p role="alert" className="text-[12.5px] font-semibold text-de9-red">
            {refus}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={join.isPending}>
          {join.isPending && <Loader2 className="size-4 animate-spin" />}
          {L('Envoyer la demande', 'إرسال الطلب')}
        </Button>
      </div>
    </form>
  );
}

function Field({
  champ,
  label,
  hint,
  error,
  children,
}: {
  champ: Champ;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  const note = error ?? hint;
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={idOf(champ)} className="text-[12.5px] text-de9-gray">
        {label}
      </Label>
      {children}
      {note && (
        <span id={noteIdOf(champ)} className={cn('text-[11.5px]', error ? 'text-de9-red' : 'text-de9-gray')}>
          {note}
        </span>
      )}
    </div>
  );
}
