import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OnboardingState as OnboardingPayload } from '@/features/auth/schemas/auth';
import { rememberStorage, SESSION_STORE_KEYS } from './rememberStorage';

/**
 * Where onboarding stands for this session — the phone step, then KYC. Like the
 * home, it arrives inside the sign-in answer and has no route of its own on the
 * company app, so it is persisted next to the token and refreshed on the next
 * sign-in (or by a KYC call that returns a new dossier).
 */
interface OnboardingStoreState {
  onboarding: OnboardingPayload | null;
}

export const useOnboardingStore = create<OnboardingStoreState>()(
  persist(() => ({ onboarding: null }) as OnboardingStoreState, {
    name: SESSION_STORE_KEYS.onboarding,
    storage: rememberStorage<OnboardingStoreState>(),
    // No stored copy means no session: do not keep the previous one's state.
    merge: (persisted, current) => ({
      ...current,
      onboarding: null,
      ...(persisted as Partial<OnboardingStoreState> | undefined),
    }),
  }),
);

export const onboardingActions = {
  set: (onboarding: OnboardingPayload | null | undefined): void => {
    useOnboardingStore.setState({ onboarding: onboarding ?? null });
  },
  /**
   * Fold a fresh KYC verdict into the stored onboarding — starting one when the
   * sign-in answer carried none, so the verdict is not lost.
   */
  patchKyc: (patch: Partial<OnboardingPayload>): void => {
    useOnboardingStore.setState((s) => ({
      onboarding: { ...(s.onboarding ?? { nextStep: 'kyc', pieces: [] }), ...patch },
    }));
  },
  clear: (): void => {
    useOnboardingStore.setState({ onboarding: null });
  },
};
