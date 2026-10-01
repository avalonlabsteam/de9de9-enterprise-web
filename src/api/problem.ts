import axios from 'axios';
import { ZodError } from 'zod';

/**
 * The API reports failures as problem JSON: a machine-readable `code`, a
 * `field` when one input is at fault, and a `detail` already written in French
 * for the user. This reads that body out of an axios rejection without trusting
 * its shape — a gateway can answer with anything.
 *
 * Some routes (e.g. `/auth/login` with a malformed body) still answer with
 * ASP.NET's default validation shape, `errors: { Email: ["…"] }`, and no
 * `code` / `field`: the first entry is lifted into `field` / `detail` so the
 * screens handle both shapes the same way.
 */
export interface ApiProblem {
  status: number;
  /**
   * `validation_failed`, `email_taken`, `too_many_requests`… `network` when the
   * call never landed, `invalid_response` when its answer did not fit the schema.
   */
  code: string;
  /** The offending input, when the API blames one. */
  field?: string;
  /** User-facing message from the API. */
  detail?: string;
}

const str = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined;

export function toProblem(error: unknown): ApiProblem {
  // The call worked but the answer did not match the schema: say so, and show
  // developers exactly which field — never blame the user's connection.
  if (error instanceof ZodError) {
    if (import.meta.env.DEV) console.error('[api] unexpected answer shape', error.issues);
    return { status: 0, code: 'invalid_response' };
  }
  if (!axios.isAxiosError(error) || !error.response) {
    return { status: 0, code: 'network' };
  }
  const { status, data } = error.response;
  const body: Record<string, unknown> = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  const first = firstModelError(body['errors']);
  return {
    status,
    code: str(body['code']) ?? (first ? 'validation_failed' : `http_${status}`),
    field: str(body['field']) ?? first?.field,
    detail: str(body['detail']) ?? str(body['message']) ?? first?.message,
  };
}

/** `{ Email: ["The Email field is required."] }` → `{ field: 'email', message }`. */
function firstModelError(errors: unknown): { field: string; message: string } | undefined {
  if (!errors || typeof errors !== 'object') return undefined;
  for (const [key, value] of Object.entries(errors as Record<string, unknown>)) {
    const message = Array.isArray(value) ? str(value[0]) : str(value);
    if (message) return { field: key.charAt(0).toLowerCase() + key.slice(1), message };
  }
  return undefined;
}

/**
 * `toProblem` for a call made with `responseType: 'blob'` (a PDF): a failure
 * then carries its problem JSON as a Blob, which has to be read first.
 */
export async function toProblemOfBlob(error: unknown): Promise<ApiProblem> {
  if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
    try {
      const body: unknown = JSON.parse(await error.response.data.text());
      return toProblem({ ...error, isAxiosError: true, response: { ...error.response, data: body } });
    } catch {
      /* not JSON: the status alone is all there is */
    }
  }
  return toProblem(error);
}

/**
 * The route itself does not exist: the backend has not deployed it yet. A 404
 * the API wrote carries a problem `code` (`annonce_not_found`); the router's
 * own 404 carries none.
 */
export function isRouteAbsente(error: unknown): boolean {
  if (!axios.isAxiosError(error) || error.response?.status !== 404) return false;
  const body = error.response.data as { code?: unknown } | undefined;
  return typeof body?.code !== 'string';
}
