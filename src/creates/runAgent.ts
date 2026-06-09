import { Bundle, ZObject } from 'zapier-platform-core';

import { ApiResponse, parseOk, request } from '../client';

const perform = async (z: ZObject, bundle: Bundle) => {
  const response = await request(z, bundle, {
    method: 'POST',
    path: '/promptAgent',
    version: 'v2',
    body: {
      spaceId: bundle.inputData.space_id,
      agentId: bundle.inputData.agent_id,
      prompt: bundle.inputData.prompt,
    },
  });

  const data: ApiResponse = parseOk(z, response.json);

  return { summary: (data.summary ?? '') as string };
};

export default {
  key: 'run_agent',
  noun: 'Agent Response',
  display: {
    label: 'Run AI Agent',
    description: 'Sends a prompt to a Taskade AI agent and returns its response.',
    hidden: false,
  },
  operation: {
    inputFields: [
      {
        key: 'space_id',
        label: 'Workspace ID',
        type: 'string',
        required: true,
        helpText: 'The ID of the workspace the agent belongs to.',
      },
      {
        key: 'agent_id',
        label: 'Agent ID',
        type: 'string',
        required: true,
        helpText: 'The ID of the agent to prompt.',
      },
      {
        key: 'prompt',
        label: 'Prompt',
        type: 'text',
        required: true,
        helpText: 'The message to send to the agent.',
      },
    ],
    perform,
    sample: { summary: 'Here is the agent response.' },
    outputFields: [{ key: 'summary', label: 'Response' }],
  },
};
