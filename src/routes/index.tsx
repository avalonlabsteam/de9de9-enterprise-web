import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { RequireRole, RootRedirect } from './guards';

/**
 * Route-level code splitting: each page loads its own chunk on first visit.
 * `page(loader, name)` adapts a dynamic import + named export into react-router's
 * `lazy` shape. AppLayout + guards stay eager (they wrap every shell route).
 */
type PageModule = Record<string, React.ComponentType>;
const page =
  (loader: () => Promise<PageModule>, name: string): RouteObject['lazy'] =>
  async () => ({ Component: (await loader())[name] });

export const router = createBrowserRouter([
  // ===== public / auth =====
  { path: '/login', lazy: page(() => import('@/features/auth/components/LoginPage'), 'LoginPage') },
  { path: '/role', lazy: page(() => import('@/features/onboarding/components/RoleChoosePage'), 'RoleChoosePage') },
  { path: '/signup', lazy: page(() => import('@/features/onboarding/components/ProSignupPage'), 'ProSignupPage') },
  { path: '/signup/client', lazy: page(() => import('@/features/onboarding/components/ClientSignupPage'), 'ClientSignupPage') },
  { path: '/onboarding/kyc', lazy: page(() => import('@/features/kyc/components/ProKycPage'), 'ProKycPage') },
  { path: '/onboarding/kyc/success', lazy: page(() => import('@/features/kyc/components/ProKycSuccessPage'), 'ProKycSuccessPage') },
  { path: '/', element: <RootRedirect /> },

  // ===== client shell =====
  {
    path: '/client',
    element: (
      <RequireRole role="client">
        <AppLayout />
      </RequireRole>
    ),
    children: [
      { index: true, lazy: page(() => import('@/features/client-catalogue/components/CataloguePage'), 'CataloguePage') },
      { path: 'family/:id', lazy: page(() => import('@/features/client-catalogue/components/FamilyDetailPage'), 'FamilyDetailPage') },
      { path: 'kyc', lazy: page(() => import('@/features/kyc/components/ClientKycPage'), 'ClientKycPage') },
      { path: 'kyc/success', lazy: page(() => import('@/features/kyc/components/ClientKycSuccessPage'), 'ClientKycSuccessPage') },
      { path: 'publish/:familyId', lazy: page(() => import('@/features/client-tenders/components/PublishTenderPage'), 'PublishTenderPage') },
      { path: 'publish/:familyId/confirm', lazy: page(() => import('@/features/client-tenders/components/TenderConfirmPage'), 'TenderConfirmPage') },
      { path: 'tenders', lazy: page(() => import('@/features/client-tenders/components/MyTendersPage'), 'MyTendersPage') },
      { path: 'tender/:id', lazy: page(() => import('@/features/client-tenders/components/TenderDetailPage'), 'TenderDetailPage') },
      { path: 'calendrier', lazy: page(() => import('@/features/client-calendrier/components/ClientCalendrierPage'), 'ClientCalendrierPage') },
      { path: 'wallet', lazy: page(() => import('@/features/client-wallet/components/WalletPage'), 'WalletPage') },
      { path: 'factures', lazy: page(() => import('@/features/client-factures/components/FacturesPage'), 'FacturesPage') },
      { path: 'profile', lazy: page(() => import('@/features/client-profil/components/ClientProfilePage'), 'ClientProfilePage') },
    ],
  },

  // ===== prestataire shell =====
  {
    path: '/prestataire',
    element: (
      <RequireRole role="prestataire">
        <AppLayout />
      </RequireRole>
    ),
    children: [
      { index: true, lazy: page(() => import('@/features/prestataire-dashboard/components/DashboardPage'), 'DashboardPage') },
      { path: 'b2c', lazy: page(() => import('@/features/prestataire-b2c/components/B2cPage'), 'B2cPage') },
      { path: 'b2b', lazy: page(() => import('@/features/prestataire-b2b/components/B2bPage'), 'B2bPage') },
      { path: 'b2b/:id', lazy: page(() => import('@/features/prestataire-b2b/components/B2bDetailPage'), 'B2bDetailPage') },
      { path: 'calendar', lazy: page(() => import('@/features/prestataire-calendar/components/CalendarPage'), 'CalendarPage') },
      { path: 'annonces', lazy: page(() => import('@/features/prestataire-annonces/components/AnnoncesPage'), 'AnnoncesPage') },
      { path: 'annonce/create', lazy: page(() => import('@/features/prestataire-annonces/components/CreateAnnoncePage'), 'CreateAnnoncePage') },
      { path: 'annonce/assign', lazy: page(() => import('@/features/prestataire-annonces/components/AssignAnnoncePage'), 'AssignAnnoncePage') },
      { path: 'effectif', lazy: page(() => import('@/features/prestataire-equipe/components/EffectifPage'), 'EffectifPage') },
      { path: 'effectif/:id', lazy: page(() => import('@/features/prestataire-equipe/components/ProDetailPage'), 'ProDetailPage') },
      { path: 'worker/:id', lazy: page(() => import('@/features/prestataire-equipe/components/WorkerProfilePage'), 'WorkerProfilePage') },
      { path: 'agrandir', lazy: page(() => import('@/features/prestataire-equipe/components/AgrandirPage'), 'AgrandirPage') },
      { path: 'stats', lazy: page(() => import('@/features/prestataire-dashboard/components/StatsPage'), 'StatsPage') },
      { path: 'profile', lazy: page(() => import('@/features/prestataire-profil/components/PrestataireProfilePage'), 'PrestataireProfilePage') },
    ],
  },

  { path: '*', element: <Navigate to="/" replace /> },
]);
