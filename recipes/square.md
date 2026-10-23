# Connect Square to Taskade

Square has no Taskade integration yet. A Taskade webhook and the **Send HTTP Request** step with your Square access token cover the common jobs today.

**Who it is for:** Shops, studios and service teams that take payments in Square and track orders or clients in Taskade.

**What it does:** Each completed Square payment adds a task to a Taskade project, and a Taskade automation can create a customer in Square.

**Before you start:** The **When a webhook arrives** trigger needs the Pro plan or higher. You need a Square developer application. Test with its Sandbox access token and the Sandbox host `connect.squareupsandbox.com` first.

## Steps

1. In Taskade, create an automation with the trigger **When a webhook arrives**. Copy the **Webhook URL**, and set **Verify requests** to **None**.
2. In **Parameters**, add the Square fields that the next steps use: `data.object.payment.id`, `data.object.payment.status` and `data.object.payment.amount_money.amount`.
3. Add an **Only continue if...** step that passes when the payment status is `COMPLETED`. Then add an **Add a task** step with the payment ID and the amount in the task text. Turn on the automation.
4. In the Square Developer Console, open your application, then **Webhooks**, then **Subscriptions**. Add a subscription with the Taskade URL and the `payment.updated` event.
5. Send a test event from Square. Make sure that a run shows in the automation history and that a task shows in your project.
6. To write to Square, add **Send HTTP Request** to a Taskade automation. Open **Authentication**, pick **Bearer Token**, and paste your Square Sandbox access token.
7. Set **Method** `POST`, **URL** `https://connect.squareupsandbox.com/v2/customers`, a `Square-Version` header, and **Request Body Type** **JSON** with the body below.

Request body for step 7 (map the values from your task):

```json
{
  "given_name": "Jane",
  "email_address": "jane@example.com"
}
```

## Check the result

You are done when a Square test payment adds a task, and the **Send HTTP Request** step answers with a new customer `id`.

## Notes

- Square signs each event with its own header, and Taskade does not read that header. Thus the Taskade URL is the only key. Keep it private, and do not paste it into a page or a chat.
- Put the Square token only in the **Authentication** panel, never in **Headers**. Taskade saves headers as plain text in the automation.
- To go live, change both the token and the host. Use your production access token and `https://connect.squareup.com/v2/customers`. A Sandbox token fails on the production host, and a production token creates real customers.
- The **Only continue if...** step skips a payment that is not complete. It does not stop a duplicate task. Square retries an event that it did not see delivered, and a completed payment can send `payment.updated` again, for example after a refund. Thus one payment can add more than one task. The payment ID in the task text helps you find a duplicate.
- If the automation is off, the webhook URL answers 404, and Square retries the event.

## Taskade EVE can build this for you

> Build an automation that adds a task to my Orders project each time Square sends a completed payment to my webhook.

## Checked

- Taskade steps, labels and webhook behavior: checked against the Taskade app on 2026-10-22.
- Square facts (Developer Console labels, the `payment.updated` event and its payload paths, the Sandbox and production hosts, `/v2/customers` and its fields, the `Square-Version` header, the Square signature header, retries): taken from Square's public docs. Not checked in a Square account.
- A nested field such as `data.object.payment.status` in **Parameters**: the field builder supports nested objects, but this recipe was not run end to end.
