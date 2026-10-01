/**
 * The de9de9 app's job states, as the company reads them (guide 16a §4-5,
 * 16b §6.2 and §8). `status` (overall), `statusPro` (the company's side) and
 * `statusClient` (the consumer's) are ints on one scale:
 * 0 new / negotiating · 1 that side countered and waits · 2 accepted ·
 * 4 ended by that side · 5 cancelled · 6 refused · 7 done · 8 on `statusPro`:
 * the consumer countered.
 */

type Pair = [fr: string, ar: string];

export interface JobState {
  /** `order` — a booking · `offer` — the company's bid on a consumer's post. */
  type: string;
  status: number;
  statusPro: number;
  statusClient: number;
  /** Offers, from the detail only: 0 the consumer countered last · 1 the company did. */
  lastModifiedBy?: number;
}

export interface Pill {
  label: Pair;
  /** One of the app's tones (`tonePill`). */
  ton: string;
  /** The line under the pill, on « Offres envoyées ». */
  sub?: Pair;
}

/** Bookings, and accepted offers once they sit in « Services confirmés » (guide 16a §4.1). */
export function bookingPill({ status, statusPro, statusClient }: JobState): Pill {
  switch (status) {
    case 0:
      if (statusPro === 1) {
        return { label: ['Contre-proposition envoyée — en attente du client', 'تم إرسال اقتراح مضاد — في انتظار العميل'], ton: 'info' };
      }
      if (statusPro === 8) return { label: ['Le client a contre-proposé', 'العميل قدّم اقتراحًا مضادًا'], ton: 'attention' };
      return { label: ['Nouvelle', 'جديد'], ton: 'attention' };
    case 2:
      if (statusPro === 4) {
        return { label: ['Terminé de votre côté — en attente du client', 'منتهٍ من جهتك — في انتظار العميل'], ton: 'neutre' };
      }
      // Not "the consumer confirmed": only « terminé » on their side counts here.
      if (statusClient === 4) {
        return { label: ['Le client a déclaré la prestation terminée', 'العميل أعلن انتهاء الخدمة'], ton: 'attention' };
      }
      return { label: ['Confirmé', 'مؤكَّد'], ton: 'valide' };
    case 5:
      return { label: ['Annulée', 'ملغاة'], ton: 'neutre' };
    case 6:
      return { label: ['Refusée', 'مرفوضة'], ton: 'neutre' };
    case 7:
      return { label: ['Terminée', 'منتهية'], ton: 'valide' };
    default:
      return { label: ['En cours', 'جارٍ'], ton: 'neutre' };
  }
}

/** « Offres envoyées » (guide 16b §6.2). The two counters write different `statusClient`: 1 theirs, 8 the company's. */
export function offerPill({ status, statusPro, statusClient, lastModifiedBy }: JobState): Pill {
  switch (status) {
    case 0: {
      const pending: Pair = ['En attente', 'قيد الانتظار'];
      if (statusPro !== 1) return { label: pending, ton: 'attention' };
      const theirs = lastModifiedBy !== undefined ? lastModifiedBy === 0 : statusClient !== 8;
      return theirs
        ? { label: pending, ton: 'attention', sub: ['Contre-proposition du client — à vous de répondre', 'اقتراح مضاد من العميل — دورك للرد'] }
        : { label: pending, ton: 'info', sub: ['Votre contre-proposition est envoyée', 'تم إرسال اقتراحك المضاد'] };
    }
    case 2:
    case 3:
      if (statusPro === 4) {
        return {
          label: ['Terminée de votre côté', 'منتهية من جهتك'],
          ton: 'neutre',
          sub: ['En attente de confirmation du client', 'في انتظار تأكيد العميل'],
        };
      }
      return { label: ['Retenue', 'مقبول'], ton: 'valide', sub: ['Voir dans Services confirmés', 'انظر في الخدمات المؤكّدة'] };
    case 4:
      return { label: ['Terminée de votre côté', 'منتهية من جهتك'], ton: 'neutre' };
    case 7:
      return { label: ['Terminée', 'منتهية'], ton: 'valide' };
    case 5:
      return { label: ['Retirée', 'مسحوب'], ton: 'neutre' };
    default:
      return { label: ['Refusée', 'مرفوض'], ton: 'neutre' };
  }
}

export type JobAction = 'accept' | 'decline' | 'modify' | 'acceptModification' | 'terminate' | 'cancel';

/**
 * The buttons a state offers, primary first. The de9de9 app guards almost
 * nothing (two seats share one account, blocker B16), so this table is the
 * guard: never « Accepter » on the company's own counter, « Refuser » only
 * while new, « Annuler » and « Marquer terminé » only once confirmed.
 */
export function actionsFor({ type, status, statusPro, lastModifiedBy }: JobState): JobAction[] {
  if (type === 'offer') {
    if (status === 0) {
      // Only the consumer opens a negotiation; the company answers a counter of theirs.
      return statusPro === 1 && lastModifiedBy === 0 ? ['acceptModification', 'modify', 'cancel'] : ['cancel'];
    }
    // An accepted offer IS the booking; it cannot be modified any more.
    return status === 2 && statusPro === 2 ? ['terminate', 'cancel'] : [];
  }
  if (status === 0) {
    if (statusPro === 0) return ['accept', 'decline', 'modify'];
    if (statusPro === 1) return ['decline'];
    // `accept-modification`, not `pro-accept-orders`: only it closes the negotiation.
    if (statusPro === 8) return ['acceptModification', 'modify', 'decline'];
    return [];
  }
  return status === 2 && statusPro === 2 ? ['terminate', 'modify', 'cancel'] : [];
}

export function actionLabel(action: JobAction, { type, status, statusPro }: JobState): Pair {
  const offer = type === 'offer';
  switch (action) {
    case 'accept':
      return ['Accepter', 'قبول'];
    case 'decline':
      return ['Refuser', 'رفض'];
    case 'acceptModification':
      return offer ? ['Accepter la contre-proposition', 'قبول الاقتراح المضاد'] : ['Accepter la modification', 'قبول التعديل'];
    case 'modify':
      if (offer) return ['Contre-proposer', 'اقتراح مضاد'];
      if (status === 2) return ['Modifier', 'تعديل'];
      return statusPro === 8 ? ['Re-proposer', 'إعادة الاقتراح'] : ['Proposer une modification', 'اقتراح تعديل'];
    case 'terminate':
      return ['Marquer terminé', 'تعليم كمنتهٍ'];
    case 'cancel':
      return offer && status === 0 ? ["Retirer l'offre", 'سحب العرض'] : ['Annuler', 'إلغاء'];
  }
}

/** What a press asks before it sends — null: it sends at once. */
export function confirmFor(action: JobAction, { type, status }: JobState): Pair | null {
  switch (action) {
    case 'decline':
      return ['Refuser cette réservation ? Le client sera prévenu.', 'رفض هذا الحجز؟ سيتم إعلام العميل.'];
    case 'terminate':
      return ['Marquer cette prestation comme terminée ?', 'تعليم هذه الخدمة كمنتهية؟'];
    case 'cancel':
      if (type !== 'offer') return ['Annuler cette réservation ? Le client sera prévenu.', 'إلغاء هذا الحجز؟ سيتم إعلام العميل.'];
      return status === 0
        ? ['Retirer cette offre ? Le client ne la verra plus.', 'سحب هذا العرض؟ لن يراه العميل بعد الآن.']
        : ['Annuler ce service ? Le client sera prévenu.', 'إلغاء هذه الخدمة؟ سيتم إعلام العميل.'];
    default:
      return null;
  }
}

// ---------------------------------------------------------------- formatting

/** « 4 500 DZD » */
export const dzd = (amount: number | undefined): string =>
  amount == null ? '—' : `${amount.toLocaleString('fr-FR')} DZD`;

/** `"2026-10-04"` → `"04/10/2026"` */
export function frDate(iso: string | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

/** `"04/10/2026"` → `"2026-10-04"` (for a date input) */
export function isoDate(fr: string | undefined): string {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(fr ?? '');
  return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
}

/**
 * The date and time parts of a de9de9 `dueDateTime`, cut from the string: it
 * holds Algeria wall-clock time flagged `Z`, so `new Date()` would shift it by
 * an hour (blocker B26). Never converted.
 */
export function wallClock(stamp: string | undefined): { date: string; time: string } {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(stamp ?? '');
  return m ? { date: frDate(m[1]), time: m[2] ?? '' } : { date: '', time: '' };
}

/** « 04/10/2026 · 14:30 », with the day name in front when there is one. */
export function slotLabel(parts: { day?: string; date?: string; time?: string }): string {
  const date = [parts.day, parts.date].filter(Boolean).join(' ');
  return [date, parts.time].filter(Boolean).join(' · ');
}

type L = (fr: string, ar: string) => string;

/** « il y a 12 min » · « il y a 2 h » · « il y a 3 j » — from the answer's own counters. */
export function ageLabel(
  row: { timeDiffInMinutes?: number; totalHours?: number; totalDays?: number },
  L: L,
): string {
  const { timeDiffInMinutes: min, totalHours: hours, totalDays: days } = row;
  if (min != null && min < 60) return L(`il y a ${Math.max(min, 1)} min`, `منذ ${Math.max(min, 1)} د`);
  if (hours != null && hours < 24) return L(`il y a ${hours} h`, `منذ ${hours} سا`);
  if (days != null) return L(`il y a ${days} j`, `منذ ${days} ي`);
  return '';
}

/** « Aucune offre » · « 1 offre » · « n offres » — the live offers on a consumer's post. */
export function offersLabel(count: number, L: L): string {
  if (count === 0) return L('Aucune offre', 'لا توجد عروض');
  return count === 1 ? L('1 offre', 'عرض واحد') : L(`${count} offres`, `${count} عروض`);
}

const pad = (n: number): string => String(n).padStart(2, '0');

/** Today, as a date input writes it. */
export function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * The de9de9 app accepts a past slot (blockers B19): the app does not. Which
 * input is at fault, or null when the slot is in the future.
 */
export function slotError(dueDate: string, dueTime: string): 'dueDate' | 'dueTime' | null {
  const today = todayIso();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || dueDate < today) return 'dueDate';
  if (!/^\d{2}:\d{2}$/.test(dueTime)) return 'dueTime';
  if (dueDate === today) {
    const now = new Date();
    if (dueTime <= `${pad(now.getHours())}:${pad(now.getMinutes())}`) return 'dueTime';
  }
  return null;
}
