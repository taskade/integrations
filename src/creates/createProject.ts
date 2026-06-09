import { Bundle, ZObject } from 'zapier-platform-core';

import { ApiResponse, parseOk, request } from '../client';
import { spaceField } from '../fields';

const perform = async (z: ZObject, bundle: Bundle) => {
  const response = await request(z, bundle, {
    method: 'POST',
    path: '/projects',
    body: {
      folderId: bundle.inputData.space_id,
      contentType: (bundle.inputData.content_type as string) ?? 'text/markdown',
      content: bundle.inputData.content as string,
    },
  });

  const data: ApiResponse = parseOk(z, response.json);

  return data.item ?? data;
};

export default {
  key: 'create_project',
  noun: 'Project',
  display: {
    label: 'Create Project',
    description: 'Creates a new project from Markdown content in a folder.',
    hidden: false,
  },
  operation: {
    inputFields: [
      { ...spaceField(true), label: 'Folder' },
      {
        key: 'content',
        label: 'Content',
        type: 'text',
        required: true,
        helpText: 'Markdown content for the project, e.g. a title line followed by tasks.',
      },
      {
        key: 'content_type',
        label: 'Format',
        type: 'string',
        choices: { 'text/markdown': 'Markdown', 'text/plain': 'Plain text' },
        default: 'text/markdown',
        required: false,
      },
    ],
    perform,
    sample: { id: '8hoA5PtYfKroDifZ', name: 'New Project' },
    outputFields: [
      { key: 'id', label: 'Project ID' },
      { key: 'name', label: 'Name' },
    ],
  },
};
