import type { MockResponse } from './router';

/** 200 with a JSON body. */
export const ok = (data: unknown): MockResponse => ({ data });

/** 404 with a message body. */
export const notFound = (message: string): MockResponse => ({ status: 404, data: { message } });

/** 400 with a message body. */
export const badRequest = (message: string): MockResponse => ({ status: 400, data: { message } });

/** Read a field from an unknown JSON body without unsafe casts. */
export function field<T = unknown>(body: unknown, key: string): T | undefined {
  if (body && typeof body === 'object' && key in body) {
    return (body as Record<string, T>)[key];
  }
  return undefined;
}
