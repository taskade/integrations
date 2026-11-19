import type { Icon, ICredentialType, INodeProperties } from 'n8n-workflow';

export class TaskadeOAuth2Api implements ICredentialType {
  name = 'taskadeOAuth2Api';

  extends = ['oAuth2Api'];

  displayName = 'Taskade OAuth2 API';

  icon: Icon = { light: 'file:../icons/taskade.svg', dark: 'file:../icons/taskade.dark.svg' };

  documentationUrl =
    'https://github.com/taskade/integrations/tree/master/packages/n8n-nodes-taskade#credentials';

  properties: INodeProperties[] = [
    {
      displayName: 'Grant Type',
      name: 'grantType',
      type: 'hidden',
      default: 'authorizationCode',
    },
    {
      displayName: 'Authorization URL',
      name: 'authUrl',
      type: 'hidden',
      default: 'https://www.taskade.com/oauth2/authorize',
      required: true,
    },
    {
      displayName: 'Access Token URL',
      name: 'accessTokenUrl',
      type: 'hidden',
      default: 'https://www.taskade.com/oauth2/token',
      required: true,
    },
    {
      displayName: 'Scope',
      name: 'scope',
      type: 'hidden',
      default: '',
    },
    {
      displayName: 'Auth URI Query Parameters',
      name: 'authQueryParameters',
      type: 'hidden',
      default: '',
    },
    {
      // The Taskade token endpoint reads client_id and client_secret from the body.
      displayName: 'Authentication',
      name: 'authentication',
      type: 'hidden',
      default: 'body',
    },
  ];
}
