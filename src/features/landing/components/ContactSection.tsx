import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Phone, Mail, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useL } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useSendContact } from '../api/contact';
import { contactSchema, type ContactValues } from '../schemas/contact';
import { CONTACT_DETAILS } from '../contactDetails';

const LOGO_WHITE_IMG = '/logo-white.png';

/** Filled, borderless field styling from the design. */
const fieldCls =
  'h-14 rounded-[10px] border-transparent bg-background px-5 text-[15px] shadow-none placeholder:text-de9-slate dark:bg-input/40';

/** "Nous contacter" — coordinates panel beside a message form. */
export function ContactSection() {
  const L = useL();
  const send = useSendContact();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { nom: '', phone: '', email: '', objet: '', message: '' },
  });

  const onSubmit = (values: ContactValues) => {
    send.mutate(values, {
      onSuccess: () => {
        toast.success(L('Message envoyé. Nous vous répondrons vite.', 'تم إرسال الرسالة. سنرد عليك قريبًا.'));
        reset();
      },
      onError: () => {
        toast.error(L("L'envoi a échoué. Réessayez.", 'فشل الإرسال. حاول مجددًا.'));
      },
    });
  };

  return (
    <section id="contact" className="bg-background px-6 pb-24 pt-20 sm:px-10 xl:px-[80px]">
      <h2 className="text-center text-3xl font-bold text-de9-teal ltr:tracking-tight sm:text-[40px]">
        {L('Nous contacter', 'اتصل بنا')}
      </h2>

      <div className="mx-auto mt-12 flex max-w-[1000px] flex-col gap-5 lg:grid lg:grid-cols-[380px_minmax(0,1fr)] lg:gap-0 lg:overflow-hidden lg:rounded-[20px] lg:shadow-float">
        {/* coordinates — below the form on mobile, beside it from lg */}
        <div className="relative order-2 overflow-hidden rounded-[20px] bg-de9-teal px-8 pb-40 pt-9 [--ring:var(--primary-foreground)] lg:order-1 lg:rounded-none">
          <img src={LOGO_WHITE_IMG} alt="De9 De9 Entreprise" className="mx-auto h-[58px] w-auto" />
          <h3 className="mt-7 text-center text-[19px] font-bold text-white">
            {L('Nos coordonnées', 'إحداثياتنا')}
          </h3>
          <ul className="relative z-10 mt-12 flex flex-col gap-7 text-[15px] text-white">
            <li className="flex items-center gap-4">
              <Phone className="size-5 flex-none" />
              <a href={`tel:${CONTACT_DETAILS.phone.replace(/\s/g, '')}`} className="hover:underline">
                {CONTACT_DETAILS.phone}
              </a>
            </li>
            <li className="flex items-center gap-4">
              <Mail className="size-5 flex-none" />
              <a href={`mailto:${CONTACT_DETAILS.email}`} className="hover:underline">
                {CONTACT_DETAILS.email}
              </a>
            </li>
            <li className="flex items-center gap-4">
              <MapPin className="size-5 flex-none" />
              {CONTACT_DETAILS.address}
            </li>
          </ul>
          <MountainArt />
        </div>

        {/* message form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="order-1 rounded-[20px] bg-card p-7 shadow-float lg:order-2 lg:rounded-none lg:p-9 lg:shadow-none"
        >
          <Input
            {...register('nom')}
            placeholder={L('Nom et prénom', 'الاسم واللقب')}
            aria-invalid={Boolean(errors.nom)}
            aria-label={L('Nom et prénom', 'الاسم واللقب')}
            className={fieldCls}
          />
          <Input
            {...register('phone')}
            type="tel"
            placeholder={L('Numéro de téléphone', 'رقم الهاتف')}
            aria-invalid={Boolean(errors.phone)}
            aria-label={L('Numéro de téléphone', 'رقم الهاتف')}
            className={cn(fieldCls, 'mt-4')}
          />
          <Input
            {...register('email')}
            type="email"
            placeholder={L('Adresse e-mail', 'البريد الإلكتروني')}
            aria-invalid={Boolean(errors.email)}
            aria-label={L('Adresse e-mail', 'البريد الإلكتروني')}
            className={cn(fieldCls, 'mt-4')}
          />
          <Input
            {...register('objet')}
            placeholder={L('Objet', 'الموضوع')}
            aria-invalid={Boolean(errors.objet)}
            aria-label={L('Objet', 'الموضوع')}
            className={cn(fieldCls, 'mt-4')}
          />
          <Textarea
            {...register('message')}
            rows={5}
            placeholder={L('Écrivez votre message ici', 'اكتب رسالتك هنا')}
            aria-invalid={Boolean(errors.message)}
            aria-label={L('Message', 'الرسالة')}
            className="mt-4 min-h-[150px] rounded-[10px] border-transparent bg-de9-row px-5 py-4 text-[15px] placeholder:text-de9-teal-dark"
          />

          {Object.keys(errors).length > 0 && (
            <p className="mt-3 text-[13px] font-medium text-destructive">
              {L(
                'Vérifiez les champs : tous sont requis et l’e-mail doit être valide.',
                'تحقّق من الحقول: كلها مطلوبة والبريد يجب أن يكون صحيحًا.',
              )}
            </p>
          )}

          <button
            type="submit"
            disabled={send.isPending}
            className="mt-5 h-14 w-full rounded-[10px] bg-de9-teal text-[15px] font-semibold text-primary-foreground transition-[filter] hover:brightness-95 disabled:opacity-70"
          >
            {send.isPending ? L('Envoi…', 'جارٍ الإرسال…') : L('Envoyer', 'إرسال')}
          </button>
        </form>
      </div>
    </section>
  );
}

/** Decorative peaks anchored to the bottom of the teal panel. */
function MountainArt() {
  return (
    <svg
      viewBox="0 0 380 170"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[170px] w-full"
      aria-hidden
    >
      <defs>
        <linearGradient id="contact-peak" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".42" />
          <stop offset="1" stopColor="#fff" stopOpacity=".06" />
        </linearGradient>
      </defs>
      <path
        fill="url(#contact-peak)"
        d="M232 170c-14-22-28-45-42-66-9-13-25-13-34 0-19 28-40 55-62 66z"
      />
      <path
        fill="url(#contact-peak)"
        d="M40 170c40-4 78-38 106-80 12-18 32-18 44 0 26 40 62 74 100 80z"
      />
    </svg>
  );
}
