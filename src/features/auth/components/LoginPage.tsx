import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { authActions } from '@/stores/authStore';
import { useT, useL } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { loginSchema, type LoginValues } from '../schemas/auth';

export function LoginPage() {
  const t = useT();
  const L = useL();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'contact@plombex.dz', password: '123456789', remember: true },
  });

  const onSubmit = () => {
    authActions.setMode('login');
    navigate('/role');
  };

  const goSignup = () => {
    authActions.setMode('signup');
    navigate('/role');
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-de9-bg px-4 py-10">
      <div className="w-full max-w-md animate-slide-up">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <Card className="border-de9-line shadow-sm">
          <CardContent className="p-6 sm:p-7">
            <h1 className="mb-6 text-center text-xl font-extrabold text-de9-ink">{t('loginTitle')}</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="login-email">{t('email')}</Label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  {...register('email')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="login-password">{t('password')}</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    aria-invalid={!!errors.password}
                    className="pe-10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? L('Masquer', 'إخفاء') : L('Afficher', 'إظهار')}
                    className="absolute inset-y-0 end-0 flex w-10 items-center justify-center text-de9-gray hover:text-de9-ink"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[13px]">
                <label className="flex cursor-pointer items-center gap-2 text-de9-slate">
                  <Checkbox
                    defaultChecked
                    onCheckedChange={(v) => setValue('remember', v === true)}
                  />
                  <span>{t('rester')}</span>
                </label>
                <button type="button" className="font-medium text-de9-teal-dark hover:underline">
                  {t('forgot')}
                </button>
              </div>

              <Button type="submit" size="lg" className="h-11 w-full text-[15px]">
                {t('loginCta')}
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-de9-line" />
              <span className="text-[12px] text-de9-gray">{L('ou', 'أو')}</span>
              <span className="h-px flex-1 bg-de9-line" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <SocialButton label="Google" />
              <SocialButton label="Apple" />
            </div>

            <p className="mt-6 text-center text-[13px] text-de9-slate">
              {t('noAccount')}{' '}
              <button type="button" onClick={goSignup} className="font-semibold text-de9-teal-dark hover:underline">
                {t('createAccount')}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function SocialButton({ label, className }: { label: string; className?: string }) {
  return (
    <Button type="button" variant="outline" size="lg" className={cn('h-11', className)} tabIndex={-1}>
      {label}
    </Button>
  );
}
