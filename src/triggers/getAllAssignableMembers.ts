import { Bundle, ZObject } from 'zapier-platform-core';

import { dropdownPageParams } from '../client';

interface ProjectMember {
  handle: string;
  displayName: string;
}

interface ProjectMembersResponseOk {
  ok: true;
  items: ProjectMember[];
}

interface ProjectMembersResponseError {
  ok: false;
  message: string;
}

type ProjectMembersResponse = ProjectMembersResponseOk | ProjectMembersResponseError;

const perform = async (z: ZObject, bundle: Bundle) => {
  // The route returns 20 members by default. Ask for 100, and read the page
  // that Zapier asks for when the user clicks "Load more".
  const params = dropdownPageParams(bundle);
  if (params == null) {
    return [];
  }

  const response = await z.request({
    url: `https://www.taskade.com/api/v1/projects/${bundle.inputData.project_id}/members`,
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'content-type': 'application/json',
      authorization: `Bearer ${bundle.authData.access_token}`,
    },
    params,
  });

  const data: ProjectMembersResponse = response.json;

  if (!data.ok) {
    throw new z.errors.Error(data.message, 'invalid_input', 400);
  }

  return data.items.map((i) => ({
    id: i.handle,
    displayName: i.displayName,
  }));
};

export default {
  operation: {
    perform: perform,
    inputFields: [
      {
        key: 'project_id',
        type: 'string',
        label: 'Project ID',
        dynamic: 'get_all_projects.id.title',
        required: true,
        list: false,
        altersDynamicFields: true,
      },
    ],
    sample: { id: '1', displayName: 'xiao ming' },
    outputFields: [
      { key: 'id', label: 'Handle' },
      { key: 'displayName', label: 'Display Name' },
    ],
    canPaginate: true,
  },
  key: 'get_all_assignable_members',
  noun: 'Assignable Members',
  display: {
    label: 'Get All Assignable Members',
    description: 'List all assignable members from a project.',
    hidden: true,
  },
};
