import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useClientSignup } from '../api/onboarding';
import { clientSignupSchema, type ClientSignupValues } from '../schemas/onboarding';
import { authActions } from '@/stores/authStore';
import { useT, useL } from '@/lib/i18n';

export function ClientSignupPage() {
  const t = useT();
  const L = useL();
  const navigate = useNavigate();
  const signup = useClientSignup();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientSignupValues>({
    resolver: zodResolver(clientSignupSchema),
    defaultValues: {
      nom: 'Khelifi',
      prenom: 'Amel',
      entreprise: 'Hôtel El Aurassi',
      rc: '',
      phone: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = (values: ClientSignupValues) => {
    signup.mutate(values, {
      onSuccess: (data) => {
        authActions.login(data.token, data.user);
        navigate('/client/kyc');
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
            <h1 className="text-xl font-extrabold text-de9-ink">{t('clientSignupTitle')}</h1>
            <p className="mt-1.5 text-[13px] text-de9-slate">
              {L(
                'Espace acheteur B2B — hôtels, entreprises et grands comptes.',
                'فضاء المشتري B2B — الفنادق والشركات والحسابات الكبرى.',
              )}
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4" noValidate>
              <div className="grid grid-cols-2 gap-3">
                <TextField id="cli-nom" label={t('fieldNom')} error={!!errors.nom} {...register('nom')} />
                <TextField id="cli-prenom" label={t('fieldPrenom')} error={!!errors.prenom} {...register('prenom')} />
              </div>
              <TextField
                id="cli-entreprise"
                label={t('fieldEntreprise')}
                error={!!errors.entreprise}
                {...register('entreprise')}
              />
              <TextField id="cli-rc" label={t('fieldRc')} error={!!errors.rc} {...register('rc')} />
              <TextField
                id="cli-phone"
                type="tel"
                label={t('fieldPhone')}
                error={!!errors.phone}
                {...register('phone')}
              />
              <TextField
                id="cli-email"
                type="email"
                label={t('email')}
                error={!!errors.email}
                {...register('email')}
              />
              <TextField
                id="cli-password"
                type="password"
                label={t('fieldPassword')}
                error={!!errors.password}
                {...register('password')}
              />

              <Button type="submit" size="lg" className="h-11 w-full text-[15px]" disabled={signup.isPending}>
                {signup.isPending ? L('Chargement…', 'جارٍ…') : t('createAccountCta')}
              </Button>
            </form>
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
