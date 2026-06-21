# Contributing

Thanks for helping extend Taskade's reach. This repo is the public source-of-truth for Taskade actions & triggers, so improvements here ripple out to every platform.

## Quick start

The repo installs with **no auth and no private registries** — clone, build, and test in one go:

```bash
git clone https://github.com/taskade/integrations.git
cd integrations
yarn install
yarn lint     # eslint (public config)
yarn build    # tsc -> lib/
yarn test     # builds, then validates against Zapier's official schema
```

All four should pass before you open a PR. CI runs the same steps.

## Layout

| Path | What |
| --- | --- |
| [`src/`](src) | The Zapier app — `creates/`, `searches/`, `triggers/`, plus `authentication.ts` / `client.ts` / `fields.ts` |
| [`src/index.ts`](src/index.ts) | Registers every operation into the app definition |
| [`src/test/app.test.ts`](src/test/app.test.ts) | Schema-validates the whole app (`zapier-platform-schema`) |
| [`packages/n8n-nodes-taskade/`](packages/n8n-nodes-taskade) | The official n8n community node |

## The contract: the public API

Every operation must run against the **documented public API** — no internal/undocumented routes. That portability is the whole point.

- **v1 REST** — [spec](https://www.taskade.com/api/documentation/v1/json) · full task/project CRUD
- **v2 Action** — [spec](https://www.taskade.com/api/documentation/v2/json) · action-based, AI-agent prompting
- Auth: OAuth2 or a [Personal Access Token](https://www.taskade.com/settings/api)

If you need an endpoint that isn't public yet, open an issue on [taskade/taskade](https://github.com/taskade/taskade/issues) rather than reaching for an internal route.

## Adding a Zapier operation

1. Add a file under `src/creates/`, `src/searches/`, or `src/triggers/` exporting an operation object (`key`, `noun`, `display`, `operation`).
2. Import and register it in [`src/index.ts`](src/index.ts).
3. `yarn test` — the schema validator will catch a malformed definition before deploy.

## Adding a new platform

Building Taskade for Activepieces, Make, Pipedream, or somewhere new? Open a PR — a `packages/<platform>-taskade/` package alongside the n8n node is the pattern. Reuse the public API calls in `src/` as the reference implementation.

## Pull requests

- Keep PRs focused; conventional-commit titles (`feat(…)`, `fix(…)`, `docs(…)`) are appreciated.
- Green CI (`lint` + `build` + `test`) is required.
- Deploying to the live Zapier app is a separate, deliberate, manual step (`zapier push`) — never automatic on merge.

Questions or ideas? [Open an issue](https://github.com/taskade/integrations/issues).
