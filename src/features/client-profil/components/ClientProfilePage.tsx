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
import { authActions } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useKyc } from '../api/useKyc';

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
  const { data: kycValidated } = useKyc('client');

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
      trailing: kycValidated ? (
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
        <CardContent className="flex items-center gap-4">
          <div className="flex size-14 flex-none items-center justify-center rounded-2xl bg-[#E9F6F5] text-de9-teal-dark dark:bg-[#14322E]">
            <Building2 className="size-7" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[17px] font-black text-de9-ink">Hôtel El Aurassi</p>
            <p className="text-[13px] text-de9-gray">{L('Cliente Entreprise · Alger', 'عميلة شركة · الجزائر')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Support banner */}
      <button
        type="button"
        onClick={() => uiActions.openSupport()}
        className="flex items-center gap-4 rounded-2xl bg-de9-teal-dark px-5 py-4 text-start text-white transition-opacity hover:opacity-95"
      >
        <div className="flex size-11 flex-none items-center justify-center rounded-full bg-white/15">
          <Phone className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold">{L('Support & contact', 'الدعم والتواصل')}</p>
          <p className="text-[13px] text-white/80">0560 00 00 00 · 7j/7</p>
        </div>
        <ChevronRight className="size-5 flex-none text-white/80 rtl:rotate-180" />
      </button>

      {/* Rows */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {rows.map((row) => {
              const Icon = row.icon;
              return (
                <button
                  key={row.key}
                  type="button"
                  onClick={row.onClick}
                  className="flex w-full items-center gap-3.5 px-4 py-3.5 text-start transition-colors hover:bg-de9-row"
                >
                  <div className="flex size-9 flex-none items-center justify-center rounded-full bg-secondary text-de9-slate">
                    <Icon className="size-[18px]" />
                  </div>
                  <span className="flex-1 text-[14px] font-bold text-de9-ink">
                    {L(row.labelFr, row.labelAr)}
                  </span>
                  {row.trailing}
                  <ChevronRight className="size-[18px] flex-none text-de9-gray rtl:rotate-180" />
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Button
        variant="outline"
        className="w-full border-de9-red/30 text-de9-red hover:bg-de9-red/10 hover:text-de9-red"
        onClick={() => {
          authActions.logout();
          navigate('/login');
        }}
      >
        <LogOut className="size-4" />
        {L('Se déconnecter', 'تسجيل الخروج')}
      </Button>
    </div>
  );
}
