# Contributing

Thank you for your help with the Taskade integrations. This repository holds three apps on the public Taskade API:

| App | Folder | Language and package manager |
|---|---|---|
| Zapier | [`src/`](src) | TypeScript, Yarn 1 (`yarn.lock`) |
| n8n | [`packages/n8n-nodes-taskade`](packages/n8n-nodes-taskade) | TypeScript, npm (`package-lock.json`) |
| Make | [`packages/make-app-taskade`](packages/make-app-taskade) | Make Apps Editor files (`.iml.jsonc`), no dependencies |

New here? Read [Build a trigger and an action](docs/build-a-trigger-and-an-action.md) first. It walks through one trigger and one action, file by file.

## Before you start

- To ask for a new trigger or action, or to report a bug, use the [issue forms](https://github.com/taskade/integrations/issues/new/choose).
- Check that the public API can do what you want. Refer to the [API docs](https://www.taskade.com/docs/getting-started/api-overview). A new instant trigger needs a public webhook event, and [#10](https://github.com/taskade/integrations/issues/10) tracks the events that are not public yet.
- For a large change, open an issue first, so that a maintainer can agree on the plan with you.

## Set up

You need Git, Node.js and Yarn 1. CI uses Node 20 for the Zapier app, Node 24 for the n8n node and Node 22 for the Make check. All the commands below also pass on Node 22.

```bash
git clone https://github.com/taskade/integrations.git
cd integrations
```

### The Zapier app

Run these commands from the root of the repository. They are the same steps as the `build-and-test` job in [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

```bash
yarn install --frozen-lockfile
yarn lint     # ESLint on src/
yarn build    # tsc, from src/ to lib/
yarn test     # builds again, then runs the Jest tests in lib/test
```

`yarn test` also runs the Zapier schema validation on the full app definition, so a schema error fails before it reaches a deploy.

The [Zapier CLI](https://docs.zapier.com/platform/build-cli/overview) adds a local check of the app structure. `npx` runs the CLI with no global install. Version 17.4.0 matches `zapier-platform-core` in `package.json`.

```bash
npx --yes --package zapier-platform-cli@17.4.0 zapier validate --without-style
```

### Run the Zapier app against your own account

`zapier invoke` runs one trigger, action or search on your computer, against the real Taskade API. Nothing goes to Zapier.

1. Use a test account or a test workspace. The actions change real data.
2. Create a personal access token in Taskade under [Settings > API](https://www.taskade.com/settings/api).
3. Put the token in a `.env` file at the root of the repository. The app reads it as `authData_access_token`, the same field that holds the OAuth2 token on Zapier:

   ```bash
   echo "authData_access_token='tskdp_your_token_here'" > .env
   ```

4. Build, then invoke:

   ```bash
   yarn build
   npx --yes --package zapier-platform-cli@17.4.0 zapier invoke trigger get_all_spaces
   npx --yes --package zapier-platform-cli@17.4.0 zapier invoke create create_task --inputData '{"project_id":"YOUR_PROJECT_ID","content":"Hello from my computer"}'
   ```

   The first command lists your workspaces and folders. The second command adds a task to a project. Use a test project.

Git ignores `.env`. Never commit it, and never paste a token into an issue, a pull request, a test or a sample. If a token leaks, delete it in Settings > API and create a new one.

### The n8n node

Run these commands in the package folder. They are the same steps as the `n8n-node` job in [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

```bash
cd packages/n8n-nodes-taskade
npm ci --ignore-scripts
npm run lint
npm test         # Vitest
npm run build    # n8n-node build, to dist/
```

CI also runs the n8n community package scanner on the source and on the packed tarball:

```bash
npm install --no-save --ignore-scripts --prefix /tmp/n8n-scanner @n8n/scan-community-package@0.38.0
npm run scan -- /tmp/n8n-scanner
```

The [package README](packages/n8n-nodes-taskade/README.md) describes the credentials, the operations and the trigger.

### The Make app

The Make app has no dependencies. Run the check from the root of the repository, the same step as [`.github/workflows/make-app.yml`](.github/workflows/make-app.yml):

```bash
node packages/make-app-taskade/test/validate.mjs
```

The script compares every request of the app with the live Public API v2 spec. The [package README](packages/make-app-taskade/README.md) explains the layout and each check.

## Rules

- **One integration in each pull request.** A change to the Zapier app and a change to the n8n node go in two pull requests.
- **A key never changes.** A Zapier key (`create_task`), an n8n node name or operation value, and a Make module ID are public contracts after they ship. A saved Zap, workflow or scenario stores them. Add a new key, and never rename or remove an old one.
- **No secret and no personal data in the code.** Use made-up values in tests, fixtures and samples: `token`, `jane@example.com`, `A1b2C3d4E5f6G7h8`. Never use a real token, email address, name, or link to a private workspace.
- **Product names in full.** Write "Taskade Genesis" and "Taskade EVE", not "Genesis" or "EVE" alone.
- **Plan facts follow the API docs.** For example, webhooks need a Taskade Pro plan or higher. If an operation needs a plan, say so in its description, as the webhook triggers do.
- **Tests with each change.** A new trigger, action or search comes with a test that checks the request it sends. The [guide](docs/build-a-trigger-and-an-action.md#7-the-test) shows the pattern.
- **Commit messages** follow the history of this repository: `feat(zapier): Add ...`, `fix(n8n): ...`, `docs(readme): ...`.

## Pull requests

1. Create a branch from `master`.
2. Make your change, with tests.
3. Run the commands for the app that you changed (refer to [Set up](#set-up)).
4. Open a pull request. Say what changed, why, and which commands you ran.

CI runs on every pull request. The `CI` workflow builds, lints and tests the Zapier app and the n8n node. The `Make app` workflow runs when a pull request changes `packages/make-app-taskade/`.

## How a merged change reaches users

A merge to `master` does not change any live integration. Each platform has its own release step.

| App | Release | Who |
|---|---|---|
| Zapier | A maintainer bumps `version` in `package.json`, adds the notes to `CHANGELOG.md`, runs `zapier push`, tests the new version in a Zap, then runs `zapier promote` and `zapier migrate`. The steps are in the [README](README.md#release). No workflow deploys to Zapier. | Maintainer, by hand |
| n8n | A maintainer bumps `version` in `packages/n8n-nodes-taskade/package.json`, merges it, then pushes the tag `n8n-v<version>` from `master`. [`publish-n8n.yml`](.github/workflows/publish-n8n.yml) checks that the tag matches the version and is on `master`, tests, builds, scans, and publishes to npm with provenance. n8n verification of the node is tracked in [#17](https://github.com/taskade/integrations/issues/17). | Maintainer, with a tag |
| Make | CI checks the app on each pull request and on `master`. A maintainer deploys it to Make and submits it for the Make review with the steps in [`SUBMISSION.md`](packages/make-app-taskade/SUBMISSION.md). It is not submitted yet: refer to [#33](https://github.com/taskade/integrations/issues/33). | Maintainer, by hand |

## Questions and security

- Product questions and account help: [taskade.com/contact](https://www.taskade.com/contact).
- API questions: [taskade.com/docs](https://www.taskade.com/docs).
- A security problem: report it through [taskade.com/contact](https://www.taskade.com/contact), not in a public issue.

By contributing, you agree that your contribution is licensed under the [MIT License](LICENSE).
