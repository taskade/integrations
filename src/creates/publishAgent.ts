import { Bundle, ZObject } from 'zapier-platform-core';

import { ApiResponse, parseOk, request } from '../client';
import { spaceField } from '../fields';

const perform = async (z: ZObject, bundle: Bundle) => {
  const response = await request(z, bundle, {
    method: 'PUT',
    path: `/agents/${bundle.inputData.agent_id}/publicAccess`,
    body: {},
  });

  const data: ApiResponse = parseOk(z, response.json);

  return data.item ?? data;
};

export default {
  key: 'publish_agent',
  noun: 'Agent',
  display: {
    label: 'Enable Public Agent Access',
    description: 'Makes an AI agent publicly accessible and returns its public URL.',
    hidden: false,
  },
  operation: {
    inputFields: [
      { ...spaceField(true), label: 'Folder', altersDynamicFields: true },
      {
        key: 'agent_id',
        label: 'Agent',
        type: 'string',
        dynamic: 'get_all_agents.id.title',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
    ],
    perform,
    sample: { publicUrl: 'https://www.taskade.com/a/agent-123' },
    outputFields: [{ key: 'publicUrl', label: 'Public URL' }],
  },
};
