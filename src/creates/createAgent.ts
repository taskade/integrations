import { Bundle, ZObject } from 'zapier-platform-core';

import { ApiResponse, parseOk, request } from '../client';
import { spaceField } from '../fields';

const PERSONAS = [
  'Tasker', 'Researcher', 'Marketer', 'EmailWriter', 'Sales', 'CustomerSupport',
  'ProjectManager', 'ContentCreator', 'Copywriter', 'SeoSpecialist', 'Translator',
  'Summarizer', 'SocialMediaSpecialist', 'FinancialAnalyst', 'DataAnalyst', 'Editor',
  'BlogExpert', 'CourseCreator', 'Proofreader', 'StartupMentor', 'PromptEngineer',
  'ArticleWriter', 'LeadQualifier', 'ReviewResponder',
];

const perform = async (z: ZObject, bundle: Bundle) => {
  const response = await request(z, bundle, {
    method: 'POST',
    path: `/folders/${bundle.inputData.space_id}/agents`,
    body: {
      name: bundle.inputData.name as string,
      data: {
        type: 'template',
        template: { type: bundle.inputData.persona as string },
      },
    },
  });

  const data: ApiResponse = parseOk(z, response.json);

  return data.item ?? data;
};

export default {
  key: 'create_agent',
  noun: 'Agent',
  display: {
    label: 'Create AI Agent',
    description: 'Creates a new AI agent from a persona template in a folder.',
    hidden: false,
  },
  operation: {
    inputFields: [
      { ...spaceField(true), label: 'Folder' },
      {
        key: 'name',
        label: 'Agent Name',
        type: 'string',
        required: true,
      },
      {
        key: 'persona',
        label: 'Persona',
        type: 'string',
        choices: Object.fromEntries(PERSONAS.map((p) => [p, p])),
        default: 'Tasker',
        required: true,
        helpText:
          'The agent template to start from. Any valid Taskade persona works — this list shows common ones.',
      },
    ],
    perform,
    sample: { id: 'agent-123', name: 'Research Assistant' },
    outputFields: [
      { key: 'id', label: 'Agent ID' },
      { key: 'name', label: 'Name' },
    ],
  },
};
