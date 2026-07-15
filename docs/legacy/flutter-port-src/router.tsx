import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen'
import { LoginScreen } from '@/features/auth/LoginScreen'
import { SignupScreen } from '@/features/auth/SignupScreen'
import { ForgotPasswordScreen } from '@/features/auth/ForgotPasswordScreen'
import { ClientShell } from '@/features/client/ClientShell'
import { CatalogueScreen } from '@/features/client/CatalogueScreen'
import { FamilyDetailScreen } from '@/features/client/FamilyDetailScreen'
import { MyTendersScreen } from '@/features/client/tenders/MyTendersScreen'
import { TenderDetailScreen } from '@/features/client/tenders/TenderDetailScreen'
import { PublishTenderScreen } from '@/features/client/tenders/PublishTenderScreen'
import { WalletScreen } from '@/features/client/WalletScreen'
import { InvoicesScreen } from '@/features/client/InvoicesScreen'
import { ClientProfileScreen } from '@/features/client/ClientProfileScreen'
import { KycScreen } from '@/features/client/KycScreen'
import { PrestataireShell } from '@/features/prestataire/PrestataireShell'
import { AccueilScreen } from '@/features/prestataire/AccueilScreen'
import { B2cScreen } from '@/features/prestataire/b2c/B2cScreen'
import { B2bScreen } from '@/features/prestataire/B2bScreen'
import { CalendarScreen } from '@/features/prestataire/CalendarScreen'
import { EffectifScreen } from '@/features/prestataire/EffectifScreen'
import { StatsScreen } from '@/features/prestataire/StatsScreen'
import { CreateAnnonceScreen } from '@/features/prestataire/CreateAnnonceScreen'
import { PrestataireProfileScreen } from '@/features/prestataire/PrestataireProfileScreen'

/** Gate that bounces unauthenticated users back to login. */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

const routes: RouteObject[] = [
  { path: '/', element: <OnboardingScreen /> },
  { path: '/login', element: <LoginScreen /> },
  { path: '/signup', element: <SignupScreen /> },
  { path: '/forgot-password', element: <ForgotPasswordScreen /> },
  {
    path: '/app',
    element: (
      <RequireAuth>
        <ClientShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/app/catalogue" replace /> },
      { path: 'catalogue', element: <CatalogueScreen /> },
      { path: 'catalogue/:id', element: <FamilyDetailScreen /> },
      { path: 'tenders', element: <MyTendersScreen /> },
      { path: 'tenders/new', element: <PublishTenderScreen /> },
      { path: 'tenders/:id', element: <TenderDetailScreen /> },
      { path: 'wallet', element: <WalletScreen /> },
      { path: 'invoices', element: <InvoicesScreen /> },
      { path: 'profile', element: <ClientProfileScreen /> },
      { path: 'profile/kyc', element: <KycScreen /> },
    ],
  },
  {
    path: '/app/prestataire',
    element: (
      <RequireAuth>
        <PrestataireShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <AccueilScreen /> },
      { path: 'b2c', element: <B2cScreen /> },
      { path: 'b2b', element: <B2bScreen /> },
      { path: 'calendrier', element: <CalendarScreen /> },
      { path: 'profil', element: <PrestataireProfileScreen /> },
      { path: 'effectif', element: <EffectifScreen /> },
      { path: 'stats', element: <StatsScreen /> },
      { path: 'annonce/new', element: <CreateAnnonceScreen /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]

export const router = createBrowserRouter(routes)
