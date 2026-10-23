# Use Taskade with n8n today

The Taskade node for n8n is ready for n8n verification in [PR #32](https://github.com/taskade/integrations/pull/32), and [issue #17](https://github.com/taskade/integrations/issues/17) tracks the npm publish and the n8n review. The node is not on npm yet. Until it is, connect n8n and Taskade with the built-in n8n nodes and a Taskade automation.

**Who it is for:** n8n users, on n8n Cloud or self-hosted, who want a workflow to read or write Taskade.

**What it does:** An n8n workflow adds tasks to a Taskade project through the Taskade API, and a Taskade automation starts an n8n workflow with each new task.

**Before you start:** You need a Taskade account with a verified email. Taskade must reach your n8n over the public internet. The Taskade **Send HTTP Request** step blocks `localhost` and private network addresses.

## Steps

1. In Taskade, open **Settings**, then **API**, and click **Create token**. Copy the token. It starts with `tskdp_`.
2. In n8n, add an **HTTP Request** node. Set **Method** to `POST` and **URL** to `https://www.taskade.com/api/v2/createTask`.
3. Set **Authentication** to **Generic Credential Type**, then **Header Auth**. Use the name `Authorization` and the value `Bearer tskdp_YOUR_TOKEN`.
4. Turn on **Send Body** and pick **JSON**. Set the JSON field to **Expression**, and paste the expression below with your project ID. The project ID is in the Taskade address bar, after `/d/`.
5. Click **Execute step**. Make sure that Taskade answers `{"ok":true,...}` and that the task shows in your project.
6. To start n8n from Taskade, add an n8n **Webhook** node with the method `POST`, and copy its **Production URL**.
7. In a Taskade automation, add **When a task is added**, then **Send HTTP Request** with **Method** `POST`, the n8n URL and **Request Body Type** **JSON**. Activate the n8n workflow.

Request body for step 4:

```js
{{ {
  "projectId": "YOUR_PROJECT_ID",
  "tasks": [
    { "contentType": "text/markdown", "content": $json.title, "placement": "beforeend" }
  ]
} }}
```

The expression returns the whole body as an object, and n8n serializes it. Do not put `{{ $json.title }}` inside quoted JSON text. n8n does not escape the value there, so a title such as `Call "Acme"` makes the body invalid.

## Check the result

You are done when an n8n run adds a task to your project, and a new Taskade task shows as an execution in n8n.

## Notes

- The **Header Auth** credential keeps the token out of the workflow JSON, so an exported workflow does not carry it.
- For Taskade events such as a task assigned, paste the n8n URL into **Settings** > **API** > **Outgoing webhooks** (Pro and above). Each delivery carries an `X-Taskade-Signature` header that you can check.
- When the Taskade node is on npm, it replaces steps 2 to 5 with a **Taskade** node and a **Taskade Trigger** node.

## Taskade EVE can build this for you

> Build an automation that sends every new task in my Requests project to my n8n webhook URL.

## Checked

- Taskade steps, labels and the `createTask` body: checked against the Taskade app and the [v2 spec](https://www.taskade.com/api/documentation/v2) on 2026-10-22.
- n8n labels (**HTTP Request**, **Generic Credential Type**, **Header Auth**, **Send Body**, **Expression**, **Execute step**, **Webhook**, **Production URL**): taken from n8n's public docs. Not checked in an n8n instance.
