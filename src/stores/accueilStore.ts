import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Accueil, AccueilEnvelope, ClientAccueil } from '@/features/auth/schemas/accueil';
import { rememberStorage, SESSION_STORE_KEYS } from './rememberStorage';

/**
 * The home the backend built for this session. It only ever arrives inside a
 * sign-in or a `/auth/switch-role` answer, so it is persisted next to the
 * token: without that, a browser refresh would leave the home screen with
 * nothing to render and no route to fetch it from.
 *
 * It is therefore as of the last sign-in or switch, not live.
 */
interface AccueilState {
  accueil: AccueilEnvelope | null;
}

export const useAccueilStore = create<AccueilState>()(
  persist(() => ({ accueil: null }) as AccueilState, {
    name: SESSION_STORE_KEYS.accueil,
    storage: rememberStorage<AccueilState>(),
    // No stored copy means no session: do not keep the previous one's home.
    merge: (persisted, current) => ({
      ...current,
      accueil: null,
      ...(persisted as Partial<AccueilState> | undefined),
    }),
  }),
);

export const accueilActions = {
  set: (accueil: AccueilEnvelope | null | undefined): void => {
    useAccueilStore.setState({ accueil: accueil ?? null });
  },
  /**
   * Fold a fresh KYC verdict into the active side's company block, so the home
   * card agrees with the pills until the next sign-in brings a new home.
   */
  patchEntreprise: (patch: { kycStatut?: string; verifie?: boolean }): void => {
    useAccueilStore.setState((s) => {
      const accueil = s.accueil;
      if (accueil?.role === 'prestataire' && accueil.prestataire) {
        const side = accueil.prestataire;
        return { accueil: { ...accueil, prestataire: { ...side, entreprise: { ...side.entreprise, ...patch } } } };
      }
      if (accueil?.role === 'client' && accueil.client) {
        const side = accueil.client;
        return { accueil: { ...accueil, client: { ...side, entreprise: { ...side.entreprise, ...patch } } } };
      }
      return s; // No home to patch: the next sign-in brings one.
    });
  },
  /**
   * A fresh prestataire home (`GET /prestataire/accueil`) takes the place of
   * the one the sign-in carried — only while the session is on that side.
   */
  setPrestataire: (home: Accueil): void => {
    useAccueilStore.setState((s) =>
      s.accueil?.role === 'prestataire' ? { accueil: { ...s.accueil, prestataire: home } } : s,
    );
  },
  /** The same for the client home (`GET /client/accueil`). */
  setClient: (home: ClientAccueil): void => {
    useAccueilStore.setState((s) => (s.accueil?.role === 'client' ? { accueil: { ...s.accueil, client: home } } : s));
  },
  /** An access de9de9 just closed, folded into the active home until the next read. */
  patchAcces: (patch: { b2b?: boolean; b2c?: { accorde: boolean; statut: string } }): void => {
    useAccueilStore.setState((s) => {
      const accueil = s.accueil;
      if (accueil?.role === 'prestataire' && accueil.prestataire) {
        const home = accueil.prestataire;
        return { accueil: { ...accueil, prestataire: { ...home, acces: { b2b: true, ...home.acces, ...patch } } } };
      }
      if (accueil?.role === 'client' && accueil.client) {
        const home = accueil.client;
        return { accueil: { ...accueil, client: { ...home, acces: { b2b: true, ...home.acces, ...patch } } } };
      }
      return s;
    });
  },
  clear: (): void => {
    useAccueilStore.setState({ accueil: null });
  },
};

/**
 * The signed-in company, from the active side's home. A stored reference, so
 * it is safe as a selector result.
 */
export function useActiveEntreprise() {
  return useAccueilStore((s) =>
    s.accueil?.role === 'prestataire' ? s.accueil.prestataire?.entreprise : s.accueil?.client?.entreprise,
  );
}
