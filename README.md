<div align="center">

# Taskade Integration Kit

**The public source-of-truth for Taskade actions & triggers — across Zapier, n8n, Activepieces, Make, Pipedream, and anything you build.**

Every integration here runs on the documented [Taskade public API](https://docs.taskade.com). Copy freely.

<br>

[![Zapier](https://img.shields.io/badge/Zapier-live-FF4A00?style=flat-square&logo=zapier&logoColor=white)](https://zapier.com/apps/taskade/integrations)
[![CI](https://github.com/taskade/integrations/actions/workflows/ci.yml/badge.svg)](https://github.com/taskade/integrations/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-3DA639?style=flat-square)](LICENSE)
[![API Docs](https://img.shields.io/badge/API_Docs-docs.taskade.com-333?style=flat-square)](https://docs.taskade.com)

</div>

---

## Why this exists

[Taskade](https://www.taskade.com) is the **AI-native workspace platform** — projects that remember, agents that think, automations that execute. **[Taskade Genesis](https://www.taskade.com/genesis)** turns one prompt into a live app with all three.

This kit is how that workspace reaches the **outside world**: the actions and triggers that let a Taskade automation (or a Genesis app) create tasks, run an AI agent, or fire on an event in Zapier, n8n, and beyond. One documented API surface, many platforms.

## Part of the Taskade ecosystem

| Repo | What it is |
| --- | --- |
| **[taskade/taskade](https://github.com/taskade/taskade)** | The platform home — the AI-native workspace, **Genesis** app builder, and where to file bugs & feature requests |
| **[taskade/mcp](https://github.com/taskade/mcp)** | Official **MCP server** + OpenAPI→MCP generator — wire Taskade into any AI tool ([`@taskade/mcp-server`](https://www.npmjs.com/package/@taskade/mcp-server)) |
| **[taskade/docs](https://github.com/taskade/docs)** | Source for [docs.taskade.com](https://docs.taskade.com) — the API reference & guides |
| **[taskade/awesome-vibe-coding](https://github.com/taskade/awesome-vibe-coding)** | The complete guide to building software by prompt |
| **[taskade/taskade-sample-app](https://github.com/taskade/taskade-sample-app)** | Genesis App Kit — a Workspace DNA template to build from |
| **taskade/integrations** | 👈 you are here — the integration kit |

## Platforms

| Platform | Status | Where |
| --- | --- | --- |
| **Zapier** | ✅ Live | [zapier.com/apps/taskade](https://zapier.com/apps/taskade/integrations) — source in [`src/`](src) |
| **n8n** | ✅ Source here · npm publish pending | [`packages/n8n-nodes-taskade`](packages/n8n-nodes-taskade) — official community node |
| **Other platforms** | 🔧 Build on the API | Activepieces, Make, Pipedream, or your own — everything below runs against the public API, copy freely |

## Zapier app capabilities

| Type | Key | What it does |
|---|---|---|
| Trigger | `task_due` | Fires when a task is due (instant / webhook) |
| Action | `create_task` | Create a task — due date, assignee; content > 2000 chars auto-chunks into sibling tasks |
| Action | `complete_task` | Mark a task complete, or reopen it |
| Action | `update_task` | Update a task's content |
| Action | `delete_task` | Delete a task |
| Action | `move_task` | Reorder / reparent a task within a project |
| Action | `create_project` | Create a project from Markdown |
| Action | `create_project_from_template` | Create a project from a template |
| Action | `run_agent` | Prompt a Taskade AI agent, get its response (v2 `promptAgent`) |
| Action | `custom_api_call` | Authenticated request to any Taskade API endpoint |
| Search | `find_task` | Find a task in a project by text |
| Search | `find_project` | Find a project by name |

Hidden dropdown helpers (not user-facing): `get_all_spaces`, `get_all_projects`, `get_all_blocks`, `get_all_assignable_members`, `get_all_tasks`, `get_all_project_templates`.

## Built on the public API

Two live OpenAPI surfaces — both documented, both yours to build on:

- **v1 REST API** — `https://www.taskade.com/api/v1` · [spec](https://www.taskade.com/api/documentation/v1/json) — full task CRUD, projects, members.
- **v2 Action API** — `https://www.taskade.com/api/v2` · [spec](https://www.taskade.com/api/documentation/v2/json) — action-based (`/listSpaces`, `/promptAgent`, …), adds AI-agent prompting.

**Auth:** the Zapier app connects via **OAuth2** (click *Connect* — no token to copy). For direct API calls, the n8n node, or your own integration, use a [Personal Access Token](https://www.taskade.com/settings/api) (`Authorization: Bearer tskdp_…`).

**Event subscriptions (Beta):** `POST /api/v2/subscribeWebhook` registers a `targetUrl` for an event (`task.due` today) and returns a `hookId`; `POST /api/v2/unsubscribeWebhook` removes it. Available on **Pro and above**. This is the portable surface the `task_due` trigger uses — see [Programmatic Webhook Subscriptions](https://docs.taskade.com/apis-living-system-development/webhooks).

## Development

Prerequisites: Node ≥ 18, Yarn, [Zapier CLI](https://docs.zapier.com/platform/build-cli/overview#quick-setup-guide).

```bash
yarn install
yarn lint         # eslint (public config — no private packages)
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

- Platform-agnostic operation manifest + per-platform codegen — the existing [n8n node](packages/n8n-nodes-taskade) and future targets (Activepieces, Make, Pipedream) rendered from one source.
- More portable event triggers as additional events light up on the public subscription API (`task.completed`, `task.assigned`, …).

See the [Zapier Integration Guide](https://help.taskade.com/en/articles/8958540-zapier-integration) for end-user docs.

## Contributing

Building a Taskade integration for another platform, or improving an existing one? **[CONTRIBUTING.md](CONTRIBUTING.md)** has the quick start — and now that the repo installs with no auth and no private registries, you can clone, build, and test in one go.

## License

[MIT](LICENSE) — © Taskade.

<div align="center">
<br>
⭐ <b>Find this useful? <a href="https://github.com/taskade/integrations">Star the repo</a></b> and build the next integration.
</div>
