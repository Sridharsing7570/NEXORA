import type { AuthTokens } from '@repo/api/auth/auth.schemas';
import Constants from 'expo-constants';

import { deleteSecureItem, getSecureItem, setSecureItem } from '@/lib/secure-storage';

const REFRESH_TOKEN_KEY = 'nexora.refreshToken';
const REQUEST_TIMEOUT_MS = 15_000;
/** Refresh this long before the access token actually expires, to absorb clock skew and latency. */
const EXPIRY_MARGIN_MS = 30_000;

/**
 * Where the API lives. `EXPO_PUBLIC_API_URL` wins; in development we otherwise reuse the host the
 * Expo dev server is reachable on (your computer's LAN IP), so a phone or emulator finds the API
 * on port 3000 without configuration.
 */
function resolveBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/+$/, '');
  const devHost = Constants.expoConfig?.hostUri?.split(':')[0];
  return `http://${devHost ?? 'localhost'}:3000`;
}

export const API_URL = resolveBaseUrl();

export type ApiIssue = { path: string; message: string };

export class ApiError extends Error {
  constructor(
    /** HTTP status, or 0 when the server could not be reached. */
    readonly status: number,
    message: string,
    readonly issues: ApiIssue[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isNetworkError() {
    return this.status === 0;
  }
}

// ---------------------------------------------------------------------------
// Session tokens. The access token stays in memory; the refresh token is in secure storage.
// ---------------------------------------------------------------------------

let accessToken: string | null = null;
let accessTokenExpiresAt = 0;
let refreshInFlight: Promise<boolean> | null = null;
let onSessionEnded: (() => void) | null = null;

export async function storeTokens(tokens: AuthTokens): Promise<void> {
  accessToken = tokens.accessToken;
  accessTokenExpiresAt = Date.now() + tokens.accessTokenExpiresIn * 1000;
  await setSecureItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export async function clearTokens(): Promise<void> {
  accessToken = null;
  accessTokenExpiresAt = 0;
  await deleteSecureItem(REFRESH_TOKEN_KEY);
}

export function getStoredRefreshToken(): Promise<string | null> {
  return getSecureItem(REFRESH_TOKEN_KEY);
}

/** Called when the server rejects the refresh token (signed out elsewhere, revoked, expired). */
export function setSessionEndedHandler(handler: (() => void) | null) {
  onSessionEnded = handler;
}

/**
 * Gets a new token pair. Concurrent callers share one request, because the server rotates the
 * refresh token: two parallel refreshes with the same token would look like token theft.
 * Resolves `false` when there is no valid session; throws `ApiError` (status 0) when offline.
 */
export function refreshSession(): Promise<boolean> {
  refreshInFlight ??= (async () => {
    try {
      const refreshToken = await getStoredRefreshToken();
      if (!refreshToken) return false;
      try {
        const { tokens } = await send<{ tokens: AuthTokens }>('POST', '/auth/refresh', { refreshToken });
        await storeTokens(tokens);
        return true;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          await clearTokens();
          onSessionEnded?.();
          return false;
        }
        throw error;
      }
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Send the access token (default). Public auth endpoints pass `false`. */
  auth?: boolean;
};

export async function api<T>(path: string, { method = 'GET', body, auth = true }: RequestOptions = {}): Promise<T> {
  if (!auth) {
    return send<T>(method, path, body);
  }

  if (!accessToken || Date.now() > accessTokenExpiresAt - EXPIRY_MARGIN_MS) {
    await refreshSession();
  }
  try {
    return await send<T>(method, path, body, accessToken);
  } catch (error) {
    // The token may have been revoked server-side before it expired; refresh once and retry.
    if (error instanceof ApiError && error.status === 401 && (await refreshSession())) {
      return send<T>(method, path, body, accessToken);
    }
    throw error;
  }
}

async function send<T>(method: string, path: string, body?: unknown, token?: string | null): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Could not reach Nexora. Check your connection and try again.');
  } finally {
    clearTimeout(timeout);
  }

  const text = await response.text();
  const payload: unknown = text ? safeJson(text) : null;

  if (!response.ok) {
    const errorBody = (payload ?? {}) as { message?: string | string[]; issues?: ApiIssue[] };
    const message = Array.isArray(errorBody.message) ? errorBody.message[0] : errorBody.message;
    throw new ApiError(response.status, message ?? 'Something went wrong. Please try again.', errorBody.issues ?? []);
  }
  return payload as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** First human-readable message for an error, preferring field-level validation messages. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.issues[0]?.message ?? error.message;
  }
  return 'Something went wrong. Please try again.';
}
