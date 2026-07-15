import type { DemandStatusInput, Occurrence, VisiteCode } from './index';
import { STATUS_BY_CODE } from './index';

export type BadgeKind = 'action' | 'wait' | 'setup' | 'done' | 'info' | 'cancelled';

export interface DemandBadge {
  fr: string;
  kind: BadgeKind;
  /** Raw date backing the label, when the badge references one. */
  date?: string;
}

/** Parse ISO or dd/mm/yyyy into a comparable timestamp (NaN-safe → +Infinity). */
function ts(date: string): number {
  const iso = Date.parse(date);
  if (!Number.isNaN(iso)) return iso;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date);
  if (m) return Date.parse(`${m[3]}-${m[2]}-${m[1]}`);
  return Number.POSITIVE_INFINITY;
}

/** Display a date as dd/mm/yyyy when it's ISO; otherwise pass it through. */
function fmtDate(date: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : date;
}

const byDate = (a: Occurrence, b: Occurrence): number => ts(a.date) - ts(b.date);

/**
 * The client's whole-demand badge — NEVER stored, always derived from the
 * occurrences by an urgency cascade (action before info). Deliberately differs
 * from progression order: a facture to approve (V5) outranks a visit to confirm
 * (V1) which outranks passive waits. See BUILD-SPEC §5.4.
 */
export function computeDemandBadge(d: DemandStatusInput): DemandBadge {
  const occ = d.occurrences;

  // Setup phase — no occurrences yet: surface the client-side setup label.
  if (occ.length === 0) {
    const code = d.setup ?? 'arappeler';
    const def = STATUS_BY_CODE[code];
    return { fr: def.labels.client ?? def.fr, kind: 'setup' };
  }

  const has = (s: VisiteCode): boolean => occ.some((o) => o.status === s);
  const nearest = (...codes: VisiteCode[]): Occurrence | undefined =>
    occ.filter((o) => codes.includes(o.status)).sort(byDate)[0];

  // 1 — Facture à approuver (V5)
  if (has('doneInvoiced')) return { fr: 'Facture à approuver', kind: 'action' };

  // 2 — Prochaine visite à confirmer (V1, nearest)
  const toConfirm = nearest('toConfirm');
  if (toConfirm) {
    return {
      fr: `Prochaine visite à confirmer : ${fmtDate(toConfirm.date)}`,
      kind: 'action',
      date: toConfirm.date,
    };
  }

  // 3 — En attente de la facture (V4)
  if (has('doneNoInvoice')) return { fr: 'En attente de la facture', kind: 'wait' };

  // 4 — Facture contestée (V5·C)
  if (has('doneDisputed')) return { fr: 'Facture contestée', kind: 'wait' };

  // 5 — Visite à planifier (V0)
  if (has('added')) return { fr: 'Visite à planifier', kind: 'setup' };

  // 6 — Everything terminal
  if (occ.every((o) => o.status === 'paid' || o.status === 'cancelled')) {
    return occ.every((o) => o.status === 'cancelled')
      ? { fr: 'Annulée', kind: 'cancelled' }
      : { fr: 'Terminé', kind: 'done' };
  }

  // Info — a confirmed upcoming visit (V2/V3) with nothing more urgent.
  const upcoming = nearest('confirmed', 'confirmedAssigned');
  if (upcoming) {
    return { fr: `Prochaine visite : ${fmtDate(upcoming.date)}`, kind: 'info', date: upcoming.date };
  }

  return { fr: 'En cours', kind: 'info' };
}
