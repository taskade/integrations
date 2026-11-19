# Use Taskade with Make today

The Taskade app for Make is not listed on Make yet. Its source is in [`packages/make-app-taskade`](../packages/make-app-taskade), and [issue #33](https://github.com/taskade/integrations/issues/33) tracks the submission. Until Make lists it, connect Make and Taskade with the Make HTTP module and a Taskade automation.

**Who it is for:** Make users who want a scenario to add tasks in Taskade, or to start when a task lands in Taskade.

**What it does:** A Make scenario adds tasks to a Taskade project through the Taskade API, and a Taskade automation sends each new task to a Make scenario.

**Before you start:** You need a Taskade account and a Make account. The Taskade API takes a personal access token.

## Steps

1. In Taskade, open **Settings**, then **API**, and create a personal access token. Copy the token. It starts with `tskdp_`.
2. Open the Taskade project for the new tasks. Copy the project ID from the address bar, after `/d/`.
3. In Make, add the **HTTP** app's **Make a request** module. Set the method to `POST` and the URL to `https://www.taskade.com/api/v2/createTask`.
4. Add the header `Authorization` with the value `Bearer tskdp_YOUR_TOKEN`. Add the header `Content-Type` with the value `application/json`.
5. Before the HTTP module, add the **JSON** app's **Create JSON** module. Give it the structure of the body below, and map your Make values into `content`.
6. In the HTTP module, set the body to raw JSON and map the **JSON string** output of **Create JSON** as the request content. Do not type mapped values into raw JSON text. Raw text does not escape a quote or a line break in a value, so a name such as `Jane "JJ" Doe` breaks the request.
7. Run the scenario once. Make sure that Taskade answers `{"ok":true,...}` and that the task shows in your project.
8. To start a scenario from Taskade, copy the URL of a Make **Custom webhook** module. In a Taskade automation, add **When a task is added**, then **Send HTTP Request** with **Method** `POST`, that **URL** and **Request Body Type** **JSON**.

Request body for step 5:

```json
{
  "projectId": "YOUR_PROJECT_ID",
  "tasks": [
    { "contentType": "text/markdown", "content": "New lead: {{name}}", "placement": "beforeend" }
  ]
}
```

Answer from Taskade:

```json
{ "ok": true, "items": [{ "id": "NEW_TASK_ID" }] }
```

## Check the result

You are done when a Make run adds a task to your project, and a new Taskade task starts your Make scenario.

## Notes

- Anyone who can edit the scenario can read the token in the header. Give the token its own name, such as `make`, and revoke it in **Settings** > **API** when you stop.
- `createTask` takes 1 to 20 tasks per call, and each `content` holds up to 2,000 characters. `placement` is `beforeend` (last) or `afterbegin` (first).
- Taskade webhook events, such as a task assigned or a comment added, need the Pro plan or higher. The [webhooks guide](https://www.taskade.com/docs/guides/webhooks) shows how to send them to a URL.

## Checked

- Taskade steps and labels: taken from the Taskade app on 2026-10-22.
- The `createTask` call, its body, its limits and its answer: the same as in the Zapier app and the n8n node in this repository.
- Make labels (**HTTP**, **Make a request**, **Custom webhook**, **JSON**, **Create JSON**, **JSON string**): taken from Make's public docs. Not checked in a Make account.
