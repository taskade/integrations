import type {
  IDataObject,
  IHookFunctions,
  INodeType,
  INodeTypeDescription,
  IWebhookFunctions,
  IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { taskadeApiRequest } from './GenericFunctions';

export class TaskadeTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Taskade Trigger',
    name: 'taskadeTrigger',
    icon: 'file:taskade.svg',
    group: ['trigger'],
    version: 1,
    subtitle: '={{$parameter["event"]}}',
    description: 'Starts a workflow when something happens in Taskade',
    defaults: { name: 'Taskade Trigger' },
    inputs: [],
    outputs: [NodeConnectionTypes.Main],
    credentials: [{ name: 'taskadeApi', required: true }],
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
        displayName: 'Event',
        name: 'event',
        type: 'options',
        options: [
          { name: 'Comment Created', value: 'comment.created' },
          { name: 'Member Joined Project', value: 'project.joined' },
          { name: 'Project Assigned', value: 'project.assigned' },
          { name: 'Project Created', value: 'project.created' },
          { name: 'Task Assigned', value: 'task.assigned' },
          { name: 'Task Due', value: 'task.due' },
        ],
        default: 'task.due',
        required: true,
        description: 'The Taskade event that starts the workflow',
      },
    ],
  };

  webhookMethods = {
    default: {
      async checkExists(this: IHookFunctions): Promise<boolean> {
        return this.getWorkflowStaticData('node').hookId != null;
      },
      async create(this: IHookFunctions): Promise<boolean> {
        const response = await taskadeApiRequest.call(
          this as never,
          'POST',
          '/subscribeWebhook',
          {
            targetUrl: this.getNodeWebhookUrl('default') as string,
            triggerType: this.getNodeParameter('event') as string,
          },
          'v2',
        );
        const hookId = (response as IDataObject).hookId;
        if (hookId == null) {
          return false;
        }
        this.getWorkflowStaticData('node').hookId = hookId;
        return true;
      },
      async delete(this: IHookFunctions): Promise<boolean> {
        const staticData = this.getWorkflowStaticData('node');
        if (staticData.hookId == null) {
          return true;
        }
        try {
          await taskadeApiRequest.call(
            this as never,
            'POST',
            '/unsubscribeWebhook',
            { hookId: staticData.hookId as string },
            'v2',
          );
        } catch {
          // Hook may already be gone server-side; always clear local state so
          // a future activation re-subscribes instead of silently never firing.
        }
        delete staticData.hookId;
        return true;
      },
    },
  };

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    const body = this.getBodyData();
    return {
      workflowData: [this.helpers.returnJsonArray(body as IDataObject)],
    };
  }
}
