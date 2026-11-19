import { Bundle, ZObject } from 'zapier-platform-core';

export const BASE_V1 = 'https://www.taskade.com/api/v1';
export const BASE_V2 = 'https://www.taskade.com/api/v2';

/** Rows to ask for on each page of a page-numbered list. It is the default of `GET /me/projects`. */
export const PAGE_SIZE = 100;

/**
 * The most pages that the app reads from one page-numbered list (2,000 rows at
 * PAGE_SIZE). A response that ignores the `page` parameter returns the same
 * full page every time, and this bound stops the app from asking forever.
 */
export const MAX_PAGES = 20;

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

/**
 * Turns the dropdown page that Zapier sends (`bundle.meta.page`, 0 for the
 * first page) into the `page` (1 for the first page) and `limit` parameters of
 * a page-numbered Taskade list. Returns null at MAX_PAGES and after it, so the
 * caller returns no rows and Zapier stops asking for more.
 */
export const dropdownPageParams = (bundle: Bundle): { limit: string; page: string } | null => {
  const page = Number(bundle.meta?.page ?? 0);
  if (!Number.isInteger(page) || page < 0 || page >= MAX_PAGES) {
    return null;
  }
  return { limit: String(PAGE_SIZE), page: String(page + 1) };
};

/**
 * Reads every page of a page-numbered Taskade list. It stops at the first page
 * with fewer than PAGE_SIZE rows, or after MAX_PAGES pages.
 */
export const listAllPages = async (z: ZObject, bundle: Bundle, path: string) => {
  const items: Array<Record<string, unknown>> = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const response = await request(z, bundle, {
      method: 'GET',
      path,
      params: { limit: String(PAGE_SIZE), page: String(page) },
    });
    const pageItems = parseOk(z, response.json).items ?? [];
    items.push(...pageItems);
    if (pageItems.length < PAGE_SIZE) {
      break;
    }
  }
  return items;
};

/** Throws the Taskade error message when the API returns `{ ok: false }`, else returns the body. */
export const parseOk = (z: ZObject, data: ApiResponse): ApiResponse => {
  if (data && data.ok === false) {
    throw new z.errors.Error(data.message || 'Taskade API request failed', 'invalid_input', 400);
  }
  return data;
};
