import { Bundle, ZObject } from 'zapier-platform-core';

import { ApiResponse, parseOk, request } from '../client';
import { spaceField } from '../fields';

const perform = async (z: ZObject, bundle: Bundle) => {
  const response = await request(z, bundle, {
    method: 'GET',
    path: `/folders/${bundle.inputData.space_id}/agents`,
  });

  const data: ApiResponse = parseOk(z, response.json);

  return (data.items ?? []).map((agent) => ({
    id: agent.id as string,
    title: (agent.name ?? agent.id) as string,
  }));
};

export default {
  operation: {
    perform,
    inputFields: [{ ...spaceField(true), altersDynamicFields: true }],
    sample: { id: 'agent-123', title: 'Research Assistant' },
    outputFields: [
      { key: 'id', label: 'ID' },
      { key: 'title', label: 'Name' },
    ],
  },
  key: 'get_all_agents',
  noun: 'Agents',
  display: {
    label: 'Get All Agents',
    description: 'List all AI agents in a folder.',
    hidden: true,
  },
};
