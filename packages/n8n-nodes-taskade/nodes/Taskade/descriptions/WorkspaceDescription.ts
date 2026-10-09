import type { INodeProperties } from 'n8n-workflow';

import { spaceLocator } from './SharedFields';

export const workspaceOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['workspace'] } },
    options: [
      { name: 'Get Many', value: 'getMany', action: 'Get many workspaces', description: 'List the workspaces you belong to' },
    ],
    default: 'getMany',
  },
];

export const folderOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['folder'] } },
    options: [
      { name: 'Get Many', value: 'getMany', action: 'Get many folders', description: 'List the folders in a workspace' },
    ],
    default: 'getMany',
  },
];

export const folderFields: INodeProperties[] = [
  spaceLocator(
    { show: { resource: ['folder'], operation: ['getMany'] } },
    { displayName: 'Workspace', description: 'The workspace to list folders for' },
  ),
];
