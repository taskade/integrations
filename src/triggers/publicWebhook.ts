import { Bundle, ZObject } from 'zapier-platform-core';

import { ApiResponse, parseOk, request } from '../client';

/**
 * Factory for instant triggers backed by Taskade's public webhook-subscription
 * API (v2 POST /subscribeWebhook + /unsubscribeWebhook). One definition per
 * public trigger type; the delivered payload is the typed packet the server
 * renders for that event.
 *
 * Note: the legacy `task_due` trigger predates this API and stays on its
 * original endpoints; new triggers all use the public surface below.
 */
interface PublicWebhookTriggerOptions {
  key: string;
  noun: string;
  label: string;
  description: string;
  /** Public trigger type accepted by POST /subscribeWebhook. */
  triggerType: string;
  sample: Record<string, unknown>;
  outputFields: Array<Record<string, unknown>>;
}

export const makePublicWebhookTrigger = (options: PublicWebhookTriggerOptions) => {
  const performSubscribe = async (z: ZObject, bundle: Bundle) => {
    const response = await request(z, bundle, {
      method: 'POST',
      path: '/subscribeWebhook',
      version: 'v2',
      body: { targetUrl: bundle.targetUrl, triggerType: options.triggerType },
    });
    const data: ApiResponse = parseOk(z, response.json);
    return data; // { ok: true, hookId } -> stored as bundle.subscribeData
  };

  const performUnsubscribe = async (z: ZObject, bundle: Bundle) => {
    const response = await request(z, bundle, {
      method: 'POST',
      path: '/unsubscribeWebhook',
      version: 'v2',
      // @ts-ignore subscribeData is populated by Zapier with performSubscribe's result
      body: { hookId: bundle.subscribeData.hookId },
    });
    return parseOk(z, response.json);
  };

  const perform = async (z: ZObject, bundle: Bundle) => [bundle.cleanedRequest];

  // No public list endpoint exists for historical events; return the
  // documented sample so users can set up their Zap before the first delivery.
  const performList = async () => [options.sample];

  return {
    key: options.key,
    noun: options.noun,
    display: {
      label: options.label,
      description: options.description,
      hidden: false,
    },
    operation: {
      type: 'hook',
      perform,
      performSubscribe,
      performUnsubscribe,
      performList,
      sample: options.sample,
      outputFields: options.outputFields,
    },
  };
};

// ---- packet shapes below mirror the server's typed Zapier packets ----

export const NewComment = makePublicWebhookTrigger({
  key: 'new_comment',
  noun: 'Comment',
  label: 'New Comment',
  description: 'Triggers when a comment is added to a task.',
  triggerType: 'comment.created',
  sample: {
    projectName: 'Customer Projects',
    projectId: 'A1b2C3d4E5f6G7h8',
    nodeId: '099630d4-267e-4b22-894b-08b69f3a4d79',
    nodeText: 'Follow up with the client',
    commenterDisplayName: 'Jane Doe',
    commenterHandle: 'janedoe',
    commentBody: 'Done — sent the proposal.',
    commentBodyType: 'text/markdown',
    assignees: [],
    mentionedHandles: [],
  },
  outputFields: [
    { key: 'projectName' },
    { key: 'projectId' },
    { key: 'nodeId', label: 'Task ID' },
    { key: 'nodeText', label: 'Task Text' },
    { key: 'commenterDisplayName' },
    { key: 'commenterHandle' },
    { key: 'commentBody' },
    { key: 'commentBodyType' },
  ],
});

export const TaskAssigned = makePublicWebhookTrigger({
  key: 'task_assigned',
  noun: 'Task Assignment',
  label: 'Task Assigned',
  description: 'Triggers when tasks are assigned to someone.',
  triggerType: 'task.assigned',
  sample: {
    projectName: 'Customer Projects',
    projectId: 'A1b2C3d4E5f6G7h8',
    assignerName: 'Jane Doe',
    nodes: [
      {
        nodeId: '099630d4-267e-4b22-894b-08b69f3a4d79',
        nodeText: 'Prepare the quote',
        isCompleted: false,
        assignees: ['johnsmith'],
      },
    ],
  },
  outputFields: [
    { key: 'projectName' },
    { key: 'projectId' },
    { key: 'assignerName' },
    { key: 'nodes[]nodeId', label: 'Task ID' },
    { key: 'nodes[]nodeText', label: 'Task Text' },
    { key: 'nodes[]isCompleted', type: 'boolean' },
  ],
});

export const NewProject = makePublicWebhookTrigger({
  key: 'new_project',
  noun: 'Project',
  label: 'New Project',
  description: 'Triggers when a project is created.',
  triggerType: 'project.created',
  sample: {
    spaceName: 'Acme Workspace',
    spaceId: '1UsRFaZu9XgyTFej',
    projectName: 'Q3 Launch Plan',
    projectId: 'A1b2C3d4E5f6G7h8',
    creatorName: 'Jane Doe',
  },
  outputFields: [
    { key: 'spaceName' },
    { key: 'spaceId' },
    { key: 'projectName' },
    { key: 'projectId' },
    { key: 'creatorName' },
  ],
});

export const ProjectAssigned = makePublicWebhookTrigger({
  key: 'project_assigned',
  noun: 'Project Assignment',
  label: 'Project Assigned',
  description: 'Triggers when a project is assigned to someone.',
  triggerType: 'project.assigned',
  sample: {
    spaceName: 'Acme Workspace',
    spaceId: '1UsRFaZu9XgyTFej',
    projectName: 'Q3 Launch Plan',
    projectId: 'A1b2C3d4E5f6G7h8',
    assignerName: 'Jane Doe',
    assigneeName: 'John Smith',
    assigneeId: 12345,
  },
  outputFields: [
    { key: 'spaceName' },
    { key: 'projectName' },
    { key: 'projectId' },
    { key: 'assignerName' },
    { key: 'assigneeName' },
  ],
});

export const ProjectJoined = makePublicWebhookTrigger({
  key: 'project_joined',
  noun: 'Project Member',
  label: 'Member Joined Project',
  description: 'Triggers when someone joins a project.',
  triggerType: 'project.joined',
  sample: {
    spaceId: '1UsRFaZu9XgyTFej',
    projectName: 'Q3 Launch Plan',
    projectId: 'A1b2C3d4E5f6G7h8',
    joinerName: 'John Smith',
    joinerUserId: 12345,
  },
  outputFields: [
    { key: 'projectName' },
    { key: 'projectId' },
    { key: 'joinerName' },
  ],
});
