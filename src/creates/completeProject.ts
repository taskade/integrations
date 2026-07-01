import { Bundle, ZObject } from 'zapier-platform-core';

import { ApiResponse, parseOk, request } from '../client';
import { projectField, spaceField } from '../fields';

const perform = async (z: ZObject, bundle: Bundle) => {
  const completed = bundle.inputData.completed;
  const action = completed === false || completed === 'false' ? 'restore' : 'complete';

  const response = await request(z, bundle, {
    method: 'POST',
    path: `/projects/${bundle.inputData.project_id}/${action}`,
    body: {},
  });

  const data: ApiResponse = parseOk(z, response.json);

  return data.item ?? { id: bundle.inputData.project_id, completed: action === 'complete' };
};

export default {
  key: 'complete_project',
  noun: 'Project',
  display: {
    label: 'Complete Project',
    description: 'Marks a project as completed (archived), or restores it.',
    hidden: false,
  },
  operation: {
    inputFields: [
      spaceField(false),
      projectField(true),
      {
        key: 'completed',
        label: 'Mark as Complete',
        type: 'boolean',
        default: 'true',
        required: false,
        helpText: 'Set to No to restore a completed project instead.',
      },
    ],
    perform,
    sample: { id: 'A1b2C3d4E5f6G7h8', completed: true },
    outputFields: [
      { key: 'id', label: 'Project ID' },
      { key: 'completed', type: 'boolean' },
    ],
  },
};
