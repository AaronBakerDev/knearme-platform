import { describe, expect, it } from 'vitest';
import type { Env } from '../../types';
import { handleWebhookEvent } from '../webhooks';

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function signPayload(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );
  return `sha256=${bufferToHex(signature)}`;
}

const env = {
  FB_APP_SECRET: 'secret',
} as unknown as Env;

describe('webhook signature verification', () => {
  it('rejects invalid signatures', async () => {
    const body = JSON.stringify({ object: 'page', entry: [] });
    const request = new Request('https://example.com/webhook', {
      method: 'POST',
      headers: { 'X-Hub-Signature-256': 'sha256=invalid' },
      body,
    });

    const response = await handleWebhookEvent(request, env);
    expect(response.status).toBe(403);
  });

  it('accepts valid signatures', async () => {
    const body = JSON.stringify({ object: 'page', entry: [] });
    const signature = await signPayload('secret', body);
    const request = new Request('https://example.com/webhook', {
      method: 'POST',
      headers: { 'X-Hub-Signature-256': signature },
      body,
    });

    const response = await handleWebhookEvent(request, env);
    expect(response.status).toBe(200);
  });
});
