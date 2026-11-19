# Taskade Integrations

The open source Taskade apps for Zapier, n8n and Make, built on the public Taskade API: use them, learn from them, add to them.

**[Use an integration](#use-an-integration)** · **[Learn how it is built](docs/build-a-trigger-and-an-action.md)** · **[Add a trigger or an action](CONTRIBUTING.md)**

## Use an integration

| Platform | Where to get it | Status |
|---|---|---|
| Zapier | [Taskade on Zapier](https://zapier.com/apps/taskade/integrations) | Live. The public version (1.3.0) has every Zapier trigger, action and search in the table below. A maintainer deploys each version by hand, so the live app can lag this source. Source in [`src/`](src). |
| n8n | [`n8n-nodes-taskade` on npm](https://www.npmjs.com/package/n8n-nodes-taskade) | On npm, published from GitHub Actions with npm provenance. Self-hosted n8n installs it as a community node. Not verified by n8n yet: see [#17](https://github.com/taskade/integrations/issues/17). Source in [`packages/n8n-nodes-taskade`](packages/n8n-nodes-taskade). |
| Make | Not listed on Make yet | Source in [`packages/make-app-taskade`](packages/make-app-taskade), checked in CI. Not submitted yet: see [`SUBMISSION.md`](packages/make-app-taskade/SUBMISSION.md) and [#33](https://github.com/taskade/integrations/issues/33). |

Two more platforms keep their own Taskade apps in their own repositories: [Taskade on Activepieces](https://www.activepieces.com/pieces/taskade) and [Taskade on Pipedream](https://pipedream.com/apps/taskade).

## What ships today

Every name below comes from the code in this repository. The [Zapier app reference](#zapier-app-reference) lists the Zapier keys.

| Platform | Triggers | Actions | Searches |
|---|---|---|---|
| Zapier | Task Due, New Comment, Task Assigned, New Project, Project Assigned, Member Joined Project | Create Task, Complete Task, Update Task, Delete Task, Move Task, Set Task Due Date, Assign Task, Set Task Note, Set Task Custom Field, Create Project, Create Project From Template, Complete Project, Copy Project, Get Project Share Link, Run AI Agent, Create AI Agent, Generate AI Agent, Update AI Agent, Add Knowledge to AI Agent, Enable Public Agent Access, Run Automation, Custom API Call | Find Task, Find Project, Find AI Agent, Get Project Content |
| n8n | Taskade Trigger: Task Due, Comment Created, Task Assigned, Project Created, Project Assigned, Member Joined Project | Task: Create, Update, Complete, Reopen, Delete, Move, Assign, Set Note, Set Date, Set Custom Field. Project: Create, Create From Template, Copy, Complete, Restore, Enable Share Link. Agent: Prompt, Generate, Add Project Knowledge | Task: Get Many. Project: Get, Get Many. Agent: Get, Get Many. Workspace: Get Many. Folder: Get Many |
| Make | Watch Tasks Due, Watch New Comments, Watch Task Assignments, Watch New Projects, Watch Project Assignments, Watch New Project Members | Create a Task, Update a Task, Complete a Task, Delete a Task, Move a Task, Assign a Task, Set a Task Date, Set a Task Note, Set a Task Custom Field, Create a Project, Create a Project from a Template, Copy a Project, Get a Project, Prompt an AI Agent, Generate an AI Agent, Make an API Call | List Tasks, List Projects, List AI Agents |

## Learn how it is built

Start with [Build a trigger and an action](docs/build-a-trigger-and-an-action.md). It walks through one real trigger and one real action of the Zapier app, file by file, and then the same for the n8n node.

```text
src/                            the Zapier app (TypeScript)
  index.ts                      registers every trigger, action and search by its key
  authentication.ts             OAuth2 with Taskade
  client.ts                     one request helper for the v1 and v2 API
  fields.ts                     shared dropdown fields (workspace, project, task)
  triggers/                     instant triggers, and hidden triggers that fill dropdowns
  creates/                      actions
  searches/                     searches
  test/                         Jest tests
packages/n8n-nodes-taskade/     the n8n node and the n8n trigger
packages/make-app-taskade/      the Make app
```

## Add a trigger or an action

Read [CONTRIBUTING.md](CONTRIBUTING.md). It has the setup, the commands that CI runs, how to run the Zapier app against your own Taskade account, and the rules. To ask for a trigger or an action, [open a request](https://github.com/taskade/integrations/issues/new/choose).

## What the public API offers today

Everything in this repository uses the public Taskade API, except the Zapier `task_due` trigger. If the API can do it, an integration here can do it.

| Area | Docs |
|---|---|
| Start here: every API surface and the plans that have it | [API overview](https://www.taskade.com/docs/getting-started/api-overview) |
| Sign in with a personal access token or OAuth2 | [Authentication](https://www.taskade.com/docs/getting-started/authentication) |
| Webhook events: `task.due`, `task.assigned`, `comment.created`, `project.created`, `project.assigned`, `project.joined`. Pro plan and higher. | [Webhooks guide](https://www.taskade.com/docs/guides/webhooks) · [`POST /webhooks`](https://www.taskade.com/docs/actions/webhooks-post) |
| Tasks: create, update, complete, move, assign, dates, notes, custom fields | [Create task](https://www.taskade.com/docs/actions/create-task) · [List tasks](https://www.taskade.com/docs/actions/list-tasks) |
| Projects: create, copy, templates, share links, Markdown export | [Create project](https://www.taskade.com/docs/actions/create-project) · [Export project](https://www.taskade.com/docs/actions/export-project) |
| AI agents: create, generate, prompt, knowledge, public access | [Prompt agent](https://www.taskade.com/docs/actions/prompt-agent) · [List agents](https://www.taskade.com/docs/actions/list-agents) |
| Workspaces and folders | [List spaces](https://www.taskade.com/docs/actions/list-spaces) · [List folders](https://www.taskade.com/docs/actions/list-folders) |
| Full reference | [Action API v2](https://www.taskade.com/docs/actions) · [REST API v1](https://www.taskade.com/docs/rest) · [v2 spec](https://www.taskade.com/api/documentation/v2/json) · [v1 spec](https://www.taskade.com/api/documentation/v1/json) |

A new instant trigger needs a new public webhook event first. [#10](https://github.com/taskade/integrations/issues/10) tracks the events that are not public yet.

## Zapier app reference

All triggers are instant (webhooks). The triggers on the public webhook-subscription API need a Taskade Pro plan or higher. Actions and searches do not need Pro. Run AI Agent and Generate AI Agent use AI credits, and Run Automation needs an automation with a webhook trigger, which also needs Pro.

| Type | Name | Key | Notes |
|---|---|---|---|
| Trigger | Task Due | `task_due` | Fires when a task is due. Uses Taskade-internal webhook routes. |
| Trigger | New Comment | `new_comment` | Public webhook-subscription API (`POST /api/v2/subscribeWebhook`) |
| Trigger | Task Assigned | `task_assigned` | Public webhook-subscription API |
| Trigger | New Project | `new_project` | Public webhook-subscription API |
| Trigger | Project Assigned | `project_assigned` | Public webhook-subscription API |
| Trigger | Member Joined Project | `project_joined` | Public webhook-subscription API |
| Action | Create Task | `create_task` | Splits content over 2000 characters into sibling tasks |
| Action | Complete Task | `complete_task` | Can also reopen a task |
| Action | Update Task | `update_task` | |
| Action | Delete Task | `delete_task` | |
| Action | Move Task | `move_task` | |
| Action | Set Task Due Date | `set_task_date` | Can also clear the date |
| Action | Assign Task | `assign_task` | |
| Action | Set Task Note | `set_task_note` | |
| Action | Set Task Custom Field | `set_custom_field` | |
| Action | Create Project | `create_project` | From Markdown text |
| Action | Create Project From Template | `create_project_from_template` | |
| Action | Complete Project | `complete_project` | Can also restore a project |
| Action | Copy Project | `copy_project` | |
| Action | Get Project Share Link | `enable_share_link` | |
| Action | Run AI Agent | `run_agent` | Sends a prompt and returns the reply. Uses AI credits. |
| Action | Create AI Agent | `create_agent` | From a persona template |
| Action | Generate AI Agent | `generate_agent` | From a plain-language description |
| Action | Update AI Agent | `update_agent` | |
| Action | Add Knowledge to AI Agent | `add_agent_knowledge` | A project or a media file |
| Action | Enable Public Agent Access | `publish_agent` | |
| Action | Run Automation | `trigger_automation` | Starts a Taskade automation that begins with a webhook trigger |
| Action | Custom API Call | `custom_api_call` | Sends an authenticated request to any Taskade API endpoint |
| Search | Find Task | `find_task` | |
| Search | Find Project | `find_project` | |
| Search | Find AI Agent | `find_agent` | |
| Search | Get Project Content | `get_project_content` | Returns the project as Markdown |

Hidden dropdown helpers (not user-facing): `get_all_spaces`, `get_all_projects`, `get_all_blocks`, `get_all_assignable_members`, `get_all_tasks`, `get_all_project_templates`, `get_all_agents`, `get_all_fields`.

Auth: OAuth2 (`www.taskade.com/oauth2/*`). The API also accepts [personal access tokens](https://www.taskade.com/settings/api) (`Authorization: Bearer tskdp_…`), which the n8n node, the Make app and local tests use.

> Note: only `task_due` still uses Taskade-internal webhook routes. The other instant triggers use the public webhook-subscription API, so other platforms can subscribe to the same events.

## Release

A merged change does not reach users by itself. [CONTRIBUTING.md](CONTRIBUTING.md#how-a-merged-change-reaches-users) has the steps for each platform. For the Zapier app, a maintainer runs them:

1. Bump `version` in `package.json` to a number that `zapier versions` does not list yet
2. Add the release notes to `CHANGELOG.md`
3. `yarn build && zapier push`
4. Test each new trigger, action and search in a Zap, then `zapier promote <version>`
5. `zapier migrate <old version> <new version> <percent>` moves existing users to the new version. Start with a small percent and watch `zapier logs`

Deploying to the live Zapier app is a deliberate, manual step. It never happens on merge.

```bash
zapier logs
zapier logs --type=console
zapier logs --type=http --detailed
```

## Roadmap

- Platform-agnostic operation manifest + per-platform codegen: the existing [n8n node](packages/n8n-nodes-taskade) and the Make app rendered from one source
- Move `task_due` to the public webhook API

See the [Zapier Integration Guide](https://help.taskade.com/en/articles/8958540-zapier-integration) for end-user docs.

## Related repos

- [Taskade Docs](https://github.com/taskade/docs): source for [docs.taskade.com](https://docs.taskade.com)
- [Taskade MCP](https://github.com/taskade/mcp): official MCP server ([`@taskade/mcp-server`](https://www.npmjs.com/package/@taskade/mcp-server) on npm)
- [Taskade](https://github.com/taskade/taskade): platform home, including the Taskade Genesis AI app builder
