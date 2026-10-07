# Taskade Integrations

The public source-of-truth for Taskade actions & triggers across automation platforms — starting with the official [Zapier integration](https://zapier.com/apps/taskade/integrations), built entirely on the [Taskade public API](https://docs.taskade.com/).

Building a Taskade integration for another platform (n8n, Activepieces, Make, Pipedream, or your own)? Everything here runs against the documented public API — copy freely. Live OpenAPI specs:

- v1 REST API: `https://www.taskade.com/api/v1` — [spec](https://www.taskade.com/api/documentation/v1/json)
- v2 Action API: `https://www.taskade.com/api/v2` — [spec](https://www.taskade.com/api/documentation/v2/json)

## Status

| Platform | Status |
|---|---|
| Zapier | Live: [Taskade on Zapier](https://zapier.com/apps/taskade/integrations). Deploys are manual, so the live app version can lag this source. |
| n8n | Source in [`packages/n8n-nodes-taskade`](packages/n8n-nodes-taskade) (package `n8n-nodes-taskade` 0.2.0). Not yet published to npm. |
| Activepieces, Make, Pipedream | Planned. No code in this repo yet. |

## Zapier app capabilities

| Type | Keys | Notes |
|---|---|---|
| Trigger (instant) | `task_due` | Fires when a task is due. Uses Taskade-internal webhook routes. |
| Trigger (instant) | `new_comment`, `task_assigned`, `new_project`, `project_assigned`, `project_joined` | Use the public webhook-subscription API (`POST /api/v2/subscribeWebhook`) |
| Action (tasks) | `create_task`, `complete_task`, `update_task`, `delete_task`, `move_task`, `set_task_date`, `assign_task`, `set_task_note`, `set_custom_field` | `create_task` splits content over 2000 characters into sibling tasks |
| Action (projects) | `create_project`, `create_project_from_template`, `complete_project`, `copy_project`, `enable_share_link` | |
| Action (AI agents) | `run_agent`, `create_agent`, `generate_agent`, `update_agent`, `add_agent_knowledge`, `publish_agent` | `run_agent` prompts an agent and returns its response |
| Action (other) | `trigger_automation`, `custom_api_call` | `custom_api_call` sends an authenticated request to any Taskade API endpoint |
| Search | `find_task`, `find_project` | |

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
- Move `task_due` to the public webhook-subscription API

See the [Zapier Integration Guide](https://help.taskade.com/en/articles/8958540-zapier-integration) for end-user docs.

## Related repos

- [Taskade Docs](https://github.com/taskade/docs) — source for [docs.taskade.com](https://docs.taskade.com)
- [Taskade MCP](https://github.com/taskade/mcp) — official MCP server ([`@taskade/mcp-server`](https://www.npmjs.com/package/@taskade/mcp-server) on npm)
- [Taskade](https://github.com/taskade/taskade) — platform home, including the Genesis AI app builder
