# Taskade app for Make

The source of the official Taskade app for [Make](https://www.make.com). The app runs on the [Taskade Public API v2](https://www.taskade.com/api/documentation/v2). It uses the local development layout of the Make Apps Editor for VS Code: one `makecomapp.json` manifest, and one folder per component.

To publish the app, follow [SUBMISSION.md](SUBMISSION.md).

## What the app has

| Component | Items |
|---|---|
| Connections | `taskade` (OAuth2, the default), `taskade-token` (personal access token, the alternative connection on every module) |
| Instant triggers | Watch Tasks Due, Watch New Comments, Watch Task Assignments, Watch New Projects, Watch Project Assignments, Watch New Project Members |
| Webhooks | One dedicated, attached webhook per trigger. Attach calls `POST /v2/webhooks` with one event and an optional workspace filter. Detach calls `DELETE /v2/webhooks/{id}`. |
| Actions | Create a Task, Update a Task, Complete a Task, Move a Task, Assign a Task, Set a Task Date, Set a Task Note, Set a Task Custom Field, Delete a Task, Create a Project, Create a Project from a Template, Copy a Project, Get a Project, Prompt an AI Agent, Generate an AI Agent |
| Searches | List Tasks (cursor paging), List Projects, List AI Agents |
| Universal | Make an API Call (the user enters a path, the host `https://www.taskade.com/api` is fixed) |
| RPCs | list-workspaces, list-folders, list-projects, list-tasks, list-agents, list-fields, list-members, list-templates |

## Layout

```text
makecomapp.json              manifest: components, code files, Make origins
general/base.iml.jsonc       base URL, Authorization header, error handling, log sanitization
general/readme.md            the app description that Make shows to users
connections/<id>/            connection communication and parameters
webhooks/<id>/               attach, detach, communication, parameters
modules/<id>/                communication, static and mappable parameters, interface, samples
modules/groups.json          module groups in the Make module picker
rpcs/<id>/                   dynamic options for select fields
assets/icon-512.png          app icon (512 x 512 PNG) to upload in the app settings
test/validate.mjs            static checks
```

Design notes:

- The base URL is `https://www.taskade.com/api`, and modules call `/v2/<operation>`. The universal module fixes the same host and takes a path for `/v1/...` or `/v2/...`. Thus a mapped value cannot send the token to another host, as the Make review asks.
- The OAuth2 and the token connections both store the token as `connection.accessToken`, so one base header serves both.
- A Workspace select has a nested Folder select. Modules send `ifempty(folderId, spaceId)`, because the API accepts a workspace ID or a folder ID.
- Taskade signs webhook deliveries (`X-Taskade-Signature`), but a Make webhook cannot read the raw request body, so the app does not check the signature. Each dedicated webhook URL is secret to its scenario.

## Check the app

```bash
node test/validate.mjs            # compares requests with the live OpenAPI spec
node test/validate.mjs ./v2.json  # offline, with a saved copy of the spec
```

The script checks:

- Every code file in the manifest exists and parses, and every app file is in the manifest.
- Connection, webhook, and `rpc://` references resolve.
- Each module is in exactly one group.
- The base and the connections sanitize secrets and handle errors.
- Search modules and RPCs have a limit. The universal module fixes the Taskade host.
- Date parameters go through `formatDate()`.
- Every `parameters.x` in a communication exists, and every sample key is in the interface.
- Every `{{ }}` expression is balanced.
- Every Public API v2 request uses a path, a method, and body properties that exist in the OpenAPI spec, with all required properties.

CI runs it in the `Make app` workflow (`.github/workflows/make-app.yml`).

## Deploy changes

1. Install the [Make Apps Editor](https://marketplace.visualstudio.com/items?itemName=Integromat.apps-sdk) extension for VS Code.
2. Put a Make API token with the `sdk-apps:read` and `sdk-apps:write` scopes in `.secrets/apikey`. The `.secrets/` folder is ignored by git.
3. Fill the `-FILL-ME-` values of the origin in `makecomapp.json` (zone URL and app ID).
4. Right-click `makecomapp.json` and select **Deploy to Make**.

After Make approves the app, deploy changes to the development version first, test them, and then promote them. Refer to [Manage testing and production app versions](https://developers.make.com/custom-apps-documentation/get-started/make-apps-editor/apps-sdk/manage-testing-and-production-app-versions).
