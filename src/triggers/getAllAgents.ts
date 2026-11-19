import { Bundle, ZObject } from 'zapier-platform-core';

import { ApiResponse, dropdownPageParams, parseOk, request } from '../client';
import { spaceField } from '../fields';

const perform = async (z: ZObject, bundle: Bundle) => {
  // The route returns 20 agents by default. Ask for 100, and read the page that
  // Zapier asks for when the user clicks "Load more".
  const params = dropdownPageParams(bundle);
  if (params == null) {
    return [];
  }

  const response = await request(z, bundle, {
    method: 'GET',
    path: `/folders/${bundle.inputData.space_id}/agents`,
    params,
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
    canPaginate: true,
  },
  key: 'get_all_agents',
  noun: 'Agents',
  display: {
    label: 'Get All Agents',
    description: 'List all AI agents in a folder.',
    hidden: true,
  },
};
