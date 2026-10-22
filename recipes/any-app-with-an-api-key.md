# Connect any app with an API key

Taskade connects to 100+ integrations. If your app is not one of them, it can still join an automation when it has an API key or sends webhooks.

**Who it is for:** Teams whose tool is not in the Taskade integrations list, but who can copy an API key from it.

**What it does:** A Taskade automation calls the app with your saved API key, and the app sends its events to a Taskade automation.

**Before you start:** You need an API key and the API docs of the app. The webhook part needs the Pro plan or higher.

## Steps

1. In the app, create an API key. In its API docs, find the header for the key, for example `Authorization: Bearer <key>` or `X-API-Key: <key>`.
2. In a Taskade automation, add **Send HTTP Request** from the **Data & Text Tools** tab.
3. Open **Authentication** and pick the **Auth Type** that the app expects: **Bearer Token**, **API Key** with a **Header Name**, or **Basic Auth**. Paste the key there.
4. Set **Method**, **URL** and **Request Body Type** **JSON**. Set **Response Body Type** to **JSON**, so the next steps can use the answer.
5. To hear from the app, create an automation with **When a webhook arrives**. Paste its **Webhook URL** into the webhook settings of the app.
6. Set **Verify requests** to a mode that the app supports: **Bearer token**, **Stripe signature** or **HMAC-SHA256 signature**. Use **None** only when the app supports no check.
7. If the app can run a script but cannot send webhooks, call the Taskade API from the script with a personal access token, as shown below.

```bash
curl https://www.taskade.com/api/v2/createTask \
  -H "Authorization: Bearer tskdp_YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"projectId":"YOUR_PROJECT_ID","tasks":[{"contentType":"text/markdown","content":"Hello from my app","placement":"beforeend"}]}'
```

## Auth Type reference

| Auth Type | Taskade sends |
|---|---|
| **Bearer Token** | `Authorization: Bearer <token>` |
| **API Key** | `<Header Name>: <key>` |
| **Basic Auth** | `Authorization: Basic base64(username:password)` |

## Verify requests reference

| Mode | What the sender must do |
|---|---|
| **Bearer token** | Send `Authorization: Bearer <token>`. Taskade makes the token when you turn on the automation |
| **Stripe signature** | Send the `Stripe-Signature` header of a Stripe webhook endpoint. Paste its signing secret in Taskade |
| **HMAC-SHA256 signature** | Send the hex HMAC-SHA256 of `<timestamp>.<raw body>` in `X-Taskade-Signature-V2` and the Unix time in seconds in `X-Taskade-Timestamp`. Taskade rejects a request more than 5 minutes old |
| **None** | Nothing. Anyone with the URL can start the automation |

## Check the result

You are done when the **Send HTTP Request** step shows the answer of the app in its run, and an event from the app starts your webhook automation.

## Notes

- Never put a key in **Headers** or **Query params**. Taskade saves those fields as plain text in the automation, and everyone who can open the automation can read them.
- The webhook takes JSON, `multipart/form-data` and `application/x-www-form-urlencoded` bodies up to about 1.5 MB. If the automation is off, the URL answers 404.
- The **Send HTTP Request** step does not reach `localhost` or private network addresses.

## Taskade EVE can build this for you

> Build an automation that sends each new task in my Requests project to the Acme API with my saved API key.

## Checked

- Taskade steps, labels, the Auth Type and Verify requests options, and the `createTask` call: checked against the Taskade app and the [v2 spec](https://www.taskade.com/api/documentation/v2) on 2026-10-22.
- The behavior of a specific third-party app is not covered. Read its API docs for the URL, the header and the webhook settings.
