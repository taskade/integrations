import type { INodeProperties } from 'n8n-workflow';

import { agentLocator, projectLocator, returnAllAndLimit, spaceLocator } from './SharedFields';

const show = (operation: string[]) => ({ show: { resource: ['agent'], operation } });

export const agentOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['agent'] } },
    options: [
      { name: 'Add Project Knowledge', value: 'addKnowledgeProject', action: 'Add a project as agent knowledge', description: 'Add a project to the knowledge of an agent' },
      { name: 'Generate', value: 'generate', action: 'Generate an agent', description: 'Create an agent from a plain-language description' },
      { name: 'Get', value: 'get', action: 'Get an agent', description: 'Get an agent by ID' },
      { name: 'Get Many', value: 'getMany', action: 'Get many agents', description: 'List the agents in a workspace or folder' },
      { name: 'Prompt', value: 'prompt', action: 'Prompt an agent', description: 'Send a prompt to an agent and return its answer' },
    ],
    default: 'prompt',
  },
];

export const agentFields: INodeProperties[] = [
  spaceLocator(show(['generate', 'getMany', 'prompt'])),
  spaceLocator(show(['addKnowledgeProject', 'get']), {
    required: false,
    description: 'Optional. Select a workspace or folder to list its agents in the Agent field.',
  }),
  agentLocator(show(['addKnowledgeProject', 'get', 'prompt'])),

  // prompt
  {
    displayName: 'Prompt',
    name: 'prompt',
    type: 'string',
    typeOptions: { rows: 4 },
    required: true,
    default: '',
    description: 'The message to send to the agent',
    displayOptions: show(['prompt']),
  },

  // generate
  {
    displayName: 'Description',
    name: 'text',
    type: 'string',
    typeOptions: { rows: 4 },
    required: true,
    default: '',
    placeholder: 'e.g. An agent that sorts inbound support emails by urgency',
    description: 'Describe the agent you want',
    displayOptions: show(['generate']),
  },

  // addKnowledgeProject
  projectLocator(show(['addKnowledgeProject'])),

  // getMany
  ...returnAllAndLimit(show(['getMany'])),
];
