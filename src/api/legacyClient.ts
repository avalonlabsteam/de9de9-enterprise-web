import axios, { type InternalAxiosRequestConfig } from 'axios';
import { sessionEpoch } from '@/stores/sessionEpoch';
import { dropB2cSession, ensureB2cSession } from '@/features/prestataire-b2c/api/session';
import { stripNulls } from './stripNulls';

/**
 * The de9de9 app's API (`api.de9de9.dz`), where the company works as a normal
 * pro (guide 16 §3). A second client on purpose: it must never go through the
 * Entreprise interceptors, which would send the Entreprise bearer to another
 * host and sign the user out on a refused refresh. Its paths carry `/api/v1/…`.
 *
 * No `X-App-Version` / `X-App-Platform`: the de9de9 app's version gate only
 * checks callers that send them.
 */
export const legacyClient = axios.create({
  timeout: 20_000,
  // Lists repeat the key (`?statuses=0&statuses=2`), never `statuses[]=`.
  paramsSerializer: { indexes: null },
});

type LegacyConfig = InternalAxiosRequestConfig & {
  _retried?: boolean;
  _epoch?: number;
  _token?: string;
};

legacyClient.interceptors.request.use(async (config: LegacyConfig) => {
  // Kept on a replay: the call still belongs to the Entreprise session that sent it.
  config._epoch ??= sessionEpoch();
  const session = await ensureB2cSession();
  config.baseURL = session.apiBaseUrl;
  config._token = session.legacyToken;
  config.headers.set('Authorization', `Bearer ${session.legacyToken}`);
  return config;
});

legacyClient.interceptors.response.use(
  (response) => {
    // .NET sends empty values as `null`; the schemas speak "missing" (see stripNulls).
    response.data = stripNulls(response.data);
    return response;
  },
  async (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const config = error.config as LegacyConfig | undefined;
      // Expired (60 min), or the company was suspended: trade a new token once
      // and replay once. A refused exchange rejects with its refusal, which
      // has its own screen. Never an Entreprise logout: this 401 is de9de9's.
      // A call from a session since replaced is dropped, not renewed.
      if (config && !config._retried && config._epoch === sessionEpoch()) {
        config._retried = true;
        if (config._token) dropB2cSession(config._token);
        await ensureB2cSession();
        return legacyClient.request(config);
      }
    }
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  },
);
