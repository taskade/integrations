import moment from 'moment-timezone';
import { Bundle, ZObject } from 'zapier-platform-core';

interface DateRange {
  start: {
    date: string;
    time: string;
    timezone: string;
  };
  end?: {
    date: string;
    time: string;
    timezone: string;
  };
}

interface Task {
  id: string;
}

interface CreateTaskInput {
  taskId?: string;
  contentType: string;
  content: string;
  placement: string;
}

interface CreateTasksResponseOk {
  ok: true;
  item: Task[];
}

interface CreateTasksResponseError {
  ok: false;
  message: string;
}

type CreateTasksResponse = CreateTasksResponseOk | CreateTasksResponseError;

interface CreateDateResponseOk {
  ok: true;
  item: Task;
}

interface CreateDateResponseError {
  ok: false;
  message: string;
}

type CreateDateResponse = CreateDateResponseOk | CreateDateResponseError;

interface CreateAssigneeResponseOk {
  ok: true;
  item: Task;
}

interface CreateAssigneeResponseError {
  ok: false;
  message: string;
}

type CreateAssigneeResponse = CreateAssigneeResponseOk | CreateAssigneeResponseError;

const taskDueDateReqVariables = (z: ZObject, bundle: Bundle) => {
  const  zapierProfileTimezone = bundle.meta.timezone ?? 'Etc/UTC';

  let date: DateRange | null = null;

  if (bundle.inputData.start_date != null && bundle.inputData.end_date == null) {
    const startMoment = moment.tz(bundle.inputData.start_date, zapierProfileTimezone);
    date = {
      start: {
        date: startMoment.format('YYYY-MM-DD'),
        time: startMoment.format('HH:mm:ss'),
        timezone: zapierProfileTimezone,
      },
    };
  } else if (bundle.inputData.start_date != null && bundle.inputData.end_date != null) {
    const startMoment = moment.tz(bundle.inputData.start_date, zapierProfileTimezone);
    date = {
      start: {
        date: startMoment.format('YYYY-MM-DD'),
        time: startMoment.format('HH:mm:ss'),
        timezone: zapierProfileTimezone,
      },
    };
    const endMoment = moment.tz(bundle.inputData.end_date, zapierProfileTimezone);
    date.end = {
      date: endMoment.format('YYYY-MM-DD'),
      time: endMoment.format('HH:mm:ss'),
      timezone: zapierProfileTimezone,
    };
  } else if (bundle.inputData.start_date == null && bundle.inputData.end_date != null) {
    const startMoment = moment.tz(bundle.inputData.end_date, zapierProfileTimezone);
    date = {
      start: {
        date: startMoment.format('YYYY-MM-DD'),
        time: startMoment.format('HH:mm:ss'),
        timezone: zapierProfileTimezone,
      },
    };
  } else {
    return null;
  }

  return date;
};

const splitContentIntoChunks = (content: string, maxChunkSize: number = 2000): string[] => {
  if (content.length <= maxChunkSize) {
    return [content];
  }

  const chunks: string[] = [];
  let currentIndex = 0;

  while (currentIndex < content.length) {
    let endIndex = currentIndex + maxChunkSize;

    // If we're not at the end of the string, try to find a good breaking point
    if (endIndex < content.length) {
      // Look for the last space, newline, or punctuation within the chunk
      const searchStart = Math.max(currentIndex, endIndex - 100); // Look back up to 100 chars
      const breakPoints = ['\n', '. ', '! ', '? ', ', ', '; ', ' '];

      let bestBreakPoint = -1;
      for (const breakPoint of breakPoints) {
        const lastIndex = content.lastIndexOf(breakPoint, endIndex - 1);
        if (lastIndex > searchStart) {
          bestBreakPoint = Math.max(bestBreakPoint, lastIndex + breakPoint.length);
        }
      }

      if (bestBreakPoint > -1) {
        endIndex = bestBreakPoint;
      }
    }

    chunks.push(content.slice(currentIndex, endIndex).trim());
    currentIndex = endIndex;
  }

  return chunks.filter((chunk) => chunk.length > 0);
};

const perform = async (z: ZObject, bundle: Bundle) => {
  const content = bundle.inputData.content as string;
  const contentChunks = splitContentIntoChunks(content, 2000);
  if (contentChunks.length > 20) {
    throw new z.errors.Error('Input content too large', 'invalid_input', 400);
  }

  const tasks: CreateTaskInput[] = contentChunks.map((chunk) => {
    const task: CreateTaskInput = {
      contentType: 'text/markdown',
      content: chunk,
      placement: 'beforeend',
    };

    if (bundle.inputData.block_id != null) {
      task.taskId = bundle.inputData.block_id as string;
    }

    return task;
  });

  const createTaskResponse = await z.request({
    url: `https://www.taskade.com/api/v1/projects/${bundle.inputData.project_id}/tasks`,
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'content-type': 'application/json',
      authorization: `Bearer ${bundle.authData.access_token}`,
    },
    body: JSON.stringify({
      tasks: tasks,
    }),
  });

  const createTaskData: CreateTasksResponse = createTaskResponse.json;

  if (!createTaskData.ok) {
    throw new z.errors.Error(createTaskData.message, 'invalid_input', 400);
  }

  const taskId = createTaskData.item[0]?.id ?? null;
  if (taskId == null) {
    throw new z.errors.Error('Missing task ID', 'invalid_input', 400);
  }

  const dateAddon = taskDueDateReqVariables(z, bundle);
  if (dateAddon != null) {
    const createDateResponse = await z.request({
      url: `https://www.taskade.com/api/v1/projects/${bundle.inputData.project_id}/tasks/${taskId}/date`,
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'content-type': 'application/json',
        authorization: `Bearer ${bundle.authData.access_token}`,
      },
      body: JSON.stringify(dateAddon),
    });

    const createDateData: CreateDateResponse = createDateResponse.json;

    if (!createDateData.ok) {
      throw new z.errors.Error(createDateData.message, 'invalid_input', 400);
    }
  }

  if (bundle.inputData.member_id != null) {
    const createAssigneeResponse = await z.request({
      url: `https://www.taskade.com/api/v1/projects/${bundle.inputData.project_id}/tasks/${taskId}/assignees`,
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'content-type': 'application/json',
        authorization: `Bearer ${bundle.authData.access_token}`,
      },
      body: JSON.stringify({ handles: [bundle.inputData.member_id] }),
    });

    const createAssigneeData: CreateAssigneeResponse = createAssigneeResponse.json;

    if (!createAssigneeData.ok) {
      throw new z.errors.Error(createAssigneeData.message, 'invalid_input', 400);
    }
  }

  return { taskId };
};

export default {
  key: 'create_task',
  noun: 'Task',
  display: {
    label: 'Create Task',
    description: 'Creates a Task in Taskade',
    hidden: false,
  },
  operation: {
    inputFields: [
      {
        key: 'space_id',
        label: 'Workspace or Folder',
        type: 'string',
        dynamic: 'get_all_spaces.id.name',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'project_id',
        label: 'Project',
        type: 'string',
        dynamic: 'get_all_projects.id.title',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'block_id',
        label: 'Block',
        type: 'string',
        dynamic: 'get_all_blocks.id.title',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'content',
        label: 'Content',
        type: 'string',
        helpText: 'The content of the task.',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'start_date',
        label: 'Start Date',
        type: 'datetime',
        helpText: 'The start date of the task.',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'end_date',
        label: 'End Date',
        type: 'datetime',
        helpText: 'The end date of the task.',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'member_id',
        label: 'Assign to',
        type: 'string',
        dynamic: 'get_all_assignable_members.id.displayName',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
    ],
    sample: {
      taskId: '099630d4-267e-4b22-894b-08b69f3a4d79',
    },
    outputFields: [{ key: 'taskId' }],
    perform: perform,
  },
};
