import { Bundle, ZObject } from 'zapier-platform-core';

import { ApiResponse, parseOk, request } from '../client';
import { projectField, spaceField, taskField } from '../fields';

const perform = async (z: ZObject, bundle: Bundle) => {
  const raw = bundle.inputData.member_ids;
  const handles = (Array.isArray(raw) ? raw : [raw]).filter(Boolean);

  const response = await request(z, bundle, {
    method: 'PUT',
    path: `/projects/${bundle.inputData.project_id}/tasks/${bundle.inputData.task_id}/assignees`,
    body: { handles },
  });

  const data: ApiResponse = parseOk(z, response.json);

  return data.item ?? { id: bundle.inputData.task_id, assignees: handles };
};

export default {
  key: 'assign_task',
  noun: 'Task Assignment',
  display: {
    label: 'Assign Task',
    description: 'Sets the assignees of an existing task.',
    hidden: false,
  },
  operation: {
    inputFields: [
      spaceField(false),
      projectField(true),
      taskField('task_id', 'Task', true),
      {
        key: 'member_ids',
        label: 'Assign To',
        type: 'string',
        dynamic: 'get_all_assignable_members.id.displayName',
        required: true,
        list: true,
        altersDynamicFields: false,
      },
    ],
    perform,
    sample: { id: '099630d4-267e-4b22-894b-08b69f3a4d79', assignees: ['janedoe'] },
    outputFields: [{ key: 'id', label: 'Task ID' }],
  },
};
