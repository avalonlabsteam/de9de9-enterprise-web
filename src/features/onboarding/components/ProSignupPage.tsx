import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useT, useL } from '@/lib/i18n';
import { SignupField } from './SignupField';
import { proRegisterSchema, type ProRegisterValues } from '../schemas/onboarding';
import { useRegisterSubmit } from '../lib/useRegisterSubmit';
import type { RegisterField } from '../lib/registerFlow';

export function ProSignupPage() {
  const t = useT();
  const L = useL();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ProRegisterValues>({
    resolver: zodResolver(proRegisterSchema),
    defaultValues: {
      lastName: '',
      firstName: '',
      companyName: '',
      rc: '',
      email: '',
      password: '',
      proCount: '',
    },
  });

  const { submit, isPending } = useRegisterSubmit({
    onFieldError: (field: RegisterField, message) => {
      if (field === 'telephone') return false; // collected in onboarding, not here
      setError(field, { message });
      return true;
    },
  });

  const onSubmit = (values: ProRegisterValues) => {
    // proCount is what opens this first session on the prestataire side; the
    // company still holds both roles.
    submit({
      lastName: values.lastName.trim(),
      firstName: values.firstName.trim(),
      companyName: values.companyName.trim(),
      rc: values.rc.trim(),
      email: values.email.trim(),
      password: values.password,
      proCount: Number(values.proCount),
    });
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md animate-slide-up">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <Card className="shadow-modal">
          <CardContent className="p-6 sm:p-7">
            <h1 className="text-xl font-extrabold text-de9-ink">{t('proSignupTitle')}</h1>
            <p className="mt-1.5 rounded-lg bg-accent px-3 py-2 text-[12.5px] text-de9-teal-dark">
              {L(
                'Un compte client est créé automatiquement avec votre compte professionnel.',
                'يتم إنشاء حساب عميل تلقائيًا مع حسابك المهني.',
              )}
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4" noValidate>
              <div className="grid grid-cols-2 gap-3">
                <SignupField
                  id="pro-nom"
                  label={t('fieldNom')}
                  error={errors.lastName?.message}
                  {...register('lastName')}
                />
                <SignupField
                  id="pro-prenom"
                  label={t('fieldPrenom')}
                  error={errors.firstName?.message}
                  {...register('firstName')}
                />
              </div>
              <SignupField
                id="pro-entreprise"
                label={t('fieldEntreprise')}
                error={errors.companyName?.message}
                {...register('companyName')}
              />
              <SignupField
                id="pro-rc"
                label={t('fieldRc')}
                placeholder="16/00-1234567 B 24"
                // LTR so the groups keep their order in Arabic, right-aligned there.
                dir="ltr"
                className="rtl:text-right"
                error={errors.rc?.message}
                {...register('rc')}
              />
              <SignupField
                id="pro-email"
                type="email"
                label={t('email')}
                error={errors.email?.message}
                {...register('email')}
              />
              <SignupField
                id="pro-password"
                type="password"
                label={t('fieldPassword')}
                hint={L(
                  '8 caractères minimum, dont 1 chiffre, 1 minuscule et 1 majuscule.',
                  '8 أحرف على الأقل، منها رقم وحرف صغير وحرف كبير.',
                )}
                error={errors.password?.message}
                {...register('password')}
              />
              <SignupField
                id="pro-procount"
                type="number"
                inputMode="numeric"
                min={1}
                max={10000}
                step={1}
                label={L('Nombre de pros', 'عدد المهنيين')}
                hint={L('De 1 à 10 000 · modifiable plus tard', 'من 1 إلى 10 000 · يمكن تعديله لاحقًا')}
                error={errors.proCount?.message}
                {...register('proCount')}
              />

              <Button type="submit" size="lg" className="h-11 w-full text-[15px]" disabled={isPending}>
                {isPending ? L('Chargement…', 'جارٍ…') : t('createEnterprise')}
              </Button>
            </form>

            <p className="mt-4 text-center text-[12px] text-de9-gray">
              {L(
                "En continuant vous acceptez les conditions d'utilisation",
                'بالمتابعة فإنك توافق على شروط الاستخدام',
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
