import { Bundle, ZObject } from 'zapier-platform-core';

import { ApiResponse, dropdownPageParams, parseOk, request } from '../client';
import { spaceField } from '../fields';

const perform = async (z: ZObject, bundle: Bundle) => {
  // The route returns 20 templates by default. Ask for 100, and read the page
  // that Zapier asks for when the user clicks "Load more".
  const params = dropdownPageParams(bundle);
  if (params == null) {
    return [];
  }

  const response = await request(z, bundle, {
    method: 'GET',
    path: `/folders/${bundle.inputData.space_id}/project-templates`,
    params,
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
    canPaginate: true,
  },
  key: 'get_all_project_templates',
  noun: 'Project Templates',
  display: {
    label: 'Get All Project Templates',
    description: 'List all project templates in a folder.',
    hidden: true,
  },
};
