# Connect any app with an API key

If your app has no Taskade integration, it can still join a Taskade automation when it has an API key or sends webhooks.

**Who it is for:** Teams whose tool has no Taskade integration, but who can copy an API key from it.

**What it does:** A Taskade automation calls the app with your saved API key, and the app sends its events to a Taskade automation.

**Before you start:** You need an API key and the API docs of the app. The webhook part needs the Pro plan or higher.

## Steps

1. In the app, create an API key. In its API docs, find the header for the key, for example `Authorization: Bearer <key>` or `X-API-Key: <key>`.
2. In a Taskade automation, add a **Send HTTP Request** step.
3. Open **Authentication** and pick the **Auth Type** that the app expects: **Bearer Token**, **API Key** with a **Header Name**, or **Basic Auth**. Paste the key there.
4. Set **Method**, **URL** and **Request Body Type** **JSON**. Set **Response Body Type** to **JSON**, so the next steps can use the answer.
5. To hear from the app, create an automation with **When a webhook arrives**. Paste its **Webhook URL** into the webhook settings of the app.
6. Set **Verify requests** to a mode that the app supports, for example **Bearer token** or **HMAC-SHA256 signature**. Use **None** only when the app supports no check.
7. If the app can run a script but cannot send webhooks, call the Taskade API from the script with a personal access token, as shown below.

```bash
curl https://www.taskade.com/api/v2/createTask \
  -H "Authorization: Bearer tskdp_YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"projectId":"YOUR_PROJECT_ID","tasks":[{"contentType":"text/markdown","content":"Hello from my app","placement":"beforeend"}]}'
```

## Check the result

You are done when the **Send HTTP Request** step shows the answer of the app in its run, and an event from the app starts your webhook automation.

## Notes

- Never type a key into **Headers** or **Query params**. Put it only in the **Authentication** panel.
- With **Verify requests** set to **None**, anyone with the webhook URL can start the automation. Keep the URL private.

## Checked

- Taskade steps and labels: taken from the Taskade app on 2026-10-22.
- The `createTask` call: the same as in the Zapier app and the n8n node in this repository.
- The behavior of a specific third-party app is not covered. Read its API docs for the URL, the header and the webhook settings.
