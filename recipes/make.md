# Use Taskade with Make today

The official Taskade app for Make is in review. [PR #34](https://github.com/taskade/integrations/pull/34) holds the app, and [issue #33](https://github.com/taskade/integrations/issues/33) tracks the Make review. Until Make approves it, connect Make and Taskade with the Make HTTP module and a Taskade automation.

**Who it is for:** Make users who want a scenario to add tasks in Taskade, or to start when a task lands in Taskade.

**What it does:** A Make scenario adds tasks to a Taskade project through the Taskade API, and a Taskade automation sends each new task to a Make scenario.

**Before you start:** You need a Taskade account with a verified email and a Make account. The Taskade API takes a personal access token.

## Steps

1. In Taskade, open **Settings**, then **API**, and click **Create token** under **Personal access tokens**. Copy the token. It starts with `tskdp_`.
2. Open the Taskade project for the new tasks. Copy the project ID from the address bar, after `/d/`.
3. In Make, add the **HTTP** app's **Make a request** module. Set the method to `POST` and the URL to `https://www.taskade.com/api/v2/createTask`.
4. Add the header `Authorization` with the value `Bearer tskdp_YOUR_TOKEN`. Add the header `Content-Type` with the value `application/json`.
5. Set the body to raw JSON and paste the body below. Map your Make values into `content`.
6. Run the module once. Make sure that Taskade answers `{"ok":true,...}` and that the task shows in your project.
7. To start a scenario from Taskade, copy the URL of a Make **Custom webhook** module. In a Taskade automation, add **When a task is added**, then **Send HTTP Request** with **Method** `POST`, that **URL** and **Request Body Type** **JSON**.

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

You are done when a Make run adds a task to your project, and a new Taskade task starts your Make scenario. The **When a task is added** trigger waits about 5 minutes after the last edit of a task.

## Notes

- Anyone who can edit the scenario can read the token in the header. Give the token its own name, such as `make`, and revoke it in **Settings** > **API** when you stop.
- `createTask` takes 1 to 20 tasks per call, and each `content` holds up to 2,000 characters. `placement` is `beforeend` (last) or `afterbegin` (first).
- For Taskade events such as a task assigned or a comment added, paste the Make URL into **Settings** > **API** > **Outgoing webhooks** (Pro and above). No automation is needed for those events.

## Taskade EVE can build this for you

> Build an automation that sends every new task in my Leads project to my Make webhook URL.

## Checked

- Taskade steps, labels and the `createTask` body: checked against the Taskade app and the [v2 spec](https://www.taskade.com/api/documentation/v2) on 2026-10-22.
- Make labels (**HTTP**, **Make a request**, **Custom webhook**): taken from Make's public docs. Not checked in a Make account.
