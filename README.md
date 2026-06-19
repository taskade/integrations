# Taskade Integrations

The public source-of-truth for Taskade actions & triggers across automation platforms — starting with the official [Zapier integration](https://zapier.com/apps/taskade/integrations), built entirely on the [Taskade public API](https://docs.taskade.com/).

Building a Taskade integration for another platform (n8n, Activepieces, Make, Pipedream, or your own)? Everything here runs against the documented public API — copy freely. Live OpenAPI specs:

- v1 REST API: `https://www.taskade.com/api/v1` — [spec](https://www.taskade.com/api/documentation/v1/json)
- v2 Action API: `https://www.taskade.com/api/v2` — [spec](https://www.taskade.com/api/documentation/v2/json)

## Packages

- [`packages/n8n-nodes-taskade`](packages/n8n-nodes-taskade) — official n8n community node for Taskade, built in this repo

## Zapier app capabilities

| Type | Key | What it does |
|---|---|---|
| Trigger | `task_due` | Fires when a task is due (instant/webhook) |
| Action | `create_task` | Create a task — with due date, assignee; content > 2000 chars auto-chunks into sibling tasks |
| Action | `complete_task` | Mark a task complete, or reopen it |
| Action | `update_task` | Update a task's content |
| Action | `delete_task` | Delete a task |
| Action | `move_task` | Reorder/reparent a task within a project |
| Action | `create_project` | Create a project from Markdown |
| Action | `create_project_from_template` | Create a project from a template |
| Action | `run_agent` | Prompt a Taskade AI agent, get its response (v2 `promptAgent`) |
| Action | `custom_api_call` | Authenticated request to any Taskade API endpoint |
| Search | `find_task` | Find a task in a project by text |
| Search | `find_project` | Find a project by name |

Hidden dropdown helpers (not user-facing): `get_all_spaces`, `get_all_projects`, `get_all_blocks`, `get_all_assignable_members`, `get_all_tasks`, `get_all_project_templates`.

Auth: OAuth2 (`www.taskade.com/oauth2/*`). The API also supports [Personal Access Tokens](https://www.taskade.com/settings/api) (`Authorization: Bearer tskdp_…`) for other platforms.

> Note: the `task_due` trigger subscribes via the public **Action API v2** (`POST /api/v2/subscribeWebhook` / `unsubscribeWebhook`, available on **Pro and above**), so event triggers are portable to any platform. Its test-sample fetch still uses an internal route pending a public sample endpoint.

## Development

Prerequisites: Node ≥ 18, Yarn, [Zapier CLI](https://docs.zapier.com/platform/build-cli/overview#quick-setup-guide).

```bash
yarn install
yarn build        # tsc -> lib/
yarn test         # builds, then validates the app against Zapier's official schema
```

The test suite validates the full app definition with `zapier-platform-schema`'s `validateAppDefinition` — the same check `zapier validate` runs — so schema regressions fail in CI before they reach a deploy.

### Release

1. Bump `version` in `package.json`
2. `yarn build && zapier build && zapier push`

Deploying to the live Zapier app is a deliberate, manual step — never automatic on merge.

### Logs

```bash
zapier logs
zapier logs --type=console
zapier logs --type=http --detailed
```

## Roadmap

- Platform-agnostic operation manifest + per-platform codegen — the existing [n8n node](packages/n8n-nodes-taskade) and future targets (Activepieces, Make, Pipedream) rendered from one source
- Portable event triggers once the public webhook-subscription API ships

See the [Zapier Integration Guide](https://help.taskade.com/en/articles/8958540-zapier-integration) for end-user docs.

## Related repos

- [Taskade Docs](https://github.com/taskade/docs) — source for [docs.taskade.com](https://docs.taskade.com)
- [Taskade MCP](https://github.com/taskade/mcp) — official MCP server ([`@taskade/mcp-server`](https://www.npmjs.com/package/@taskade/mcp-server) on npm)
- [Taskade](https://github.com/taskade/taskade) — platform home, including the Genesis AI app builder
