import { Bundle, ZObject } from 'zapier-platform-core';

import { ApiResponse, parseOk, request } from '../client';
import { projectField, spaceField } from '../fields';

const perform = async (z: ZObject, bundle: Bundle) => {
  const response = await request(z, bundle, {
    method: 'PUT',
    path: `/projects/${bundle.inputData.project_id}/shareLink`,
    body: {},
  });

  const data: ApiResponse = parseOk(z, response.json);

  // API returns { viewUrl, editUrl, checkUrl? }; expose viewUrl as the primary link.
  const item = (data.item ?? {}) as Record<string, unknown>;
  return { shareLink: item.viewUrl ?? null, ...item };
};

export default {
  key: 'enable_share_link',
  noun: 'Share Link',
  display: {
    label: 'Get Project Share Link',
    description: 'Enables sharing on a project and returns its shareable URL.',
    hidden: false,
  },
  operation: {
    inputFields: [spaceField(false), projectField(true)],
    perform,
    sample: {
      shareLink: 'https://www.taskade.com/d/A1b2C3d4E5f6G7h8',
      viewUrl: 'https://www.taskade.com/d/A1b2C3d4E5f6G7h8',
      editUrl: 'https://www.taskade.com/d/A1b2C3d4E5f6G7h8?edit=1',
    },
    outputFields: [
      { key: 'shareLink', label: 'Share URL (View)' },
      { key: 'viewUrl', label: 'View URL' },
      { key: 'editUrl', label: 'Edit URL' },
    ],
  },
};
