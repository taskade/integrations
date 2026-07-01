import { Bundle, ZObject } from 'zapier-platform-core';

import { ApiResponse, parseOk, request } from '../client';
import { projectField, spaceField, taskField } from '../fields';

const perform = async (z: ZObject, bundle: Bundle) => {
  const response = await request(z, bundle, {
    method: 'PUT',
    path: `/projects/${bundle.inputData.project_id}/tasks/${bundle.inputData.task_id}/note`,
    body: {
      type: (bundle.inputData.note_type as string) ?? 'text/markdown',
      value: bundle.inputData.value as string,
    },
  });

  const data: ApiResponse = parseOk(z, response.json);

  return data.item ?? { id: bundle.inputData.task_id };
};

export default {
  key: 'set_task_note',
  noun: 'Task Note',
  display: {
    label: 'Set Task Note',
    description: 'Sets the note of an existing task (single-line).',
    hidden: false,
  },
  operation: {
    inputFields: [
      spaceField(false),
      projectField(true),
      taskField('task_id', 'Task', true),
      {
        key: 'value',
        label: 'Note',
        type: 'string',
        required: true,
        helpText: 'Note content — single line, no line breaks.',
      },
      {
        key: 'note_type',
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
