import { Bundle, ZObject } from 'zapier-platform-core';

import { ApiResponse, parseOk, request } from '../client';
import { spaceField } from '../fields';

const perform = async (z: ZObject, bundle: Bundle) => {
  const response = await request(z, bundle, {
    method: 'POST',
    path: '/listAgents',
    version: 'v2',
    body: {
      spaceId: bundle.inputData.space_id,
      filterBy: { name: { operator: 'contains', value: String(bundle.inputData.query ?? '') } },
    },
  });

  const data: ApiResponse = parseOk(z, response.json);

  return (data.items ?? []).map((agent) => ({
    id: agent.id as string,
    name: (agent.name ?? '') as string,
    description: (agent.description ?? '') as string,
  }));
};

export default {
  key: 'find_agent',
  noun: 'Agent',
  display: {
    label: 'Find AI Agent',
    description: 'Finds an AI agent in a folder by its name.',
    hidden: false,
  },
  operation: {
    inputFields: [
      { ...spaceField(true), label: 'Folder' },
      {
        key: 'query',
        label: 'Agent Name',
        type: 'string',
        required: true,
        helpText: 'Returns agents whose name contains this value.',
      },
    ],
    perform,
    sample: {
      id: 'agent-123',
      name: 'Support Triage Agent',
      description: 'You sort inbound support emails by topic and urgency.',
    },
    outputFields: [
      { key: 'id', label: 'Agent ID' },
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
    ],
  },
};
