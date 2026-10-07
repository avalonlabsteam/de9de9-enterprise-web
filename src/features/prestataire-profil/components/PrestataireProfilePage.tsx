import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Building2,
  ShieldCheck,
  Users,
  Bell,
  Settings,
  ChevronRight,
  UserPlus,
  HeartHandshake,
  FileCheck2,
  Eye,
  EyeOff,
  Download,
  LogOut,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useT, useL } from '@/lib/i18n';
import { authActions, useAuthStore } from '@/stores/authStore';
import { useActiveEntreprise } from '@/stores/accueilStore';
import { CompanyAvatar } from '@/components/common/CompanyAvatar';
import { RecruterSheet } from './RecruterSheet';
import { HandicapSheet, type HandicapOnglet } from './HandicapSheet';
import { RecruterSentModal } from './RecruterSentModal';
import { HandicapSentModal } from './HandicapSentModal';

export function PrestataireProfilePage() {
  const t = useT();
  const L = useL();
  const navigate = useNavigate();
  const entreprise = useActiveEntreprise();
  const userName = useAuthStore((st) => st.user?.name);
  const companyName = entreprise?.nom ?? userName ?? '';

  const [recruterOpen, setRecruterOpen] = useState(false);
  const [handicapOpen, setHandicapOpen] = useState(false);
  const [handicapOnglet, setHandicapOnglet] = useState<HandicapOnglet>('nouvelle');
  const [recruterSent, setRecruterSent] = useState(false);
  const [handicapSent, setHandicapSent] = useState(false);
  const [contratVisible, setContratVisible] = useState(false);

  // `?handicap=demandes`: an alert about a handicap request lands on « Mes demandes » (see `cheminOf`).
  // The address only opens the sheet: at the first tap in it the page takes over and the address is
  // cleared — left there, the sheet would open again at every return to this page.
  const [params, setParams] = useSearchParams();
  const depuisAlerte = params.get('handicap') === 'demandes';
  const handicapActif: HandicapOnglet = depuisAlerte ? 'suivi' : handicapOnglet;
  const setHandicap = (open: boolean, onglet: HandicapOnglet) => {
    setHandicapOpen(open);
    setHandicapOnglet(onglet);
    if (!depuisAlerte) return;
    const p = new URLSearchParams(params);
    p.delete('handicap');
    setParams(p, { replace: true });
  };

  function logout() {
    authActions.logout();
    navigate('/login');
  }

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-5">
      <h1 className="text-[20px] font-extrabold text-de9-ink">{t('profilTitle')}</h1>

      {/* Company card */}
      <Card>
        <CardContent className="flex items-center gap-4 py-5">
          <CompanyAvatar name={companyName} logoUrl={entreprise?.logoUrl} className="size-12 text-[15px]" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-bold text-de9-ink">{companyName}</p>
            <p className="truncate text-[12.5px] text-de9-gray">
              {L('Espace prestataire', 'مساحة المهني')}
              {entreprise?.nomUtilisateur ? ` · ${entreprise.nomUtilisateur}` : ''}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Settings pill rows */}
      <div className="flex flex-col gap-2.5">
        <Row icon={<Building2 className="size-3.5" />} label={L("Informations de l'entreprise", 'معلومات المؤسسة')} />
        <Row icon={<ShieldCheck className="size-3.5" />} label={L('Vérification KYC', 'التحقق KYC')} />
        <Row icon={<Users className="size-3.5" />} label={L('Mon effectif', 'فريق عملي')} />
        <Row icon={<Bell className="size-3.5" />} label={L('Notifications', 'الإشعارات')} />
        <Row icon={<Settings className="size-3.5" />} label={L('Paramètres', 'الإعدادات')} />
      </div>

      {/* Recruter / Handicap actions */}
      <div className="flex flex-col gap-3">
        <ActionRow
          icon={<UserPlus className="size-5" />}
          title={t('recruter')}
          hint={L("Renfort d'effectif · pros de9de9", 'تعزيز الفريق · محترفو de9de9')}
          onClick={() => setRecruterOpen(true)}
        />
        <ActionRow
          icon={<HeartHandshake className="size-5" />}
          title={t('handicap')}
          hint={L('Rejoignez la liste — de9de9 vous recontacte', 'انضم إلى القائمة — سيتواصل معك de9de9')}
          onClick={() => setHandicapOpen(true)}
        />
      </div>

      {/* Contrat de partenariat */}
      <Card>
        <CardContent className="flex flex-col gap-4 py-5">
          <div className="flex items-center gap-3">
            <span className="flex size-10 flex-none items-center justify-center rounded-[12px] bg-de9-teal-tint text-de9-teal">
              <FileCheck2 className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold text-de9-ink">{t('contrat')}</p>
              <p className="truncate text-[12px] text-de9-gray">contrat-partenariat-plombex-signe.pdf</p>
            </div>
            <span className="flex-none rounded-full bg-de9-teal-soft px-2.5 py-1 text-[11.5px] font-bold text-de9-teal-dark">
              {t('signe')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-background px-3 py-2.5">
              <p className="text-[11.5px] text-de9-gray">{L('Signature', 'التوقيع')}</p>
              <p className="text-[13px] font-bold text-de9-ink">18/02/2026</p>
            </div>
            <div className="rounded-lg bg-background px-3 py-2.5">
              <p className="text-[11.5px] text-de9-gray">{L('Échéance', 'الاستحقاق')}</p>
              <p className="text-[13px] font-bold text-de9-ink">18/02/2027</p>
            </div>
          </div>

          {contratVisible && (
            <div className="rounded-lg bg-background p-4 text-[12.5px] leading-relaxed text-de9-gray">
              {L(
                `Contrat de partenariat entre ${companyName} et de9de9. Aperçu du document simulé — le PDF signé est archivé de manière sécurisée.`,
                `عقد شراكة بين ${companyName} و de9de9. معاينة للمستند المحاكى — ملف PDF الموقّع محفوظ بشكل آمن.`,
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 gap-1.5"
              onClick={() => setContratVisible((v) => !v)}
            >
              {contratVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              {contratVisible ? L('Masquer le contrat', 'إخفاء العقد') : L('Voir le contrat', 'عرض العقد')}
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-1.5"
              onClick={() => toast(L('Téléchargement du contrat simulé', 'تنزيل العقد (محاكاة)'))}
            >
              <Download className="size-4" />
              {L('Télécharger', 'تنزيل')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <button
        type="button"
        onClick={logout}
        className="flex h-11 w-full items-center gap-3.5 rounded-full bg-card px-4 text-start shadow-soft transition-shadow hover:shadow-lift dark:ring-1 dark:ring-border"
      >
        <span className="flex size-[26px] flex-none items-center justify-center rounded-full bg-de9-red-soft text-de9-red">
          <LogOut className="size-3.5 rtl:rotate-180" />
        </span>
        <span className="flex-1 text-[13px] font-medium text-de9-red">{t('logout')}</span>
      </button>

      <RecruterSheet
        open={recruterOpen}
        onOpenChange={setRecruterOpen}
        onSent={() => setRecruterSent(true)}
      />
      <HandicapSheet
        open={handicapOpen || depuisAlerte}
        onOpenChange={(open) => setHandicap(open, handicapActif)}
        onglet={handicapActif}
        onOngletChange={(onglet) => setHandicap(true, onglet)}
        onSent={() => setHandicapSent(true)}
      />
      <RecruterSentModal open={recruterSent} onOpenChange={setRecruterSent} />
      <HandicapSentModal open={handicapSent} onOpenChange={setHandicapSent} />
    </div>
  );
}

function Row({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="flex h-11 w-full items-center gap-3.5 rounded-full bg-card px-4 text-start shadow-soft transition-shadow hover:shadow-lift dark:ring-1 dark:ring-border"
    >
      <span className="flex size-[26px] flex-none items-center justify-center rounded-full bg-de9-teal-tint text-de9-teal">
        {icon}
      </span>
      <span className="flex-1 text-[13px] font-medium text-de9-ink">{label}</span>
      <ChevronRight className="size-4 flex-none text-de9-gray rtl:rotate-180" />
    </button>
  );
}

function ActionRow({
  icon,
  title,
  hint,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3.5 rounded-lg bg-card p-4 text-start shadow-soft transition-shadow hover:shadow-lift dark:ring-1 dark:ring-border"
    >
      <span className="flex size-11 flex-none items-center justify-center rounded-[12px] bg-de9-teal-tint text-de9-teal">
        {icon}
      </span>
      <span className="flex-1">
        <span className="block text-[14px] font-bold text-de9-ink">{title}</span>
        <span className="block text-[12.5px] text-de9-gray">{hint}</span>
      </span>
      <ChevronRight className="size-4 flex-none text-de9-gray rtl:rotate-180" />
    </button>
  );
}
