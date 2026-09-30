import { apiClient } from '@/api/apiClient';
import { toProblem } from '@/api/problem';
import { apiUrl } from '@/api/hostUrl';
import type { ApiAction, Champ } from './schema';

export { apiUrl };

/** The values a confirmation sheet collected, by field `code`. */
export interface SheetValues {
  values: Record<string, unknown>;
  files: Record<string, File[]>;
}

/** Fields the user types into — the others are files, or lines only to read. */
const isInput = (champ: Champ) => champ.type !== 'fichier' && champ.type !== 'lecture_seule';

/** A sheet as it opens: each field prefilled with its `valeur` (the current amount, the last valid day…). */
export function initialSheet(action: ApiAction): SheetValues {
  const values: Record<string, unknown> = {};
  for (const champ of action.confirm?.champs ?? []) {
    if (isInput(champ) && champ.valeur !== undefined) values[champ.code] = champ.valeur;
  }
  return { values, files: {} };
}

/**
 * The body: `corps` (a constant, maybe `{}`, maybe a `version`) plus each sheet
 * field under its code — except `date_chips`, whose `{ date, time }` object is
 * merged in, `fichier`, which travels as its own multipart part, and
 * `lecture_seule`, which is never sent.
 */
export function buildBody(action: ApiAction, sheet: SheetValues): Record<string, unknown> {
  const body: Record<string, unknown> = { ...(action.corps ?? {}) };
  for (const champ of action.confirm?.champs ?? []) {
    const value = sheet.values[champ.code];
    if (!isInput(champ) || value === undefined || value === '') continue;
    if (champ.type === 'date_chips' && value && typeof value === 'object') Object.assign(body, value);
    else body[champ.code] = value;
  }
  return body;
}

/** `requis: true` keeps the confirm button disabled until the field is filled. */
export function champFilled(champ: Champ, sheet: SheetValues): boolean {
  if (champ.type === 'fichier') return (sheet.files[champ.code]?.length ?? 0) > 0;
  if (champ.type === 'lecture_seule') return true;
  const value = sheet.values[champ.code];
  return value !== undefined && value !== '' && value !== null;
}

/** A typed amount below `min` is not sent — the button waits for a valid one. */
export function champValid(champ: Champ, sheet: SheetValues): boolean {
  if (champ.type !== 'montant_dzd') return true;
  const value = sheet.values[champ.code];
  return value === undefined || (typeof value === 'number' && value >= (champ.min ?? 1));
}

/** Every `requis` field filled, every typed value valid. */
export function sheetReady(champs: Champ[], sheet: SheetValues): boolean {
  return champs.every((champ) => (!champ.requis || champFilled(champ, sheet)) && champValid(champ, sheet));
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

function keyFor(action: ApiAction): string {
  const slot = `${action.method}:${action.href}`;
  const existing = retryKeys.get(slot);
  if (existing) return existing;
  const key = newIdempotencyKey();
  retryKeys.set(slot, key);
  return key;
}

export interface SendOptions {
  /**
   * Send a `multipart/form-data` action as multipart even when no file rides
   * along (the `payload` part alone). The prestataire routes refuse JSON there;
   * the client screens send JSON when they carry no file.
   */
  multipartAlways?: boolean;
}

/**
 * Send one press — steps 3 to 6 of the guides' single algorithm. JSON, or
 * multipart with the JSON in a `payload` text part and each file under its
 * field's code. Resolves with the raw 2xx body; the caller reads it by
 * `reponse`.
 */
export async function sendAction(
  action: ApiAction,
  body: Record<string, unknown>,
  files: Record<string, File | File[]> = {},
  { multipartAlways = false }: SendOptions = {},
): Promise<unknown> {
  if (!action.href || !action.method) throw new Error('action_without_route');

  const idempotent = action.idempotence === 'uuid_par_confirmation';
  const headers: Record<string, string> = {};
  if (idempotent) headers['Idempotency-Key'] = keyFor(action);

  const fileEntries = Object.entries(files).flatMap(([code, f]) =>
    (Array.isArray(f) ? f : [f]).map((file) => [code, file] as const),
  );
  let data: unknown = body;
  if (action.contentType === 'multipart/form-data' && (multipartAlways || fileEntries.length > 0)) {
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
 * The sentence to print for a refused press. Routes under `/client/…` and
 * `/prestataire/…` answer a French `detail` (a field rule: its sentence in
 * `errors`); the reused ones answer English, so their `erreurs` map (`*` as
 * fallback) carries the sentence.
 */
export function actionErrorMessage(action: ApiAction, error: unknown, fallback: string): string {
  const problem = toProblem(error);
  if (action.erreurs) return action.erreurs[problem.code] ?? action.erreurs['*'] ?? problem.detail ?? fallback;
  return problem.detail ?? fallback;
}
