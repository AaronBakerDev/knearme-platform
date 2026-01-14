/**
 * Webhooks Handler
 *
 * Handles Facebook/Instagram webhook verification and event processing.
 * Stores events in KV for polling by MCP server.
 *
 * @module handlers/webhooks
 * @see https://developers.facebook.com/docs/graph-api/webhooks
 */

import type { Env, WebhookEvent, WebhookEntry, WebhookChange } from '../types';
import { storeWebhookEvent } from '../utils';

/**
 * Handle webhook verification (GET request)
 *
 * Facebook sends a GET request to verify the webhook endpoint.
 * We must respond with the hub.challenge value.
 *
 * @param url - Request URL with query params
 * @param env - Environment
 */
export function handleWebhookVerification(
  url: URL,
  env: Env
): Response {
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  console.log('Webhook verification request:', { mode, token: token?.slice(0, 4) + '...' });

  if (mode === 'subscribe' && token === env.WEBHOOK_VERIFY_TOKEN) {
    console.log('Webhook verified successfully');
    return new Response(challenge, { status: 200 });
  }

  console.warn('Webhook verification failed');
  return new Response('Forbidden', { status: 403 });
}

/**
 * Handle incoming webhook event (POST request)
 *
 * Process and store webhook events for later retrieval.
 *
 * @param body - Webhook event body
 * @param env - Environment
 */
export async function handleWebhookEvent(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    if (!env.FB_APP_SECRET) {
      console.error('Missing FB_APP_SECRET for webhook signature verification');
      return new Response('Server misconfigured', { status: 500 });
    }

    const signature = request.headers.get('X-Hub-Signature-256');
    const rawBody = await request.clone().arrayBuffer();

    const valid = await verifyWebhookSignature(
      rawBody,
      signature,
      env.FB_APP_SECRET
    );

    if (!valid) {
      console.warn('Invalid webhook signature');
      return new Response('Forbidden', { status: 403 });
    }

    let body: WebhookEvent;
    try {
      body = (await request.json()) as WebhookEvent;
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    console.log('Received webhook event:', body.object);

    // Process each entry
    for (const entry of body.entry) {
      await processWebhookEntry(entry, body.object, env);
    }

    // Facebook expects a 200 response
    return new Response('EVENT_RECEIVED', { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Still return 200 to prevent Facebook from retrying
    return new Response('EVENT_RECEIVED', { status: 200 });
  }
}

/**
 * Process a single webhook entry
 *
 * @param entry - Webhook entry
 * @param objectType - Object type (page, instagram)
 * @param env - Environment
 */
async function processWebhookEntry(
  entry: WebhookEntry,
  objectType: 'page' | 'instagram',
  env: Env
): Promise<void> {
  const accountId = entry.id;
  const timestamp = entry.time;

  // Process changes (comments, feed, mentions, etc.)
  if (entry.changes) {
    for (const change of entry.changes) {
      await processWebhookChange(change, accountId, objectType, timestamp, env);
    }
  }

  // Process messaging (DMs) - requires special permissions
  if (entry.messaging) {
    for (const message of entry.messaging) {
      const eventId = `msg:${message.timestamp}:${message.sender.id}`;
      await storeWebhookEvent(
        eventId,
        {
          type: 'message',
          object_type: objectType,
          account_id: accountId,
          sender_id: message.sender.id,
          recipient_id: message.recipient.id,
          message: message.message,
          timestamp: message.timestamp,
        },
        env
      );
      console.log(`Stored message event: ${eventId}`);
    }
  }
}

/**
 * Process a webhook change
 *
 * @param change - Change object
 * @param accountId - Account ID
 * @param objectType - Object type
 * @param timestamp - Event timestamp
 * @param env - Environment
 */
async function processWebhookChange(
  change: WebhookChange,
  accountId: string,
  objectType: 'page' | 'instagram',
  timestamp: number,
  env: Env
): Promise<void> {
  const field = change.field;
  const value = change.value;

  // Generate unique event ID
  const eventId = generateEventId(field, value, timestamp);

  // Build event object based on field type
  let event: Record<string, unknown> = {
    type: field,
    object_type: objectType,
    account_id: accountId,
    timestamp,
    raw_value: value,
  };

  switch (field) {
    case 'comments':
      event = {
        ...event,
        comment_id: value.comment_id,
        post_id: value.post_id,
        parent_id: value.parent_id,
        message: value.message,
        sender_id: value.sender_id,
        verb: value.verb,
        created_time: value.created_time,
      };
      break;

    case 'feed':
      event = {
        ...event,
        item: value.item,
        post_id: value.post_id,
        verb: value.verb,
      };
      break;

    case 'mentions':
      event = {
        ...event,
        comment_id: value.comment_id,
        media_id: value.post_id,
        sender_id: value.sender_id,
      };
      break;

    case 'reactions':
      event = {
        ...event,
        post_id: value.post_id,
        reaction_type: value.item,
        verb: value.verb,
      };
      break;
  }

  // Store event
  await storeWebhookEvent(eventId, event, env);
  console.log(`Stored ${field} event: ${eventId}`);
}

/**
 * Generate unique event ID
 */
function generateEventId(
  field: string,
  value: WebhookChange['value'],
  timestamp: number
): string {
  const identifier =
    value.comment_id ||
    value.post_id ||
    value.sender_id ||
    crypto.randomUUID().slice(0, 8);

  return `${field}:${timestamp}:${identifier}`;
}

async function verifyWebhookSignature(
  body: ArrayBuffer,
  signatureHeader: string | null,
  appSecret: string
): Promise<boolean> {
  if (!signatureHeader) {
    return false;
  }

  const [scheme, signature] = signatureHeader.split('=');
  if (!scheme || !signature || scheme.toLowerCase() !== 'sha256') {
    return false;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(appSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signed = await crypto.subtle.sign('HMAC', key, body);
  const computed = bufferToHex(signed);

  return timingSafeEqual(signature, computed);
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Get recent webhook events (for polling)
 *
 * @param env - Environment
 * @param eventType - Optional filter by event type
 * @param limit - Max events to return
 */
export async function getRecentEvents(
  env: Env,
  eventType?: string,
  limit: number = 50
): Promise<{ events: unknown[]; count: number }> {
  try {
    // List keys with prefix
    const prefix = eventType ? `event:${eventType}:` : 'event:';
    const keys = await env.META_EVENTS.list({ prefix, limit });

    const events: unknown[] = [];
    for (const key of keys.keys) {
      const event = await env.META_EVENTS.get(key.name);
      if (event) {
        events.push(JSON.parse(event));
      }
    }

    return {
      events,
      count: events.length,
    };
  } catch (error) {
    console.error('Failed to get recent events:', error);
    return { events: [], count: 0 };
  }
}
