import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, User } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { Card } from '@/components/ui/card';
import { useLogin } from '@/features/auth/api/auth';
import { authActions, useAuthStore, type Role } from '@/stores/authStore';
import { useT, useL } from '@/lib/i18n';

export function RoleChoosePage() {
  const t = useT();
  const L = useL();
  const navigate = useNavigate();
  const pendingMode = useAuthStore((s) => s.pendingMode);
  const login = useLogin();

  const pick = (role: Role) => {
    authActions.setPendingRole(role);
    login.mutate(role, {
      onSuccess: (data) => {
        authActions.login(data.token, data.user);
        if (pendingMode === 'signup') {
          navigate(role === 'prestataire' ? '/signup' : '/signup/client');
        } else {
          navigate(role === 'prestataire' ? '/prestataire' : '/client');
        }
      },
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-de9-bg px-4 py-10">
      <div className="w-full max-w-md animate-slide-up">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-de9-slate hover:text-de9-ink"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" />
          {L('Retour', 'رجوع')}
        </button>

        <h1 className="mb-5 text-center text-xl font-extrabold text-de9-ink">{t('roleTitle')}</h1>

        <div className="grid gap-4 sm:grid-cols-2">
          <RoleCard
            icon={<User className="size-6" />}
            label={t('roleClient')}
            onClick={() => pick('client')}
            disabled={login.isPending}
          />
          <RoleCard
            icon={<Building2 className="size-6" />}
            label={t('rolePro')}
            onClick={() => pick('prestataire')}
            disabled={login.isPending}
          />
        </div>

        {login.isError && (
          <p className="mt-4 text-center text-[13px] text-de9-red">
            {L('Une erreur est survenue. Réessayez.', 'حدث خطأ. أعد المحاولة.')}
          </p>
        )}
      </div>
    </main>
  );
}

function RoleCard({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Card
      role="button"
      tabIndex={0}
      aria-disabled={disabled}
      onClick={disabled ? undefined : onClick}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className="flex cursor-pointer flex-col items-center gap-3 border-de9-line py-8 text-center transition-colors hover:border-de9-teal hover:bg-de9-row aria-disabled:pointer-events-none aria-disabled:opacity-60"
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-accent text-de9-teal-dark">
        {icon}
      </span>
      <span className="text-[15px] font-semibold text-de9-ink">{label}</span>
    </Card>
  );
}
