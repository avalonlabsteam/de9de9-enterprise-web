import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useL } from '@/lib/i18n';
import type { SignupErrorKey } from '../schemas/onboarding';

interface SignupFieldProps extends React.ComponentProps<typeof Input> {
  id: string;
  label: string;
  /** Message under the input — a zod key, or the `detail` of a 400 problem. */
  error?: string;
  /** A node, so an example number can sit in a `<bdi dir="ltr">`. */
  hint?: React.ReactNode;
}

// The example number is wrapped in LTR isolates (U+2066…U+2069): in an RTL line
// its digit groups would otherwise print in reverse order.
const EXAMPLE_PHONE = '⁦05 60 00 00 00⁩';

/** French / Arabic text of each sign-up error key. */
const ERRORS: Record<SignupErrorKey, readonly [fr: string, ar: string]> = {
  'lastName.required': ['Le nom est obligatoire.', 'اللقب إجباري.'],
  'firstName.required': ['Le prénom est obligatoire.', 'الاسم إجباري.'],
  'companyName.required': ["Le nom de l'entreprise est obligatoire.", 'اسم الشركة إجباري.'],
  'rc.required': ['Le registre de commerce est obligatoire.', 'السجل التجاري إجباري.'],
  'rc.digits': ['Le registre de commerce doit contenir des chiffres.', 'يجب أن يحتوي السجل التجاري على أرقام.'],
  'email.required': ["L'adresse e-mail est obligatoire.", 'البريد الإلكتروني إجباري.'],
  'email.invalid': ['Adresse e-mail invalide.', 'بريد إلكتروني غير صالح.'],
  'password.rules': [
    '8 caractères minimum, dont 1 chiffre, 1 minuscule et 1 majuscule.',
    '8 أحرف على الأقل، منها رقم وحرف صغير وحرف كبير.',
  ],
  'telephone.invalid': [
    `Numéro algérien invalide (ex. ${EXAMPLE_PHONE}).`,
    `رقم جزائري غير صالح (مثال ${EXAMPLE_PHONE}).`,
  ],
  'telephone.mobile': [
    'Entrez un mobile algérien (05, 06 ou 07).',
    'أدخل رقم هاتف نقال جزائري (05، 06 أو 07).',
  ],
  'companyPhone.invalid': ['Numéro algérien invalide.', 'رقم جزائري غير صالح.'],
  'proCount.integer': ['Indiquez un nombre entier de pros.', 'أدخل عددًا صحيحًا من المهنيين.'],
  'proCount.range': ['Entre 1 et 10 000 pros.', 'بين 1 و 10 000 مهني.'],
  'max.64': ['Maximum 64 caractères.', '64 حرفًا كحد أقصى.'],
  'max.100': ['Maximum 100 caractères.', '100 حرف كحد أقصى.'],
  'max.200': ['Maximum 200 caractères.', '200 حرف كحد أقصى.'],
  'max.256': ['Maximum 256 caractères.', '256 حرفًا كحد أقصى.'],
};

// Only an exact own key of ERRORS is translated; anything else — the API's
// French `detail` set through setError — is shown as the server wrote it.
function isErrorKey(message: string): message is SignupErrorKey {
  return Object.hasOwn(ERRORS, message);
}

/** Labelled input for the sign-up screens, with the field's error underneath. */
export function SignupField({ id, label, error, hint, ...props }: SignupFieldProps) {
  const L = useL();
  const message = error && isErrorKey(error) ? L(...ERRORS[error]) : error;
  const describedBy = message ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} aria-invalid={!!message} aria-describedby={describedBy} {...props} />
      {message ? (
        <p id={`${id}-error`} className="text-[12px] font-medium text-destructive">
          {message}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[12px] text-de9-gray">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
