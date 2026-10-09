import type {
  IDataObject,
  IExecuteFunctions,
  IHookFunctions,
  IHttpRequestMethods,
  IHttpRequestOptions,
  ILoadOptionsFunctions,
  JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

export const TASKADE_API_BASE_URL = 'https://www.taskade.com/api/v2';

type TaskadeContext = IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions;

/** The credential type that the node's "Authentication" parameter selects. */
function getCredentialType(context: TaskadeContext): string {
  // Only the execute context takes an item index. Hook and load-options contexts read the node directly.
  const authentication =
    'getInputData' in context
      ? context.getNodeParameter('authentication', 0, 'accessToken')
      : context.getNodeParameter('authentication', 'accessToken');
  return authentication === 'oAuth2' ? 'taskadeOAuth2Api' : 'taskadeApi';
}

/**
 * Sends one request to the Taskade Public API v2.
 *
 * Every v2 operation is a POST with a JSON body and returns an ok-discriminated
 * envelope: `{ ok: true, ... }` on success, `{ ok: false, code, message }` on error.
 */
export async function taskadeApiRequest(
  this: TaskadeContext,
  endpoint: string,
  body: IDataObject = {},
  method: IHttpRequestMethods = 'POST',
): Promise<IDataObject> {
  const options: IHttpRequestOptions = {
    method,
    url: `${TASKADE_API_BASE_URL}${endpoint}`,
    headers: { Accept: 'application/json' },
    json: true,
  };
  if (method !== 'GET' && method !== 'DELETE') {
    options.body = body;
  }

  let response: IDataObject;
  try {
    response = (await this.helpers.httpRequestWithAuthentication.call(
      this,
      getCredentialType(this),
      options,
    )) as IDataObject;
  } catch (error) {
    throw new NodeApiError(this.getNode(), error as JsonObject);
  }

  if (response?.ok === false) {
    throw new NodeApiError(this.getNode(), response as JsonObject, {
      message: String(response.message ?? 'The Taskade API rejected the request'),
    });
  }
  return response;
}

/**
 * Collects every item of a cursor-paginated v2 list (`listTasks`), or stops at `limit`.
 * The cursor is the ID of the last item on the previous page.
 */
export async function taskadeApiRequestCursorItems(
  this: IExecuteFunctions | ILoadOptionsFunctions,
  endpoint: string,
  body: IDataObject,
  limit?: number,
): Promise<IDataObject[]> {
  const pageSize = 100;
  const items: IDataObject[] = [];
  let after: string | undefined;

  for (;;) {
    const response = await taskadeApiRequest.call(this, endpoint, {
      ...body,
      limit: pageSize,
      ...(after === undefined ? {} : { after }),
    });
    const page = (response.items as IDataObject[] | undefined) ?? [];
    items.push(...page);
    if (limit !== undefined && items.length >= limit) {
      return items.slice(0, limit);
    }
    if (page.length < pageSize) {
      return items;
    }
    after = String(page[page.length - 1].id);
  }
}

/** Collects every item of a page-numbered v2 list (`listMyProjects`, `listTemplates`), or stops at `limit`. */
export async function taskadeApiRequestPagedItems(
  this: IExecuteFunctions | ILoadOptionsFunctions,
  endpoint: string,
  body: IDataObject,
  limit?: number,
): Promise<IDataObject[]> {
  const pageSize = 100;
  const items: IDataObject[] = [];

  for (let page = 1; ; page++) {
    const response = await taskadeApiRequest.call(this, endpoint, {
      ...body,
      limit: pageSize,
      page,
    });
    const pageItems = (response.items as IDataObject[] | undefined) ?? [];
    items.push(...pageItems);
    if (limit !== undefined && items.length >= limit) {
      return items.slice(0, limit);
    }
    if (pageItems.length < pageSize) {
      return items;
    }
  }
}

/** Sends a numeric string as a number, because number fields reject a string value. */
export function toFieldValue(raw: string): string | number {
  const trimmed = raw.trim();
  const numeric = Number(trimmed);
  return trimmed !== '' && Number.isFinite(numeric) && String(numeric) === trimmed
    ? numeric
    : raw;
}
