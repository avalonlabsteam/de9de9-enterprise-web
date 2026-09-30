import { createBrowserRouter, Navigate, Outlet, type RouteObject } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ApiPathAlias, RedirectWithParams, RequireAuth, RequireRole } from './guards';

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
  { path: '/', lazy: page(() => import('@/features/landing/components/LandingPage'), 'LandingPage') },
  { path: '/contact', lazy: page(() => import('@/features/landing/components/ContactPage'), 'ContactPage') },

  // ===== onboarding: runs on the session the sign-up opened =====
  // Without one every call fails, so a lost session goes back to /login.
  {
    element: (
      <RequireAuth>
        <Outlet />
      </RequireAuth>
    ),
    children: [
      { path: '/onboarding/telephone', lazy: page(() => import('@/features/onboarding/components/PhonePage'), 'PhonePage') },
      { path: '/onboarding/kyc', lazy: page(() => import('@/features/kyc/components/ProKycPage'), 'ProKycPage') },
      { path: '/onboarding/kyc/success', lazy: page(() => import('@/features/kyc/components/ProKycSuccessPage'), 'ProKycSuccessPage') },
    ],
  },

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
      // « Suivi d'une demande » — the demande, and the commande it became once contracted.
      { path: 'tender/:id', lazy: page(() => import('@/features/client-tenders/components/SuiviDemandePage'), 'SuiviDemandePage') },
      { path: 'calendrier', lazy: page(() => import('@/features/client-calendrier/components/ClientCalendrierPage'), 'ClientCalendrierPage') },
      { path: 'wallet', lazy: page(() => import('@/features/client-wallet/components/WalletPage'), 'WalletPage') },
      { path: 'wallet/mouvements/:id', lazy: page(() => import('@/features/client-wallet/components/MouvementDetailPage'), 'MouvementDetailPage') },
      { path: 'factures', lazy: page(() => import('@/features/client-factures/components/FacturesPage'), 'FacturesPage') },
      { path: 'profile', lazy: page(() => import('@/features/client-profil/components/ClientProfilePage'), 'ClientProfilePage') },
      // The API's names for these screens (alerts, guides) — see features/alertes/lib/chemin.ts.
      ...['demandes', 'demandes/:id', 'factures/:id', 'portefeuille/*', 'profil', 'sous-traitance/*'].map((path) => ({
        path,
        element: <ApiPathAlias />,
      })),
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
      // « B2B · Entreprises » and « Détail de la mission » (guide 12); `b2b` is the old address.
      { path: 'missions', lazy: page(() => import('@/features/prestataire-missions/components/MissionsPage'), 'MissionsPage') },
      { path: 'missions/:id', lazy: page(() => import('@/features/prestataire-missions/components/MissionDetailPage'), 'MissionDetailPage') },
      { path: 'b2b/*', element: <Navigate to="/prestataire/missions" replace /> },
      // « Demandes de devis » (guide 13).
      { path: 'demandes-devis', lazy: page(() => import('@/features/prestataire-devis/components/DemandesDevisPage'), 'DemandesDevisPage') },
      { path: 'demandes-devis/:id', lazy: page(() => import('@/features/prestataire-devis/components/DemandeDevisPage'), 'DemandeDevisPage') },
      { path: 'calendar', lazy: page(() => import('@/features/prestataire-calendar/components/CalendarPage'), 'CalendarPage') },
      { path: 'annonces', lazy: page(() => import('@/features/prestataire-annonces/components/AnnoncesPage'), 'AnnoncesPage') },
      { path: 'annonce/create', lazy: page(() => import('@/features/prestataire-annonces/components/CreateAnnoncePage'), 'CreateAnnoncePage') },
      { path: 'annonce/assign', lazy: page(() => import('@/features/prestataire-annonces/components/AssignAnnoncePage'), 'AssignAnnoncePage') },
      { path: 'effectif', lazy: page(() => import('@/features/prestataire-equipe/components/EffectifPage'), 'EffectifPage') },
      { path: 'effectif/:id', lazy: page(() => import('@/features/prestataire-equipe/components/ProDetailPage'), 'ProDetailPage') },
      // The member's profile is « Gestion du professionnel »; « Agrandir » has no prestataire-side route (guide 15).
      { path: 'worker/:id', element: <RedirectWithParams to="/prestataire/effectif/:id" /> },
      { path: 'agrandir', element: <Navigate to="/prestataire/effectif" replace /> },
      { path: 'stats', lazy: page(() => import('@/features/prestataire-dashboard/components/StatsPage'), 'StatsPage') },
      { path: 'profile', lazy: page(() => import('@/features/prestataire-profil/components/PrestataireProfilePage'), 'PrestataireProfilePage') },
    ],
  },

  // The API's alerts and guides name the pro screens `/pro/…` (`/pro/missions/{id}?occurrence=…`),
  // and « Vérifier mon entreprise » `/kyc` on both sides.
  { path: '/pro/*', element: <ApiPathAlias /> },
  { path: '/kyc', element: <ApiPathAlias /> },

  { path: '*', element: <Navigate to="/" replace /> },
]);
