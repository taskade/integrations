# Taskade Integrations

The public source-of-truth for Taskade actions & triggers across automation platforms, starting with the official [Zapier integration](https://zapier.com/apps/taskade/integrations). It is built on the [Taskade public API](https://docs.taskade.com/), with one exception: the `task_due` trigger (see the note below).

Building a Taskade integration for another platform (n8n, Activepieces, Make, Pipedream, or your own)? Everything here except `task_due` runs against the documented public API, so copy freely. Live OpenAPI specs:

- v1 REST API: `https://www.taskade.com/api/v1` — [spec](https://www.taskade.com/api/documentation/v1/json)
- v2 Action API: `https://www.taskade.com/api/v2` — [spec](https://www.taskade.com/api/documentation/v2/json)

## Status

| Platform | Status |
|---|---|
| Zapier | Live: [Taskade on Zapier](https://zapier.com/apps/taskade/integrations). The public version has 1 trigger (Task Due) and 1 action (Create Task). This source holds the full set below. Deploys are manual, so the live app version can lag this source. |
| Activepieces | Live: [Taskade on Activepieces](https://www.activepieces.com/pieces/taskade) (`@activepieces/piece-taskade`). Activepieces maintains the piece in [its own repo](https://github.com/activepieces/activepieces). |
| Pipedream | Live: [Taskade on Pipedream](https://pipedream.com/apps/taskade). Pipedream maintains the components in [its own repo](https://github.com/PipedreamHQ/pipedream). |
| n8n | Source in [`packages/n8n-nodes-taskade`](packages/n8n-nodes-taskade). Not yet published to npm. |
| Make | In review: the official Make app is in [#34](https://github.com/taskade/integrations/pull/34). Not yet on Make. |

## Zapier app capabilities

All triggers are instant (webhooks). The 5 triggers on the public webhook-subscription API need a Taskade Pro plan or higher. Actions and searches do not need Pro. Run AI Agent and Generate AI Agent use AI credits, and Run Automation needs an automation with a webhook trigger, which also needs Pro.

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

Auth: OAuth2 (`www.taskade.com/oauth2/*`). The API also supports [Personal Access Tokens](https://www.taskade.com/settings/api) (`Authorization: Bearer tskdp_…`) for other platforms.

> Note: only `task_due` still uses Taskade-internal webhook routes. The other instant triggers use the public webhook-subscription API, so other platforms can subscribe to the same events.

## Development

Prerequisites: Node ≥ 18, Yarn, [Zapier CLI](https://docs.zapier.com/platform/build-cli/overview#quick-setup-guide).

```bash
yarn install
yarn lint         # eslint on src/
yarn build        # tsc -> lib/
yarn test         # builds, then validates the app against Zapier's official schema
```

The test suite validates the full app definition with `zapier-platform-schema`'s `validateAppDefinition` — the same check `zapier validate` runs — so schema regressions fail in CI before they reach a deploy.

### Release

1. Bump `version` in `package.json` to a number that `zapier versions` does not list yet
2. Add the release notes to `CHANGELOG.md`
3. `yarn build && zapier push`
4. Test each new trigger, action and search in a Zap, then `zapier promote <version>`
5. `zapier migrate <old version> <new version> <percent>` moves existing users to the new version. Start with a small percent and watch `zapier logs`

Deploying to the live Zapier app is a deliberate, manual step — never automatic on merge.

### Logs

```bash
zapier logs
zapier logs --type=console
zapier logs --type=http --detailed
```

## Roadmap

- Platform-agnostic operation manifest + per-platform codegen: the existing [n8n node](packages/n8n-nodes-taskade) and the Make app rendered from one source
- Move `task_due` to the public webhook-subscription API

See the [Zapier Integration Guide](https://help.taskade.com/en/articles/8958540-zapier-integration) for end-user docs.

## Related repos

- [Taskade Docs](https://github.com/taskade/docs): source for [docs.taskade.com](https://docs.taskade.com)
- [Taskade MCP](https://github.com/taskade/mcp): official MCP server ([`@taskade/mcp-server`](https://www.npmjs.com/package/@taskade/mcp-server) on npm)
- [Taskade](https://github.com/taskade/taskade): platform home, including the Taskade Genesis AI app builder
