import type {
  IExecuteFunctions,
  IHttpRequestMethods,
  IHttpRequestOptions,
  ILoadOptionsFunctions,
  IDataObject,
} from 'n8n-workflow';

const BASE_V1 = 'https://www.taskade.com/api/v1';
const BASE_V2 = 'https://www.taskade.com/api/v2';

export async function taskadeApiRequest(
  this: IExecuteFunctions | ILoadOptionsFunctions,
  method: IHttpRequestMethods,
  path: string,
  body?: IDataObject,
  version: 'v1' | 'v2' = 'v1',
  qs?: IDataObject,
): Promise<IDataObject> {
  const options: IHttpRequestOptions = {
    method,
    url: `${version === 'v2' ? BASE_V2 : BASE_V1}${path}`,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body,
    qs,
    json: true,
  };
  if (body === undefined) {
    delete options.body;
  }
  return (await this.helpers.httpRequestWithAuthentication.call(
    this,
    'taskadeApi',
    options,
  )) as IDataObject;
}

/** Returns `items` from a Taskade `{ ok, items }` response, tolerating absent fields. */
export async function taskadeApiList(
  this: IExecuteFunctions | ILoadOptionsFunctions,
  path: string,
  qs?: IDataObject,
): Promise<IDataObject[]> {
  const response = await taskadeApiRequest.call(this, 'GET', path, undefined, 'v1', qs);
  return (response.items as IDataObject[]) ?? [];
}
