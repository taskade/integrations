import { Bundle, ZObject } from 'zapier-platform-core';

import { ApiResponse, parseOk, request } from '../client';
import { spaceField } from '../fields';

const perform = async (z: ZObject, bundle: Bundle) => {
  const response = await request(z, bundle, {
    method: 'GET',
    path: `/folders/${bundle.inputData.space_id}/project-templates`,
  });

  const data: ApiResponse = parseOk(z, response.json);

  return (data.items ?? []).map((template) => ({
    id: template.id as string,
    title: (template.name ?? template.title ?? template.id) as string,
  }));
};

export default {
  operation: {
    perform,
    inputFields: [{ ...spaceField(true), altersDynamicFields: true }],
    sample: { id: '8hoA5PtYfKroDifZ', title: 'CRM Template' },
    outputFields: [
      { key: 'id', label: 'ID' },
      { key: 'title', label: 'Title' },
    ],
  },
  key: 'get_all_project_templates',
  noun: 'Project Templates',
  display: {
    label: 'Get All Project Templates',
    description: 'List all project templates in a folder.',
    hidden: true,
  },
};
