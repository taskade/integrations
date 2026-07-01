import { Bundle, ZObject } from 'zapier-platform-core';

import { ApiResponse, parseOk, request } from '../client';
import { spaceField } from '../fields';

const perform = async (z: ZObject, bundle: Bundle) => {
  const response = await request(z, bundle, {
    method: 'POST',
    path: `/folders/${bundle.inputData.space_id}/agent-generate`,
    body: { text: bundle.inputData.text as string },
  });

  const data: ApiResponse = parseOk(z, response.json);

  return data.item ?? data;
};

export default {
  key: 'generate_agent',
  noun: 'Agent',
  display: {
    label: 'Generate AI Agent',
    description: 'Generates a new AI agent from a plain-language description.',
    hidden: false,
  },
  operation: {
    inputFields: [
      { ...spaceField(true), label: 'Folder' },
      {
        key: 'text',
        label: 'Description',
        type: 'text',
        required: true,
        helpText: 'Describe the agent you want, e.g. "An agent that triages inbound support emails".',
      },
    ],
    perform,
    sample: { id: 'agent-123', name: 'Support Triage Agent' },
    outputFields: [
      { key: 'id', label: 'Agent ID' },
      { key: 'name', label: 'Name' },
    ],
  },
};
