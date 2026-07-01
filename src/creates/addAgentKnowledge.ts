import { Bundle, ZObject } from 'zapier-platform-core';

import { ApiResponse, parseOk, request } from '../client';
import { projectField, spaceField } from '../fields';

const perform = async (z: ZObject, bundle: Bundle) => {
  const isMedia = bundle.inputData.knowledge_type === 'media';

  const sourceId = isMedia ? bundle.inputData.media_id : bundle.inputData.project_id;
  if (sourceId == null || sourceId === '') {
    throw new z.errors.Error(
      isMedia ? 'Media ID is required when the source is Media File.' : 'Project is required when the source is Project.',
      'invalid_input',
      400,
    );
  }

  const response = await request(z, bundle, {
    method: 'POST',
    path: `/agents/${bundle.inputData.agent_id}/knowledge/${isMedia ? 'media' : 'project'}`,
    body: isMedia
      ? { mediaId: bundle.inputData.media_id as string }
      : { projectId: bundle.inputData.project_id as string },
  });

  const data: ApiResponse = parseOk(z, response.json);

  return data.item ?? { agentId: bundle.inputData.agent_id, added: true };
};

export default {
  key: 'add_agent_knowledge',
  noun: 'Agent Knowledge',
  display: {
    label: 'Add Knowledge to AI Agent',
    description: 'Adds a project or media file to an AI agent’s knowledge.',
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
      {
        key: 'knowledge_type',
        label: 'Knowledge Source',
        type: 'string',
        choices: { project: 'Project', media: 'Media File' },
        default: 'project',
        required: true,
        altersDynamicFields: true,
      },
      { ...projectField(false), helpText: 'The project to add (when source is Project).' },
      {
        key: 'media_id',
        label: 'Media ID',
        type: 'string',
        required: false,
        helpText: 'The media file ID to add (when source is Media File).',
      },
    ],
    perform,
    sample: { agentId: 'agent-123', added: true },
    outputFields: [{ key: 'agentId' }, { key: 'added', type: 'boolean' }],
  },
};
