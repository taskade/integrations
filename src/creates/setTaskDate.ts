import moment from 'moment-timezone';
import { Bundle, ZObject } from 'zapier-platform-core';

import { ApiResponse, parseOk, request } from '../client';
import { projectField, spaceField, taskField } from '../fields';

const toDatePart = (value: string, timezone: string) => {
  const m = moment.tz(value, timezone);
  return { date: m.format('YYYY-MM-DD'), time: m.format('HH:mm:ss'), timezone };
};

const perform = async (z: ZObject, bundle: Bundle) => {
  const basePath = `/projects/${bundle.inputData.project_id}/tasks/${bundle.inputData.task_id}/date`;
  const clear = bundle.inputData.clear === true || bundle.inputData.clear === 'true';

  if (clear) {
    const response = await request(z, bundle, { method: 'DELETE', path: basePath });
    parseOk(z, response.json);
    return { id: bundle.inputData.task_id as string, cleared: true };
  }

  // Guard: moment(undefined) silently means "now" — never write an implicit date.
  if (bundle.inputData.start_date == null || bundle.inputData.start_date === '') {
    throw new z.errors.Error(
      'Start Date is required unless Clear Due Date is Yes.',
      'invalid_input',
      400,
    );
  }

  const timezone = bundle.meta.timezone ?? 'Etc/UTC';
  const body: Record<string, unknown> = {
    start: toDatePart(bundle.inputData.start_date as string, timezone),
  };
  if (bundle.inputData.end_date != null && bundle.inputData.end_date !== '') {
    body.end = toDatePart(bundle.inputData.end_date as string, timezone);
  }

  const response = await request(z, bundle, { method: 'PUT', path: basePath, body });
  const data: ApiResponse = parseOk(z, response.json);

  return data.item ?? { id: bundle.inputData.task_id };
};

export default {
  key: 'set_task_date',
  noun: 'Due Date',
  display: {
    label: 'Set Task Due Date',
    description: 'Sets (or clears) the due date of an existing task.',
    hidden: false,
  },
  operation: {
    inputFields: [
      spaceField(false),
      projectField(true),
      taskField('task_id', 'Task', true),
      {
        key: 'start_date',
        label: 'Start Date',
        type: 'datetime',
        required: false,
        helpText: 'Required unless clearing the date.',
      },
      { key: 'end_date', label: 'End Date', type: 'datetime', required: false },
      {
        key: 'clear',
        label: 'Clear Due Date',
        type: 'boolean',
        default: 'false',
        required: false,
        helpText: 'Set to Yes to remove the due date instead of setting one.',
      },
    ],
    perform,
    sample: { id: '099630d4-267e-4b22-894b-08b69f3a4d79' },
    outputFields: [{ key: 'id', label: 'Task ID' }],
  },
};
