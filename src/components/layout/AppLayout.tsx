import { useState } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import {
  Menu,
  Moon,
  Sun,
  HelpCircle,
  Bell,
  Home,
  ClipboardList,
  Calendar,
  Wallet,
  FileText,
  Users,
  UsersRound,
  Megaphone,
  Building2,
  UserCog,
  type LucideIcon,
} from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Logo } from '@/components/common/Logo';
import { RoleBadge } from './RoleBadge';
import { SupportHost, DocViewHost, WorkerViewHost } from './overlayHosts';
import { cn } from '@/lib/utils';
import { useT, useL, type TKey } from '@/lib/i18n';
import { dirOf, langActions, useLangStore } from '@/stores/langStore';
import { themeActions, useThemeStore, type ThemeMode } from '@/stores/themeStore';
import { uiActions } from '@/stores/uiStore';
import { useAuthStore, type Role } from '@/stores/authStore';
import { useKyc } from '@/features/kyc/api/kyc';
import { useDashboard } from '@/features/prestataire-dashboard/api/dashboard';

interface NavItem {
  to: string;
  labelKey: TKey;
  icon: LucideIcon;
  end?: boolean;
}

/** Deg Deg groups the sidebar: main nav, then "Gestion du compte". */
interface NavGroup {
  title?: [fr: string, ar: string];
  items: NavItem[];
}

const ACCOUNT_TITLE: [string, string] = ['Gestion du compte', 'إدارة الحساب'];

const CLIENT_NAV: NavGroup[] = [
  {
    items: [
      { to: '/client', labelKey: 'navHome', icon: Home, end: true },
      { to: '/client/tenders', labelKey: 'navSuivi', icon: ClipboardList },
      { to: '/client/calendrier', labelKey: 'navCalendrier', icon: Calendar },
    ],
  },
  {
    title: ACCOUNT_TITLE,
    items: [
      { to: '/client/wallet', labelKey: 'navWallet', icon: Wallet },
      { to: '/client/factures', labelKey: 'navFactures', icon: FileText },
      { to: '/client/profile', labelKey: 'pNavProfil', icon: UserCog },
    ],
  },
];

const PRESTATAIRE_NAV: NavGroup[] = [
  {
    items: [
      { to: '/prestataire', labelKey: 'pNavHome', icon: Home, end: true },
      { to: '/prestataire/b2c', labelKey: 'pNavB2c', icon: Users },
      { to: '/prestataire/b2b', labelKey: 'pNavB2b', icon: Building2 },
      { to: '/prestataire/calendar', labelKey: 'pNavCal', icon: Calendar },
    ],
  },
  {
    title: ACCOUNT_TITLE,
    items: [
      { to: '/prestataire/effectif', labelKey: 'monEquipe', icon: UsersRound },
      { to: '/prestataire/annonces', labelKey: 'mesAnnonces', icon: Megaphone },
      { to: '/prestataire/profile', labelKey: 'pNavProfil', icon: UserCog },
    ],
  },
];

const THEME_ICONS: Record<ThemeMode, LucideIcon> = { light: Sun, dark: Moon };

const navFor = (role: Role | undefined): NavGroup[] =>
  role === 'prestataire' ? PRESTATAIRE_NAV : CLIENT_NAV;

/** Deg Deg sidebar link: icon in a white 30px tile; active = white card + teal tile. */
function NavList({ role, onNavigate }: { role: Role | undefined; onNavigate?: () => void }) {
  const t = useT();
  const L = useL();
  return (
    <nav className="flex flex-col">
      {navFor(role).map((group, gi) => (
        <div key={gi}>
          {group.title && (
            <p className="mb-1 mt-[26px] ps-4 text-[16px] font-bold text-de9-ink">
              {L(group.title[0], group.title[1])}
            </p>
          )}
          <ul className="flex flex-col gap-1.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'group flex h-[54px] cursor-pointer items-center gap-3 whitespace-nowrap rounded-lg px-4 text-[15px] font-semibold transition-colors',
                        isActive
                          ? 'bg-card text-de9-ink shadow-soft dark:ring-1 dark:ring-border'
                          : 'bg-transparent text-de9-gray hover:text-de9-ink',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={cn(
                            'flex size-[30px] flex-none items-center justify-center rounded-[12px] transition-colors',
                            isActive
                              ? 'bg-de9-teal text-white'
                              : 'bg-card text-de9-teal shadow-soft dark:ring-1 dark:ring-border',
                          )}
                        >
                          <Icon className="size-4" />
                        </span>
                        {t(item.labelKey)}
                      </>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** Circular white shadowed icon button (the reference "bell" pattern). */
const iconButtonCls =
  'flex size-10 flex-none cursor-pointer items-center justify-center rounded-full bg-card text-de9-teal shadow-lift hover:brightness-97 dark:ring-1 dark:ring-border';

/** Company pill from the topbar (white, teal border, round logo, bold name). */
function CompanyPill({ role }: { role: Role | undefined }) {
  const name = useAuthStore((s) => s.user?.name);
  if (!name) return null;
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <Link
      to={role === 'prestataire' ? '/prestataire/profile' : '/client/profile'}
      className="hidden h-10 items-center gap-2.5 rounded-full border border-de9-teal bg-card py-1 pe-3.5 ps-1.5 sm:flex"
    >
      <span className="flex size-[30px] flex-none items-center justify-center rounded-full bg-de9-blue text-[10px] font-bold text-white shadow-soft">
        {initials}
      </span>
      <span className="max-w-[140px] truncate text-[15px] font-bold text-de9-ink">{name}</span>
    </Link>
  );
}

/** Deg Deg "Vérifier mon entreprise" topbar pill — reuses the existing KYC flows. */
function VerifyPillButton({ validated, to }: { validated: boolean; to: string }) {
  const L = useL();
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className={cn(
        'hidden h-10 cursor-pointer items-center justify-center whitespace-nowrap rounded-full border border-de9-teal px-4 text-xs font-semibold transition-[filter] md:flex',
        validated
          ? 'bg-card text-de9-teal'
          : 'bg-de9-teal text-white shadow-glow hover:brightness-95',
      )}
    >
      {validated
        ? L('Entreprise Vérifiée', 'مؤسسة موثّقة')
        : L('Vérifier mon entreprise', 'وثّق مؤسستي')}
    </button>
  );
}

function ClientVerifyPill() {
  const kycQuery = useKyc('client');
  if (kycQuery.isPending || kycQuery.isError) return null;
  return <VerifyPillButton validated={kycQuery.data.validated} to="/client/kyc" />;
}

function PrestataireVerifyPill() {
  const { data } = useDashboard();
  if (!data) return null;
  return <VerifyPillButton validated={data.verified} to="/onboarding/kyc" />;
}

export function AppLayout() {
  const lang = useLangStore((s) => s.lang);
  const mode = useThemeStore((s) => s.mode);
  const role = useAuthStore((s) => s.user?.role);
  const dir = dirOf(lang);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // <html> dir/lang and the .dark class are stamped globally by initDomSync
  // (src/lib/domSync.ts) so public routes get them too — no effects here.

  const ThemeIcon = THEME_ICONS[mode];

  return (
    <div className="min-h-screen">
      {/* ===== Topbar — Deg Deg: full-width white bar, brand at the start ===== */}
      <header className="sticky top-0 z-40 bg-card shadow-soft dark:border-b dark:border-border">
        <div className="flex h-[78px] items-center gap-2.5 px-4 sm:gap-4 sm:px-[26px] lg:ps-10">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <button type="button" className={cn(iconButtonCls, 'lg:hidden')} aria-label="Menu">
                <Menu className="size-[18px]" />
              </button>
            </SheetTrigger>
            <SheetContent
              side={dir === 'rtl' ? 'right' : 'left'}
              className="w-[260px] gap-0 bg-background p-4 pt-6"
            >
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="mb-4 px-2">
                <Logo />
              </div>
              <div className="mb-5 px-2">
                <RoleBadge />
              </div>
              <NavList role={role} onNavigate={() => setMobileNavOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-3">
            <Logo />
            <RoleBadge className="hidden sm:inline-block" />
          </div>

          <div className="flex-1" />

          <CompanyPill role={role} />
          {role === 'client' && <ClientVerifyPill />}
          {role === 'prestataire' && <PrestataireVerifyPill />}
          <button type="button" className={iconButtonCls} aria-label="Notifications">
            <Bell className="size-[18px]" />
          </button>
          <button
            type="button"
            onClick={uiActions.openSupport}
            className={iconButtonCls}
            aria-label="Support"
          >
            <HelpCircle className="size-[18px]" />
          </button>
          <button
            type="button"
            onClick={themeActions.toggle}
            className={iconButtonCls}
            aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} theme`}
            title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} theme`}
          >
            <ThemeIcon className="size-[18px]" />
          </button>
          <button
            type="button"
            onClick={langActions.toggle}
            className={cn(iconButtonCls, 'text-[13px] font-bold')}
            aria-label="Toggle language"
          >
            {lang === 'fr' ? 'ع' : 'FR'}
          </button>
        </div>
      </header>

      {/* ===== Body — sidebar floats on the gray bg below the topbar ===== */}
      <div className="mx-auto flex w-full max-w-[1400px] items-start px-4 sm:px-6 lg:px-10">
        <aside className="sticky top-[78px] hidden max-h-[calc(100vh-78px)] w-[248px] flex-none overflow-y-auto pb-10 pe-7 pt-[42px] lg:block">
          <NavList role={role} />
        </aside>

        <main className="min-w-0 flex-1 pb-[70px] pt-6 lg:ps-7 lg:pt-[42px]">
          <Outlet />
        </main>
      </div>

      {/* Global overlays */}
      <SupportHost />
      <DocViewHost />
      <WorkerViewHost />
      <Toaster position="bottom-center" />
    </div>
  );
}
