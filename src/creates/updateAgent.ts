import { Bundle, ZObject } from 'zapier-platform-core';

import { ApiResponse, parseOk, request } from '../client';
import { spaceField } from '../fields';

const agentDropdown = {
  key: 'agent_id',
  label: 'Agent',
  type: 'string',
  dynamic: 'get_all_agents.id.title',
  required: true,
  list: false,
  altersDynamicFields: false,
};

const perform = async (z: ZObject, bundle: Bundle) => {
  const response = await request(z, bundle, {
    method: 'PATCH',
    path: `/agents/${bundle.inputData.agent_id}`,
    body: { name: bundle.inputData.name as string },
  });

  const data: ApiResponse = parseOk(z, response.json);

  return data.item ?? { id: bundle.inputData.agent_id };
};

export default {
  key: 'update_agent',
  noun: 'Agent',
  display: {
    label: 'Update AI Agent',
    description: "Renames an AI agent.",
    hidden: false,
  },
  operation: {
    inputFields: [
      { ...spaceField(true), label: 'Folder', altersDynamicFields: true },
      agentDropdown,
      { key: 'name', label: 'New Name', type: 'string', required: true },
    ],
    perform,
    sample: { id: 'agent-123', name: 'Renamed Agent' },
    outputFields: [{ key: 'id', label: 'Agent ID' }],
  },
};
