import type {
  IDataObject,
  IExecuteFunctions,
  ILoadOptionsFunctions,
  INodeExecutionData,
  INodeListSearchResult,
  INodePropertyOptions,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { agentFields, agentOperations } from './descriptions/AgentDescription';
import { projectFields, projectOperations } from './descriptions/ProjectDescription';
import { taskFields, taskOperations } from './descriptions/TaskDescription';
import {
  folderFields,
  folderOperations,
  workspaceOperations,
} from './descriptions/WorkspaceDescription';
import {
  taskadeApiRequest,
  taskadeApiRequestCursorItems,
  taskadeApiRequestPagedItems,
  toFieldValue,
} from './GenericFunctions';

/**
 * Converts an n8n dateTime value to the `{ date, time, timezone }` object that the v2 API expects.
 * A value with `Z` or a UTC offset is an exact instant, so it is converted to the clock time in `timezone`.
 * A value without an offset is read as a clock time in `timezone`.
 */
export function toTaskadeDate(
  value: string,
  allDay: boolean,
  timezone: string,
): IDataObject | undefined {
  const trimmed = value.trim();
  const match = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}(?::\d{2})?)(?:\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/i.exec(
    trimmed,
  );
  if (match === null) {
    return undefined;
  }
  let [, date, time] = match;
  if (match[3] !== undefined) {
    const instant = new Date(trimmed);
    if (Number.isNaN(instant.getTime())) {
      return undefined;
    }
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
      })
        .formatToParts(instant)
        .map((part) => [part.type, part.value]),
    );
    date = `${parts.year}-${parts.month}-${parts.day}`;
    time = `${parts.hour}:${parts.minute}:${parts.second}`;
  }
  if (time !== undefined && time.length === 5) {
    time = `${time}:00`;
  }
  // Reject values like 2026-02-30 or 25:61: a real date and time round-trips unchanged.
  const iso = `${date}T${time ?? '00:00:00'}`;
  if (Number.isNaN(Date.parse(`${iso}Z`)) || new Date(`${iso}Z`).toISOString().slice(0, 19) !== iso) {
    return undefined;
  }
  if (allDay || time === undefined) {
    return { date };
  }
  return { date, time, timezone };
}

function matchesFilter(name: string, filter?: string): boolean {
  return filter === undefined || filter === '' || name.toLowerCase().includes(filter.toLowerCase());
}

export class Taskade implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Taskade',
    name: 'taskade',
    icon: { light: 'file:../../icons/taskade.svg', dark: 'file:../../icons/taskade.dark.svg' },
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Manage Taskade tasks, projects, and folders, and prompt Taskade AI agents',
    defaults: { name: 'Taskade' },
    usableAsTool: true,
    inputs: [NodeConnectionTypes.Main],
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
    properties: [
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
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          { name: 'Agent', value: 'agent' },
          { name: 'Folder', value: 'folder' },
          { name: 'Project', value: 'project' },
          { name: 'Task', value: 'task' },
          { name: 'Workspace', value: 'workspace' },
        ],
        default: 'task',
      },
      ...agentOperations,
      ...agentFields,
      ...folderOperations,
      ...folderFields,
      ...projectOperations,
      ...projectFields,
      ...taskOperations,
      ...taskFields,
      ...workspaceOperations,
    ],
  };

  methods = {
    listSearch: {
      async searchSpaces(
        this: ILoadOptionsFunctions,
        filter?: string,
      ): Promise<INodeListSearchResult> {
        const spaces = (await taskadeApiRequest.call(this, '/listSpaces')).items as IDataObject[];
        const results: INodeListSearchResult['results'] = [];
        for (const space of spaces ?? []) {
          const spaceName = String(space.name ?? space.id);
          if (matchesFilter(spaceName, filter)) {
            results.push({ name: spaceName, value: String(space.id) });
          }
          const folders = (
            await taskadeApiRequest.call(this, '/listFolders', { spaceId: space.id })
          ).items as IDataObject[];
          for (const folder of folders ?? []) {
            const name = `${spaceName} / ${String(folder.name ?? folder.id)}`;
            if (matchesFilter(name, filter)) {
              results.push({ name, value: String(folder.id) });
            }
          }
        }
        return { results };
      },

      async searchProjects(
        this: ILoadOptionsFunctions,
        filter?: string,
      ): Promise<INodeListSearchResult> {
        const projects = await taskadeApiRequestPagedItems.call(this, '/listMyProjects', {}, 500);
        return {
          results: projects
            .map((project) => ({
              name: String(project.name || project.id),
              value: String(project.id),
              url: `https://www.taskade.com/d/${String(project.id)}`,
            }))
            .filter((project) => matchesFilter(project.name, filter)),
        };
      },

      async searchTasks(
        this: ILoadOptionsFunctions,
        filter?: string,
      ): Promise<INodeListSearchResult> {
        const projectId = this.getCurrentNodeParameter('projectId', {
          extractValue: true,
        }) as string;
        if (!projectId) {
          return { results: [] };
        }
        const tasks = await taskadeApiRequestCursorItems.call(this, '/listTasks', { projectId }, 500);
        return {
          results: tasks
            .map((task) => ({ name: String(task.text || task.id), value: String(task.id) }))
            .filter((task) => matchesFilter(task.name, filter)),
        };
      },

      async searchAgents(
        this: ILoadOptionsFunctions,
        filter?: string,
      ): Promise<INodeListSearchResult> {
        const spaceId = this.getCurrentNodeParameter('spaceId', { extractValue: true }) as string;
        if (!spaceId) {
          return { results: [] };
        }
        const body: IDataObject = { spaceId };
        if (filter) {
          body.filterBy = { name: { operator: 'contains', value: filter } };
        }
        const agents = (await taskadeApiRequest.call(this, '/listAgents', body))
          .items as IDataObject[];
        return {
          results: (agents ?? []).map((agent) => ({
            name: String(agent.name || agent.id),
            value: String(agent.id),
          })),
        };
      },
    },

    loadOptions: {
      async getProjectMembers(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const projectId = this.getCurrentNodeParameter('projectId', {
          extractValue: true,
        }) as string;
        if (!projectId) {
          return [];
        }
        const members = await taskadeApiRequestPagedItems.call(this, '/listProjectMembers', {
          projectId,
        });
        return members.map((member) => ({
          name: member.displayName
            ? `${String(member.displayName)} (@${String(member.handle)})`
            : `@${String(member.handle)}`,
          value: String(member.handle),
        }));
      },

      async getProjectFields(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const projectId = this.getCurrentNodeParameter('projectId', {
          extractValue: true,
        }) as string;
        if (!projectId) {
          return [];
        }
        const fields = (await taskadeApiRequest.call(this, '/listFields', { projectId }))
          .items as IDataObject[];
        // The label lives inside `data`: displayName for most types, title for rating and AI fields.
        return (fields ?? []).map((field) => {
          const data = (field.data ?? {}) as IDataObject;
          return { name: String(data.displayName ?? data.title ?? field.id), value: String(field.id) };
        });
      },

      async getTemplates(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const folderId = this.getCurrentNodeParameter('spaceId', { extractValue: true }) as string;
        if (!folderId) {
          return [];
        }
        const templates = await taskadeApiRequestPagedItems.call(this, '/listTemplates', {
          folderId,
        });
        return templates.map((template) => ({
          name: String(template.name ?? template.title ?? template.id),
          value: String(template.id),
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
        const result = await executeOperation.call(this, resource, operation, i);
        const executionData = this.helpers.constructExecutionMetaData(
          this.helpers.returnJsonArray(result),
          { itemData: { item: i } },
        );
        returnData.push(...executionData);
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

async function executeOperation(
  this: IExecuteFunctions,
  resource: string,
  operation: string,
  i: number,
): Promise<IDataObject | IDataObject[]> {
  const param = <T>(name: string): T => this.getNodeParameter(name, i) as T;
  const locator = (name: string): string =>
    this.getNodeParameter(name, i, '', { extractValue: true }) as string;
  const limitOf = (): number | undefined =>
    param<boolean>('returnAll') ? undefined : param<number>('limit');
  const call = async (endpoint: string, body: IDataObject) =>
    await taskadeApiRequest.call(this, endpoint, body);

  if (resource === 'workspace' && operation === 'getMany') {
    return ((await call('/listSpaces', {})).items as IDataObject[]) ?? [];
  }

  if (resource === 'folder' && operation === 'getMany') {
    return ((await call('/listFolders', { spaceId: locator('spaceId') })).items as IDataObject[]) ?? [];
  }

  if (resource === 'project') {
    switch (operation) {
      case 'create':
        return (await call('/createProject', {
          spaceId: locator('spaceId'),
          contentType: 'text/markdown',
          content: param<string>('content'),
        })).item as IDataObject;
      case 'createFromTemplate':
        return (await call('/createProjectFromTemplate', {
          spaceId: locator('spaceId'),
          templateId: param<string>('templateId'),
        })).item as IDataObject;
      case 'copy': {
        const body: IDataObject = {
          projectId: locator('projectId'),
          destinationSpaceId: locator('spaceId'),
        };
        const projectTitle = param<string>('projectTitle');
        if (projectTitle) {
          body.projectTitle = projectTitle;
        }
        return (await call('/copyProject', body)).item as IDataObject;
      }
      case 'get':
        return (await call('/getProject', { projectId: locator('projectId') })).item as IDataObject;
      case 'getMany': {
        const projects = ((await call('/listProjects', { spaceId: locator('spaceId') }))
          .items as IDataObject[]) ?? [];
        const limit = limitOf();
        return limit === undefined ? projects : projects.slice(0, limit);
      }
      case 'complete':
        return (await call('/completeProject', { projectId: locator('projectId') }))
          .item as IDataObject;
      case 'restore':
        return (await call('/restoreProject', { projectId: locator('projectId') }))
          .item as IDataObject;
      case 'enableShareLink':
        return (await call('/enableShareLink', { projectId: locator('projectId') }))
          .item as IDataObject;
    }
  }

  if (resource === 'task') {
    const projectId = locator('projectId');
    if (operation === 'create') {
      const options = param<IDataObject>('options');
      const relativeTaskId = String(options.relativeTaskId ?? '').trim();
      const placement = String(options.placement ?? 'beforeend');
      const task: IDataObject = {
        contentType: param<string>('contentType'),
        content: param<string>('content'),
        placement,
      };
      if (relativeTaskId) {
        task.taskId = relativeTaskId;
      } else if (placement !== 'afterbegin' && placement !== 'beforeend') {
        throw new NodeOperationError(
          this.getNode(),
          'Before and After need a parent or sibling task ID',
          { itemIndex: i },
        );
      }
      const items = (await call('/createTask', { projectId, tasks: [task] }))
        .items as IDataObject[];
      return items?.[0] ?? {};
    }
    if (operation === 'getMany') {
      return await taskadeApiRequestCursorItems.call(this, '/listTasks', { projectId }, limitOf());
    }

    const taskId = locator('taskId');
    const target = { projectId, taskId };
    switch (operation) {
      case 'update':
        return (await call('/updateTask', {
          ...target,
          contentType: param<string>('contentType'),
          content: param<string>('content'),
        })).item as IDataObject;
      case 'complete':
        return (await call('/completeTask', target)).item as IDataObject;
      case 'uncomplete':
        return (await call('/uncompleteTask', target)).item as IDataObject;
      case 'delete':
        await call('/deleteTask', target);
        return { id: taskId, deleted: true };
      case 'move':
        return (await call('/moveTask', {
          ...target,
          target: { taskId: param<string>('targetTaskId'), position: param<string>('position') },
        })).item as IDataObject;
      case 'assign':
        return (await call('/assignTask', { ...target, handles: param<string[]>('handles') }))
          .item as IDataObject;
      case 'setNote':
        return {
          id: taskId,
          note: (await call('/setTaskNote', {
            ...target,
            type: param<string>('noteType'),
            value: param<string>('note'),
          })).item,
        };
      case 'setDate': {
        const options = param<IDataObject>('dateOptions');
        const allDay = options.allDay === true;
        const timezone = String(options.timezone || this.getTimezone());
        const start = toTaskadeDate(param<string>('startDate'), allDay, timezone);
        if (start === undefined) {
          throw new NodeOperationError(this.getNode(), 'Start Date is not a valid date', {
            itemIndex: i,
          });
        }
        const body: IDataObject = { ...target, start };
        if (options.endDate) {
          const end = toTaskadeDate(String(options.endDate), allDay, timezone);
          if (end === undefined) {
            throw new NodeOperationError(this.getNode(), 'End Date is not a valid date', {
              itemIndex: i,
            });
          }
          body.end = end;
        }
        return (await call('/setTaskDate', body)).item as IDataObject;
      }
      case 'setFieldValue':
        await call('/setTaskFieldValue', {
          ...target,
          fieldId: param<string>('fieldId'),
          value: toFieldValue(param<string>('value')),
        });
        return { id: taskId, fieldId: param<string>('fieldId'), success: true };
    }
  }

  if (resource === 'agent') {
    switch (operation) {
      case 'prompt': {
        const agentId = locator('agentId');
        const response = await call('/promptAgent', {
          spaceId: locator('spaceId'),
          agentId,
          prompt: param<string>('prompt'),
        });
        return { agentId, response: response.summary };
      }
      case 'generate':
        return (await call('/generateAgent', { folderId: locator('spaceId'), text: param<string>('text') }))
          .item as IDataObject;
      case 'get':
        return (await call('/getAgent', { agentId: locator('agentId') })).item as IDataObject;
      case 'getMany': {
        const agents = ((await call('/listAgents', { spaceId: locator('spaceId') }))
          .items as IDataObject[]) ?? [];
        const limit = limitOf();
        return limit === undefined ? agents : agents.slice(0, limit);
      }
      case 'addKnowledgeProject':
        return (await call('/addKnowledgeProject', {
          agentId: locator('agentId'),
          projectId: locator('projectId'),
        })).item as IDataObject;
    }
  }

  throw new NodeOperationError(
    this.getNode(),
    `The operation "${operation}" is not supported for the resource "${resource}"`,
    { itemIndex: i },
  );
}
