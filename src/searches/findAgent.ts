import { Bundle, ZObject } from 'zapier-platform-core';

import { ApiResponse, parseOk, request } from '../client';
import { spaceField } from '../fields';

const TAA_AGENT_ID = 'taa';

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
  const query = String(bundle.inputData.query ?? '').toLowerCase();

  const agents = (data.items ?? [])
    // `taa` is the built-in Taskade agent that the API lists first. It is not
    // one of the user's agents, so a name search must not pick it.
    .filter((agent) => agent.id !== TAA_AGENT_ID)
    .map((agent) => ({
      id: agent.id as string,
      name: (agent.name ?? '') as string,
      description: (agent.description ?? '') as string,
    }));

  // Zapier uses the first result, so put an exact name match first.
  const exact = agents.filter((agent) => agent.name.toLowerCase() === query);
  return [...exact, ...agents.filter((agent) => agent.name.toLowerCase() !== query)];
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
