import { create } from 'zustand';

/**
 * The de9de9 app session behind « B2C · Particuliers » (guide 16 §2): a short
 * pro token for the company's shared account, traded for the Entreprise token
 * by `POST /b2c/session`. In memory only — never persisted: it has no refresh
 * token, and a reload simply asks for a new one.
 */
export interface B2cSession {
  legacyToken: string;
  legacyExpiresAt: string;
  /** The company's shadow pro — the `proId` of every booking, the hub group. */
  legacyUserId: string;
  /** A host, no trailing slash: the paths carry `/api/v1/…`. */
  apiBaseUrl: string;
  hubUrl: string;
  /** The Entreprise session (`sessionEpoch()`) it was traded for. */
  epoch: number;
}

/** Why the exchange refused — each kind has its own screen (guide 16 §2.2). */
export type B2cRefusalKind =
  | 'forbidden' // 403 forbidden: not an active seat, or the company is inactive
  | 'side' // 403 prestataire_side_required
  | 'access' // 403 b2c_access_required: de9de9 has not granted the B2C access, or took it back (guide 21 §14)
  | 'kyc' // 422 kyc_required
  | 'suspended' // 423 b2c_suspended
  | 'not_ready' // 409 legacy_account_not_ready
  | 'unavailable' // 503 legacy_unavailable, or the de9de9 app unreachable
  | 'signed_out' // 401: the Entreprise session itself is over
  | 'other';

export interface B2cRefusal {
  kind: B2cRefusalKind;
  status: number;
  code?: string;
  /** French, from the server — printed as is when there is one. */
  detail?: string;
  kycStatus?: string;
  legacySyncStatus?: string;
}

interface B2cSessionState {
  session: B2cSession | null;
  refusal: B2cRefusal | null;
}

export const useB2cSessionStore = create<B2cSessionState>()(() => ({ session: null, refusal: null }));
