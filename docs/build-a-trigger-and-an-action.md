# Build a trigger and an action

This guide walks through one real trigger and one real action of the Taskade app for Zapier. Then it shows the same two parts in the n8n node. Every excerpt is copied from the files in this repository. Open the file beside the guide and read the full code there.

When you finish, you know where each part lives, how it calls the public Taskade API, and how to test it. The last section is a checklist to add your own trigger or action.

- [The Zapier app](#the-zapier-app)
  - [1. Registration](#1-registration)
  - [2. Authentication](#2-authentication)
  - [3. The trigger: New Comment](#3-the-trigger-new-comment)
  - [4. The action: Create Task](#4-the-action-create-task)
  - [5. A dynamic dropdown](#5-a-dynamic-dropdown)
  - [6. Deduplication](#6-deduplication)
  - [7. The test](#7-the-test)
  - [8. Run it against your own account](#8-run-it-against-your-own-account)
- [Add your own in 6 steps](#add-your-own-in-6-steps)
- [The n8n node](#the-n8n-node)

## The Zapier app

The Zapier app is TypeScript in [`src/`](../src). `tsc` compiles it to `lib/`, and Zapier loads `lib/index.js` through [`index.js`](../index.js). The Zapier name for an action is a "create".

| Part | File |
|---|---|
| Registration of every trigger, create and search | [`src/index.ts`](../src/index.ts) |
| OAuth2 with Taskade | [`src/authentication.ts`](../src/authentication.ts) |
| Request helper for the v1 and v2 API | [`src/client.ts`](../src/client.ts) |
| Shared dropdown fields | [`src/fields.ts`](../src/fields.ts) |
| The trigger in this guide | [`src/triggers/publicWebhook.ts`](../src/triggers/publicWebhook.ts) |
| The action in this guide | [`src/creates/createTask.ts`](../src/creates/createTask.ts) |
| The dropdown in this guide | [`src/triggers/getAllProjects.ts`](../src/triggers/getAllProjects.ts) |
| The tests in this guide | [`src/test/triggerAndAction.test.ts`](../src/test/triggerAndAction.test.ts) |

### 1. Registration

[`src/index.ts`](../src/index.ts) imports each definition and puts it in `triggers`, `creates` or `searches` under its key:

```ts
  triggers: {
    // hidden dropdown helpers
    [GetAllBlocks.key]: GetAllBlocks,
    [GetAllProjects.key]: GetAllProjects,
    ...
    // instant triggers
    [TaskDue.key]: TaskDue,
    [NewComment.key]: NewComment,
    ...
  },

  creates: {
    // tasks
    [CreateTask.key]: CreateTask,
    ...
```

The key is the public contract with every Zap that uses it. A Zap stores the key, so a renamed key breaks every Zap that uses the old one. Never rename or remove a key.

### 2. Authentication

The app uses OAuth2. [`src/authentication.ts`](../src/authentication.ts) points Zapier at the Taskade OAuth2 endpoints, and Zapier stores the token in `bundle.authData`:

```ts
export const authentication = {
  type: 'oauth2',
  test: {
    headers: {
      accept: 'application/json',
      authorization: 'bearer {{bundle.authData.access_token}}',
    },
    url: 'https://www.taskade.com/oauth2/ping',
  },
  oauth2Config: {
    authorizeUrl: {
      url: 'https://www.taskade.com/oauth2/authorize',
```

`CLIENT_ID` and `CLIENT_SECRET` belong to the Taskade app on Zapier. You do not need them to build or test. Each request sends the token as a bearer token. [`src/client.ts`](../src/client.ts) does this for every new trigger, action and search:

```ts
export const request = async (z: ZObject, bundle: Bundle, opts: RequestOptions) => {
  const base = opts.version === 'v2' ? BASE_V2 : BASE_V1;
  const url = opts.path.startsWith('http') ? opts.path : `${base}${opts.path}`;
  return z.request({
    url,
    method: opts.method,
    headers: {
      Accept: 'application/json',
      'content-type': 'application/json',
      authorization: `Bearer ${bundle.authData.access_token}`,
    },
```

`parseOk` in the same file turns an `{ ok: false, message }` answer from the API into a Zapier error that the user can read.

### 3. The trigger: New Comment

New Comment (`new_comment`) starts a Zap when someone adds a comment to a task. It is an instant trigger: Taskade sends each event to Zapier, and Zapier does not poll.

The five public-webhook triggers share one factory, `makePublicWebhookTrigger`, in [`src/triggers/publicWebhook.ts`](../src/triggers/publicWebhook.ts). A new trigger of this kind is one call to the factory:

```ts
export const NewComment = makePublicWebhookTrigger({
  key: 'new_comment',
  noun: 'Comment',
  label: 'New Comment',
  description: 'Triggers when a comment is added to a task. Requires a Taskade Pro plan or higher.',
  triggerType: 'comment.created',
  sample: {
    projectName: 'Customer Projects',
    projectId: 'A1b2C3d4E5f6G7h8',
    nodeId: '099630d4-267e-4b22-894b-08b69f3a4d79',
    nodeText: 'Follow up with the client',
    ...
  },
  outputFields: [
    { key: 'projectName' },
    { key: 'projectId' },
    { key: 'nodeId', label: 'Task ID' },
    { key: 'nodeText', label: 'Task Text' },
    ...
  ],
});
```

- `key` is the contract with every Zap. `noun` and `label` are what users see in the Zap editor.
- `triggerType` is the name of the public webhook event. The [webhooks guide](https://www.taskade.com/docs/guides/webhooks#supported-events) lists every event.
- `sample` is the data that the Zap editor shows before the first real event. It has the same fields as a real delivery, with made-up values.
- `outputFields` gives each field a label in the Zap editor.

The factory writes the four functions that Zapier calls for a hook trigger:

```ts
  const performSubscribe = async (z: ZObject, bundle: Bundle) => {
    const response = await request(z, bundle, {
      method: 'POST',
      path: '/subscribeWebhook',
      version: 'v2',
      body: { targetUrl: bundle.targetUrl, triggerType: options.triggerType },
    });
    const data: ApiResponse = parseOk(z, response.json);
    return data; // { ok: true, hookId } -> stored as bundle.subscribeData
  };

  const performUnsubscribe = async (z: ZObject, bundle: Bundle) => {
    const response = await request(z, bundle, {
      method: 'POST',
      path: '/unsubscribeWebhook',
      version: 'v2',
      // @ts-ignore subscribeData is populated by Zapier with performSubscribe's result
      body: { hookId: bundle.subscribeData.hookId },
    });
    return parseOk(z, response.json);
  };

  const perform = async (z: ZObject, bundle: Bundle) => [bundle.cleanedRequest];

  // No public list endpoint exists for historical events; return the
  // documented sample so users can set up their Zap before the first delivery.
  const performList = async () => [options.sample];
```

| Function | When Zapier calls it | What it does here |
|---|---|---|
| `performSubscribe` | The user turns the Zap on | Registers the Zap URL for the event with [`POST /subscribeWebhook`](https://www.taskade.com/docs/actions/subscribe-webhook) |
| `performUnsubscribe` | The user turns the Zap off | Removes the registration with [`POST /unsubscribeWebhook`](https://www.taskade.com/docs/actions/unsubscribe-webhook) |
| `perform` | Taskade sends an event | Returns the delivery as one trigger result |
| `performList` | The user tests the trigger in the Zap editor | Returns the sample |

The API docs mark `subscribeWebhook` and `unsubscribeWebhook` as deprecated. Their replacement is the signed [`POST /webhooks`](https://www.taskade.com/docs/actions/webhooks-post) API. The [n8n trigger](#the-n8n-trigger) uses it. The Zapier triggers still use the older pair, and they still work.

Webhook triggers need a Taskade Pro plan or higher. The description of each trigger says so, and a test checks it.

### 4. The action: Create Task

Create Task (`create_task`) adds a task to a project. Its file is [`src/creates/createTask.ts`](../src/creates/createTask.ts).

The definition names the action and lists its input fields. Four fields are dynamic dropdowns. `content` is plain text, and the two dates use the `datetime` type:

```ts
export default {
  key: 'create_task',
  noun: 'Task',
  display: {
    label: 'Create Task',
    description: 'Creates a task in a Taskade project.',
    hidden: false,
  },
  operation: {
    inputFields: [
      {
        key: 'space_id',
        label: 'Workspace or Folder',
        type: 'string',
        dynamic: 'get_all_spaces.id.name',
        required: false,
        ...
      },
      {
        key: 'project_id',
        label: 'Project',
        type: 'string',
        dynamic: 'get_all_projects.id.title',
        required: true,
        ...
      },
      ...
      {
        key: 'content',
        label: 'Content',
        type: 'string',
        helpText: 'The content of the task.',
        required: true,
        ...
      },
```

`perform` reads the values from `bundle.inputData` and calls [`POST /api/v1/projects/{projectId}/tasks`](https://www.taskade.com/docs/rest/task-create):

```ts
  const createTaskResponse = await z.request({
    url: `https://www.taskade.com/api/v1/projects/${bundle.inputData.project_id}/tasks`,
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'content-type': 'application/json',
      authorization: `Bearer ${bundle.authData.access_token}`,
    },
    body: JSON.stringify({
      tasks: tasks,
    }),
  });

  const createTaskData: CreateTasksResponse = createTaskResponse.json;

  if (!createTaskData.ok) {
    throw new z.errors.Error(createTaskData.message, 'invalid_input', 400);
  }
```

The API takes at most 2000 characters for each task, so `splitContentIntoChunks` cuts longer content into sibling tasks. If a start or end date is set, another call sets the date. If an assignee is set, another call assigns the task. The action returns the ID of the new task, and the sample has the same shape:

```ts
    sample: {
      taskId: '099630d4-267e-4b22-894b-08b69f3a4d79',
    },
    outputFields: [{ key: 'taskId' }],
```

`create_task` is older than [`src/client.ts`](../src/client.ts), so it writes its headers by hand. Newer actions use `request`, `parseOk` and the fields in [`src/fields.ts`](../src/fields.ts). [`src/creates/deleteTask.ts`](../src/creates/deleteTask.ts) is the shortest example, and a good template for a new action:

```ts
const perform = async (z: ZObject, bundle: Bundle) => {
  const response = await request(z, bundle, {
    method: 'DELETE',
    path: `/projects/${bundle.inputData.project_id}/tasks/${bundle.inputData.task_id}`,
  });

  parseOk(z, response.json);

  return { id: bundle.inputData.task_id as string, deleted: true };
};

export default {
  key: 'delete_task',
  noun: 'Task',
  display: {
    label: 'Delete Task',
    description: 'Deletes a task from a project.',
    hidden: false,
  },
  operation: {
    inputFields: [spaceField(false), projectField(true), taskField('task_id', 'Task', true)],
```

### 5. A dynamic dropdown

`dynamic: 'get_all_projects.id.title'` tells Zapier to fill the Project dropdown from the trigger with the key `get_all_projects`. Zapier uses `id` as the value and `title` as the label. That trigger is [`src/triggers/getAllProjects.ts`](../src/triggers/getAllProjects.ts). It is hidden, so users never see it as a trigger:

```ts
  key: 'get_all_projects',
  noun: 'Projects',
  display: {
    label: 'Get All Projects',
    description: "List all projects from a user's space.",
    hidden: true,
  },
```

Zapier gives the dropdown trigger the values that the user already picked in the action. Thus the project list follows the Workspace or Folder field:

```ts
const perform = async (z: ZObject, bundle: Bundle) => {
  if (bundle.inputData.space_id == null) {
    const response = await z.request({
      url: `https://www.taskade.com/api/v1/me/projects`,
      ...
    return data.items.map((i) => ({ id: i.id, title: i.name }));
  }

  const response = await z.request({
    url: `https://www.taskade.com/api/v1/folders/${bundle.inputData.space_id}/projects`,
```

The trigger sets `canPaginate: true`, so Zapier can ask for more pages and passes the page number in `bundle.meta.page`. This trigger does not read `bundle.meta.page` yet, and it sends the same request for each page.

### 6. Deduplication

Zapier deduplicates the results of a polling trigger by the `id` field of each item. Refer to [Zapier deduplication](https://docs.zapier.com/platform/build/deduplication). The hidden dropdown triggers are polling triggers, and each item that they return has an `id`.

The instant triggers in this app return each delivery as one result. They add no `id` and no other deduplication key. If you add a polling trigger, return an `id` on each item, or set `primary: true` on the output fields that make an item unique.

### 7. The test

The tests run with Jest and need no network and no Taskade account. [`src/test/triggerAndAction.test.ts`](../src/test/triggerAndAction.test.ts) tests the trigger and the action of this guide. It uses a stand-in for the Zapier `z` object that records each request and returns a fixed answer:

```ts
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
```

A test calls `perform` and checks the request that the action sent:

```ts
  it('creates the task at the end of the project and returns its ID', async () => {
    const { z, calls } = fakeZ({ ok: true, item: [{ id: 'task-1' }] });
    const result = await CreateTask.operation.perform(
      z,
      fakeBundle({ inputData: { project_id: 'project-1', content: 'Send the proposal' } }),
    );
    expect(result).toEqual({ taskId: 'task-1' });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://www.taskade.com/api/v1/projects/project-1/tasks');
```

[`src/test/app.test.ts`](../src/test/app.test.ts) checks the whole app. It runs the Zapier schema validation, checks that every key is registered, and checks the listing copy: labels in title case, trigger descriptions that start with "Triggers when", and the Pro plan notice on each webhook trigger.

Run all tests:

```bash
yarn test
```

### 8. Run it against your own account

The Zapier CLI runs a trigger or an action on your computer with `zapier invoke`. Nothing goes to Zapier. `npx` runs the CLI with no global install. You need a Taskade account and a personal access token from [Settings > API](https://www.taskade.com/settings/api). The token works in place of the OAuth2 token, because both go in the same `Authorization: Bearer` header.

Put the token in a `.env` file at the root of the repository. Git ignores `.env`. Never commit a token.

```bash
echo "authData_access_token='tskdp_your_token_here'" > .env
yarn build
npx --yes --package zapier-platform-cli@17.4.0 zapier invoke trigger get_all_spaces
npx --yes --package zapier-platform-cli@17.4.0 zapier invoke create create_task --inputData '{"project_id":"YOUR_PROJECT_ID","content":"Hello from my computer"}'
```

The first command lists your workspaces and folders, the same list that fills the dropdown. The second command adds a task to a real project in your account. Use a test project.

An instant trigger needs a public URL that Taskade can call, and `zapier invoke` runs on your computer. The tests in [`src/test/triggerAndAction.test.ts`](../src/test/triggerAndAction.test.ts) cover the subscribe, unsubscribe and delivery steps of an instant trigger.

## Add your own in 6 steps

- [ ] **1. Check the API.** Find the endpoint in the [Action API reference](https://www.taskade.com/docs/actions) or the [REST API reference](https://www.taskade.com/docs/rest). For an instant trigger, the event must be in the [list of webhook events](https://www.taskade.com/docs/guides/webhooks#supported-events). The Zapier app already uses every event in that list. A new event needs a change to the Taskade API first, so add a comment to [#10](https://github.com/taskade/integrations/issues/10).
- [ ] **2. Write one file.** Put an action in `src/creates/`, a search in `src/searches/` and a trigger in `src/triggers/`. Start from [`src/creates/deleteTask.ts`](../src/creates/deleteTask.ts). Pick a new key in `snake_case`. Write the label in title case. Start a trigger description with "Triggers when", start an action or search description with a verb that ends in "s", such as "Creates" or "Finds", and end it with a period. The tests in [`src/test/app.test.ts`](../src/test/app.test.ts) check these rules. Use `request` and `parseOk` from [`src/client.ts`](../src/client.ts) and the fields in [`src/fields.ts`](../src/fields.ts). Add a `sample` with the same keys as a real result, and `outputFields` with clear labels.
- [ ] **3. Register it.** Import the file in [`src/index.ts`](../src/index.ts) and add it to `triggers`, `creates` or `searches` under its key.
- [ ] **4. Test it.** Add a test in `src/test/` that calls `perform` with `fakeZ` and checks the request and the result. Add the key to the list in the matching "registers the expected ..." test in [`src/test/app.test.ts`](../src/test/app.test.ts).
- [ ] **5. Run the checks.** Run `yarn lint` and `yarn test`. Then run `zapier invoke` against a test project in your own account, as in [step 8](#8-run-it-against-your-own-account).
- [ ] **6. Open a pull request.** Add the new name to the tables in the [README](../README.md). Describe what you ran. A maintainer writes the release notes in `CHANGELOG.md` and releases the new version (refer to [CONTRIBUTING.md](../CONTRIBUTING.md#how-a-merged-change-reaches-users)).

## The n8n node

The n8n package is in [`packages/n8n-nodes-taskade`](../packages/n8n-nodes-taskade). It has two nodes: `Taskade` for actions and reads, and `Taskade Trigger` for events. Both call the Action API v2 through one helper, `taskadeApiRequest` in [`nodes/Taskade/GenericFunctions.ts`](../packages/n8n-nodes-taskade/nodes/Taskade/GenericFunctions.ts). Two credential types are in [`credentials/`](../packages/n8n-nodes-taskade/credentials): a personal access token and OAuth2.

### One operation: Task > Create

An n8n node describes its fields as data, and one `execute` function runs every operation.

1. The operation is an option in [`nodes/Taskade/descriptions/TaskDescription.ts`](../packages/n8n-nodes-taskade/nodes/Taskade/descriptions/TaskDescription.ts):

   ```ts
         { name: 'Create', value: 'create', action: 'Create a task', description: 'Create a task in a project' },
   ```

2. The Project field is a resource locator in [`nodes/Taskade/descriptions/SharedFields.ts`](../packages/n8n-nodes-taskade/nodes/Taskade/descriptions/SharedFields.ts). The user picks from a list, pastes a project URL, or types an ID. The list comes from the `searchProjects` method in [`nodes/Taskade/Taskade.node.ts`](../packages/n8n-nodes-taskade/nodes/Taskade/Taskade.node.ts), which calls `/listMyProjects`. It is the n8n form of a dynamic dropdown:

   ```ts
       modes: [
         {
           displayName: 'From List',
           name: 'list',
           type: 'list',
           typeOptions: { searchListMethod: 'searchProjects', searchable: true },
         },
   ```

3. `executeOperation` in [`nodes/Taskade/Taskade.node.ts`](../packages/n8n-nodes-taskade/nodes/Taskade/Taskade.node.ts) sends the request to [`POST /createTask`](https://www.taskade.com/docs/actions/create-task):

   ```ts
         const items = (await call('/createTask', { projectId, tasks: [task] }))
           .items as IDataObject[];
         return items?.[0] ?? {};
   ```

4. [`test/Taskade.node.test.ts`](../packages/n8n-nodes-taskade/test/Taskade.node.test.ts) has a table with one row for each operation: the parameters, the endpoint and the body that the node must send.

   ```ts
       {
         name: 'task create at the project root',
         params: { resource: 'task', operation: 'create', projectId: 'p1', content: 'Ship it', contentType: 'text/markdown', options: {} },
         endpoint: '/createTask',
         body: { projectId: 'p1', tasks: [{ contentType: 'text/markdown', content: 'Ship it', placement: 'beforeend' }] },
       },
   ```

To add an operation, add the option and its fields in the description file, add a branch in `executeOperation`, and add a row to the test table.

### The n8n trigger

[`nodes/TaskadeTrigger/TaskadeTrigger.node.ts`](../packages/n8n-nodes-taskade/nodes/TaskadeTrigger/TaskadeTrigger.node.ts) uses the signed webhook API. When the user activates the workflow, `create` registers the n8n URL for one event with [`POST /webhooks`](https://www.taskade.com/docs/actions/webhooks-post) and keeps the signing secret:

```ts
      async create(this: IHookFunctions): Promise<boolean> {
        const targetUrl = this.getNodeWebhookUrl('default') as string;
        const spaceIds = this.getNodeParameter('spaceIds', []) as string[];
        const response = await taskadeApiRequest.call(this, '/webhooks', {
          targetUrl,
          events: [this.getNodeParameter('event') as string],
          spaceIds,
        });
```

`delete` removes the registration when the user deactivates the workflow. `webhook` runs for each delivery. It checks the `X-Taskade-Signature-V2` header with `isValidSignature` and answers HTTP 401 to a delivery with a wrong signature, or one more than 5 minutes old. [`test/TaskadeTrigger.node.test.ts`](../packages/n8n-nodes-taskade/test/TaskadeTrigger.node.test.ts) tests the signature check and each step of the webhook lifecycle.

Run the n8n checks from the package folder:

```bash
cd packages/n8n-nodes-taskade
npm ci --ignore-scripts
npm run lint
npm test
npm run build
```
