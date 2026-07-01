import { Bundle, ZObject } from 'zapier-platform-core';

const perform = async (z: ZObject, bundle: Bundle) => {
  const url = bundle.inputData.webhook_url as string;
  if (!url.startsWith('https://')) {
    throw new z.errors.Error('The automation webhook URL must use https.', 'invalid_input', 400);
  }

  let payload: unknown = {};
  if (bundle.inputData.payload) {
    try {
      payload = JSON.parse(bundle.inputData.payload as string);
    } catch {
      throw new z.errors.Error('Payload must be valid JSON.', 'invalid_input', 400);
    }
  }

  const response = await z.request({
    url,
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
    skipThrowForStatus: true,
  });

  if (response.status >= 400) {
    throw new z.errors.Error(
      `Automation webhook returned ${response.status} — check the webhook URL is current.`,
      'invalid_input',
      response.status,
    );
  }

  return { status: response.status, ok: true };
};

export default {
  key: 'trigger_automation',
  noun: 'Automation Run',
  display: {
    label: 'Trigger Taskade Automation',
    description:
      'Starts a Taskade automation that uses a Webhook trigger, passing an optional JSON payload.',
    hidden: false,
  },
  operation: {
    inputFields: [
      {
        key: 'webhook_url',
        label: 'Automation Webhook URL',
        type: 'string',
        required: true,
        helpText:
          'In your Taskade automation, add a **Webhook** trigger and paste its unique URL here. Payload fields become `{{trigger.<key>}}` variables in the flow.',
      },
      {
        key: 'payload',
        label: 'JSON Payload',
        type: 'text',
        required: false,
        helpText: 'Optional JSON object to send, e.g. `{"customer": "Jane", "amount": 100}`.',
      },
    ],
    perform,
    sample: { status: 200, ok: true },
    outputFields: [
      { key: 'status', label: 'HTTP Status', type: 'integer' },
      { key: 'ok', type: 'boolean' },
    ],
  },
};
