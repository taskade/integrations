import type { INodeProperties } from 'n8n-workflow';

type DisplayOptions = INodeProperties['displayOptions'];

/** A workspace or a folder. Taskade accepts either ID wherever the v2 API asks for a space. */
export function spaceLocator(
  displayOptions: DisplayOptions,
  overrides: Partial<INodeProperties> = {},
): INodeProperties {
  return {
    displayName: 'Workspace or Folder',
    name: 'spaceId',
    type: 'resourceLocator',
    default: { mode: 'list', value: '' },
    required: true,
    description: 'The workspace or folder to use',
    modes: [
      {
        displayName: 'From List',
        name: 'list',
        type: 'list',
        typeOptions: { searchListMethod: 'searchSpaces', searchable: true },
      },
      {
        displayName: 'By ID',
        name: 'id',
        type: 'string',
        placeholder: 'e.g. 8pVZCzz6ubkbhxkS',
      },
    ],
    displayOptions,
    ...overrides,
  };
}

export function projectLocator(displayOptions: DisplayOptions): INodeProperties {
  return {
    displayName: 'Project',
    name: 'projectId',
    type: 'resourceLocator',
    default: { mode: 'list', value: '' },
    required: true,
    description: 'The project to use. The list shows the projects you viewed most recently.',
    modes: [
      {
        displayName: 'From List',
        name: 'list',
        type: 'list',
        typeOptions: { searchListMethod: 'searchProjects', searchable: true },
      },
      {
        displayName: 'By URL',
        name: 'url',
        type: 'string',
        placeholder: 'e.g. https://www.taskade.com/d/F6Rsgnp1h8sd5w5Q',
        extractValue: { type: 'regex', regex: 'taskade\\.com\\/d\\/([a-zA-Z0-9]+)' },
        validation: [
          {
            type: 'regex',
            properties: {
              regex: '.*taskade\\.com\\/d\\/([a-zA-Z0-9]+).*',
              errorMessage: 'Not a valid Taskade project URL',
            },
          },
        ],
      },
      {
        displayName: 'By ID',
        name: 'id',
        type: 'string',
        placeholder: 'e.g. F6Rsgnp1h8sd5w5Q',
      },
    ],
    displayOptions,
  };
}

export function taskLocator(displayOptions: DisplayOptions): INodeProperties {
  return {
    displayName: 'Task',
    name: 'taskId',
    type: 'resourceLocator',
    default: { mode: 'list', value: '' },
    required: true,
    description: 'The task to use',
    modes: [
      {
        displayName: 'From List',
        name: 'list',
        type: 'list',
        typeOptions: { searchListMethod: 'searchTasks', searchable: true },
      },
      {
        displayName: 'By ID',
        name: 'id',
        type: 'string',
        placeholder: 'e.g. 3f1c2d5e-1b2a-4c3d-9e8f-0a1b2c3d4e5f',
      },
    ],
    displayOptions,
  };
}

export function agentLocator(displayOptions: DisplayOptions): INodeProperties {
  return {
    displayName: 'Agent',
    name: 'agentId',
    type: 'resourceLocator',
    default: { mode: 'list', value: '' },
    required: true,
    description: 'The AI agent to use',
    modes: [
      {
        displayName: 'From List',
        name: 'list',
        type: 'list',
        typeOptions: { searchListMethod: 'searchAgents', searchable: true },
      },
      {
        displayName: 'By ID',
        name: 'id',
        type: 'string',
        placeholder: 'e.g. 8YhDrxGRF4Gr3pUH',
      },
    ],
    displayOptions,
  };
}

export function returnAllAndLimit(displayOptions: DisplayOptions): INodeProperties[] {
  return [
    {
      displayName: 'Return All',
      name: 'returnAll',
      type: 'boolean',
      default: false,
      description: 'Whether to return all results or only up to a given limit',
      displayOptions,
    },
    {
      displayName: 'Limit',
      name: 'limit',
      type: 'number',
      typeOptions: { minValue: 1 },
      default: 50,
      description: 'Max number of results to return',
      displayOptions: {
        ...displayOptions,
        show: { ...displayOptions?.show, returnAll: [false] },
      },
    },
  ];
}
