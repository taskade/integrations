import { Bundle, ZObject } from 'zapier-platform-core';

import { ApiResponse, parseOk, request } from '../client';
import { projectField, spaceField, taskField } from '../fields';

const perform = async (z: ZObject, bundle: Bundle) => {
  const action = bundle.inputData.completed === false ? 'uncomplete' : 'complete';

  const response = await request(z, bundle, {
    method: 'POST',
    path: `/projects/${bundle.inputData.project_id}/tasks/${bundle.inputData.task_id}/${action}`,
    body: {},
  });

  const data: ApiResponse = parseOk(z, response.json);

  return data.item ?? { id: bundle.inputData.task_id, completed: action === 'complete' };
};

export default {
  key: 'complete_task',
  noun: 'Task',
  display: {
    label: 'Complete Task',
    description: 'Marks a task as complete, or reopens it.',
    hidden: false,
  },
  operation: {
    inputFields: [
      spaceField(false),
      projectField(true),
      taskField('task_id', 'Task', true),
      {
        key: 'completed',
        label: 'Mark as Complete',
        type: 'boolean',
        default: 'true',
        required: false,
        helpText: 'Set to No to reopen (uncomplete) the task instead.',
      },
    ],
    perform,
    sample: { id: '099630d4-267e-4b22-894b-08b69f3a4d79', completed: true },
    outputFields: [
      { key: 'id', label: 'Task ID' },
      { key: 'completed', type: 'boolean' },
    ],
  },
};
