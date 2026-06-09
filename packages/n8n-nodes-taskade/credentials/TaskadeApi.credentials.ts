import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class TaskadeApi implements ICredentialType {
  name = 'taskadeApi';

  displayName = 'Taskade API';

  documentationUrl = 'https://docs.taskade.com';

  properties: INodeProperties[] = [
    {
      displayName: 'Personal Access Token',
      name: 'accessToken',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      description:
        'Create a token at taskade.com → Settings → API (tokens start with tskdp_)',
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
      baseURL: 'https://www.taskade.com/api/v1',
      url: '/workspaces',
    },
  };
}
