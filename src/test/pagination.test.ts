import { Bundle, ZObject } from 'zapier-platform-core';

import { MAX_PAGES } from '../client';
import FindProject from '../searches/findProject';
import GetAllAgents from '../triggers/getAllAgents';
import GetAllAssignableMembers from '../triggers/getAllAssignableMembers';
import GetAllProjects from '../triggers/getAllProjects';
import GetAllProjectTemplates from '../triggers/getAllProjectTemplates';

// A stand-in for the Taskade API. It pages a list of `total` rows with the
// `page` and `limit` query parameters, the same way that the public API does.
// `defaultLimit` is the page size that the API uses when no `limit` is sent.
// With `ignorePage`, it returns the first page for every request, which is the
// bad response that the page bound protects against.

interface FakeRequest {
  url: string;
  method: string;
  params?: Record<string, string | undefined>;
}

const pagedZ = (total: number, options: { defaultLimit?: number; ignorePage?: boolean } = {}) => {
  const rows = Array.from({ length: total }, (_, index) => ({
    id: `id-${index + 1}`,
    name: `Row ${index + 1}`,
    handle: `user${index + 1}`,
    displayName: `User ${index + 1}`,
  }));
  const calls: FakeRequest[] = [];
  const z = {
    request: async (request: FakeRequest) => {
      calls.push(request);
      const limit = Number(request.params?.limit ?? options.defaultLimit ?? 100);
      const page = options.ignorePage ? 1 : Number(request.params?.page ?? 1);
      const items = rows.slice((page - 1) * limit, page * limit);
      return { status: 200, json: { ok: true, items } };
    },
    errors: { Error: class extends Error {} },
  } as unknown as ZObject;
  return { z, calls };
};

const bundleFor = (inputData: Record<string, unknown>, page?: number) =>
  ({
    authData: { access_token: 'token' },
    inputData,
    meta: page === undefined ? {} : { page },
  }) as unknown as Bundle;

const ids = (rows: Array<{ id: string }>) => rows.map((row) => row.id);

describe('dropdown: get_all_projects without a folder', () => {
  it('shows the projects after the first 100 when Zapier asks for the next page', async () => {
    const { z } = pagedZ(150);
    const first = await GetAllProjects.operation.perform(z, bundleFor({}, 0));
    const second = await GetAllProjects.operation.perform(z, bundleFor({}, 1));
    expect(first).toHaveLength(100);
    expect(ids(second)).toEqual(Array.from({ length: 50 }, (_, index) => `id-${index + 101}`));
  });

  it('sends the page and limit parameters of GET /me/projects', async () => {
    const { z, calls } = pagedZ(150);
    await GetAllProjects.operation.perform(z, bundleFor({}, 1));
    expect(calls[0].url).toBe('https://www.taskade.com/api/v1/me/projects');
    expect(calls[0].params).toEqual({ limit: '100', page: '2' });
  });

  it('returns no rows after the last page', async () => {
    const { z } = pagedZ(150);
    expect(await GetAllProjects.operation.perform(z, bundleFor({}, 2))).toEqual([]);
  });

  it('stops at the page bound when the API ignores the page parameter', async () => {
    const { z, calls } = pagedZ(150, { ignorePage: true });
    expect(await GetAllProjects.operation.perform(z, bundleFor({}, MAX_PAGES))).toEqual([]);
    expect(calls).toHaveLength(0);
  });
});

describe('dropdown: get_all_projects in a folder', () => {
  it('lists the folder projects on the first page', async () => {
    const { z, calls } = pagedZ(3);
    const result = await GetAllProjects.operation.perform(z, bundleFor({ space_id: 'folder-1' }, 0));
    expect(ids(result)).toEqual(['id-1', 'id-2', 'id-3']);
    expect(calls[0].url).toBe('https://www.taskade.com/api/v1/folders/folder-1/projects');
  });

  it('does not repeat the folder projects when Zapier asks for the next page', async () => {
    // GET /folders/{folderId}/projects takes no page parameter, so one request returns every row.
    const { z, calls } = pagedZ(3);
    expect(await GetAllProjects.operation.perform(z, bundleFor({ space_id: 'folder-1' }, 1))).toEqual([]);
    expect(calls).toHaveLength(0);
  });
});

describe('search: find_project without a folder', () => {
  it('finds a project that is after the first 100', async () => {
    const { z } = pagedZ(150);
    const result = await FindProject.operation.perform(z, bundleFor({ query: 'Row 130' }));
    expect(result).toEqual([{ id: 'id-130', name: 'Row 130' }]);
  });

  it('reads at most the page bound when the API ignores the page parameter', async () => {
    const { z, calls } = pagedZ(150, { ignorePage: true });
    expect(await FindProject.operation.perform(z, bundleFor({ query: 'no match' }))).toEqual([]);
    expect(calls).toHaveLength(MAX_PAGES);
  });
});

describe('dropdowns on other page-numbered lists', () => {
  it('get_all_agents shows the second page', async () => {
    const { z, calls } = pagedZ(130, { defaultLimit: 20 });
    const result = await GetAllAgents.operation.perform(z, bundleFor({ space_id: 'folder-1' }, 1));
    expect(ids(result)).toEqual(Array.from({ length: 30 }, (_, index) => `id-${index + 101}`));
    expect(calls[0].params).toEqual({ limit: '100', page: '2' });
  });

  it('get_all_project_templates shows more than the 20 rows of the default page', async () => {
    const { z } = pagedZ(30, { defaultLimit: 20 });
    const result = await GetAllProjectTemplates.operation.perform(z, bundleFor({ space_id: 'folder-1' }, 0));
    expect(result).toHaveLength(30);
  });

  it('get_all_assignable_members shows more than the 20 rows of the default page', async () => {
    const { z, calls } = pagedZ(30, { defaultLimit: 20 });
    const result = await GetAllAssignableMembers.operation.perform(z, bundleFor({ project_id: 'project-1' }, 0));
    expect(result).toHaveLength(30);
    expect(calls[0].url).toBe('https://www.taskade.com/api/v1/projects/project-1/members');
  });

  it('every page-numbered dropdown tells Zapier that it can load more rows', () => {
    for (const trigger of [GetAllProjects, GetAllAgents, GetAllProjectTemplates, GetAllAssignableMembers]) {
      const { canPaginate } = trigger.operation as { canPaginate?: boolean };
      expect({ key: trigger.key, canPaginate }).toEqual({
        key: trigger.key,
        canPaginate: true,
      });
    }
  });

  it('every page-numbered dropdown stops at the page bound', async () => {
    const triggers = [
      { trigger: GetAllAgents, inputData: { space_id: 'folder-1' } },
      { trigger: GetAllProjectTemplates, inputData: { space_id: 'folder-1' } },
      { trigger: GetAllAssignableMembers, inputData: { project_id: 'project-1' } },
    ];
    for (const { trigger, inputData } of triggers) {
      const { z, calls } = pagedZ(150, { ignorePage: true });
      expect(await trigger.operation.perform(z, bundleFor(inputData, MAX_PAGES))).toEqual([]);
      expect(calls).toHaveLength(0);
    }
  });
});
