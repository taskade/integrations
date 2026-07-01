import { Bundle, ZObject } from 'zapier-platform-core';

import { ApiResponse, parseOk, request } from '../client';
import { projectField, spaceField } from '../fields';

const perform = async (z: ZObject, bundle: Bundle) => {
  const response = await request(z, bundle, {
    method: 'GET',
    path: `/projects/${bundle.inputData.project_id}/fields`,
  });

  const data: ApiResponse = parseOk(z, response.json);

  // The human label lives inside field.data (displayName for most field
  // types, title for rating/AI variants) — not at the top level.
  return (data.items ?? []).map((field) => {
    const fieldData = (field.data ?? {}) as Record<string, unknown>;
    return {
      id: field.id as string,
      title: (fieldData.displayName ?? fieldData.title ?? field.id) as string,
    };
  });
};

export default {
  operation: {
    perform,
    inputFields: [spaceField(false), projectField(true)],
    sample: { id: 'field-123', title: 'Priority' },
    outputFields: [
      { key: 'id', label: 'ID' },
      { key: 'title', label: 'Name' },
    ],
  },
  key: 'get_all_fields',
  noun: 'Custom Fields',
  display: {
    label: 'Get All Custom Fields',
    description: 'List all custom fields in a project.',
    hidden: true,
  },
};
