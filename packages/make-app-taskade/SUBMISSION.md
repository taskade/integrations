# Make app review: submission checklist

This file lists the steps to create, test, publish, and submit the Taskade app for the Make app review. The checklist follows the Make developer documentation:

- [App review overview](https://developers.make.com/custom-apps-documentation/app-review/overview)
- [App review prerequisites](https://developers.make.com/custom-apps-documentation/app-review/prerequisites)
- [Request app review](https://developers.make.com/custom-apps-documentation/app-review/request-app-review)
- [OAuth 2.0 connection](https://developers.make.com/custom-apps-documentation/app-components/connections/oauth2)
- [Attached dedicated webhooks](https://developers.make.com/custom-apps-documentation/app-components/webhooks/dedicated/attached)
- [Universal module, REST](https://developers.make.com/custom-apps-documentation/app-components/modules/universal-module/rest)
- [Local development for apps](https://developers.make.com/custom-apps-documentation/make-apps-editor/apps-sdk/local-development-for-apps/deploy-changes-from-local-app-to-make-app)

## 1. Create the app in Make

1. Sign in to Make with a Taskade-owned account (not a personal account), so that the app stays with the company. Note the zone in the URL (for example `us1`).
2. Go to **Custom apps** and create an app:
   - Name: `taskade` (Make adds a suffix if the name is taken; the suffix becomes part of the app ID)
   - Label: `Taskade`
   - Description: `Create tasks and projects, prompt AI agents, and react to Taskade events.`
   - Theme: the Taskade brand color
   - Language: English. Countries: all.
3. Upload `assets/icon-512.png` as the app icon.
4. Copy the app ID into `origins[0].appId` in `makecomapp.json`, and the zone API URL (for example `https://us1.make.com/api`) into `origins[0].baseUrl`. Replace the `-FILL-ME-` label.
5. Create a Make API token with the scopes `sdk-apps:read` and `sdk-apps:write` (Profile > API access). Save it in `packages/make-app-taskade/.secrets/apikey`. Never commit this file.
6. In VS Code with the Make Apps Editor extension, right-click `makecomapp.json` and select **Deploy to Make**. When the extension asks how to pair each local component, select **create new**.

## 2. Create the Taskade OAuth2 client for Make

1. In Taskade, sign in with the company account that owns integrations. Open **Settings > API > OAuth2 Applications** and create an application named `Make`.
2. Add the redirect URL `https://www.make.com/oauth/cb/app` (the connection sends `oauth.localRedirectUri`, which Make recommends for apps that go to review).
3. In Make, open the **Taskade** connection, tab **Common data**, and enter:

   ```json
   { "clientId": "<client ID>", "clientSecret": "<client secret>" }
   ```

   The common data stays in Make. `makecomapp.json` sets `common: null` for both connections, so a deploy never reads or writes it.

## 3. Test with scenarios

Use a Taskade account on the Pro plan or higher: the Watch modules need webhooks, which free plans do not have. Remove personal data from test content before you run the scenarios.

- [ ] Create a **Taskade** (OAuth2) connection, and a **Taskade (personal access token)** connection. Confirm that each shows `@handle` under its name.
- [ ] Create a token connection with a wrong token. Confirm the 401 error message.
- [ ] Scenario A, one chain that runs without errors: Create a Project > Create a Task > Update a Task > Set a Task Note > Set a Task Date > Set a Task Custom Field (needs a project with a custom field) > Assign a Task > Move a Task > Complete a Task > Delete a Task > Copy a Project > Get a Project > Create a Project from a Template > Generate an AI Agent > Prompt an AI Agent > Make an API Call (`POST /v2/listSpaces`, body `{}`).
- [ ] Scenario B: List Tasks, List Projects, and List AI Agents, each at the end of its own router route. Use a project with more than 100 tasks and a limit above 100, so the log shows a second page for List Tasks.
- [ ] Scenario C: each Watch module, one per scenario. Create the webhook in the module, and confirm that `GET https://www.taskade.com/api/v2/webhooks` (with your token) lists it. Make the event happen in Taskade, and confirm one bundle per event. Then delete the webhook on the Make **Webhooks** page, and confirm that it is gone from the list. (Make runs attach when you create the webhook and detach when you delete it, not when you turn the scenario on or off.)
- [ ] Scenario C2: one Watch webhook with a workspace filter. Confirm that an event in that workspace arrives, and that an event in one of its folders does not arrive unless you also add the folder ID.
- [ ] Scenario D: a scenario that produces an error, for example Get a Project with an ID that does not exist (404 message).
- [ ] Run all scenarios again right before you request the review, and after every fix. Make keeps logs for a limited time only.

## 4. Review prerequisites

| Make requirement | Status in this app |
|---|---|
| The app uses a web service that Make does not integrate yet | An unofficial community app exists (`make.com/en/integrations/taskade-community`). Say in the review form that this is the official app from the vendor. |
| Modules call the service API and do not copy Make tools | Done: every module calls the Public API v2. |
| The API has its own domain | Done: `www.taskade.com`. |
| The connection asks only for the credentials it needs | Done: OAuth2 (client ID and secret are optional advanced fields), or one token. |
| Base and connections sanitize secrets | Done: `log.sanitize` on the base, on every token request, and on webhook attach (`response.body.secret`). |
| Base and connections handle errors | Done: the base maps 400, 401, 402, 403, 404, 429, and a default message. The token connection maps 401. Both connections have a default message. |
| The connection calls an API endpoint and rejects bad credentials | Done: `GET /oauth2/ping` returns the handle, or 401. |
| Correct module labels and descriptions | Done: Watch, Create a, Update a, Get a, List, Make an API Call. Descriptions are full sentences. |
| One universal module with a relative URL | Done: Make an API Call takes a path, and the host `https://www.taskade.com/api` is fixed, so the token cannot go to another host. |
| Interfaces match the output | Done: `test/validate.mjs` checks that every sample key is in the interface. |
| Dates are formatted in parameters and typed in interfaces | Done: Set a Task Date uses `formatDate()`. Due dates in Watch Tasks Due are `date` fields. |
| Searches, triggers, and RPCs have a limit and use pagination | Done for searches and RPCs: `limit` parameter or `response.limit`, cursor paging for tasks, page paging for projects, members, and templates. Instant triggers produce one bundle per webhook call, so they have no limit. |
| Each module is in a test scenario | Owner: section 3. |
| No test modules or test connections left | Owner: delete them before you publish. Make cannot delete a component of a published app. |

## 5. Publish and request the review

1. Remove test modules and test connections, if any.
2. Click **Publish**. This cannot be undone.
3. On the **Modules** tab, make each module visible.
4. Open the **Review** tab and fill in the form:
   - API documentation: `https://www.taskade.com/api/documentation/v2`
   - Help: `https://help.taskade.com`
   - Links to the test scenarios from section 3
5. Click **Request review**. Answer the email "App review: Taskade" from Make. After each fix, deploy, run the scenarios again, and reply.

After approval, Make gives the app a development version. Deploy every later change to it first, test, and then promote it.

## Known limits

- Webhooks need the Taskade Pro plan or higher. On other plans, attach fails with 402 and the error message says so.
- The workspace filter of a webhook matches the space of the event exactly. A workspace does not include its folders, so the webhook also takes a list of folder IDs.
- An all-day date in Set a Task Date is read in the timezone of the Make profile. A date with a time is sent in the Timezone field, or in UTC.
- Make cannot check the `X-Taskade-Signature` header, because a Make webhook does not expose the raw body. The dedicated webhook URL is secret to the scenario.
- Set a Task Date sends the start date. To set a date range, use Make an API Call with `POST /v2/setTaskDate` and a `start` and `end` object.
- Update a Task and Set a Task Note take one line of text. The API rejects line breaks there.
