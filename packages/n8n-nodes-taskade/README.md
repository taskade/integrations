# n8n-nodes-taskade

Official [n8n](https://n8n.io) community node for [Taskade](https://www.taskade.com) — tasks, projects, and AI agents on the [Taskade public API](https://docs.taskade.com).

## Operations

| Resource | Operations |
|---|---|
| Task | Create, Complete, Uncomplete, Update, Delete, Move, Get Many |
| Project | Create (Markdown), Create From Template, Get Many |
| AI Agent | Prompt (synchronous response via the v2 Action API) |

The node is `usableAsTool`, so n8n AI agents can call Taskade directly.

## Credentials

Personal Access Token — create one at taskade.com → Settings → API (tokens start with `tskdp_`). The credential test calls `GET /api/v1/workspaces`.

## Installation

Self-hosted n8n: **Settings → Community Nodes → Install** → `n8n-nodes-taskade` (npm publish pending — follow this repo for the release).

## Development

```bash
npm install
npm run build   # tsc -> dist/ + icon copy
```

Part of [taskade/integrations](https://github.com/taskade/integrations) — the public source-of-truth for Taskade integrations. MIT.
