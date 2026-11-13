import { Bundle, ZObject } from 'zapier-platform-core';

import { ApiResponse, parseOk, request } from '../client';
import { projectField, spaceField } from '../fields';

const perform = async (z: ZObject, bundle: Bundle) => {
  const response = await request(z, bundle, {
    method: 'POST',
    path: '/exportProject',
    version: 'v2',
    body: { projectId: bundle.inputData.project_id },
  });

  const data: ApiResponse = parseOk(z, response.json);
  const item = (data.item ?? {}) as Record<string, unknown>;

  return [
    {
      id: (item.id ?? bundle.inputData.project_id) as string,
      name: (item.name ?? '') as string,
      content: (item.content ?? '') as string,
    },
  ];
};

export default {
  key: 'get_project_content',
  noun: 'Project Content',
  display: {
    label: 'Get Project Content',
    description:
      'Gets the full text of a project as Markdown, for use in later steps such as an email or an AI prompt.',
    hidden: false,
  },
  operation: {
    inputFields: [spaceField(false), projectField(true)],
    perform,
    sample: {
      id: 'A1b2C3d4E5f6G7h8',
      name: 'Q3 Launch Plan',
      content: '# Q3 Launch Plan\n\n- [ ] Draft the launch email\n- [x] Book the venue',
    },
    outputFields: [
      { key: 'id', label: 'Project ID' },
      { key: 'name', label: 'Name' },
      { key: 'content', label: 'Content (Markdown)' },
    ],
  },
};
