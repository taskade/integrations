import { Bundle, ZObject } from 'zapier-platform-core';

import { ApiResponse, parseOk, request } from '../client';
import { projectField, spaceField, taskField } from '../fields';

const perform = async (z: ZObject, bundle: Bundle) => {
  const raw = bundle.inputData.value as string;
  const numeric = Number(raw);
  const value =
    raw !== '' && Number.isFinite(numeric) && String(numeric) === raw.trim() ? numeric : raw;

  const response = await request(z, bundle, {
    method: 'PUT',
    path: `/projects/${bundle.inputData.project_id}/tasks/${bundle.inputData.task_id}/fields/${bundle.inputData.field_id}`,
    body: { value },
  });

  const data: ApiResponse = parseOk(z, response.json);

  return data.item ?? { id: bundle.inputData.task_id, fieldId: bundle.inputData.field_id };
};

export default {
  key: 'set_custom_field',
  noun: 'Custom Field',
  display: {
    label: 'Set Task Custom Field',
    description: 'Sets a custom field value on a task (table/board projects).',
    hidden: false,
  },
  operation: {
    inputFields: [
      spaceField(false),
      projectField(true),
      taskField('task_id', 'Task', true),
      {
        key: 'field_id',
        label: 'Field',
        type: 'string',
        dynamic: 'get_all_fields.id.title',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'value',
        label: 'Value',
        type: 'string',
        required: true,
        helpText: 'Numeric strings are sent as numbers automatically.',
      },
    ],
    perform,
    sample: { id: '099630d4-267e-4b22-894b-08b69f3a4d79', fieldId: 'field-123' },
    outputFields: [
      { key: 'id', label: 'Task ID' },
      { key: 'fieldId', label: 'Field ID' },
    ],
  },
};
