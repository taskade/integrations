import { Bundle, ZObject } from 'zapier-platform-core';

import { ApiResponse, parseOk, request } from '../client';
import { projectField, spaceField } from '../fields';

const perform = async (z: ZObject, bundle: Bundle) => {
  const body: Record<string, unknown> = { folderId: bundle.inputData.target_folder_id };
  if (bundle.inputData.project_title != null && bundle.inputData.project_title !== '') {
    body.projectTitle = bundle.inputData.project_title;
  }

  const response = await request(z, bundle, {
    method: 'POST',
    path: `/projects/${bundle.inputData.project_id}/copy`,
    body,
  });

  const data: ApiResponse = parseOk(z, response.json);

  return data.item ?? data;
};

export default {
  key: 'copy_project',
  noun: 'Project',
  display: {
    label: 'Copy Project',
    description: 'Copies a project into a folder, optionally with a new title.',
    hidden: false,
  },
  operation: {
    inputFields: [
      spaceField(false),
      projectField(true),
      {
        key: 'target_folder_id',
        label: 'Destination Folder',
        type: 'string',
        dynamic: 'get_all_spaces.id.name',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'project_title',
        label: 'New Title',
        type: 'string',
        required: false,
        helpText: 'Optional title for the copy. Defaults to the original name.',
      },
    ],
    perform,
    sample: { id: 'Z9y8X7w6V5u4T3s2', name: 'Q3 Launch Plan (Copy)' },
    outputFields: [
      { key: 'id', label: 'Project ID' },
      { key: 'name', label: 'Name' },
    ],
  },
};
