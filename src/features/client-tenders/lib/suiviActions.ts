import { apiClient } from '@/api/apiClient';
import { toProblem } from '@/api/problem';
import { apiUrl } from '@/api/hostUrl';

export { apiUrl };
import type { Champ, SuiviAction } from '../schemas/suivi';

/** The values a confirmation sheet collected, by field `code`. */
export interface SheetValues {
  values: Record<string, unknown>;
  files: Record<string, File>;
}

/**
 * The body: `corps` (a constant, maybe `{}`) plus each sheet field under its
 * code — except `date_chips`, whose `{ date, time }` object is merged in, and
 * `fichier`, which travels as its own multipart part.
 */
export function buildBody(action: SuiviAction, sheet: SheetValues): Record<string, unknown> {
  const body: Record<string, unknown> = { ...(action.corps ?? {}) };
  for (const champ of action.confirm?.champs ?? []) {
    const value = sheet.values[champ.code];
    if (champ.type === 'fichier' || value === undefined || value === '') continue;
    if (champ.type === 'date_chips' && value && typeof value === 'object') Object.assign(body, value);
    else body[champ.code] = value;
  }
  return body;
}

/** `requis: true` keeps the confirm button disabled until the field is filled. */
export function champFilled(champ: Champ, sheet: SheetValues): boolean {
  if (champ.type === 'fichier') return !!sheet.files[champ.code];
  const value = sheet.values[champ.code];
  return value !== undefined && value !== '' && value !== null;
}

function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  // Not a secure context: still unique enough for one press.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Idempotency keys by action: a new UUID per confirmed press, the SAME one when
 * that press is retried after a network failure — so a payment is never taken
 * twice because the first answer got lost.
 */
const retryKeys = new Map<string, string>();

function keyFor(action: SuiviAction): string {
  const slot = `${action.method}:${action.href}`;
  const existing = retryKeys.get(slot);
  if (existing) return existing;
  const key = newIdempotencyKey();
  retryKeys.set(slot, key);
  return key;
}

/**
 * Send one press — steps 3 to 6 of the guide's single algorithm. JSON, or
 * multipart with the JSON in a `payload` text part and each file under its
 * field's code. Resolves with the raw 2xx body; the caller reads it by
 * `reponse`.
 */
export async function sendAction(
  action: SuiviAction,
  body: Record<string, unknown>,
  files: Record<string, File | File[]> = {},
): Promise<unknown> {
  if (!action.href || !action.method) throw new Error('action_without_route');

  const idempotent = action.idempotence === 'uuid_par_confirmation';
  const headers: Record<string, string> = {};
  if (idempotent) headers['Idempotency-Key'] = keyFor(action);

  const fileEntries = Object.entries(files).flatMap(([code, f]) =>
    (Array.isArray(f) ? f : [f]).map((file) => [code, file] as const),
  );
  let data: unknown = body;
  if (action.contentType === 'multipart/form-data' && fileEntries.length > 0) {
    const form = new FormData();
    form.append('payload', JSON.stringify(body));
    for (const [code, file] of fileEntries) form.append(code, file);
    data = form;
  }

  try {
    const res = await apiClient.request({
      url: apiUrl(action.href),
      method: action.method,
      data,
      headers,
      // Several files may ride along: do not cut a slow uplink at 15 s.
      timeout: fileEntries.length > 0 ? 5 * 60_000 : undefined,
    });
    if (idempotent) retryKeys.delete(`${action.method}:${action.href}`);
    return res.data;
  } catch (error) {
    // Only a press that never got an answer may be retried with its key.
    if (idempotent && toProblem(error).status !== 0) retryKeys.delete(`${action.method}:${action.href}`);
    throw error;
  }
}

/**
 * The sentence to print for a refused press. Routes under `/client/…` answer a
 * French `detail`; the reused ones answer English, so their `erreurs` map
 * (`*` as fallback) carries the sentence.
 */
export function actionErrorMessage(action: SuiviAction, error: unknown, fallback: string): string {
  const problem = toProblem(error);
  if (action.erreurs) return action.erreurs[problem.code] ?? action.erreurs['*'] ?? problem.detail ?? fallback;
  return problem.detail ?? fallback;
}
