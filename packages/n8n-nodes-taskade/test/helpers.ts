import type { IDataObject, IHttpRequestOptions } from 'n8n-workflow';

export interface RecordedCall {
  credentialType: string;
  method: string;
  url: string;
  body: IDataObject | undefined;
}

/**
 * A minimal stand-in for the n8n execute, hook, and load-options contexts.
 * `responder` returns the API response for each request, by v2 endpoint path.
 */
export function createContext(
  params: Record<string, unknown>,
  responder: (path: string, body: IDataObject | undefined, method: string) => unknown = () => ({
    ok: true,
  }),
  extra: Record<string, unknown> = {},
) {
  const calls: RecordedCall[] = [];
  const staticData: IDataObject = {};

  const lookup = (name: string, fallback?: unknown) => {
    const root = name.split('.')[0];
    return root in params ? params[root] : fallback;
  };

  const context = {
    calls,
    staticData,
    getNode: () => ({ name: 'Taskade', type: 'n8n-nodes-taskade.taskade', typeVersion: 1, parameters: {} }),
    getInputData: () => [{ json: {} }],
    continueOnFail: () => false,
    getTimezone: () => 'America/New_York',
    getNodeParameter: (name: string, ...rest: unknown[]) =>
      typeof rest[0] === 'number' ? lookup(name, rest[1]) : lookup(name, rest[0]),
    getCurrentNodeParameter: (name: string) => lookup(name),
    getWorkflowStaticData: () => staticData,
    getNodeWebhookUrl: () => 'https://n8n.example.com/webhook/abc/webhook',
    helpers: {
      httpRequestWithAuthentication: async (credentialType: string, options: IHttpRequestOptions) => {
        const path = String(options.url).replace('https://www.taskade.com/api/v2', '');
        const body = options.body as IDataObject | undefined;
        calls.push({ credentialType, method: String(options.method), url: path, body });
        return responder(path, body, String(options.method));
      },
      returnJsonArray: (data: IDataObject | IDataObject[]) =>
        (Array.isArray(data) ? data : [data]).map((json) => ({ json })),
      constructExecutionMetaData: (data: Array<{ json: IDataObject }>, options: { itemData: { item: number } }) =>
        data.map((entry) => ({ ...entry, pairedItem: options.itemData })),
    },
    ...extra,
  };
  return context;
}
