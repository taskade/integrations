import type { IDataObject, IExecuteFunctions, ILoadOptionsFunctions } from 'n8n-workflow';
import { describe, expect, it } from 'vitest';

import { Taskade, toTaskadeDate } from '../nodes/Taskade/Taskade.node';
import { createContext } from './helpers';

const node = new Taskade();

async function run(params: Record<string, unknown>, responder?: Parameters<typeof createContext>[1]) {
  const context = createContext({ authentication: 'accessToken', ...params }, responder);
  const [output] = await node.execute.call(context as unknown as IExecuteFunctions);
  return { output: output.map((entry) => entry.json), calls: context.calls };
}

describe('Taskade node description', () => {
  const properties = node.description.properties;

  it('lists one operation parameter per resource, and every operation has an action', () => {
    const resources = properties.find((p) => p.name === 'resource')?.options as Array<{ value: string }>;
    for (const { value } of resources) {
      const operation = properties.find(
        (p) => p.name === 'operation' && p.displayOptions?.show?.resource?.includes(value),
      );
      expect(operation, value).toBeDefined();
      for (const option of operation?.options as Array<{ action?: string }>) {
        expect(option.action, value).toBeTruthy();
      }
    }
  });

  it('offers a token credential and an OAuth2 credential', () => {
    expect(node.description.credentials?.map((c) => c.name)).toEqual(['taskadeApi', 'taskadeOAuth2Api']);
    expect(node.description.usableAsTool).toBe(true);
  });
});

describe('Taskade node operations map to Public API v2', () => {
  const cases: Array<{
    name: string;
    params: Record<string, unknown>;
    endpoint: string;
    body: IDataObject;
  }> = [
    {
      name: 'task create at the project root',
      params: { resource: 'task', operation: 'create', projectId: 'p1', content: 'Ship it', contentType: 'text/markdown', options: {} },
      endpoint: '/createTask',
      body: { projectId: 'p1', tasks: [{ contentType: 'text/markdown', content: 'Ship it', placement: 'beforeend' }] },
    },
    {
      name: 'task create under a parent',
      params: { resource: 'task', operation: 'create', projectId: 'p1', content: 'Sub', contentType: 'text/plain', options: { relativeTaskId: 't0', placement: 'afterend' } },
      endpoint: '/createTask',
      body: { projectId: 'p1', tasks: [{ contentType: 'text/plain', content: 'Sub', placement: 'afterend', taskId: 't0' }] },
    },
    {
      name: 'task update',
      params: { resource: 'task', operation: 'update', projectId: 'p1', taskId: 't1', content: 'New', contentType: 'text/plain' },
      endpoint: '/updateTask',
      body: { projectId: 'p1', taskId: 't1', contentType: 'text/plain', content: 'New' },
    },
    {
      name: 'task complete',
      params: { resource: 'task', operation: 'complete', projectId: 'p1', taskId: 't1' },
      endpoint: '/completeTask',
      body: { projectId: 'p1', taskId: 't1' },
    },
    {
      name: 'task reopen',
      params: { resource: 'task', operation: 'uncomplete', projectId: 'p1', taskId: 't1' },
      endpoint: '/uncompleteTask',
      body: { projectId: 'p1', taskId: 't1' },
    },
    {
      name: 'task delete',
      params: { resource: 'task', operation: 'delete', projectId: 'p1', taskId: 't1' },
      endpoint: '/deleteTask',
      body: { projectId: 'p1', taskId: 't1' },
    },
    {
      name: 'task move',
      params: { resource: 'task', operation: 'move', projectId: 'p1', taskId: 't1', targetTaskId: 't2', position: 'afterbegin' },
      endpoint: '/moveTask',
      body: { projectId: 'p1', taskId: 't1', target: { taskId: 't2', position: 'afterbegin' } },
    },
    {
      name: 'task assign',
      params: { resource: 'task', operation: 'assign', projectId: 'p1', taskId: 't1', handles: ['ada', 'lin'] },
      endpoint: '/assignTask',
      body: { projectId: 'p1', taskId: 't1', handles: ['ada', 'lin'] },
    },
    {
      name: 'task set note',
      params: { resource: 'task', operation: 'setNote', projectId: 'p1', taskId: 't1', note: 'Remember', noteType: 'text/markdown' },
      endpoint: '/setTaskNote',
      body: { projectId: 'p1', taskId: 't1', type: 'text/markdown', value: 'Remember' },
    },
    {
      name: 'task set date with time and end date',
      params: { resource: 'task', operation: 'setDate', projectId: 'p1', taskId: 't1', startDate: '2026-10-09T15:30:00', dateOptions: { endDate: '2026-10-10T09:00:00.000-04:00' } },
      endpoint: '/setTaskDate',
      body: {
        projectId: 'p1',
        taskId: 't1',
        start: { date: '2026-10-09', time: '15:30:00', timezone: 'America/New_York' },
        end: { date: '2026-10-10', time: '09:00:00', timezone: 'America/New_York' },
      },
    },
    {
      name: 'task set custom field sends numbers as numbers',
      params: { resource: 'task', operation: 'setFieldValue', projectId: 'p1', taskId: 't1', fieldId: 'f1', value: '42' },
      endpoint: '/setTaskFieldValue',
      body: { projectId: 'p1', taskId: 't1', fieldId: 'f1', value: 42 },
    },
    {
      name: 'project create',
      params: { resource: 'project', operation: 'create', spaceId: 's1', content: '# Plan' },
      endpoint: '/createProject',
      body: { spaceId: 's1', contentType: 'text/markdown', content: '# Plan' },
    },
    {
      name: 'project create from template',
      params: { resource: 'project', operation: 'createFromTemplate', spaceId: 's1', templateId: 'tpl' },
      endpoint: '/createProjectFromTemplate',
      body: { spaceId: 's1', templateId: 'tpl' },
    },
    {
      name: 'project copy',
      params: { resource: 'project', operation: 'copy', projectId: 'p1', spaceId: 's2', projectTitle: 'Copy' },
      endpoint: '/copyProject',
      body: { projectId: 'p1', destinationSpaceId: 's2', projectTitle: 'Copy' },
    },
    {
      name: 'project get',
      params: { resource: 'project', operation: 'get', projectId: 'p1' },
      endpoint: '/getProject',
      body: { projectId: 'p1' },
    },
    {
      name: 'project complete',
      params: { resource: 'project', operation: 'complete', projectId: 'p1' },
      endpoint: '/completeProject',
      body: { projectId: 'p1' },
    },
    {
      name: 'project restore',
      params: { resource: 'project', operation: 'restore', projectId: 'p1' },
      endpoint: '/restoreProject',
      body: { projectId: 'p1' },
    },
    {
      name: 'project enable share link',
      params: { resource: 'project', operation: 'enableShareLink', projectId: 'p1' },
      endpoint: '/enableShareLink',
      body: { projectId: 'p1' },
    },
    {
      name: 'agent prompt',
      params: { resource: 'agent', operation: 'prompt', spaceId: 's1', agentId: 'a1', prompt: 'Summarize' },
      endpoint: '/promptAgent',
      body: { spaceId: 's1', agentId: 'a1', prompt: 'Summarize' },
    },
    {
      name: 'agent generate',
      params: { resource: 'agent', operation: 'generate', spaceId: 's1', text: 'A triage agent' },
      endpoint: '/generateAgent',
      body: { folderId: 's1', text: 'A triage agent' },
    },
    {
      name: 'agent get',
      params: { resource: 'agent', operation: 'get', spaceId: 's1', agentId: 'a1' },
      endpoint: '/getAgent',
      body: { agentId: 'a1' },
    },
    {
      name: 'agent add project knowledge',
      params: { resource: 'agent', operation: 'addKnowledgeProject', spaceId: 's1', agentId: 'a1', projectId: 'p1' },
      endpoint: '/addKnowledgeProject',
      body: { agentId: 'a1', projectId: 'p1' },
    },
    {
      name: 'workspace get many',
      params: { resource: 'workspace', operation: 'getMany' },
      endpoint: '/listSpaces',
      body: {},
    },
    {
      name: 'folder get many',
      params: { resource: 'folder', operation: 'getMany', spaceId: 's1' },
      endpoint: '/listFolders',
      body: { spaceId: 's1' },
    },
  ];

  it.each(cases)('$name', async ({ params, endpoint, body }) => {
    const { calls } = await run(params, () => ({ ok: true, item: { id: 'x' }, items: [{ id: 'x' }], summary: 'Done' }));
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ credentialType: 'taskadeApi', method: 'POST', url: endpoint });
    expect(calls[0].body).toEqual(body);
  });

  it('uses the OAuth2 credential when selected', async () => {
    const context = createContext({ authentication: 'oAuth2', resource: 'workspace', operation: 'getMany' }, () => ({ ok: true, items: [] }));
    await node.execute.call(context as unknown as IExecuteFunctions);
    expect(context.calls[0].credentialType).toBe('taskadeOAuth2Api');
  });

  it('returns the agent answer', async () => {
    const { output } = await run(
      { resource: 'agent', operation: 'prompt', spaceId: 's1', agentId: 'a1', prompt: 'Hi' },
      () => ({ ok: true, summary: 'Hello there' }),
    );
    expect(output).toEqual([{ agentId: 'a1', response: 'Hello there' }]);
  });

  it('pages through tasks with the after cursor until a short page', async () => {
    const page = (start: number, count: number) =>
      Array.from({ length: count }, (_, n) => ({ id: `t${start + n}`, text: 'x', completed: false }));
    const { output, calls } = await run(
      { resource: 'task', operation: 'getMany', projectId: 'p1', returnAll: true },
      (_path, body) => ({ ok: true, items: body?.after === undefined ? page(0, 100) : page(100, 7) }),
    );
    expect(output).toHaveLength(107);
    expect(calls.map((c) => c.body?.after)).toEqual([undefined, 't99']);
  });

  it('stops at the limit', async () => {
    const { output, calls } = await run(
      { resource: 'task', operation: 'getMany', projectId: 'p1', returnAll: false, limit: 3 },
      () => ({ ok: true, items: Array.from({ length: 100 }, (_, n) => ({ id: `t${n}` })) }),
    );
    expect(output).toHaveLength(3);
    expect(calls).toHaveLength(1);
  });

  it('turns an { ok: false } envelope into a node error', async () => {
    await expect(
      run({ resource: 'project', operation: 'get', projectId: 'p1' }, () => ({ ok: false, code: 'NOT_FOUND', message: 'Project not found' })),
    ).rejects.toThrow('Project not found');
  });

  it('rejects Before or After without a relative task', async () => {
    await expect(
      run({ resource: 'task', operation: 'create', projectId: 'p1', content: 'x', contentType: 'text/plain', options: { placement: 'afterend' } }),
    ).rejects.toThrow('need a parent or sibling task ID');
  });
});

describe('list search', () => {
  it('lists workspaces and their folders', async () => {
    const context = createContext({ authentication: 'accessToken' }, (path, body) =>
      path === '/listSpaces'
        ? { ok: true, items: [{ id: 's1', name: 'Acme' }] }
        : { ok: true, items: [{ id: `${String(body?.spaceId)}-f`, name: 'Marketing' }] },
    );
    const result = await node.methods.listSearch.searchSpaces.call(context as unknown as ILoadOptionsFunctions);
    expect(result.results).toEqual([
      { name: 'Acme', value: 's1' },
      { name: 'Acme / Marketing', value: 's1-f' },
    ]);
  });
});

describe('toTaskadeDate', () => {
  it('keeps only the date for all-day values', () => {
    expect(toTaskadeDate('2026-10-09T15:30:00', true, 'UTC')).toEqual({ date: '2026-10-09' });
  });
  it('adds seconds to an HH:MM time', () => {
    expect(toTaskadeDate('2026-10-09 07:05', false, 'UTC')).toEqual({ date: '2026-10-09', time: '07:05:00', timezone: 'UTC' });
  });
  it('converts an exact instant to the clock time of the timezone', () => {
    expect(toTaskadeDate('2026-10-09T15:00:00Z', false, 'America/New_York')).toEqual({
      date: '2026-10-09',
      time: '11:00:00',
      timezone: 'America/New_York',
    });
    expect(toTaskadeDate('2026-10-09T02:00:00.000+00:00', false, 'America/New_York')).toEqual({
      date: '2026-10-08',
      time: '22:00:00',
      timezone: 'America/New_York',
    });
    expect(toTaskadeDate('2026-10-09T15:00:00Z', true, 'Asia/Singapore')).toEqual({ date: '2026-10-09' });
  });
  it('rejects a value that is not a date', () => {
    expect(toTaskadeDate('next week', false, 'UTC')).toBeUndefined();
    expect(toTaskadeDate('2026-13-40T25:61:61', false, 'UTC')).toBeUndefined();
    expect(toTaskadeDate('2026-02-30', true, 'UTC')).toBeUndefined();
  });
});
