# Taskade

[Taskade](https://www.taskade.com) is an AI-native workspace for projects, tasks, AI agents, and automations. With the Taskade app you can create and update tasks, build projects from Markdown or templates, prompt Taskade AI agents, and start scenarios when something happens in Taskade.

## Connect Taskade to Make

The app has two connection types:

- **Taskade** (OAuth2): sign in to Taskade and allow access. This is the recommended connection.
- **Taskade (personal access token)**: create a token in Taskade under [Settings > API](https://www.taskade.com/settings/api), and paste it into the connection. The token starts with `tskdp_`.

## Triggers

The **Watch** modules start a scenario as soon as the event occurs in Taskade:

- Watch Tasks Due
- Watch New Comments
- Watch Task Assignments
- Watch New Projects
- Watch Project Assignments
- Watch New Project Members

Webhooks are available on the Taskade Pro plan and higher. You can limit a webhook to some workspaces and folders. A workspace does not include its folders, so add the folder IDs too.

## Actions and searches

- Tasks: Create a Task, Update a Task, Complete a Task, Move a Task, Assign a Task, Set a Task Date, Set a Task Note, Set a Task Custom Field, Delete a Task, List Tasks
- Projects: Create a Project, Create a Project from a Template, Copy a Project, Get a Project, List Projects
- AI agents: Prompt an AI Agent, Generate an AI Agent, List AI Agents
- Other: Make an API Call, for any operation of the [Taskade Public API](https://www.taskade.com/api/documentation/v2)
