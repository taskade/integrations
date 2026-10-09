import { createHmac, timingSafeEqual } from 'crypto';
import type {
  IDataObject,
  IHookFunctions,
  ILoadOptionsFunctions,
  INodePropertyOptions,
  INodeType,
  INodeTypeDescription,
  IWebhookFunctions,
  IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { taskadeApiRequest } from '../Taskade/GenericFunctions';

/**
 * Checks the `X-Taskade-Signature` header of a delivery.
 * Taskade signs the raw JSON body: `sha256=` + hex(HMAC-SHA256(secret, rawBody)).
 */
export function isValidSignature(
  secret: string,
  rawBody: Buffer | string,
  header: string | undefined,
): boolean {
  if (!header) {
    return false;
  }
  const expected = `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`;
  const expectedBuffer = Buffer.from(expected);
  const headerBuffer = Buffer.from(header);
  return (
    expectedBuffer.length === headerBuffer.length && timingSafeEqual(expectedBuffer, headerBuffer)
  );
}

/** The ID of a registered webhook is its target URL, URL-encoded in the path. */
function webhookPath(targetUrl: string): string {
  return `/webhooks/${encodeURIComponent(targetUrl)}`;
}

export class TaskadeTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Taskade Trigger',
    name: 'taskadeTrigger',
    icon: { light: 'file:../../icons/taskade.svg', dark: 'file:../../icons/taskade.dark.svg' },
    group: ['trigger'],
    version: 1,
    subtitle: '={{$parameter["event"]}}',
    description: 'Starts the workflow when an event happens in Taskade',
    defaults: { name: 'Taskade Trigger' },
    inputs: [],
    outputs: [NodeConnectionTypes.Main],
    credentials: [
      {
        name: 'taskadeApi',
        required: true,
        displayOptions: { show: { authentication: ['accessToken'] } },
      },
      {
        name: 'taskadeOAuth2Api',
        required: true,
        displayOptions: { show: { authentication: ['oAuth2'] } },
      },
    ],
    webhooks: [
      {
        name: 'default',
        httpMethod: 'POST',
        responseMode: 'onReceived',
        path: 'webhook',
      },
    ],
    properties: [
      {
        displayName:
          'Taskade sends webhooks on the Pro plan and higher, and only to an HTTPS URL. Your n8n instance must be reachable over HTTPS.',
        name: 'notice',
        type: 'notice',
        default: '',
      },
      {
        displayName: 'Authentication',
        name: 'authentication',
        type: 'options',
        options: [
          { name: 'Access Token', value: 'accessToken' },
          { name: 'OAuth2', value: 'oAuth2' },
        ],
        default: 'accessToken',
      },
      {
        displayName: 'Event',
        name: 'event',
        type: 'options',
        options: [
          { name: 'Comment Created', value: 'comment.created', description: 'A comment is added to a task' },
          { name: 'Member Joined Project', value: 'project.joined', description: 'A member joins a project' },
          { name: 'Project Assigned', value: 'project.assigned', description: 'A project is assigned to a member' },
          { name: 'Project Created', value: 'project.created', description: 'A project is created' },
          { name: 'Task Assigned', value: 'task.assigned', description: 'A task is assigned to a member' },
          { name: 'Task Due', value: 'task.due', description: 'A task reaches its due date' },
        ],
        default: 'task.due',
        required: true,
        description: 'The Taskade event that starts the workflow',
      },
      {
        displayName: 'Workspace or Folder Names or IDs',
        name: 'spaceIds',
        type: 'multiOptions',
        typeOptions: { loadOptionsMethod: 'getSpaces' },
        default: [],
        description:
          'Only fire for events in these workspaces or folders. A workspace does not include its folders, so select each folder too. Leave empty to fire for everything. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
      },
    ],
  };

  methods = {
    loadOptions: {
      async getSpaces(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const spaces = (await taskadeApiRequest.call(this, '/listSpaces')).items as IDataObject[];
        const options: INodePropertyOptions[] = [];
        for (const space of spaces ?? []) {
          const spaceName = String(space.name ?? space.id);
          options.push({ name: spaceName, value: String(space.id) });
          const folders = (await taskadeApiRequest.call(this, '/listFolders', { spaceId: space.id }))
            .items as IDataObject[];
          for (const folder of folders ?? []) {
            options.push({
              name: `${spaceName} / ${String(folder.name ?? folder.id)}`,
              value: String(folder.id),
            });
          }
        }
        return options;
      },
    },
  };

  webhookMethods = {
    default: {
      async checkExists(this: IHookFunctions): Promise<boolean> {
        const staticData = this.getWorkflowStaticData('node');
        const targetUrl = this.getNodeWebhookUrl('default') as string;
        const registered = (await taskadeApiRequest.call(this, '/webhooks', {}, 'GET'))
          .items as IDataObject[];
        const exists = (registered ?? []).some((webhook) => webhook.url === targetUrl);
        if (exists && typeof staticData.secret === 'string') {
          return true;
        }
        if (exists) {
          // Registered, but this workflow no longer has the signing secret, so it
          // cannot verify deliveries. Remove it and let create() register it again.
          await taskadeApiRequest.call(this, webhookPath(targetUrl), {}, 'DELETE');
        }
        delete staticData.secret;
        return false;
      },

      async create(this: IHookFunctions): Promise<boolean> {
        const targetUrl = this.getNodeWebhookUrl('default') as string;
        const spaceIds = this.getNodeParameter('spaceIds', []) as string[];
        const response = await taskadeApiRequest.call(this, '/webhooks', {
          targetUrl,
          events: [this.getNodeParameter('event') as string],
          spaceIds,
        });
        if (typeof response.secret !== 'string') {
          return false;
        }
        this.getWorkflowStaticData('node').secret = response.secret;
        return true;
      },

      async delete(this: IHookFunctions): Promise<boolean> {
        const targetUrl = this.getNodeWebhookUrl('default') as string;
        // DELETE answers { ok: true, deleted: false } when the webhook is already gone.
        await taskadeApiRequest.call(this, webhookPath(targetUrl), {}, 'DELETE');
        delete this.getWorkflowStaticData('node').secret;
        return true;
      },
    },
  };

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    const secret = this.getWorkflowStaticData('node').secret;
    const body = this.getBodyData() as IDataObject;
    const signature = this.getHeaderData()['x-taskade-signature'] as string | undefined;
    // Taskade signs JSON.stringify(payload). When n8n keeps no raw body, the same
    // serialization of the parsed body gives the same bytes.
    const rawBody =
      (this.getRequestObject() as unknown as { rawBody?: Buffer }).rawBody ?? JSON.stringify(body);

    if (typeof secret !== 'string' || !isValidSignature(secret, rawBody, signature)) {
      const response = this.getResponseObject();
      response.status(401).json({ ok: false, message: 'Invalid signature' });
      return { noWebhookResponse: true };
    }

    return {
      workflowData: [this.helpers.returnJsonArray(body)],
    };
  }
}
