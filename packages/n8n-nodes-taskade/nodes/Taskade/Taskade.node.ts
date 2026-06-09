import type {
  IDataObject,
  IExecuteFunctions,
  ILoadOptionsFunctions,
  INodeExecutionData,
  INodePropertyOptions,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { taskadeApiList, taskadeApiRequest } from './GenericFunctions';

export class Taskade implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Taskade',
    name: 'taskade',
    icon: 'file:taskade.svg',
    group: ['output'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Work with Taskade tasks, projects, and AI agents',
    defaults: { name: 'Taskade' },
    usableAsTool: true,
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
    credentials: [{ name: 'taskadeApi', required: true }],
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          { name: 'Task', value: 'task' },
          { name: 'Project', value: 'project' },
          { name: 'AI Agent', value: 'agent' },
        ],
        default: 'task',
      },

      // ---------------------------------- task ----------------------------------
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['task'] } },
        options: [
          { name: 'Create', value: 'create', action: 'Create a task' },
          { name: 'Complete', value: 'complete', action: 'Complete a task' },
          { name: 'Uncomplete', value: 'uncomplete', action: 'Reopen a task' },
          { name: 'Update', value: 'update', action: 'Update a task' },
          { name: 'Delete', value: 'delete', action: 'Delete a task' },
          { name: 'Move', value: 'move', action: 'Move a task' },
          { name: 'Get Many', value: 'getMany', action: 'Get many tasks' },
        ],
        default: 'create',
      },
      {
        displayName: 'Project Name or ID',
        name: 'projectId',
        type: 'options',
        typeOptions: { loadOptionsMethod: 'getProjects' },
        required: true,
        default: '',
        description:
          'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
        displayOptions: { show: { resource: ['task'] } },
      },
      {
        displayName: 'Task Name or ID',
        name: 'taskId',
        type: 'options',
        typeOptions: {
          loadOptionsMethod: 'getTasks',
          loadOptionsDependsOn: ['projectId'],
        },
        required: true,
        default: '',
        description:
          'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
        displayOptions: {
          show: {
            resource: ['task'],
            operation: ['complete', 'uncomplete', 'update', 'delete', 'move'],
          },
        },
      },
      {
        displayName: 'Content',
        name: 'content',
        type: 'string',
        required: true,
        default: '',
        description: 'Task text (single line, up to 2000 characters)',
        displayOptions: { show: { resource: ['task'], operation: ['create', 'update'] } },
      },
      {
        displayName: 'Content Type',
        name: 'contentType',
        type: 'options',
        options: [
          { name: 'Markdown', value: 'text/markdown' },
          { name: 'Plain Text', value: 'text/plain' },
        ],
        default: 'text/markdown',
        displayOptions: { show: { resource: ['task'], operation: ['create', 'update'] } },
      },
      {
        displayName: 'Target Task Name or ID',
        name: 'targetTaskId',
        type: 'options',
        typeOptions: {
          loadOptionsMethod: 'getTasks',
          loadOptionsDependsOn: ['projectId'],
        },
        required: true,
        default: '',
        description:
          'The task to position relative to. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
        displayOptions: { show: { resource: ['task'], operation: ['move'] } },
      },
      {
        displayName: 'Position',
        name: 'position',
        type: 'options',
        options: [
          { name: 'Before (Sibling, Above)', value: 'beforebegin' },
          { name: 'Inside (First Child)', value: 'afterbegin' },
          { name: 'Inside (Last Child)', value: 'beforeend' },
          { name: 'After (Sibling, Below)', value: 'afterend' },
        ],
        default: 'afterend',
        displayOptions: { show: { resource: ['task'], operation: ['move'] } },
      },

      // -------------------------------- project ---------------------------------
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['project'] } },
        options: [
          { name: 'Create', value: 'create', action: 'Create a project' },
          {
            name: 'Create From Template',
            value: 'createFromTemplate',
            action: 'Create a project from a template',
          },
          { name: 'Get Many', value: 'getMany', action: 'Get many projects' },
        ],
        default: 'create',
      },
      {
        displayName: 'Folder Name or ID',
        name: 'folderId',
        type: 'options',
        typeOptions: { loadOptionsMethod: 'getFolders' },
        required: true,
        default: '',
        description:
          'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
        displayOptions: {
          show: { resource: ['project'], operation: ['create', 'createFromTemplate'] },
        },
      },
      {
        displayName: 'Content',
        name: 'content',
        type: 'string',
        typeOptions: { rows: 4 },
        required: true,
        default: '',
        description: 'Markdown content for the new project (first line becomes the title)',
        displayOptions: { show: { resource: ['project'], operation: ['create'] } },
      },
      {
        displayName: 'Template Name or ID',
        name: 'templateId',
        type: 'options',
        typeOptions: {
          loadOptionsMethod: 'getProjectTemplates',
          loadOptionsDependsOn: ['folderId'],
        },
        required: true,
        default: '',
        description:
          'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
        displayOptions: { show: { resource: ['project'], operation: ['createFromTemplate'] } },
      },

      // --------------------------------- agent ----------------------------------
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['agent'] } },
        options: [{ name: 'Prompt', value: 'prompt', action: 'Prompt an AI agent' }],
        default: 'prompt',
      },
      {
        displayName: 'Workspace ID',
        name: 'spaceId',
        type: 'string',
        required: true,
        default: '',
        description: 'The workspace the agent belongs to',
        displayOptions: { show: { resource: ['agent'], operation: ['prompt'] } },
      },
      {
        displayName: 'Agent ID',
        name: 'agentId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['agent'], operation: ['prompt'] } },
      },
      {
        displayName: 'Prompt',
        name: 'prompt',
        type: 'string',
        typeOptions: { rows: 3 },
        required: true,
        default: '',
        displayOptions: { show: { resource: ['agent'], operation: ['prompt'] } },
      },
    ],
  };

  methods = {
    loadOptions: {
      async getProjects(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const items = await taskadeApiList.call(this, '/me/projects');
        return items.map((p) => ({
          name: String(p.name ?? p.id),
          value: String(p.id),
        }));
      },
      async getFolders(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const workspaces = await taskadeApiList.call(this, '/workspaces');
        const options: INodePropertyOptions[] = [];
        for (const workspace of workspaces) {
          const folders = await taskadeApiList.call(this, `/workspaces/${workspace.id}/folders`);
          for (const folder of folders) {
            options.push({
              name: `${workspace.name} > ${folder.name}`,
              value: String(folder.id),
            });
          }
        }
        return options;
      },
      async getTasks(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const projectId = this.getCurrentNodeParameter('projectId') as string;
        if (!projectId) {
          return [];
        }
        const items = await taskadeApiList.call(this, `/projects/${projectId}/tasks`, {
          limit: 100,
        });
        return items.map((t) => ({
          name: String(t.text ?? t.content ?? t.id),
          value: String(t.id),
        }));
      },
      async getProjectTemplates(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const folderId = this.getCurrentNodeParameter('folderId') as string;
        if (!folderId) {
          return [];
        }
        const items = await taskadeApiList.call(this, `/folders/${folderId}/project-templates`);
        return items.map((t) => ({
          name: String(t.name ?? t.title ?? t.id),
          value: String(t.id),
        }));
      },
    },
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const resource = this.getNodeParameter('resource', 0) as string;
    const operation = this.getNodeParameter('operation', 0) as string;

    for (let i = 0; i < items.length; i++) {
      try {
        let responseData: IDataObject = {};

        if (resource === 'task') {
          const projectId = this.getNodeParameter('projectId', i) as string;

          if (operation === 'create') {
            const response = await taskadeApiRequest.call(
              this,
              'POST',
              `/projects/${projectId}/tasks`,
              {
                tasks: [
                  {
                    contentType: this.getNodeParameter('contentType', i) as string,
                    content: this.getNodeParameter('content', i) as string,
                    placement: 'beforeend',
                  },
                ],
              },
            );
            responseData = ((response.item as IDataObject[]) ?? [])[0] ?? response;
          } else if (operation === 'getMany') {
            const tasks = await taskadeApiList.call(this, `/projects/${projectId}/tasks`, {
              limit: 100,
            });
            responseData = { items: tasks };
          } else {
            const taskId = this.getNodeParameter('taskId', i) as string;
            if (operation === 'complete' || operation === 'uncomplete') {
              responseData = await taskadeApiRequest.call(
                this,
                'POST',
                `/projects/${projectId}/tasks/${taskId}/${operation}`,
                {},
              );
            } else if (operation === 'update') {
              responseData = await taskadeApiRequest.call(
                this,
                'PUT',
                `/projects/${projectId}/tasks/${taskId}`,
                {
                  contentType: this.getNodeParameter('contentType', i) as string,
                  content: this.getNodeParameter('content', i) as string,
                },
              );
            } else if (operation === 'delete') {
              responseData = await taskadeApiRequest.call(
                this,
                'DELETE',
                `/projects/${projectId}/tasks/${taskId}`,
              );
            } else if (operation === 'move') {
              responseData = await taskadeApiRequest.call(
                this,
                'PUT',
                `/projects/${projectId}/tasks/${taskId}/move`,
                {
                  target: {
                    taskId: this.getNodeParameter('targetTaskId', i) as string,
                    position: this.getNodeParameter('position', i) as string,
                  },
                },
              );
            }
          }
        } else if (resource === 'project') {
          if (operation === 'create') {
            responseData = await taskadeApiRequest.call(this, 'POST', '/projects', {
              folderId: this.getNodeParameter('folderId', i) as string,
              contentType: 'text/markdown',
              content: this.getNodeParameter('content', i) as string,
            });
          } else if (operation === 'createFromTemplate') {
            responseData = await taskadeApiRequest.call(this, 'POST', '/projects/from-template', {
              folderId: this.getNodeParameter('folderId', i) as string,
              templateId: this.getNodeParameter('templateId', i) as string,
            });
          } else if (operation === 'getMany') {
            const projects = await taskadeApiList.call(this, '/me/projects');
            responseData = { items: projects };
          }
        } else if (resource === 'agent') {
          if (operation === 'prompt') {
            responseData = await taskadeApiRequest.call(
              this,
              'POST',
              '/promptAgent',
              {
                spaceId: this.getNodeParameter('spaceId', i) as string,
                agentId: this.getNodeParameter('agentId', i) as string,
                prompt: this.getNodeParameter('prompt', i) as string,
              },
              'v2',
            );
          }
        }

        returnData.push({ json: responseData, pairedItem: { item: i } });
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
          continue;
        }
        throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
      }
    }

    return [returnData];
  }
}
