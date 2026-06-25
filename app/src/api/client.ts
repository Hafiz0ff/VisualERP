import { getActiveOrganizationId } from './organization';
import { ApiError } from './errors';
import type { ApiErrorEnvelope } from './envelope';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
type QueryValue = string | number | boolean | null | undefined;
type QueryParams = Record<string, QueryValue | QueryValue[]>;
type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

function buildUrl(path: string, params?: QueryParams): string {
  const urlPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${BASE_URL}${urlPath}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item !== undefined && item !== null) {
            url.searchParams.append(key, String(item));
          }
        });
      } else if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseApiErrorEnvelope(payload: unknown, status: number): ApiErrorEnvelope {
  if (isRecord(payload) && isRecord(payload.error)) {
    const code = typeof payload.error.code === 'string' ? payload.error.code : 'API_ERROR';
    const message =
      typeof payload.error.message === 'string' ? payload.error.message : `HTTP error ${status}`;
    const details = Array.isArray(payload.error.details) ? payload.error.details : [];

    return {
      error: { code, message, details },
      meta: isRecord(payload.meta)
        ? {
            requestId: String(payload.meta.requestId || ''),
            timestamp: String(payload.meta.timestamp || ''),
          }
        : { requestId: '', timestamp: '' },
    };
  }

  return {
    error: { code: 'API_ERROR', message: `HTTP error ${status}`, details: [] },
    meta: { requestId: '', timestamp: '' },
  };
}

export async function apiRequest<T>(
  method: HttpMethod,
  path: string,
  options?: {
    body?: unknown;
    params?: QueryParams;
    headers?: Record<string, string>;
    signal?: AbortSignal;
  }
): Promise<T> {
  const url = buildUrl(path, options?.params);

  const headers = new Headers(options?.headers);
  headers.set('X-Organization-Id', getActiveOrganizationId());

  if (options?.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    method,
    headers,
    body: options?.body && !(options.body instanceof FormData)
      ? JSON.stringify(options.body)
      : (options?.body as BodyInit | null | undefined),
    signal: options?.signal,
  });

  const text = await response.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : {};
  } catch (err) {
    throw new Error(`Failed to parse response JSON: ${text.substring(0, 100)}`);
  }

  if (!response.ok) {
    const envelope = parseApiErrorEnvelope(json, response.status);
    throw new ApiError(
      envelope.error.message,
      envelope.error.code,
      response.status,
      envelope.error.details
    );
  }

  return json as T;
}
