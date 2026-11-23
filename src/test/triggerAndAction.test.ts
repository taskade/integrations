import { Bundle, ZObject } from 'zapier-platform-core';

import CreateTask from '../creates/createTask';
import { NewComment } from '../triggers/publicWebhook';

// The walk-through in docs/build-a-trigger-and-an-action.md points at these tests.
// They run each perform function with a stand-in for the Zapier `z` object, so
// they need no network and no Taskade account.

const fakeZ = (json: unknown) => {
  const calls: Array<{ url: string; method: string; body?: string }> = [];
  const z = {
    request: async (options: { url: string; method: string; body?: string }) => {
      calls.push(options);
      return { status: 200, json };
    },
    errors: { Error: class extends Error {} },
  } as unknown as ZObject;
  return { z, calls };
};

const fakeBundle = (fields: Record<string, unknown>) =>
  ({ authData: { access_token: 'token' }, inputData: {}, meta: {}, ...fields }) as unknown as Bundle;

describe('trigger: new_comment', () => {
  it('subscribes the Zap URL to the comment.created event', async () => {
    const { z, calls } = fakeZ({ ok: true, hookId: 'hook-1' });
    const result = await NewComment.operation.performSubscribe(
      z,
      fakeBundle({ targetUrl: 'https://hooks.zapier.com/hooks/standard/1/abc/' }),
    );
    expect(result).toEqual({ ok: true, hookId: 'hook-1' });
    expect(calls[0].url).toBe('https://www.taskade.com/api/v2/subscribeWebhook');
    expect(calls[0].method).toBe('POST');
    expect(JSON.parse(calls[0].body ?? '{}')).toEqual({
      targetUrl: 'https://hooks.zapier.com/hooks/standard/1/abc/',
      triggerType: 'comment.created',
    });
  });

  it('unsubscribes with the hookId that the subscribe call returned', async () => {
    const { z, calls } = fakeZ({ ok: true });
    await NewComment.operation.performUnsubscribe(z, fakeBundle({ subscribeData: { hookId: 'hook-1' } }));
    expect(calls[0].url).toBe('https://www.taskade.com/api/v2/unsubscribeWebhook');
    expect(JSON.parse(calls[0].body ?? '{}')).toEqual({ hookId: 'hook-1' });
  });

  it('turns one delivery into one trigger result', async () => {
    const { z } = fakeZ({});
    const delivery = NewComment.operation.sample;
    const result = await NewComment.operation.perform(z, fakeBundle({ cleanedRequest: delivery }));
    expect(result).toEqual([delivery]);
  });

  it('has a sample for every output field', () => {
    for (const { key } of NewComment.operation.outputFields) {
      expect(NewComment.operation.sample).toHaveProperty(key as string);
    }
  });
});

describe('action: create_task', () => {
  it('creates the task at the end of the project and returns its ID', async () => {
    const { z, calls } = fakeZ({ ok: true, item: [{ id: 'task-1' }] });
    const result = await CreateTask.operation.perform(
      z,
      fakeBundle({ inputData: { project_id: 'project-1', content: 'Send the proposal' } }),
    );
    expect(result).toEqual({ taskId: 'task-1', nodeID: 'task-1', document: { id: 'project-1' } });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://www.taskade.com/api/v1/projects/project-1/tasks');
    expect(JSON.parse(calls[0].body ?? '{}')).toEqual({
      tasks: [{ contentType: 'text/markdown', content: 'Send the proposal', placement: 'beforeend' }],
    });
  });

  it('splits content over 2000 characters into more than one task', async () => {
    const { z, calls } = fakeZ({ ok: true, item: [{ id: 'task-1' }] });
    const content = `${'a'.repeat(1500)} ${'b'.repeat(1500)}`;
    await CreateTask.operation.perform(z, fakeBundle({ inputData: { project_id: 'project-1', content } }));
    const { tasks } = JSON.parse(calls[0].body ?? '{}');
    expect(tasks).toHaveLength(2);
  });

  it('shows the Taskade error message when the API refuses the request', async () => {
    const { z } = fakeZ({ ok: false, message: 'Project not found' });
    await expect(
      CreateTask.operation.perform(z, fakeBundle({ inputData: { project_id: 'missing', content: 'x' } })),
    ).rejects.toThrow('Project not found');
  });
});
