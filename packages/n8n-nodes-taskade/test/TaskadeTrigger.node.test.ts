import { createHmac } from 'crypto';
import type { IHookFunctions, IWebhookFunctions } from 'n8n-workflow';
import { describe, expect, it, vi } from 'vitest';

import { isValidSignature, TaskadeTrigger } from '../nodes/TaskadeTrigger/TaskadeTrigger.node';
import { createContext } from './helpers';

const trigger = new TaskadeTrigger();
const hooks = trigger.webhookMethods.default;
const TARGET = 'https://n8n.example.com/webhook/abc/webhook';
const ENCODED_PATH = `/webhooks/${encodeURIComponent(TARGET)}`;

// The same contract as the Taskade sender (X-Taskade-Signature-V2):
// sha256= + hex(HMAC-SHA256(secret, `${timestamp}.${rawBody}`)).
const sign = (secret: string, timestamp: string, body: string) =>
  `sha256=${createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')}`;
const signV1 = (secret: string, body: string) =>
  `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
const nowSeconds = () => String(Math.floor(Date.now() / 1000));

describe('isValidSignature', () => {
  const body = JSON.stringify({ projectId: 'p1', text: 'Due today' });
  const ts = '1800000000';
  const now = 1800000000;

  it('accepts the V2 signature of the exact timestamp and body', () => {
    expect(isValidSignature('whsec_test', body, ts, sign('whsec_test', ts, body), now)).toBe(true);
  });
  it('rejects a different secret, a changed body, a changed timestamp, and a missing header', () => {
    expect(isValidSignature('whsec_test', body, ts, sign('whsec_other', ts, body), now)).toBe(false);
    expect(isValidSignature('whsec_test', `${body} `, ts, sign('whsec_test', ts, body), now)).toBe(false);
    expect(isValidSignature('whsec_test', body, '1800000001', sign('whsec_test', ts, body), now)).toBe(false);
    expect(isValidSignature('whsec_test', body, ts, undefined, now)).toBe(false);
    expect(isValidSignature('whsec_test', body, undefined, sign('whsec_test', ts, body), now)).toBe(false);
  });
  it('rejects a replay more than 5 minutes old, and a v1 body-only signature', () => {
    expect(isValidSignature('whsec_test', body, ts, sign('whsec_test', ts, body), now + 301)).toBe(false);
    expect(isValidSignature('whsec_test', body, ts, sign('whsec_test', ts, body), now + 300)).toBe(true);
    expect(isValidSignature('whsec_test', body, ts, signV1('whsec_test', body), now)).toBe(false);
  });
});

describe('webhook lifecycle', () => {
  it('registers a signed webhook for the selected event and stores the secret', async () => {
    const context = createContext(
      { authentication: 'accessToken', event: 'task.due', spaceIds: ['s1'] },
      () => ({ ok: true, webhook: { id: TARGET }, secret: 'whsec_abc' }),
    );
    expect(await hooks.create.call(context as unknown as IHookFunctions)).toBe(true);
    expect(context.calls[0]).toMatchObject({ method: 'POST', url: '/webhooks' });
    expect(context.calls[0].body).toEqual({ targetUrl: TARGET, events: ['task.due'], spaceIds: ['s1'] });
    expect(context.staticData.secret).toBe('whsec_abc');
  });

  it('reports an existing webhook only while the secret is known', async () => {
    const listed = () => ({ ok: true, items: [{ id: TARGET, url: TARGET }] });
    const withSecret = createContext({}, listed);
    withSecret.staticData.secret = 'whsec_abc';
    expect(await hooks.checkExists.call(withSecret as unknown as IHookFunctions)).toBe(true);

    // Registered but the secret is lost: remove the old webhook so create() registers a new one.
    const withoutSecret = createContext({}, (path, _body, method) =>
      method === 'GET' ? listed() : { ok: true, deleted: true },
    );
    expect(await hooks.checkExists.call(withoutSecret as unknown as IHookFunctions)).toBe(false);
    expect(withoutSecret.calls.map((c) => `${c.method} ${c.url}`)).toEqual([
      'GET /webhooks',
      `DELETE ${ENCODED_PATH}`,
    ]);
  });

  it('deletes the webhook by its URL-encoded target URL and clears the secret', async () => {
    const context = createContext({}, () => ({ ok: true, deleted: false }));
    context.staticData.secret = 'whsec_abc';
    expect(await hooks.delete.call(context as unknown as IHookFunctions)).toBe(true);
    expect(context.calls[0]).toMatchObject({ method: 'DELETE', url: ENCODED_PATH });
    expect(context.calls[0].body).toBeUndefined();
    expect(context.staticData.secret).toBeUndefined();
  });
});

describe('webhook delivery', () => {
  const payload = { spaceName: 'Acme', projectId: 'p1', id: 't1', text: 'Renew domain', isCompleted: false };
  const rawBody = JSON.stringify(payload);

  function deliver(headers: Record<string, string>, withRawBody = true) {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const context = createContext({}, undefined, {
      getBodyData: () => payload,
      getHeaderData: () => headers,
      getRequestObject: () => (withRawBody ? { rawBody: Buffer.from(rawBody) } : {}),
      getResponseObject: () => ({ status, json }),
    });
    context.staticData.secret = 'whsec_abc';
    return { result: trigger.webhook.call(context as unknown as IWebhookFunctions), status };
  }

  const signed = (secret = 'whsec_abc', timestamp = nowSeconds()) => ({
    'x-taskade-timestamp': timestamp,
    'x-taskade-signature-v2': sign(secret, timestamp, rawBody),
  });

  it('emits the payload when the signature matches', async () => {
    const { result } = deliver(signed());
    expect((await result).workflowData).toEqual([[{ json: payload }]]);
  });

  it('verifies against the parsed body when n8n keeps no raw body', async () => {
    const { result } = deliver(signed(), false);
    expect((await result).workflowData).toEqual([[{ json: payload }]]);
  });

  it('answers 401 and starts nothing when the signature is wrong', async () => {
    const { result, status } = deliver(signed('whsec_wrong'));
    expect(await result).toEqual({ noWebhookResponse: true });
    expect(status).toHaveBeenCalledWith(401);
  });

  it('answers 401 to a replayed delivery and to a v1-only delivery', async () => {
    const old = String(Math.floor(Date.now() / 1000) - 3600);
    const replay = deliver(signed('whsec_abc', old));
    expect(await replay.result).toEqual({ noWebhookResponse: true });
    expect(replay.status).toHaveBeenCalledWith(401);
    const v1Only = deliver({ 'x-taskade-signature': signV1('whsec_abc', rawBody) });
    expect(await v1Only.result).toEqual({ noWebhookResponse: true });
    expect(v1Only.status).toHaveBeenCalledWith(401);
  });
});
