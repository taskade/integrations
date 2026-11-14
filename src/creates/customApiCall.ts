import { Bundle, ZObject } from 'zapier-platform-core';

const TASKADE_ORIGIN = 'https://www.taskade.com';

const perform = async (z: ZObject, bundle: Bundle) => {
  const raw = String(bundle.inputData.url ?? '').trim();
  // The request carries the user's Taskade token, so it may go only to Taskade.
  // A relative path resolves against the Taskade host.
  let url: URL;
  try {
    url = new URL(raw, TASKADE_ORIGIN);
  } catch {
    throw new z.errors.Error(`"${raw}" is not a valid URL or path.`, 'invalid_input', 400);
  }
  if (url.origin !== TASKADE_ORIGIN) {
    throw new z.errors.Error(
      `The URL must be on ${TASKADE_ORIGIN}. Use a path such as /api/v2/listSpaces.`,
      'invalid_input',
      400,
    );
  }

  const method =
    (bundle.inputData.http_method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH') || 'GET';
  // The API rejects an empty body when the content type is JSON.
  const hasBody = method === 'POST' || method === 'PUT' || method === 'PATCH';

  const response = await z.request({
    url: url.toString(),
    method,
    headers: {
      Accept: 'application/json',
      'content-type': 'application/json',
      authorization: `Bearer ${bundle.authData.access_token}`,
    },
    body: bundle.inputData.body ? (bundle.inputData.body as string) : hasBody ? '{}' : undefined,
    // Don't auto-throw on 4xx/5xx: this escape hatch must surface the real
    // status + error body so power users can inspect failed calls.
    skipThrowForStatus: true,
  });

  return { status: response.status, data: response.json ?? null };
};

export default {
  key: 'custom_api_call',
  noun: 'API Call',
  display: {
    label: 'Custom API Call',
    description:
      'Makes an authenticated request to any Taskade API endpoint. For advanced users.',
    hidden: false,
  },
  operation: {
    inputFields: [
      {
        key: 'http_method',
        label: 'Method',
        type: 'string',
        choices: { GET: 'GET', POST: 'POST', PUT: 'PUT', DELETE: 'DELETE', PATCH: 'PATCH' },
        default: 'GET',
        required: true,
      },
      {
        key: 'url',
        label: 'URL or Path',
        type: 'string',
        required: true,
        helpText:
          'A path such as `/api/v2/listSpaces`, or a full `https://www.taskade.com` URL. Version 2 paths need the Method POST. See the [API docs](https://www.taskade.com/api/documentation/v2).',
      },
      {
        key: 'body',
        label: 'Body',
        type: 'text',
        required: false,
        helpText: 'Raw JSON request body (for POST/PUT/PATCH).',
      },
    ],
    perform,
    sample: { status: 200, data: {} },
    outputFields: [{ key: 'status', label: 'HTTP Status', type: 'integer' }],
  },
};
