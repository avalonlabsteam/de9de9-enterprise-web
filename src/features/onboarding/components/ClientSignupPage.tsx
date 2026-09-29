import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useT, useL } from '@/lib/i18n';
import { SignupField } from './SignupField';
import { clientRegisterSchema, type ClientRegisterValues } from '../schemas/onboarding';
import { normalizePhone } from '../lib/phone';
import { useRegisterSubmit } from '../lib/useRegisterSubmit';
import type { RegisterField } from '../lib/registerFlow';

export function ClientSignupPage() {
  const t = useT();
  const L = useL();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ClientRegisterValues>({
    resolver: zodResolver(clientRegisterSchema),
    defaultValues: {
      lastName: '',
      firstName: '',
      companyName: '',
      rc: '',
      telephone: '',
      email: '',
      password: '',
    },
  });

  const { submit, isPending } = useRegisterSubmit({
    onFieldError: (field: RegisterField, message) => {
      if (field === 'proCount') return false; // not on this screen
      setError(field, { message });
      return true;
    },
  });

  const onSubmit = (values: ClientRegisterValues) => {
    const telephone = values.telephone.trim() ? normalizePhone(values.telephone) : null;
    // No proCount: this session opens on the client side. The company is still
    // created with both roles, so the user can switch later.
    submit({
      lastName: values.lastName.trim(),
      firstName: values.firstName.trim(),
      companyName: values.companyName.trim(),
      rc: values.rc.trim(),
      email: values.email.trim(),
      password: values.password,
      ...(telephone ? { telephone } : {}),
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md animate-slide-up">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <Card className="shadow-modal">
          <CardContent className="p-6 sm:p-7">
            <h1 className="text-xl font-extrabold text-de9-ink">{t('clientSignupTitle')}</h1>
            <p className="mt-1.5 text-[13px] text-de9-slate">
              {L(
                'Espace acheteur B2B — hôtels, entreprises et grands comptes.',
                'فضاء المشتري B2B — الفنادق والشركات والحسابات الكبرى.',
              )}
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4" noValidate>
              <div className="grid grid-cols-2 gap-3">
                <SignupField
                  id="cli-nom"
                  label={t('fieldNom')}
                  error={errors.lastName?.message}
                  {...register('lastName')}
                />
                <SignupField
                  id="cli-prenom"
                  label={t('fieldPrenom')}
                  error={errors.firstName?.message}
                  {...register('firstName')}
                />
              </div>
              <SignupField
                id="cli-entreprise"
                label={t('fieldEntreprise')}
                error={errors.companyName?.message}
                {...register('companyName')}
              />
              <SignupField
                id="cli-rc"
                label={t('fieldRc')}
                placeholder="16/00-1234567 B 24"
                // LTR so the groups keep their order in Arabic, right-aligned there.
                dir="ltr"
                className="rtl:text-right"
                error={errors.rc?.message}
                {...register('rc')}
              />
              <SignupField
                id="cli-phone"
                type="tel"
                label={t('fieldPhone')}
                placeholder="05 60 00 00 00"
                dir="ltr"
                className="rtl:text-right"
                hint={
                  <>
                    {L('Facultatif · ex.', 'اختياري · مثال')} <bdi dir="ltr">05 60 00 00 00</bdi>
                  </>
                }
                error={errors.telephone?.message}
                {...register('telephone')}
              />
              <SignupField
                id="cli-email"
                type="email"
                label={t('email')}
                error={errors.email?.message}
                {...register('email')}
              />
              <SignupField
                id="cli-password"
                type="password"
                label={t('fieldPassword')}
                hint={L(
                  '8 caractères minimum, dont 1 chiffre, 1 minuscule et 1 majuscule.',
                  '8 أحرف على الأقل، منها رقم وحرف صغير وحرف كبير.',
                )}
                error={errors.password?.message}
                {...register('password')}
              />

              <Button type="submit" size="lg" className="h-11 w-full text-[15px]" disabled={isPending}>
                {isPending ? L('Chargement…', 'جارٍ…') : t('createAccountCta')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
