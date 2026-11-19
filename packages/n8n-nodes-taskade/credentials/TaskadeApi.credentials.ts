import type {
  IAuthenticateGeneric,
  Icon,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class TaskadeApi implements ICredentialType {
  name = 'taskadeApi';

  displayName = 'Taskade API';

  icon: Icon = { light: 'file:../icons/taskade.svg', dark: 'file:../icons/taskade.dark.svg' };

  documentationUrl =
    'https://github.com/taskade/integrations/tree/master/packages/n8n-nodes-taskade#credentials';

  properties: INodeProperties[] = [
    {
      displayName: 'Personal Access Token',
      name: 'accessToken',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description:
        'Create a token in Taskade under Settings > API. Tokens start with tskdp_.',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: '=Bearer {{$credentials.accessToken}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: 'https://www.taskade.com/api/v2',
      url: '/listSpaces',
      method: 'POST',
      body: {},
    },
  };
}
