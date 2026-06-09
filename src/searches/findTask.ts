import { Bundle, ZObject } from 'zapier-platform-core';

import { ApiResponse, parseOk, request } from '../client';
import { projectField, spaceField } from '../fields';

const perform = async (z: ZObject, bundle: Bundle) => {
  const response = await request(z, bundle, {
    method: 'GET',
    path: `/projects/${bundle.inputData.project_id}/tasks`,
  });

  const data: ApiResponse = parseOk(z, response.json);
  const query = String(bundle.inputData.query ?? '').toLowerCase();

  return (data.items ?? [])
    .filter((task) =>
      String(task.text ?? task.content ?? '')
        .toLowerCase()
        .includes(query),
    )
    .map((task) => ({ id: task.id as string, text: (task.text ?? task.content ?? '') as string }));
};

export default {
  key: 'find_task',
  noun: 'Task',
  display: {
    label: 'Find Task',
    description: 'Finds a task in a project by matching its text.',
    hidden: false,
  },
  operation: {
    inputFields: [
      spaceField(false),
      projectField(true),
      {
        key: 'query',
        label: 'Search Text',
        type: 'string',
        required: true,
        helpText: 'Returns tasks whose text contains this value.',
      },
    ],
    perform,
    sample: { id: '099630d4-267e-4b22-894b-08b69f3a4d79', text: 'Buy milk' },
    outputFields: [
      { key: 'id', label: 'Task ID' },
      { key: 'text', label: 'Text' },
    ],
  },
};
