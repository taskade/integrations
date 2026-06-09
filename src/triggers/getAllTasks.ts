import { Bundle, ZObject } from 'zapier-platform-core';

import { ApiResponse, parseOk, request } from '../client';
import { projectField, spaceField } from '../fields';

const perform = async (z: ZObject, bundle: Bundle) => {
  const response = await request(z, bundle, {
    method: 'GET',
    path: `/projects/${bundle.inputData.project_id}/tasks`,
    params: { limit: '100' },
  });

  const data: ApiResponse = parseOk(z, response.json);

  return (data.items ?? []).map((task) => ({
    id: task.id as string,
    title: (task.text ?? task.content ?? task.id) as string,
  }));
};

export default {
  operation: {
    perform,
    inputFields: [spaceField(false), projectField(true)],
    sample: { id: '099630d4-267e-4b22-894b-08b69f3a4d79', title: 'Buy milk' },
    outputFields: [
      { key: 'id', label: 'ID' },
      { key: 'title', label: 'Title' },
    ],
  },
  key: 'get_all_tasks',
  noun: 'Tasks',
  display: {
    label: 'Get All Tasks',
    description: 'List all tasks in a project.',
    hidden: true,
  },
};
