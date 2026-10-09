# n8n-nodes-taskade

The official [Taskade](https://www.taskade.com) node for [n8n](https://n8n.io). Create and update tasks, build projects from Markdown or templates, prompt Taskade AI agents, and start workflows from Taskade events. The node runs on the [Taskade Public API v2](https://www.taskade.com/api/documentation/v2).

<!-- Screenshot placeholder: docs/screenshots/node-panel.png (the Taskade node, Task > Create) -->
<!-- Screenshot placeholder: docs/screenshots/trigger-panel.png (the Taskade Trigger, Task Due) -->
<!-- Screenshot placeholder: docs/screenshots/example-workflow.png (the comment-to-agent example) -->

[Installation](#installation) · [Credentials](#credentials) · [Operations](#operations) · [Trigger](#trigger) · [Examples](#examples) · [Compatibility](#compatibility) · [Resources](#resources)

## Installation

- **n8n Cloud and self-hosted, verified node:** open the nodes panel, search for **Taskade**, and install it. (This is available after n8n approves the node.)
- **Self-hosted, community node:** go to **Settings > Community Nodes > Install**, and enter `n8n-nodes-taskade`. Refer to the [n8n community nodes guide](https://docs.n8n.io/integrations/community-nodes/installation/).

## Credentials

The node supports two credential types. Select one in the **Authentication** field of the node.

### Taskade API (personal access token)

1. In Taskade, open **Settings > API** ([taskade.com/settings/api](https://www.taskade.com/settings/api)).
2. Create a personal access token. The token starts with `tskdp_`.
3. In n8n, create a **Taskade API** credential and paste the token.

The credential test lists your workspaces (`POST /listSpaces`).

### Taskade OAuth2 API

Use OAuth2 when each n8n user connects their own Taskade account.

1. In n8n, start a **Taskade OAuth2 API** credential and copy the **OAuth Redirect URL** that the form shows. On n8n Cloud it is `https://oauth.n8n.cloud/oauth2/callback`. On self-hosted n8n it is `https://<your-n8n-host>/rest/oauth2-credential/callback`.
2. In Taskade, open **Settings > API > OAuth2 Applications**, create an application, and add that redirect URL.
3. Copy the client ID and client secret into the n8n credential, then click **Connect my account**.

Access tokens expire after one hour. n8n refreshes them for you.

## Operations

| Resource | Operations |
|---|---|
| Task | Create, Update, Complete, Reopen, Delete, Move, Assign, Set Note, Set Date, Set Custom Field, Get Many |
| Project | Create (from Markdown), Create From Template, Copy, Get, Get Many, Complete, Restore, Enable Share Link |
| Agent | Prompt, Generate (from a description), Get, Get Many, Add Project Knowledge |
| Workspace | Get Many |
| Folder | Get Many |

Notes:

- **Workspace or Folder** fields accept a workspace ID or a folder ID. The list shows both.
- **Project** fields list the projects you viewed most recently. Use **By URL** to paste a project link (`https://www.taskade.com/d/...`), or **By ID**.
- **Agent > Prompt** returns `{ agentId, response }`, where `response` is the answer of the agent.
- **Task > Set Custom Field** sends a numeric value as a number. A select field takes the option ID, not its label.
- **Task > Update** and **Task > Set Note** take one line of text. The API rejects line breaks there.
- **Task > Set Date** uses the workflow timezone unless you set **Timezone**. A value with an offset (for example `2026-10-09T15:00:00Z`) is converted to that timezone.
- The Taskade node is `usableAsTool`. An n8n AI Agent can call it as a tool.

## Trigger

The **Taskade Trigger** node starts a workflow when one of these events occurs:

| Event | Payload fields |
|---|---|
| Task Due | `spaceId`, `spaceName`, `projectId`, `projectName`, `id`, `text`, `isCompleted`, `assignees`, `taskStartDate`, `taskStartTime`, `taskStartTimezone`, `taskEndDate`, `taskEndTime`, `taskEndTimezone` |
| Comment Created | `projectId`, `projectName`, `nodeId`, `nodeText`, `commenterDisplayName`, `commenterHandle`, `commentBody`, `commentBodyType`, `assignees`, `mentionedHandles` |
| Task Assigned | `projectId`, `projectName`, `assignerName`, `assignedNodes[]` (`nodeId`, `nodeText`, `isCompleted`, `assignees`) |
| Project Created | `spaceId`, `spaceName`, `projectId`, `projectName`, `creatorName` |
| Project Assigned | `spaceId`, `spaceName`, `projectId`, `projectName`, `assignerName`, `assigneeName`, `assigneeId` |
| Member Joined Project | `spaceId`, `projectId`, `projectName`, `joinerName`, `joinerUserId` |

How it works:

- When you activate the workflow, the node registers a signed webhook with `POST /webhooks`. When you deactivate it, the node deletes the webhook.
- Taskade signs each delivery with `X-Taskade-Signature: sha256=<HMAC-SHA256 of the body>`. The node rejects a delivery with a wrong signature (HTTP 401).
- **Workspace Names or IDs** limits the events to some workspaces. Leave it empty to get events from all of your workspaces.

Requirements:

- Webhooks are available on the Taskade Pro plan and higher. On other plans, activation fails with HTTP 402.
- Taskade sends webhooks only to HTTPS URLs. Your n8n instance must be reachable over HTTPS (a `localhost` URL does not work).

## Examples

Import these workflows in n8n (**Workflows > Import from File**), then set your IDs and credentials:

- [`examples/comment-to-agent-task.json`](examples/comment-to-agent-task.json): when someone comments on a task, a Taskade AI agent drafts a reply and the workflow adds it as a subtask.
- [`examples/weekly-project-digest.json`](examples/weekly-project-digest.json): every Monday, collect the open tasks of a project and write them into a new digest project.

More ideas:

- Form or CRM lead > **Task > Create** in a pipeline project, then **Task > Assign** to the owner.
- **Task Due** trigger > Slack or email reminder to the assignees.
- Support email > **Agent > Prompt** for a triage answer > **Task > Set Custom Field** for priority.

## Compatibility

- n8n nodes API version 1. Built and tested against `n8n-workflow` 2.16.
- No runtime dependencies. The trigger uses the Node.js `crypto` module only.

## Development

```bash
npm install
npm run lint     # n8n-node lint (the n8n community node rules)
npm test         # vitest, with a mocked Taskade API
npm run build    # n8n-node build -> dist/
npm run dev      # start a local n8n with this node loaded
```

Run the n8n community package scanner before a release:

```bash
npm install --no-save --prefix /tmp/n8n-scanner @n8n/scan-community-package@0.38.0
npm run build && npm run scan -- /tmp/n8n-scanner
```

### Release

The node publishes from GitHub Actions with npm provenance (`.github/workflows/publish-n8n.yml`). n8n requires this for verified nodes.

1. Bump `version` in `package.json` and add a line to `CHANGELOG.md`.
2. Merge to `master`.
3. Push the tag `n8n-v<version>`, for example `git tag n8n-v1.0.0 && git push origin n8n-v1.0.0`.

## Resources

- [Taskade Public API v2 reference](https://www.taskade.com/api/documentation/v2)
- [Taskade MCP server](https://github.com/taskade/mcp), for AI clients that speak the Model Context Protocol
- [Taskade help center](https://help.taskade.com)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)

## License

[MIT](LICENSE)
