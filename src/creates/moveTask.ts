import { Bundle, ZObject } from 'zapier-platform-core';

import { ApiResponse, parseOk, request } from '../client';
import { projectField, spaceField, taskField } from '../fields';

const perform = async (z: ZObject, bundle: Bundle) => {
  const response = await request(z, bundle, {
    method: 'PUT',
    path: `/projects/${bundle.inputData.project_id}/tasks/${bundle.inputData.task_id}/move`,
    body: {
      target: {
        taskId: bundle.inputData.target_task_id,
        position: bundle.inputData.position,
      },
    },
  });

  const data: ApiResponse = parseOk(z, response.json);

  return data.item ?? { id: bundle.inputData.task_id };
};

export default {
  key: 'move_task',
  noun: 'Task',
  display: {
    label: 'Move Task',
    description: 'Moves a task relative to another task in the same project.',
    hidden: false,
  },
  operation: {
    inputFields: [
      spaceField(false),
      projectField(true),
      taskField('task_id', 'Task to Move', true),
      taskField('target_task_id', 'Relative to Task', true),
      {
        key: 'position',
        label: 'Position',
        type: 'string',
        choices: {
          beforebegin: 'Before (as a sibling, above)',
          afterbegin: 'Inside (as first child)',
          beforeend: 'Inside (as last child)',
          afterend: 'After (as a sibling, below)',
        },
        default: 'afterend',
        required: true,
      },
    ],
    perform,
    sample: { id: '099630d4-267e-4b22-894b-08b69f3a4d79' },
    outputFields: [{ key: 'id', label: 'Task ID' }],
  },
};
