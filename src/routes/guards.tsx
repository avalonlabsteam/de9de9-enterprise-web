import type { ReactNode } from 'react';
import { generatePath, Navigate, useLocation, useParams } from 'react-router-dom';
import { useAuthStore, type Role } from '@/stores/authStore';
import { appPath } from '@/features/alertes/lib/chemin';

/** The home route for a persona. */
function roleHome(role: Role | undefined): string {
  return role === 'prestataire' ? '/prestataire' : '/client';
}

/** Bounce unauthenticated users to /login. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/** Ensure the logged-in persona matches the shell; otherwise send them to their own home. */
export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const userRole = useAuthStore((s) => s.user?.role);
  if (!token) return <Navigate to="/login" replace />;
  if (userRole !== role) return <Navigate to={roleHome(userRole)} replace />;
  return <>{children}</>;
}

/**
 * A screen by the API's name for it — an alert's `cible.chemin`, a guide's
 * link (`/pro/missions/…?occurrence=…`, `/client/demandes/{id}`, `/kyc`) —
 * sent to where this app files it, query kept.
 */
export function ApiPathAlias() {
  const { pathname, search } = useLocation();
  const role = useAuthStore((s) => s.user?.role);
  return <Navigate to={appPath(pathname + search, role ?? 'client')} replace />;
}

/** An old address kept alive: the same `:params`, under a new path. */
export function RedirectWithParams({ to }: { to: string }) {
  const params = useParams();
  return <Navigate to={generatePath(to, params)} replace />;
}
