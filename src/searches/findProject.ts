import { Bundle, ZObject } from 'zapier-platform-core';

import { ApiResponse, listAllPages, parseOk, request } from '../client';
import { spaceField } from '../fields';

const perform = async (z: ZObject, bundle: Bundle) => {
  const path =
    bundle.inputData.space_id != null
      ? `/folders/${bundle.inputData.space_id}/projects`
      : '/me/projects';

  // The match runs here, over the projects that the API returns. GET /me/projects
  // is page-numbered, so read each page. GET /folders/{folderId}/projects takes no page parameter.
  let projects: Array<Record<string, unknown>>;
  if (bundle.inputData.space_id != null) {
    const response = await request(z, bundle, { method: 'GET', path, params: { limit: '100' } });
    const data: ApiResponse = parseOk(z, response.json);
    projects = data.items ?? [];
  } else {
    projects = await listAllPages(z, bundle, path);
  }

  const query = String(bundle.inputData.query ?? '').toLowerCase();

  return projects
    .filter((project) =>
      String(project.name ?? project.title ?? '')
        .toLowerCase()
        .includes(query),
    )
    .map((project) => ({
      id: project.id as string,
      name: (project.name ?? project.title ?? '') as string,
    }));
};

export default {
  key: 'find_project',
  noun: 'Project',
  display: {
    label: 'Find Project',
    description: "Finds a project by name across a folder or the user's projects.",
    hidden: false,
  },
  operation: {
    inputFields: [
      spaceField(false),
      {
        key: 'query',
        label: 'Project Name',
        type: 'string',
        required: true,
        helpText: 'Returns projects whose name contains this value.',
      },
    ],
    perform,
    sample: { id: '8hoA5PtYfKroDifZ', name: 'Get Started with Taskade' },
    outputFields: [
      { key: 'id', label: 'Project ID' },
      { key: 'name', label: 'Name' },
    ],
  },
};
