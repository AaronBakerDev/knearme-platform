# Meta Graph Worker - Setup and Scope

This worker is a Cloudflare Worker that brokers Meta Graph API access for
Facebook Pages and Instagram Business accounts. It handles OAuth, token
storage, rate limiting, caching, and webhook ingestion.

## Scope

Implemented:
- Authentication: `oauth_status`, `oauth_connect`, `oauth_verify`, `list_accounts`,
  `list_businesses`, `set_default_business`
- Comments: `get_comments`, `reply_comment`, `hide_comment`, `unhide_comment`,
  `delete_comment`, `batch_get_comments`
- Posts: `get_posts`, `create_post`, `update_post`, `delete_post`, `schedule_post`
- Analytics: `get_page_insights`, `get_ig_insights`
- Webhook events: `get_recent_events`
- Ads: `list_ad_accounts`, `get_campaigns`, `create_campaign`, `update_campaign`,
  `pause_campaign`, `resume_campaign`, `delete_campaign`, `get_ad_insights`,
  `get_ad_sets`, `create_ad_set`, `update_ad_set`, `pause_ad_set`,
  `resume_ad_set`, `delete_ad_set`, `get_ads`, `create_ad`, `update_ad`,
  `pause_ad`, `resume_ad`, `delete_ad`, `get_ad_creatives`,
  `create_ad_creative`, `delete_ad_creative`, `get_ad_images`,
  `upload_ad_image`, `upload_ad_video`
- Webhooks: `GET/POST /webhook` (stores events in KV, signature validation enabled)

## Endpoints

- `POST /` API actions (JSON body with `{ action, params }`)
- `GET /oauth/callback` OAuth redirect handler
- `GET /webhook` Meta webhook verification
- `POST /webhook` Meta webhook events
- `POST /` action `get_recent_events` to poll stored webhook events

## Ads Notes

- `list_ad_accounts` requires `business_scoped_user_id` in params.
- `ad_account_id` should use the `act_<ID>` format for campaigns/insights.
- `ad_set_id` is required for `update_ad_set`; `ad_id` is required for `update_ad`.
- `create_ad_set`, `create_ad`, `create_ad_creative`, `upload_ad_image`,
  `upload_ad_video`, and delete actions require `ads_management`.
- `get_ad_sets`, `get_ads`, `get_ad_creatives`, and `get_ad_images` accept
  `fields`, `filtering`, `limit`, `after`, and `before`.
- `get_ad_insights` supports `level`, `date_preset`, `time_increment`,
  `filtering`, `breakdowns`, `summary`, and `sort`.

## Credentials and Configuration

Cloudflare:
- KV namespaces: `META_CACHE`, `META_EVENTS`, `RATE_LIMITER`
- `wrangler.toml` bindings must match those KV IDs

Worker variables (from `wrangler.toml` / Cloudflare dashboard):
- `NODE_ENV` (development or production)
- `GRAPH_API_VERSION` (e.g. `v22.0`)
- `WORKER_URL` (public base URL used for OAuth redirect)

Worker secrets (set via `wrangler secret put`):
- `FB_APP_ID` (Meta App ID)
- `FB_APP_SECRET` (Meta App Secret)
- `WEBHOOK_VERIFY_TOKEN` (random token you choose)
- `API_SECRET_KEY` (Bearer token for API auth in production)

Meta App (developers.facebook.com):
- App ID + App Secret
- Products: Facebook Login, Webhooks, Instagram Graph API, Marketing API (ads)
- OAuth redirect URI: `<WORKER_URL>/oauth/callback`
- Webhook callback URL: `<WORKER_URL>/webhook`
- Required permissions (see below)

## Required Meta Permissions

Current scopes configured in code:
- Standard: `pages_show_list`, `pages_read_engagement`, `instagram_basic`, `ads_read`
- Advanced (requires app review): `pages_manage_posts`,
  `pages_manage_metadata`, `instagram_manage_comments`

Additional permissions for write actions:
- `instagram_content_publish` (if publishing IG content)
- `ads_management` (required for ads write actions: campaign/ad set/ad/creative,
  asset uploads, and deletes)

## Cloudflare Setup

1. Create KV namespaces and update `wrangler.toml` if IDs differ.
2. Set secrets:
   - `wrangler secret put FB_APP_ID`
   - `wrangler secret put FB_APP_SECRET`
   - `wrangler secret put WEBHOOK_VERIFY_TOKEN`
   - `wrangler secret put API_SECRET_KEY`
3. Set `WORKER_URL` for each environment to match the deployed URL.
4. Deploy with `npm run deploy` or `npm run deploy:production`.

## Meta App Setup (Manual)

1. Create a Meta App (Business type is typical).
2. Add products:
   - Facebook Login
   - Webhooks
   - Instagram Graph API
   - Marketing API (ads)
3. Configure Facebook Login:
   - Valid OAuth Redirect URIs: `<WORKER_URL>/oauth/callback`
4. Configure Webhooks:
   - Callback URL: `<WORKER_URL>/webhook`
   - Verify Token: your `WEBHOOK_VERIFY_TOKEN`
   - Subscribe to fields used in this worker: `comments`, `feed`, `mentions`,
     `reactions`
5. Request advanced permissions (app review) for:
   - `pages_manage_posts`
   - `pages_manage_metadata`
   - `instagram_manage_comments`
6. Ensure the Instagram Business account is linked to a Facebook Page that the
   authenticating user administers.

## OAuth Connection Flow

1. Call `oauth_connect` to get an authorization URL.
2. Open the URL in a browser and grant permissions.
3. On success, Meta redirects to `/oauth/callback` and tokens are stored in KV.
4. Call `oauth_verify` or `list_accounts` to confirm accounts are connected.

## Dev-Browser Assisted Setup (Optional)

Use the dev-browser skill to automate the Meta Dashboard setup if you want a
repeatable flow. Do not embed usernames or passwords in scripts; log in
interactively.

1. Start the dev-browser server:
   - `cd /Users/aaronbaker/.codex/skills/dev-browser && ./server.sh &`
2. Create a script in that directory and use `getAISnapshot()` to locate UI
   elements in the Meta developer dashboard.
3. Walk through:
   - Creating or selecting the Meta App
   - Enabling products (Facebook Login, Webhooks, Instagram Graph API, Marketing API)
   - Setting OAuth Redirect URI to `<WORKER_URL>/oauth/callback`
   - Setting Webhook Callback URL to `<WORKER_URL>/webhook`
   - Copying App ID and App Secret (store outside git)

## Operational Notes

- Production auth requires `Authorization: Bearer <API_SECRET_KEY>`.
- Development accepts any Bearer token (for local testing).
- Rate limit: 60 requests per minute per IP.
- CORS in production is restricted to `admin.fixmybrick.ca` and related domains.
  Update `src/utils/cors.ts` if more origins are needed.
- Webhook POST requests require `X-Hub-Signature-256` and are verified using
  `FB_APP_SECRET` before processing.
