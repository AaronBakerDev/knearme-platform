/**
 * Push subscription helpers (client-side).
 * Handles permission flow, PushManager subscription, and persistence via API.
 */

export interface PushSubscriptionPayload {
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  user_agent?: string;
}

function base64UrlToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const safe = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(safe);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

async function getRegistration(): Promise<ServiceWorkerRegistration> {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported in this browser.');
  }
  return navigator.serviceWorker.ready;
}

export async function getExistingPushSubscription(): Promise<PushSubscription | null> {
  const registration = await getRegistration();
  return registration.pushManager.getSubscription();
}

function getVapidPublicKey(): BufferSource {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) {
    throw new Error('Missing VAPID public key. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY.');
  }
  return base64UrlToUint8Array(publicKey) as BufferSource;
}

function toPayload(subscription: PushSubscription): PushSubscriptionPayload {
  const json = subscription.toJSON();
  if (!json.keys?.p256dh || !json.keys?.auth || !json.endpoint) {
    throw new Error('Invalid push subscription payload.');
  }

  return {
    endpoint: json.endpoint,
    p256dh_key: json.keys.p256dh,
    auth_key: json.keys.auth,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
  };
}

export async function subscribeAndPersist(): Promise<PushSubscriptionPayload> {
  const registration = await getRegistration();

  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: getVapidPublicKey(),
    }));

  const payload = toPayload(subscription);

  const response = await fetch('/api/notifications/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to save push subscription.');
  }

  return payload;
}

export async function unsubscribeAndRemove(): Promise<void> {
  const registration = await getRegistration();
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  const endpoint = subscription.endpoint;

  await subscription.unsubscribe();

  const response = await fetch('/api/notifications/unsubscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint }),
  });

  if (!response.ok) {
    throw new Error('Failed to remove subscription from database');
  }
}
