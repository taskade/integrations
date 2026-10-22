# Recipes

These recipes connect Taskade with tools that have no official Taskade app yet, or whose app is still in review. Each recipe uses only what ships in Taskade today:

- The **When a webhook arrives** trigger in a Taskade automation, for events that another tool sends to Taskade.
- The **Send HTTP Request** step with its **Authentication** panel, for calls from Taskade to another tool.
- The [Public Action API v2](https://www.taskade.com/api/documentation/v2) at `https://www.taskade.com/api/v2`, for calls from another tool to Taskade.

| Recipe | Who it is for | Uses |
|---|---|---|
| [Use Taskade with Make today](make.md) | Make users, until the official Make app passes review | Public API, Send HTTP Request |
| [Use Taskade with n8n today](n8n.md) | n8n users, until the Taskade node is on npm | Public API, Send HTTP Request |
| [Connect Square to Taskade](square.md) | Teams that take payments in Square | Webhook trigger, Send HTTP Request with a Bearer Token |
| [Connect any app with an API key](any-app-with-an-api-key.md) | Teams whose tool is not in the 100+ integrations | Send HTTP Request with Custom auth, webhook trigger, Public API |

## Before you start

| You need | Where |
|---|---|
| A personal access token (starts with `tskdp_`) | Taskade **Settings** > **API** > **Personal access tokens** > **Create token**. A verified email is required, and you can keep up to 5 active tokens |
| A project ID | Open the project. The ID is in the address bar after `/d/` |
| The Pro plan or higher | Only for the **When a webhook arrives** trigger and **Outgoing webhooks** |

Every Public API v2 operation is a `POST` with a JSON body and the header `Authorization: Bearer tskdp_YOUR_TOKEN`. A first call that lists the workspaces your token can reach:

```bash
curl https://www.taskade.com/api/v2/listSpaces \
  -H "Authorization: Bearer tskdp_YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Keep secrets out of headers

Put an API key or a token only in the **Authentication** panel of the **Send HTTP Request** step. Taskade saves that panel as an encrypted credential and sends it only when the step runs. The **Headers** and **Query params** fields are saved as plain text in the automation, so everyone who can open the automation can read them.

## Taskade EVE can build these

Each recipe ends with a one-sentence prompt. Paste it into the Taskade EVE chat, and Taskade EVE builds the automation. If a step needs a key, Taskade EVE asks you to paste it into the **Authentication** panel of that step.
