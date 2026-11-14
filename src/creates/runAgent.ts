import { Bundle, ZObject } from 'zapier-platform-core';

import { ApiResponse, parseOk, request } from '../client';
import { spaceField } from '../fields';

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
    description:
      'Sends a prompt to a Taskade AI agent and returns its reply. Each run uses AI credits from your Taskade plan.',
    hidden: false,
  },
  operation: {
    inputFields: [
      {
        ...spaceField(true),
        label: 'Folder',
        altersDynamicFields: true,
        helpText: 'The workspace or folder that holds the agent.',
      },
      {
        key: 'agent_id',
        label: 'Agent',
        type: 'string',
        dynamic: 'get_all_agents.id.title',
        search: 'find_agent.id',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'prompt',
        label: 'Prompt',
        type: 'text',
        required: true,
        helpText: 'The message to send to the agent, for example "Summarize this support email".',
      },
    ],
    perform,
    sample: { summary: 'Here is the agent response.' },
    outputFields: [{ key: 'summary', label: 'Agent Reply' }],
  },
};
