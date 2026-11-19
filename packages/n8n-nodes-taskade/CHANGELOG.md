# Changelog

## Unreleased

- Fix: a list call reads at most 100 pages (10,000 rows). Before, a response that ignored `page` or `after` made Return All and the member and template dropdowns ask for pages forever.

## 1.0.1

- No change to the node. This release is the first one from GitHub Actions through npm trusted publishing (OIDC), with no npm token.
- The package now publishes with public access (`publishConfig.access`), which npm needs to make a provenance statement for a new package.

## 1.0.0

First npm release.

- All operations call the Taskade Public API v2.
- Credentials: personal access token and OAuth2.
- Task: Create, Update, Complete, Reopen, Delete, Move, Assign, Set Note, Set Date, Set Custom Field, Get Many.
- Project: Create, Create From Template, Copy, Get, Get Many, Complete, Restore, Enable Share Link.
- Agent: Prompt, Generate, Get, Get Many, Add Project Knowledge.
- Workspace and Folder: Get Many.
- Taskade Trigger: signed webhooks (`POST /webhooks`) with `X-Taskade-Signature-V2` checks that refuse a delivery more than 5 minutes old, and an optional workspace filter.
- Published from GitHub Actions with npm provenance.
