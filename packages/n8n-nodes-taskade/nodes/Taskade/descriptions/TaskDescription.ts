import type { INodeProperties } from 'n8n-workflow';

import { projectLocator, returnAllAndLimit, taskLocator } from './SharedFields';

const show = (operation: string[]) => ({ show: { resource: ['task'], operation } });

const contentTypeOptions = [
  { name: 'Markdown', value: 'text/markdown' },
  { name: 'Plain Text', value: 'text/plain' },
];

export const taskOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['task'] } },
    options: [
      { name: 'Assign', value: 'assign', action: 'Assign users to a task', description: 'Add assignees to a task' },
      { name: 'Complete', value: 'complete', action: 'Complete a task', description: 'Mark a task as complete' },
      { name: 'Create', value: 'create', action: 'Create a task', description: 'Create a task in a project' },
      { name: 'Delete', value: 'delete', action: 'Delete a task', description: 'Delete a task and its subtasks' },
      { name: 'Get Many', value: 'getMany', action: 'Get many tasks', description: 'List the tasks in a project' },
      { name: 'Move', value: 'move', action: 'Move a task', description: 'Move a task inside its project' },
      { name: 'Reopen', value: 'uncomplete', action: 'Reopen a task', description: 'Mark a task as incomplete' },
      { name: 'Set Custom Field', value: 'setFieldValue', action: 'Set a custom field on a task', description: 'Set the value of a custom field on a task' },
      { name: 'Set Date', value: 'setDate', action: 'Set the date of a task', description: 'Create or update the start and end date of a task' },
      { name: 'Set Note', value: 'setNote', action: 'Set the note of a task', description: 'Create or replace the note of a task' },
      { name: 'Update', value: 'update', action: 'Update a task', description: 'Replace the text of a task' },
    ],
    default: 'create',
  },
];

export const taskFields: INodeProperties[] = [
  projectLocator({ show: { resource: ['task'] } }),
  taskLocator(
    show(['assign', 'complete', 'delete', 'move', 'setDate', 'setFieldValue', 'setNote', 'uncomplete', 'update']),
  ),

  // create, update
  {
    displayName: 'Content',
    name: 'content',
    type: 'string',
    typeOptions: { rows: 2 },
    required: true,
    default: '',
    description: 'The text of the task, up to 2000 characters',
    displayOptions: show(['create']),
  },
  {
    displayName: 'Content',
    name: 'content',
    type: 'string',
    required: true,
    default: '',
    description: 'The new text of the task. Single line, up to 2000 characters.',
    displayOptions: show(['update']),
  },
  {
    displayName: 'Content Type',
    name: 'contentType',
    type: 'options',
    options: contentTypeOptions,
    default: 'text/markdown',
    displayOptions: show(['create', 'update']),
  },
  {
    displayName: 'Options',
    name: 'options',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: show(['create']),
    options: [
      {
        displayName: 'Parent or Sibling Task ID',
        name: 'relativeTaskId',
        type: 'string',
        default: '',
        description: 'Position the new task relative to this task. Leave empty to add it to the project root.',
      },
      {
        displayName: 'Position',
        name: 'placement',
        type: 'options',
        options: [
          { name: 'After (Sibling, Below)', value: 'afterend' },
          { name: 'Before (Sibling, Above)', value: 'beforebegin' },
          { name: 'First Child', value: 'afterbegin' },
          { name: 'Last Child', value: 'beforeend' },
        ],
        default: 'beforeend',
        description: 'Where to put the task. Without a parent or sibling task, only First Child and Last Child apply (to the project root).',
      },
    ],
  },

  // move
  {
    displayName: 'Target Task ID',
    name: 'targetTaskId',
    type: 'string',
    required: true,
    default: '',
    description: 'The task to move relative to',
    displayOptions: show(['move']),
  },
  {
    displayName: 'Position',
    name: 'position',
    type: 'options',
    options: [
      { name: 'After (Sibling, Below)', value: 'afterend' },
      { name: 'Before (Sibling, Above)', value: 'beforebegin' },
      { name: 'First Child', value: 'afterbegin' },
      { name: 'Last Child', value: 'beforeend' },
    ],
    default: 'afterend',
    displayOptions: show(['move']),
  },

  // assign
  {
    displayName: 'Assignee Names or IDs',
    name: 'handles',
    type: 'multiOptions',
    typeOptions: { loadOptionsMethod: 'getProjectMembers', loadOptionsDependsOn: ['projectId.value'] },
    required: true,
    default: [],
    description:
      'The members to assign. Existing assignees stay assigned. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    displayOptions: show(['assign']),
  },

  // setNote
  {
    displayName: 'Note',
    name: 'note',
    type: 'string',
    required: true,
    default: '',
    description: 'The note text, on a single line. It replaces the current note.',
    displayOptions: show(['setNote']),
  },
  {
    displayName: 'Note Type',
    name: 'noteType',
    type: 'options',
    options: contentTypeOptions,
    default: 'text/markdown',
    displayOptions: show(['setNote']),
  },

  // setDate
  {
    displayName: 'Start Date',
    name: 'startDate',
    type: 'dateTime',
    required: true,
    default: '',
    description: 'The start or due date of the task',
    displayOptions: show(['setDate']),
  },
  {
    displayName: 'Date Options',
    name: 'dateOptions',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: show(['setDate']),
    options: [
      {
        displayName: 'All Day',
        name: 'allDay',
        type: 'boolean',
        default: false,
        description: 'Whether to send only the date part, without a time',
      },
      {
        displayName: 'End Date',
        name: 'endDate',
        type: 'dateTime',
        default: '',
        description: 'The end date of the task',
      },
      {
        displayName: 'Timezone',
        name: 'timezone',
        type: 'string',
        default: '',
        placeholder: 'e.g. America/New_York',
        description: 'IANA timezone name. Leave empty to use the timezone of the workflow.',
      },
    ],
  },

  // setFieldValue
  {
    displayName: 'Custom Field Name or ID',
    name: 'fieldId',
    type: 'options',
    typeOptions: { loadOptionsMethod: 'getProjectFields', loadOptionsDependsOn: ['projectId.value'] },
    required: true,
    default: '',
    description:
      'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
    displayOptions: show(['setFieldValue']),
  },
  {
    displayName: 'Value',
    name: 'value',
    type: 'string',
    required: true,
    default: '',
    description:
      'The value to set. A numeric value is sent as a number. A select field takes the option ID, not its label.',
    displayOptions: show(['setFieldValue']),
  },

  // getMany
  ...returnAllAndLimit(show(['getMany'])),
];
