import { Bundle, ZObject } from 'zapier-platform-core';

import { ApiResponse, parseOk, request } from '../client';
import { spaceField } from '../fields';

const perform = async (z: ZObject, bundle: Bundle) => {
  const path =
    bundle.inputData.space_id != null
      ? `/folders/${bundle.inputData.space_id}/projects`
      : '/me/projects';

  const response = await request(z, bundle, { method: 'GET', path });

  const data: ApiResponse = parseOk(z, response.json);
  const query = String(bundle.inputData.query ?? '').toLowerCase();

  return (data.items ?? [])
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
