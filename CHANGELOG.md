## 1.3.1

- Fix: Create Task gives the outputs `nodeID` (the task ID) and `document__id` (the project ID) again, as in 1.0.x. A Zap that maps these values to a later step keeps them after the move to this version.
- Fix: the project dropdown reads the next page of projects when you click "Load more". Before, it showed the first 100 projects again, so a project after the first 100 never showed.
- Fix: the AI agent, project template and project member dropdowns show more than the first page of rows.
- Fix: Find Project searches all of your projects, not only the first 100.
- Each list reads at most 20 pages, so a bad API response cannot make it ask for pages forever.

## 1.3.0

- New triggers (instant, Taskade Pro plan or higher): New Comment, Task Assigned, New Project, Project Assigned, Member Joined Project.
- New task actions: Complete Task, Update Task, Delete Task, Move Task, Set Task Due Date, Assign Task, Set Task Note, Set Task Custom Field.
- New project actions: Create Project, Create Project From Template, Complete Project, Copy Project, Get Project Share Link.
- New AI agent actions: Run AI Agent, Create AI Agent, Generate AI Agent, Update AI Agent, Add Knowledge to AI Agent, Enable Public Agent Access.
- New actions: Run Automation (starts a Taskade automation that begins with a webhook trigger), Custom API Call.
- New searches: Find Task, Find Project, Find AI Agent, Get Project Content.
- Update: Run AI Agent picks the folder and the agent from dropdowns.
- Update: Create Task has a clearer description. Task Due and Create Task keep their inputs and outputs.

## 1.0.8

- Fix: connections no longer expire about 1 hour after connecting.
