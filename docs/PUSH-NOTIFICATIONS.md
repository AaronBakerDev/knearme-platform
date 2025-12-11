# Push Notifications (Phase 2 Prep)

_Last updated: 2025-12-10_

## Architecture Overview
- **Client**: Requests notification permission, registers a PushSubscription via the service worker, and sends the subscription to our API.
- **API**: Stores subscriptions per contractor in `push_subscriptions` (Supabase, RLS-protected).
- **Service Worker**: Will handle `push` events to display notifications (implemented in Phase 2).
- **Sender**: Future server process will trigger web-push messages using VAPID keys.

## Table & Security
- Table: `public.push_subscriptions` with unique `(contractor_id, endpoint)`.
- RLS: Contractors can only manage their own subscriptions (see `supabase/migrations/003_push_subscriptions.sql`).

## Client Flow (Phase 1)
1. Show `PushNotificationPrompt` after engagement (>=1 project).
2. Request permission (`Notification.requestPermission()`).
3. Register/resolve service worker, subscribe via `PushManager.subscribe`.
4. POST subscription to `/api/notifications/subscribe`.
5. Allow opt-out via `/api/notifications/unsubscribe`.

## Planned Triggers (Phase 2)
- **Project published**: Notify contractor when publish succeeds.
- **New portfolio view**: Engagement nudges when traffic spikes.
- **Account activity**: Sign-in from new device/location.
- **Marketing**: Feature announcements (low frequency, opt-in).

## VAPID Keys
- Generate once and store securely.
- Example (web-push CLI):
  ```bash
  npx web-push generate-vapid-keys
  # Set NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public>
  # Set VAPID_PRIVATE_KEY=<private> (server only)
  ```
- Public key is exposed to the client; private key stays server-side.

## Server-Side Sending (Phase 2)
- Use `web-push` library with VAPID keys.
- Look up subscriptions by `contractor_id` and send payloads.
- Prune invalid/expired subscriptions on `410 Gone` responses.

## Service Worker Handling (Phase 2)
- Listen for `push` and `notificationclick`.
- Show rich notifications with action buttons and deep links.
- Respect `notification.data` for routing and analytics.

## Operational Notes
- Respect user choice: persist dismissals for 14 days.
- Rate-limit marketing-style notifications.
- Log send failures with correlation IDs for traceability.
