import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Menu,
  Moon,
  Sun,
  SunMoon,
  HelpCircle,
  Home,
  ClipboardList,
  Calendar,
  Wallet,
  FileText,
  Users,
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
import { useT, type TKey } from '@/lib/i18n';
import { dirOf, langActions, useLangStore } from '@/stores/langStore';
import { resolveTheme, themeActions, useThemeStore, type ThemeMode } from '@/stores/themeStore';
import { uiActions } from '@/stores/uiStore';
import { useAuthStore, type Role } from '@/stores/authStore';

interface NavItem {
  to: string;
  labelKey: TKey;
  icon: LucideIcon;
  end?: boolean;
}

const CLIENT_NAV: NavItem[] = [
  { to: '/client', labelKey: 'navHome', icon: Home, end: true },
  { to: '/client/tenders', labelKey: 'navSuivi', icon: ClipboardList },
  { to: '/client/calendrier', labelKey: 'navCalendrier', icon: Calendar },
  { to: '/client/wallet', labelKey: 'navWallet', icon: Wallet },
  { to: '/client/factures', labelKey: 'navFactures', icon: FileText },
];

const PRESTATAIRE_NAV: NavItem[] = [
  { to: '/prestataire', labelKey: 'pNavHome', icon: Home, end: true },
  { to: '/prestataire/b2c', labelKey: 'pNavB2c', icon: Users },
  { to: '/prestataire/b2b', labelKey: 'pNavB2b', icon: Building2 },
  { to: '/prestataire/calendar', labelKey: 'pNavCal', icon: Calendar },
  { to: '/prestataire/profile', labelKey: 'pNavProfil', icon: UserCog },
];

const THEME_ICONS: Record<ThemeMode, LucideIcon> = { light: Sun, dark: Moon, system: SunMoon };

const navFor = (role: Role | undefined): NavItem[] =>
  role === 'prestataire' ? PRESTATAIRE_NAV : CLIENT_NAV;

function NavList({ role, onNavigate }: { role: Role | undefined; onNavigate?: () => void }) {
  const t = useT();
  return (
    <nav className="flex flex-col gap-1">
      {navFor(role).map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex cursor-pointer items-center gap-3 whitespace-nowrap rounded-[11px] px-3.5 py-[11px] text-[13.5px] font-bold',
                isActive
                  ? 'bg-[#E9F6F5] text-de9-teal-dark dark:bg-[#14322E]'
                  : 'bg-transparent text-de9-gray hover:text-de9-slate',
              )
            }
          >
            <Icon className="size-[18px]" />
            {t(item.labelKey)}
          </NavLink>
        );
      })}
    </nav>
  );
}

const iconButtonCls =
  'flex h-[38px] w-11 flex-none cursor-pointer items-center justify-center rounded-[11px] border-[1.5px] border-de9-line text-[13px] font-extrabold text-de9-slate hover:bg-de9-row';

export function AppLayout() {
  const lang = useLangStore((s) => s.lang);
  const mode = useThemeStore((s) => s.mode);
  const role = useAuthStore((s) => s.user?.role);
  const dir = dirOf(lang);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [dir, lang]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () =>
      document.documentElement.classList.toggle('dark', resolveTheme(mode, media.matches) === 'dark');
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [mode]);

  const ThemeIcon = THEME_ICONS[mode];

  return (
    <div className="flex min-h-screen items-stretch">
      {/* ===== Sidebar (desktop) ===== */}
      <aside className="sticky top-0 hidden h-screen w-[236px] flex-none flex-col gap-6 self-start border-e border-de9-line bg-card px-4 py-[22px] shadow-[0_4px_20px_rgba(38,50,69,.04)] lg:flex">
        <div className="flex items-center justify-between px-2">
          <Logo />
        </div>
        <div className="px-2">
          <RoleBadge />
        </div>
        <NavList role={role} />
      </aside>

      {/* ===== Main column ===== */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-de9-line bg-card shadow-[0_4px_20px_rgba(38,50,69,.04)]">
          <div className="flex h-[66px] items-center gap-2.5 px-4 sm:gap-4 sm:px-[26px]">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <button type="button" className={cn(iconButtonCls, 'lg:hidden')} aria-label="Menu">
                  <Menu className="size-[18px]" />
                </button>
              </SheetTrigger>
              <SheetContent
                side={dir === 'rtl' ? 'right' : 'left'}
                className="w-[260px] gap-0 bg-card p-4 pt-6"
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
            <div className="lg:hidden">
              <Logo />
            </div>

            <div className="flex-1" />

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
              onClick={themeActions.cycle}
              className={iconButtonCls}
              aria-label={`Theme: ${mode}`}
              title={`Theme: ${mode}`}
            >
              <ThemeIcon className="size-[18px]" />
            </button>
            <button
              type="button"
              onClick={langActions.toggle}
              className={iconButtonCls}
              aria-label="Toggle language"
            >
              {lang === 'fr' ? 'ع' : 'FR'}
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1320px] px-4 pb-[60px] pt-6 sm:px-[26px]">
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
