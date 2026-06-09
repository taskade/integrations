import { Bundle, ZObject } from 'zapier-platform-core';

import { parseOk, request } from '../client';
import { projectField, spaceField, taskField } from '../fields';

const perform = async (z: ZObject, bundle: Bundle) => {
  const response = await request(z, bundle, {
    method: 'DELETE',
    path: `/projects/${bundle.inputData.project_id}/tasks/${bundle.inputData.task_id}`,
  });

  parseOk(z, response.json);

  return { id: bundle.inputData.task_id as string, deleted: true };
};

export default {
  key: 'delete_task',
  noun: 'Task',
  display: {
    label: 'Delete Task',
    description: 'Deletes a task from a project.',
    hidden: false,
  },
  operation: {
    inputFields: [spaceField(false), projectField(true), taskField('task_id', 'Task', true)],
    perform,
    sample: { id: '099630d4-267e-4b22-894b-08b69f3a4d79', deleted: true },
    outputFields: [
      { key: 'id', label: 'Task ID' },
      { key: 'deleted', type: 'boolean' },
    ],
  },
};
