import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { onboardingStateSchema } from '@/features/auth/schemas/auth';
import { onboardingActions } from '@/stores/onboardingStore';

export interface TelephonePayload {
  /** The user's own mobile (05/06/07). */
  telephone: string;
  /** The company's line, when it differs — a landline is allowed here. */
  telephoneEntreprise: string | null;
}

/**
 * « Votre numéro » — the step `onboarding.nextStep === 'telephone'` asks for.
 * The answer is the new onboarding, which says where the user goes next.
 */
export function useSetTelephone() {
  return useMutation({
    mutationFn: async (payload: TelephonePayload) => {
      const res = await apiClient.post('/auth/me/telephone', payload);
      return onboardingStateSchema.parse(res.data);
    },
    onSuccess: (onboarding) => {
      onboardingActions.set(onboarding);
    },
  });
}
