import App from '../index';

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
      expect.arrayContaining(['find_task', 'find_project']),
    );
  });

  it('keeps the existing trigger and create intact (no regression)', () => {
    expect(Object.keys(App.triggers)).toEqual(expect.arrayContaining(['task_due']));
    expect(App.creates.create_task).toBeDefined();
  });
});
