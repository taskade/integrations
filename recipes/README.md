# Recipes

These recipes connect Taskade with a tool through a Taskade automation and the Public Action API v2. Use them when the tool has no Taskade app, or when you cannot install the Taskade app there yet. Each recipe uses these parts of Taskade:

- The **When a webhook arrives** trigger in a Taskade automation, for events that another tool sends to Taskade.
- The **Send HTTP Request** step with its **Authentication** panel, for calls from Taskade to another tool.
- The [Public Action API v2](https://www.taskade.com/api/documentation/v2) at `https://www.taskade.com/api/v2`, for calls from another tool to Taskade.

| Recipe | Who it is for | Uses |
|---|---|---|
| [Use Taskade with Make today](make.md) | Make users, until the Taskade app is listed on Make | Public API, Send HTTP Request |
| [Use Taskade with n8n today](n8n.md) | n8n users who cannot install the Taskade community node, for example on n8n Cloud before n8n verifies the node | Public API, Send HTTP Request |
| [Connect Square to Taskade](square.md) | Teams that take payments in Square | Webhook trigger, Send HTTP Request with a Bearer Token |
| [Connect any app with an API key](any-app-with-an-api-key.md) | Teams whose tool has no Taskade integration | Send HTTP Request with an API key, webhook trigger, Public API |

## Before you start

| You need | Where |
|---|---|
| A personal access token (starts with `tskdp_`) | Taskade [**Settings** > **API**](https://www.taskade.com/settings/api). Create a personal access token there |
| A project ID | Open the project. The ID is in the address bar after `/d/` |
| The Pro plan or higher | Only for the **When a webhook arrives** trigger and for Taskade webhook events |

Each recipe calls the Public API v2 with a `POST`, a JSON body and the header `Authorization: Bearer tskdp_YOUR_TOKEN`. A first call that lists the workspaces your token can reach:

```bash
curl https://www.taskade.com/api/v2/listSpaces \
  -H "Authorization: Bearer tskdp_YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Keep secrets out of headers

Put an API key or a token only in the **Authentication** panel of the **Send HTTP Request** step. Do not type a key into the **Headers** or **Query params** fields.
