import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { queryClient } from '@/lib/queryClient';
import { onboardingActions, useOnboardingStore } from '@/stores/onboardingStore';
import { accueilActions, useAccueilStore } from '@/stores/accueilStore';
import { sessionEpoch } from '@/stores/sessionEpoch';
import type { AccueilEnvelope } from '@/features/auth/schemas/accueil';
import {
  kycDocumentsSchema,
  kycDossierSchema,
  kycStatutSchema,
  type KycDossier,
  type KycKind,
  type KycStatut,
} from '../schemas/kyc';

export const dossierQueryKey = ['kyc', 'dossier'] as const;

/** Up to 20 MB in one request: the client's 15 s would cut an ordinary uplink off mid-file. */
const UPLOAD_TIMEOUT_MS = 5 * 60_000;

/** The dossier behind « Vérifier mon entreprise »: status, reason, file links. */
export function useKycDossier() {
  return useQuery({
    queryKey: dossierQueryKey,
    queryFn: async () => kycDossierSchema.parse((await apiClient.get('/kyc/dossier')).data),
  });
}

/**
 * Upload one or several pieces. Each file is paired **by position** with its
 * kind, so the two arrays are appended in step. Re-uploading a kind replaces
 * what is on screen; the previous file stays in the company's history.
 */
export function useUploadKycDocuments() {
  return useMutation({
    mutationFn: async ({
      files,
      onProgress,
    }: {
      files: { kind: KycKind; file: File }[];
      /** 0–100, as the bytes leave the browser. */
      onProgress?: (percent: number) => void;
    }) => {
      const form = new FormData();
      for (const { kind, file } of files) {
        form.append('files', file);
        form.append('kinds', kind);
      }
      const res = await apiClient.post('/kyc/documents', form, {
        timeout: UPLOAD_TIMEOUT_MS,
        onUploadProgress: (e) => {
          const ratio = e.progress ?? (e.total ? e.loaded / e.total : undefined);
          if (ratio !== undefined) onProgress?.(Math.min(100, Math.round(ratio * 100)));
        },
      });
      return kycDocumentsSchema.parse(res.data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dossierQueryKey });
    },
  });
}

/**
 * Submit the dossier for review. No body. Answers with the dossier at
 * `pending`, which also moves the session's onboarding to « en revue » and the
 * home's company badge along — the two stores are what the pills, gates and
 * home card read.
 */
export function useSubmitKyc() {
  return useMutation({
    // The session this submit belongs to: its answer must not land in a newer one.
    onMutate: () => sessionEpoch(),
    mutationFn: async () => kycDossierSchema.parse((await apiClient.post('/kyc/soumettre')).data),
    onSuccess: async (dossier, _variables, epoch) => {
      if (sessionEpoch() !== epoch) return;
      const patch = {
        nextStep: 'kyc_en_revue' as const,
        kycStatut: dossier.statut,
        kycStatutLabel: dossier.statutLabel,
        kycMotif: dossier.motif ?? null,
        kycSoumisLe: dossier.soumisLe ?? null,
      };
      // A sign-in answer without an onboarding block left nothing to patch.
      if (useOnboardingStore.getState().onboarding) onboardingActions.patchKyc(patch);
      else onboardingActions.set({ ...patch, pieces: [] });
      // The home still carries the previous verdict (e.g. « refusée »).
      accueilActions.patchEntreprise({ kycStatut: dossier.statut, verifie: dossier.statut === 'verified' });
      // The upload's refetch may still be in flight with the pre-submit
      // dossier: stop it, or it lands after this and overwrites it.
      await queryClient.cancelQueries({ queryKey: dossierQueryKey });
      if (sessionEpoch() !== epoch) return;
      queryClient.setQueryData(dossierQueryKey, dossier);
    },
  });
}

/** What every KYC pill, gate and badge in the app reads. */
export interface KycState {
  statut: KycStatut;
  verified: boolean;
  /** Filed and waiting for de9de9's verdict. */
  inReview: boolean;
  /** Rejected: the company must fix the piece named in `motif` and submit again. */
  rejected: boolean;
  motif?: string | null;
}

export function kycStateOf(
  statut: KycStatut | undefined,
  opts: { submitted?: boolean; motif?: string | null } = {},
): KycState {
  const s: KycStatut = statut ?? 'pending';
  return {
    statut: s,
    verified: s === 'verified',
    inReview: s === 'pending' && !!opts.submitted,
    rejected: s === 'rejected',
    motif: opts.motif ?? null,
  };
}

/** The company block of the active side's home. */
function activeEntreprise(accueil: AccueilEnvelope | null) {
  return accueil?.role === 'prestataire'
    ? accueil.prestataire?.entreprise
    : accueil?.client?.entreprise;
}

function asStatut(value: string | undefined): KycStatut | undefined {
  const parsed = kycStatutSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

/**
 * The KYC state of the session, from what the sign-in answer carried — no
 * call. Two sources: onboarding (which says whether the dossier was filed) and
 * the home's company badge. A verdict on the home — verified or rejected —
 * wins: a switch or the app-start check renews the home without always
 * renewing onboarding, whose `pending` may predate that verdict. Otherwise
 * onboarding is preferred (a submit patches both). The KYC screen reads the
 * dossier.
 */
export function useKycState(): KycState {
  const onboarding = useOnboardingStore((s) => s.onboarding);
  // Primitive selectors: a fresh object per call would re-render forever.
  const entStatut = useAccueilStore((s) => activeEntreprise(s.accueil)?.kycStatut);
  const entVerifie = useAccueilStore((s) => activeEntreprise(s.accueil)?.verifie === true);

  const onbStatut = asStatut(onboarding?.kycStatut);
  const homeStatut = entVerifie ? 'verified' : asStatut(entStatut);
  const verdict = homeStatut === 'verified' || homeStatut === 'rejected' ? homeStatut : undefined;
  const statut = verdict ?? onbStatut ?? homeStatut ?? 'pending';
  // Onboarding's submit date and reason go with its own status: a verdict
  // that contradicts it voids them too.
  const trusted = !verdict || !onbStatut || onbStatut === verdict;
  return kycStateOf(statut, {
    submitted: trusted && (!!onboarding?.kycSoumisLe || onboarding?.nextStep === 'kyc_en_revue'),
    motif: trusted ? onboarding?.kycMotif : null,
  });
}

/** The same state, derived from a dossier the KYC screen already loaded. */
export function kycStateOfDossier(dossier: KycDossier | undefined): KycState {
  return kycStateOf(dossier?.statut, { submitted: !!dossier?.soumisLe, motif: dossier?.motif });
}
