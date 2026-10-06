import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  ShieldCheck,
  CreditCard,
  Headset,
  Languages,
  Bell,
  LogOut,
  Phone,
  ChevronRight,
} from 'lucide-react';
import { useL } from '@/lib/i18n';
import { langActions } from '@/stores/langStore';
import { uiActions } from '@/stores/uiStore';
import { authActions, useAuthStore } from '@/stores/authStore';
import { useActiveEntreprise } from '@/stores/accueilStore';
import { CompanyAvatar } from '@/components/common/CompanyAvatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useKycState } from '@/features/kyc/api/kyc';

interface Row {
  key: string;
  icon: LucideIcon;
  labelFr: string;
  labelAr: string;
  onClick: () => void;
  trailing?: React.ReactNode;
}

export function ClientProfilePage() {
  const L = useL();
  const navigate = useNavigate();
  const kyc = useKycState();
  const entreprise = useActiveEntreprise();
  const userName = useAuthStore((st) => st.user?.name);
  const companyName = entreprise?.nom ?? userName ?? '';

  const rows: Row[] = [
    {
      key: 'infos',
      icon: Building2,
      labelFr: "Informations de l'entreprise",
      labelAr: 'معلومات الشركة',
      onClick: () => uiActions.openSupport(),
    },
    {
      key: 'kyc',
      icon: ShieldCheck,
      labelFr: 'Vérification KYC',
      labelAr: 'التحقق من الهوية',
      onClick: () => uiActions.openSupport(),
      trailing: kyc.verified ? (
        <StatusBadge
          label={L('Vérifiée', 'مُتحقّق')}
          kind="done"
          className="gap-1"
        />
      ) : undefined,
    },
    {
      key: 'abo',
      icon: CreditCard,
      labelFr: 'Abonnement & crédits',
      labelAr: 'الاشتراك والرصيد',
      onClick: () => navigate('/client/wallet'),
    },
    {
      key: 'support',
      icon: Headset,
      labelFr: 'Support & contact',
      labelAr: 'الدعم والتواصل',
      onClick: () => uiActions.openSupport(),
    },
    {
      key: 'langue',
      icon: Languages,
      labelFr: 'Langue',
      labelAr: 'اللغة',
      onClick: () => langActions.toggle(),
    },
    {
      key: 'notifs',
      icon: Bell,
      labelFr: 'Notifications',
      labelAr: 'الإشعارات',
      onClick: () => uiActions.openSupport(),
    },
  ];

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-5">
      <h1 className="text-[22px] font-black text-de9-ink">{L('Profil', 'الملف الشخصي')}</h1>

      {/* Company card */}
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
          <CompanyAvatar
            name={companyName}
            logoUrl={entreprise?.logoUrl}
            className="size-16 text-[20px] shadow-lift"
          />
          <div className="min-w-0">
            <p className="truncate text-[17px] font-bold text-de9-ink">{companyName}</p>
            <p className="text-[13px] text-de9-gray">
              {L('Espace client', 'مساحة العميل')}
              {entreprise?.nomUtilisateur ? ` · ${entreprise.nomUtilisateur}` : ''}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Support banner */}
      <button
        type="button"
        onClick={() => uiActions.openSupport()}
        className="flex items-center gap-4 rounded-lg bg-de9-teal px-5 py-4 text-start text-primary-foreground shadow-glow transition-opacity hover:opacity-95"
      >
        <div className="flex size-11 flex-none items-center justify-center rounded-full bg-white/25">
          <Phone className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold">{L('Support & contact', 'الدعم والتواصل')}</p>
          <p className="text-[13px] text-primary-foreground/80">0560 00 00 00 · 7j/7</p>
        </div>
        <ChevronRight className="size-5 flex-none text-primary-foreground/80 rtl:rotate-180" />
      </button>

      {/* Rows */}
      <div className="flex flex-col gap-2.5">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <button
              key={row.key}
              type="button"
              onClick={row.onClick}
              className="flex h-11 w-full items-center gap-3.5 rounded-full bg-card px-4 text-start shadow-soft transition-shadow hover:shadow-lift dark:ring-1 dark:ring-border"
            >
              <div className="flex size-[26px] flex-none items-center justify-center rounded-full bg-de9-teal-tint text-de9-teal">
                <Icon className="size-[15px]" />
              </div>
              <span className="flex-1 truncate text-[13px] font-medium text-de9-ink">
                {L(row.labelFr, row.labelAr)}
              </span>
              {row.trailing}
              <ChevronRight className="size-4 flex-none text-de9-gray rtl:rotate-180" />
            </button>
          );
        })}
      </div>

      <Button
        variant="ghost"
        className="h-11 w-full justify-start gap-3.5 rounded-full bg-card px-4 text-[13px] font-medium text-de9-red shadow-soft transition-shadow hover:bg-card hover:text-de9-red hover:shadow-lift dark:ring-1 dark:ring-border"
        onClick={() => {
          authActions.logout();
          navigate('/login');
        }}
      >
        <span className="flex size-[26px] flex-none items-center justify-center rounded-full bg-de9-red-soft text-de9-red">
          <LogOut className="size-[15px]" />
        </span>
        {L('Se déconnecter', 'تسجيل الخروج')}
      </Button>
    </div>
  );
}
