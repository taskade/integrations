import { Bundle, ZObject } from 'zapier-platform-core';

import { ApiResponse, parseOk, request } from '../client';
import { projectField, spaceField, taskField } from '../fields';

const perform = async (z: ZObject, bundle: Bundle) => {
  const response = await request(z, bundle, {
    method: 'PUT',
    path: `/projects/${bundle.inputData.project_id}/tasks/${bundle.inputData.task_id}`,
    body: {
      contentType: (bundle.inputData.content_type as string) ?? 'text/markdown',
      content: bundle.inputData.content as string,
    },
  });

  const data: ApiResponse = parseOk(z, response.json);

  return data.item ?? { id: bundle.inputData.task_id };
};

export default {
  key: 'update_task',
  noun: 'Task',
  display: {
    label: 'Update Task',
    description: 'Updates the content of an existing task.',
    hidden: false,
  },
  operation: {
    inputFields: [
      spaceField(false),
      projectField(true),
      taskField('task_id', 'Task', true),
      {
        key: 'content',
        label: 'Content',
        type: 'string',
        required: true,
        helpText: 'The new task text (single line, up to 2000 characters).',
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
    sample: { id: '099630d4-267e-4b22-894b-08b69f3a4d79' },
    outputFields: [{ key: 'id', label: 'Task ID' }],
  },
};
