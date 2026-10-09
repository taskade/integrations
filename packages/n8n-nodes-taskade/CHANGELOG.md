# Changelog

## 1.0.0

First npm release.

- All operations call the Taskade Public API v2.
- Credentials: personal access token and OAuth2.
- Task: Create, Update, Complete, Reopen, Delete, Move, Assign, Set Note, Set Date, Set Custom Field, Get Many.
- Project: Create, Create From Template, Copy, Get, Get Many, Complete, Restore, Enable Share Link.
- Agent: Prompt, Generate, Get, Get Many, Add Project Knowledge.
- Workspace and Folder: Get Many.
- Taskade Trigger: signed webhooks (`POST /webhooks`) with signature checks, and an optional workspace filter.
- Published from GitHub Actions with npm provenance.
