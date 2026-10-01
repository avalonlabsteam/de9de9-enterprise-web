import axios, { type AxiosResponse } from 'axios';
import type { z } from 'zod';
import { legacyClient } from '@/api/legacyClient';
import { legacyPageSchema, type LegacyPage } from '../schemas/b2c';
import { B2cSessionRefused } from './session';

/**
 * Reading the de9de9 app's answers (guide 16 §3.1). A business refusal mostly
 * comes back as **HTTP 200** `{ success: false, message }`, a few as 400 / 409
 * with the same kind of body: the status alone says nothing, the body is read.
 */

/** The de9de9 app said no. `message` is its raw text — English, French, sometimes Arabic. */
export class LegacyRefusal extends Error {
  readonly status: number;
  readonly code?: string;
  readonly data: Record<string, unknown>;
  constructor(message: string, status: number, data: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.data = data;
    this.code = typeof data['code'] === 'string' ? data['code'] : undefined;
  }
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const messageOf = (body: Record<string, unknown>): string =>
  typeof body['message'] === 'string' ? body['message'] : '';

async function settle(request: Promise<AxiosResponse<unknown>>): Promise<unknown> {
  let response: AxiosResponse<unknown>;
  try {
    response = await request;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const { status, data } = error.response;
      const body = asRecord(data);
      // 400 `{ success:false, message }` (accept), 400 `{ message }` (apply),
      // 400 `{ errors }` (a date or time not in the exact format), 409 (wrong turn).
      if (status === 400 || status === 409) {
        throw new LegacyRefusal(messageOf(body) || (body['errors'] ? 'invalid_format' : ''), status, body);
      }
    }
    throw error;
  }
  const body = asRecord(response.data);
  if (body['success'] === false) throw new LegacyRefusal(messageOf(body), response.status, body);
  return response.data;
}

export const legacyGet = (url: string, params?: Record<string, unknown>): Promise<unknown> =>
  settle(legacyClient.get(url, { params }));
export const legacyPost = (url: string, body?: unknown): Promise<unknown> => settle(legacyClient.post(url, body));
export const legacyPatch = (url: string, body?: unknown): Promise<unknown> => settle(legacyClient.patch(url, body));

/** A paged answer; a row that does not fit the schema is dropped, not the page. */
export function parsePage<T>(data: unknown, row: z.ZodType<T>): LegacyPage<T> {
  const page = legacyPageSchema.parse(data);
  const rows: T[] = [];
  for (const raw of page.data) {
    const parsed = row.safeParse(raw);
    if (parsed.success) rows.push(parsed.data);
    else if (import.meta.env.DEV) console.error('[b2c] unreadable row', parsed.error.issues);
  }
  return { page: page.meta.current_page, total: page.meta.total, hasMore: page.meta.has_more_pages, rows };
}

type L = (fr: string, ar: string) => string;

/** The de9de9 app's known English refusals, in the app's two languages. */
const KNOWN: Record<string, [fr: string, ar: string]> = {
  'Not found.': ["Introuvable — un collègue l'a peut-être déjà traitée.", 'غير موجود — ربما عالجه زميل.'],
  'Order not found.': ['Réservation introuvable.', 'الحجز غير موجود.'],
  'Reservation not found.': ['Réservation introuvable.', 'الحجز غير موجود.'],
  'Offer not found.': ['Offre introuvable.', 'العرض غير موجود.'],
  'Professional not found.': ['Compte de9de9 introuvable.', 'حساب de9de9 غير موجود.'],
  'Client post not found.': ["Cette demande n'est plus disponible.", 'هذا الطلب لم يعد متاحًا.'],
  'Cannot decline a completed order.': ['Une réservation terminée ne peut pas être refusée.', 'لا يمكن رفض حجز منتهٍ.'],
  'Order already cancelled or declined.': ['Réservation déjà annulée ou refusée.', 'الحجز ملغى أو مرفوض بالفعل.'],
  'Cannot modify this order.': ['Cette réservation ne peut plus être modifiée.', 'لم يعد ممكنًا تعديل هذا الحجز.'],
  'Cannot modify this offer.': ['Cette offre ne peut plus être modifiée.', 'لم يعد ممكنًا تعديل هذا العرض.'],
  'Already modified. Waiting for client response.': [
    'Déjà modifiée — en attente de la réponse du client.',
    'تم التعديل بالفعل — في انتظار رد العميل.',
  ],
  'Order already accepted.': ['Réservation déjà acceptée.', 'الحجز مقبول بالفعل.'],
  'Offer already accepted.': ['Offre déjà retenue.', 'العرض مقبول بالفعل.'],
  'Cannot accept modification on this order.': [
    'Cette modification ne peut plus être acceptée.',
    'لم يعد ممكنًا قبول هذا التعديل.',
  ],
  'Cannot accept a cancelled or declined offer.': [
    'Une offre retirée ou refusée ne peut pas être acceptée.',
    'لا يمكن قبول عرض مسحوب أو مرفوض.',
  ],
  'No client modification to accept.': [
    "Le client n'a pas de contre-proposition en attente.",
    'لا يوجد اقتراح مضاد من العميل.',
  ],
  'You can only respond to a client modification.': [
    "Vous ne pouvez répondre qu'à une contre-proposition du client.",
    'يمكنك الرد فقط على اقتراح مضاد من العميل.',
  ],
  'Already cancelled.': ['Déjà annulée.', 'ملغى بالفعل.'],
  'Cannot cancel a completed reservation.': ['Une réservation terminée ne peut pas être annulée.', 'لا يمكن إلغاء حجز منتهٍ.'],
  'Cannot cancel a completed offer.': ['Un service terminé ne peut pas être annulé.', 'لا يمكن إلغاء خدمة منتهية.'],
  'You cannot apply to your own job post.': [
    'Vous ne pouvez pas postuler à votre propre demande.',
    'لا يمكنك التقديم على طلبك.',
  ],
  invalid_format: ["Date ou heure invalide. Vérifiez le formulaire.", 'تاريخ أو وقت غير صالح. تحقق من النموذج.'],
};

/**
 * What to tell the user after a de9de9 call failed. A refusal prints its own
 * message (the known English ones in the app's language); anything else is a
 * connection or server failure. Empty for a session refusal: it has its screen.
 */
export function legacyErrorMessage(error: unknown, L: L): string {
  if (error instanceof B2cSessionRefused) return '';
  if (error instanceof LegacyRefusal) {
    const known = KNOWN[error.message];
    if (known) return L(...known);
    return error.message || L("L'action n'a pas pu aboutir.", 'تعذّر تنفيذ الإجراء.');
  }
  if (axios.isAxiosError(error) && !error.response) {
    return L("L'application de9de9 est injoignable. Réessayez.", 'تعذّر الوصول إلى تطبيق de9de9. أعد المحاولة.');
  }
  return L('Une erreur est survenue. Réessayez.', 'حدث خطأ. أعد المحاولة.');
}
