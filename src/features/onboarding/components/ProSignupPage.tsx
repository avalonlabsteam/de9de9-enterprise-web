import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProSignup } from '../api/onboarding';
import { proSignupSchema, type ProSignupValues } from '../schemas/onboarding';
import { authActions } from '@/stores/authStore';
import { useT, useL } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const ACCOUNT_OPTIONS = ['3', '4', '5', '6+'] as const;

export function ProSignupPage() {
  const t = useT();
  const L = useL();
  const navigate = useNavigate();
  const signup = useProSignup();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProSignupValues>({
    resolver: zodResolver(proSignupSchema),
    defaultValues: {
      nom: 'Mansouri',
      prenom: 'Nadir',
      entreprise: 'PlombEx',
      rc: '16/00-1234567 B 24',
      email: '',
      password: '',
      desiredAccounts: '3',
    },
  });

  const desired = watch('desiredAccounts');

  const onSubmit = (values: ProSignupValues) => {
    signup.mutate(values, {
      onSuccess: (data) => {
        authActions.login(data.token, data.user);
        navigate('/prestataire');
      },
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-de9-bg px-4 py-10">
      <div className="w-full max-w-md animate-slide-up">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <Card className="border-de9-line shadow-sm">
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
                <TextField id="pro-nom" label={t('fieldNom')} error={!!errors.nom} {...register('nom')} />
                <TextField id="pro-prenom" label={t('fieldPrenom')} error={!!errors.prenom} {...register('prenom')} />
              </div>
              <TextField
                id="pro-entreprise"
                label={t('fieldEntreprise')}
                error={!!errors.entreprise}
                {...register('entreprise')}
              />
              <TextField id="pro-rc" label={t('fieldRc')} error={!!errors.rc} {...register('rc')} />
              <TextField
                id="pro-email"
                type="email"
                label={t('email')}
                error={!!errors.email}
                {...register('email')}
              />
              <TextField
                id="pro-password"
                type="password"
                label={t('fieldPassword')}
                error={!!errors.password}
                {...register('password')}
              />

              <div className="space-y-2">
                <Label>{L('Nombre de comptes professionnels désiré', 'عدد الحسابات المهنية المطلوبة')}</Label>
                <div className="grid grid-cols-4 gap-2">
                  {ACCOUNT_OPTIONS.map((opt) => (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => setValue('desiredAccounts', opt, { shouldValidate: true })}
                      className={cn(
                        'h-10 rounded-lg border text-[14px] font-semibold transition-colors',
                        desired === opt
                          ? 'border-de9-teal bg-accent text-de9-teal-dark'
                          : 'border-de9-line text-de9-slate hover:border-de9-teal',
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <Button type="submit" size="lg" className="h-11 w-full text-[15px]" disabled={signup.isPending}>
                {signup.isPending ? L('Chargement…', 'جارٍ…') : t('createEnterprise')}
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

interface TextFieldProps extends React.ComponentProps<typeof Input> {
  id: string;
  label: string;
  error?: boolean;
}

function TextField({ id, label, error, ...props }: TextFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} aria-invalid={error} {...props} />
    </div>
  );
}
