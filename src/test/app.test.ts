import { Bundle, ZObject } from 'zapier-platform-core';

import CreateProject from '../creates/createProject';
import RunAgent from '../creates/runAgent';
import App from '../index';
import FindAgent from '../searches/findAgent';
import GetProjectContent from '../searches/getProjectContent';

// zapier-platform-schema ships with the platform and has no published types;
// require() keeps it untyped without tripping noImplicitAny.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const schema = require('zapier-platform-schema');

// Zapier validates the *serialized* app definition, where every function is
// replaced by a `$func$<arity>$f$` marker (exactly what the CLI does before
// `zapier validate`/`zapier push`). Convert functions before validating so this
// test mirrors what the platform actually checks.
const toSchema = (value: unknown): unknown => {
  if (typeof value === 'function') {
    return `$func$${value.length}$f$`;
  }
  if (Array.isArray(value)) {
    return value.map(toSchema);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, toSchema(v)]),
    );
  }
  return value;
};

describe('Taskade app definition', () => {
  it('passes Zapier schema validation with no errors', () => {
    const results = schema.validateAppDefinition(toSchema(App));
    expect(results.errors).toEqual([]);
  });

  it('authenticates the client on the token refresh request', () => {
    expect(App.authentication.oauth2Config.refreshAccessToken.body).toEqual(
      expect.objectContaining({
        grant_type: 'refresh_token',
        client_id: '{{process.env.CLIENT_ID}}',
        client_secret: '{{process.env.CLIENT_SECRET}}',
      }),
    );
  });

  it('registers the expected creates', () => {
    expect(Object.keys(App.creates)).toEqual(
      expect.arrayContaining([
        'create_task',
        'complete_task',
        'update_task',
        'delete_task',
        'move_task',
        'set_task_date',
        'assign_task',
        'set_task_note',
        'set_custom_field',
        'create_project',
        'create_project_from_template',
        'complete_project',
        'copy_project',
        'enable_share_link',
        'run_agent',
        'create_agent',
        'generate_agent',
        'update_agent',
        'add_agent_knowledge',
        'publish_agent',
        'trigger_automation',
        'custom_api_call',
      ]),
    );
  });

  it('registers the public-webhook instant triggers', () => {
    expect(Object.keys(App.triggers)).toEqual(
      expect.arrayContaining([
        'new_comment',
        'task_assigned',
        'new_project',
        'project_assigned',
        'project_joined',
      ]),
    );
  });

  it('registers the expected searches', () => {
    expect(Object.keys(App.searches)).toEqual(
      expect.arrayContaining(['find_task', 'find_project', 'find_agent', 'get_project_content']),
    );
  });

  it('keeps the existing trigger and create intact (no regression)', () => {
    expect(Object.keys(App.triggers)).toEqual(expect.arrayContaining(['task_due']));
    expect(App.creates.create_task).toBeDefined();
  });
});

interface Operation {
  display: { label: string; description: string; hidden: boolean };
}

const visible = (group: Record<string, Operation>) =>
  Object.values(group).filter((operation) => !operation.display.hidden);

// Words that Zapier's title case check leaves in lower case.
const SMALL_WORDS = new Set(['a', 'an', 'and', 'as', 'by', 'for', 'in', 'of', 'on', 'or', 'to']);

describe('Zapier listing copy', () => {
  it('writes every visible label in title case', () => {
    const operations = [
      ...visible(App.triggers as Record<string, Operation>),
      ...visible(App.creates as Record<string, Operation>),
      ...visible(App.searches as Record<string, Operation>),
    ];
    for (const { display } of operations) {
      const lowerWords = display.label
        .split(' ')
        .filter((word) => !SMALL_WORDS.has(word) && word[0] !== word[0].toUpperCase());
      expect({ label: display.label, lowerWords }).toEqual({ label: display.label, lowerWords: [] });
      expect(display.label).not.toMatch(/zapier/i);
    }
  });

  it('starts every visible trigger description with "Triggers when" and ends it with a period', () => {
    for (const { display } of visible(App.triggers as Record<string, Operation>)) {
      expect(display.description).toMatch(/^Triggers when .+\.$/);
    }
  });

  it('states the Pro plan requirement on every public webhook trigger', () => {
    for (const key of ['new_comment', 'task_assigned', 'new_project', 'project_assigned', 'project_joined']) {
      expect(App.triggers[key].display.description).toContain('Requires a Taskade Pro plan or higher.');
    }
  });

  it('ends every visible action and search description with a period', () => {
    const operations = [
      ...visible(App.creates as Record<string, Operation>),
      ...visible(App.searches as Record<string, Operation>),
    ];
    for (const { display } of operations) {
      expect(display.description).toMatch(/^[A-Z][a-z]+s .+\.$/);
    }
  });
});

// A minimal stand-in for the Zapier `z` object: it records each request and
// answers with the given JSON body.
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

const fakeBundle = (inputData: Record<string, unknown>) =>
  ({ authData: { access_token: 'token' }, inputData, meta: {} }) as unknown as Bundle;

describe('Taskade Genesis actions and searches', () => {
  it('prompts the selected agent through the v2 API and returns its reply', async () => {
    const { z, calls } = fakeZ({ ok: true, summary: 'Hello from the agent.' });
    const result = await RunAgent.operation.perform(
      z,
      fakeBundle({ space_id: 'folder-1', agent_id: 'agent-1', prompt: 'Hi' }),
    );
    expect(result).toEqual({ summary: 'Hello from the agent.' });
    expect(calls[0].url).toBe('https://www.taskade.com/api/v2/promptAgent');
    expect(JSON.parse(calls[0].body ?? '{}')).toEqual({
      spaceId: 'folder-1',
      agentId: 'agent-1',
      prompt: 'Hi',
    });
  });

  it('offers dropdowns, not raw ID fields, for the agent to run', () => {
    const fields = RunAgent.operation.inputFields as Array<Record<string, unknown>>;
    expect(fields.find((field) => field.key === 'space_id')?.dynamic).toBe('get_all_spaces.id.name');
    expect(fields.find((field) => field.key === 'agent_id')?.dynamic).toBe('get_all_agents.id.title');
  });

  it('finds agents by name with the v2 name filter', async () => {
    const { z, calls } = fakeZ({
      ok: true,
      items: [{ id: 'agent-1', name: 'Support Triage', description: 'Sorts mail.', tools: {} }],
    });
    const result = await FindAgent.operation.perform(
      z,
      fakeBundle({ space_id: 'folder-1', query: 'Support' }),
    );
    expect(result).toEqual([{ id: 'agent-1', name: 'Support Triage', description: 'Sorts mail.' }]);
    expect(calls[0].url).toBe('https://www.taskade.com/api/v2/listAgents');
    expect(JSON.parse(calls[0].body ?? '{}')).toEqual({
      spaceId: 'folder-1',
      filterBy: { name: { operator: 'contains', value: 'Support' } },
    });
  });

  it('returns the project Markdown as one search result', async () => {
    const { z, calls } = fakeZ({
      ok: true,
      item: { id: 'project-1', name: 'Plan', contentType: 'text/markdown', content: '# Plan' },
    });
    const result = await GetProjectContent.operation.perform(z, fakeBundle({ project_id: 'project-1' }));
    expect(result).toEqual([{ id: 'project-1', name: 'Plan', content: '# Plan' }]);
    expect(calls[0].url).toBe('https://www.taskade.com/api/v2/exportProject');
    expect(JSON.parse(calls[0].body ?? '{}')).toEqual({ projectId: 'project-1' });
  });

  it('creates projects as Markdown, the only content type the endpoint accepts', async () => {
    const { z, calls } = fakeZ({ ok: true, item: { id: 'project-1', name: 'Plan' } });
    // A Zap saved with the removed "Plain text" option still holds content_type.
    await CreateProject.operation.perform(
      z,
      fakeBundle({ space_id: 'folder-1', content: '# Plan', content_type: 'text/plain' }),
    );
    expect(CreateProject.operation.inputFields.map((field) => field.key)).not.toContain('content_type');
    expect(JSON.parse(calls[0].body ?? '{}')).toEqual({
      folderId: 'folder-1',
      contentType: 'text/markdown',
      content: '# Plan',
    });
  });

  it('returns a search sample with the same keys as the live result', async () => {
    const { z } = fakeZ({ ok: true, item: { id: 'p', name: 'n', content: 'c' } });
    const [result] = await GetProjectContent.operation.perform(z, fakeBundle({ project_id: 'p' }));
    expect(Object.keys(result).sort()).toEqual(Object.keys(GetProjectContent.operation.sample).sort());
  });
});
