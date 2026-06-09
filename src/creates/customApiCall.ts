import { Bundle, ZObject } from 'zapier-platform-core';

const perform = async (z: ZObject, bundle: Bundle) => {
  const raw = bundle.inputData.url as string;
  const url = raw.startsWith('http')
    ? raw
    : `https://www.taskade.com${raw.startsWith('/') ? '' : '/'}${raw}`;

  const method =
    (bundle.inputData.http_method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH') || 'GET';

  const response = await z.request({
    url,
    method,
    headers: {
      Accept: 'application/json',
      'content-type': 'application/json',
      authorization: `Bearer ${bundle.authData.access_token}`,
    },
    body: bundle.inputData.body ? (bundle.inputData.body as string) : undefined,
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
      'Make an authenticated request to any Taskade API endpoint. Advanced — see developer.taskade.com.',
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
        helpText: 'A full URL, or a path such as `/api/v1/me/projects`.',
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
