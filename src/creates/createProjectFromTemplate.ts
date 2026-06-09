import { Bundle, ZObject } from 'zapier-platform-core';

import { ApiResponse, parseOk, request } from '../client';
import { spaceField } from '../fields';

const perform = async (z: ZObject, bundle: Bundle) => {
  const response = await request(z, bundle, {
    method: 'POST',
    path: '/projects/from-template',
    body: {
      folderId: bundle.inputData.space_id,
      templateId: bundle.inputData.template_id,
    },
  });

  const data: ApiResponse = parseOk(z, response.json);

  return data.item ?? data;
};

export default {
  key: 'create_project_from_template',
  noun: 'Project',
  display: {
    label: 'Create Project from Template',
    description: 'Creates a new project from an existing template in a folder.',
    hidden: false,
  },
  operation: {
    inputFields: [
      { ...spaceField(true), label: 'Folder', altersDynamicFields: true },
      {
        key: 'template_id',
        label: 'Template',
        type: 'string',
        dynamic: 'get_all_project_templates.id.title',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
    ],
    perform,
    sample: { id: '8hoA5PtYfKroDifZ', name: 'New Project from Template' },
    outputFields: [
      { key: 'id', label: 'Project ID' },
      { key: 'name', label: 'Name' },
    ],
  },
};
