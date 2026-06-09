/**
 * Shared input-field builders for the dynamic dropdown chain
 * (Workspace/Folder -> Project -> Task), reused across every action and search
 * so the dropdowns behave identically to creates/createTask.ts.
 */

export const spaceField = (required = false) => ({
  key: 'space_id',
  label: 'Workspace or Folder',
  type: 'string',
  dynamic: 'get_all_spaces.id.name',
  required,
  list: false,
  altersDynamicFields: false,
});

export const projectField = (required = true) => ({
  key: 'project_id',
  label: 'Project',
  type: 'string',
  dynamic: 'get_all_projects.id.title',
  required,
  list: false,
  altersDynamicFields: true,
});

export const taskField = (key = 'task_id', label = 'Task', required = true) => ({
  key,
  label,
  type: 'string',
  dynamic: 'get_all_tasks.id.title',
  required,
  list: false,
  altersDynamicFields: false,
});
