import type { INodeProperties } from 'n8n-workflow';

import { projectLocator, returnAllAndLimit, spaceLocator } from './SharedFields';

const show = (operation: string[]) => ({ show: { resource: ['project'], operation } });

export const projectOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['project'] } },
    options: [
      { name: 'Complete', value: 'complete', action: 'Complete a project', description: 'Mark a project as completed (archived)' },
      { name: 'Copy', value: 'copy', action: 'Copy a project', description: 'Copy a project to a workspace or folder' },
      { name: 'Create', value: 'create', action: 'Create a project', description: 'Create a project from Markdown' },
      { name: 'Create From Template', value: 'createFromTemplate', action: 'Create a project from a template', description: 'Create a project from a custom template' },
      { name: 'Enable Share Link', value: 'enableShareLink', action: 'Enable the share link of a project', description: 'Turn on the share link and return its URLs' },
      { name: 'Get', value: 'get', action: 'Get a project', description: 'Get a project by ID' },
      { name: 'Get Many', value: 'getMany', action: 'Get many projects', description: 'List the projects in a workspace or folder' },
      { name: 'Restore', value: 'restore', action: 'Restore a project', description: 'Restore a completed (archived) project' },
    ],
    default: 'create',
  },
];

export const projectFields: INodeProperties[] = [
  spaceLocator(show(['create', 'createFromTemplate', 'getMany'])),
  spaceLocator(show(['copy']), {
    displayName: 'Destination Workspace or Folder',
    description: 'Where to put the copy',
  }),
  projectLocator(show(['complete', 'copy', 'enableShareLink', 'get', 'restore'])),

  // create
  {
    displayName: 'Content',
    name: 'content',
    type: 'string',
    typeOptions: { rows: 6 },
    required: true,
    default: '',
    placeholder: '# Launch plan\n- Draft the brief\n- Book the venue',
    description: 'Markdown content of the project. The first heading becomes the project title.',
    displayOptions: show(['create']),
  },

  // createFromTemplate
  {
    displayName: 'Template Name or ID',
    name: 'templateId',
    type: 'options',
    typeOptions: { loadOptionsMethod: 'getTemplates', loadOptionsDependsOn: ['spaceId.value'] },
    required: true,
    default: '',
    description:
      'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
    displayOptions: show(['createFromTemplate']),
  },

  // copy
  {
    displayName: 'Title',
    name: 'projectTitle',
    type: 'string',
    default: '',
    description: 'Title of the copy. Leave empty to keep the original title.',
    displayOptions: show(['copy']),
  },

  // getMany
  ...returnAllAndLimit(show(['getMany'])),
];
