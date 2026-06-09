import { Bundle, ZObject } from 'zapier-platform-core';

export const BASE_V1 = 'https://www.taskade.com/api/v1';
export const BASE_V2 = 'https://www.taskade.com/api/v2';

export interface ApiResponse {
  ok?: boolean;
  message?: string;
  item?: Record<string, unknown>;
  items?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** A path relative to the API base (e.g. `/projects/123/tasks`) or a full URL. */
  path: string;
  version?: 'v1' | 'v2';
  body?: unknown;
  params?: Record<string, string | undefined>;
}

/**
 * Single Taskade request helper used by every create/search. Mirrors the auth +
 * header pattern already used in creates/createTask.ts so behaviour is identical.
 */
export const request = async (z: ZObject, bundle: Bundle, opts: RequestOptions) => {
  const base = opts.version === 'v2' ? BASE_V2 : BASE_V1;
  const url = opts.path.startsWith('http') ? opts.path : `${base}${opts.path}`;
  return z.request({
    url,
    method: opts.method,
    headers: {
      Accept: 'application/json',
      'content-type': 'application/json',
      authorization: `Bearer ${bundle.authData.access_token}`,
    },
    params: opts.params,
    body: opts.body != null ? JSON.stringify(opts.body) : undefined,
  });
};

/** Throws the Taskade error message when the API returns `{ ok: false }`, else returns the body. */
export const parseOk = (z: ZObject, data: ApiResponse): ApiResponse => {
  if (data && data.ok === false) {
    throw new z.errors.Error(data.message || 'Taskade API request failed', 'invalid_input', 400);
  }
  return data;
};
