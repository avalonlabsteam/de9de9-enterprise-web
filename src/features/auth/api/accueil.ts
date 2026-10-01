import { apiClient } from '@/api/apiClient';
import { accueilActions, useAccueilStore } from '@/stores/accueilStore';
import { useAuthStore } from '@/stores/authStore';
import { sessionEpoch } from '@/stores/sessionEpoch';
import { accueilSchema, clientAccueilSchema, type AccueilEnvelope } from '../schemas/accueil';

/**
 * The two authorities de9de9 holds per company (guide 21 §12): B2B (new
 * activity on the marketplace — on by default) and B2C (the bridge to the
 * de9de9 app — off by default). Both sides of a company read the same values.
 */
export interface Acces {
  /** false: de9de9 suspended the company's B2B access — running contracts go on, nothing new starts. */
  b2b: boolean;
  /** `non_autorise` · `en_attente` · `actif` · `suspendu` */
  b2c: string;
  /** The home carried the block. An older API does not: B2B is then open and B2C read from the legacy field. */
  connu: boolean;
}

export function accesOf(accueil: AccueilEnvelope | null | undefined): Acces {
  const pro = accueil?.role === 'prestataire' ? accueil.prestataire : null;
  const acces = (pro ?? accueil?.client)?.acces;
  return {
    b2b: acces?.b2b ?? true,
    // `b2c.statut` of the prestataire home keeps its three old values; `non_autorise` only exists on `acces`.
    b2c: acces?.b2c?.statut ?? pro?.b2c?.statut ?? 'actif',
    connu: !!acces,
  };
}

// Primitive selectors: a fresh object per call would re-render forever.
export const useAccesB2b = (): boolean => useAccueilStore((s) => accesOf(s.accueil).b2b);
export const useAccesB2c = (): string => useAccueilStore((s) => accesOf(s.accueil).b2c);
export const useAccesConnu = (): boolean => useAccueilStore((s) => accesOf(s.accueil).connu);

/**
 * The active side's home, fetched again. No session ends and no live
 * « session » event is sent when an admin changes an access: the app refetches
 * the home on the access alerts and after an access refusal, so the menus
 * follow. A failure keeps the home already held.
 */
export async function refreshAccueil(): Promise<void> {
  const epoch = sessionEpoch();
  const role = useAuthStore.getState().user?.role;
  try {
    if (role === 'prestataire') {
      const home = accueilSchema.parse((await apiClient.get('/prestataire/accueil')).data);
      if (sessionEpoch() === epoch) accueilActions.setPrestataire(home);
    } else if (role === 'client') {
      const home = clientAccueilSchema.parse((await apiClient.get('/client/accueil')).data);
      if (sessionEpoch() === epoch) accueilActions.setClient(home);
    }
  } catch {
    /* unreachable, or an answer this build cannot read: the stored home stands */
  }
}

/**
 * A refusal just said an access is closed (403 `b2c_access_required`,
 * `b2b_access_disabled`): the menus follow at once, then the home is read again.
 */
export function accesRefuse(which: 'b2b' | 'b2c'): void {
  accueilActions.patchAcces(which === 'b2b' ? { b2b: false } : { b2c: { accorde: false, statut: 'non_autorise' } });
  void refreshAccueil();
}
