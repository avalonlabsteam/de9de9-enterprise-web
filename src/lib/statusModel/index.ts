/**
 * The canonical DE9DE9 status model — one status, three projections + a "ball".
 * Codes stay in English (enum values); every human label stays in French.
 * Setup states (S1–S4) run once per demand; Visite states (V0–V7 + V5·C + V✕)
 * run per occurrence. S/V numbers are an internal/admin aid — never shown to
 * client or prestataire users (they see the projection label + a Stepper).
 */

export type SetupCode = 'arappeler' | 'contacte' | 'devis' | 'assigne';
export type VisiteCode =
  | 'added'
  | 'toConfirm'
  | 'confirmed'
  | 'confirmedAssigned'
  | 'doneNoInvoice'
  | 'doneInvoiced'
  | 'doneDisputed'
  | 'doneApproved'
  | 'paid'
  | 'cancelled';
export type StatusCode = SetupCode | VisiteCode;

/** Who must act next. `done` = terminal success, `null` = terminal/none. */
export type Ball = 'client' | 'de9' | 'pro' | 'done';
/** The three viewpoints a single status projects into. */
export type Projection = 'client' | 'de9' | 'pro';
export type Level = 'S' | 'V';

export interface StatusDef {
  code: StatusCode;
  level: Level;
  /** 'S1'…'S4', 'V0'…'V7', 'V5·C', 'V✕' — admin-only aid, never rendered to users. */
  num: string;
  /** Canonical FR statut name. */
  fr: string;
  /** The three projections; `null` = not shown to that party. */
  labels: Record<Projection, string | null>;
  ball: Ball | null;
  /** Action that advances it (FR), or null when terminal. */
  action: string | null;
  /** Reachable next codes. */
  next: StatusCode[];
  /** Who performs the advancing action. */
  actor: Ball | null;
}

// One occurrence (visite) of a demand.
export interface Occurrence {
  id: string;
  /** ISO date or 'dd/mm/yyyy'. */
  date: string;
  status: VisiteCode;
  /** Facture amount in DZD (when a facture exists). */
  montant?: number;
  /** Dispute reason when status === 'doneDisputed'. */
  motif?: string;
  /** Human occurrence label, e.g. "Occurrence 2/12". */
  label?: string;
}

export interface DemandStatusInput {
  /** Setup code while the demand has no occurrences yet; null once occurrences exist. */
  setup: SetupCode | null;
  occurrences: Occurrence[];
  type: 'ponctuel' | 'recurrent';
}

import { SETUP_STATES } from './setup';
import { VISITE_STATES } from './visite';

export const ALL_STATES: StatusDef[] = [...SETUP_STATES, ...VISITE_STATES];

export const STATUS_BY_CODE: Record<StatusCode, StatusDef> = Object.fromEntries(
  ALL_STATES.map((s) => [s.code, s]),
) as Record<StatusCode, StatusDef>;

export function statusDef(code: StatusCode): StatusDef {
  return STATUS_BY_CODE[code];
}

/** Display an ISO date as dd/mm/yyyy; pass other formats through unchanged. */
function fmtDate(date: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : date;
}

/**
 * The FR projection label for a party, falling back to the canonical `fr`.
 * Some labels embed a `[date]` placeholder (e.g. "Prochaine visite : [date]") —
 * pass the occurrence date to interpolate it; without one the " : [date]" tail
 * is dropped so no raw placeholder leaks to the UI.
 */
export function projectionLabel(code: StatusCode, projection: Projection, date?: string): string {
  const raw = STATUS_BY_CODE[code]?.labels[projection] ?? STATUS_BY_CODE[code]?.fr ?? '';
  if (!raw.includes('[date]')) return raw;
  if (date) return raw.replace('[date]', fmtDate(date));
  return raw.replace(/\s*:?\s*\[date\]/, '');
}

export function ballOf(code: StatusCode): Ball | null {
  return STATUS_BY_CODE[code]?.ball ?? null;
}

export function isTerminal(code: StatusCode): boolean {
  return STATUS_BY_CODE[code]?.next.length === 0;
}

/** True when `to` is a declared transition from `from`. */
export function canTransition(from: StatusCode, to: StatusCode): boolean {
  return STATUS_BY_CODE[from]?.next.includes(to) ?? false;
}

export { SETUP_STATES } from './setup';
export { VISITE_STATES } from './visite';
export { computeDemandBadge } from './badge';
export type { BadgeKind, DemandBadge } from './badge';
