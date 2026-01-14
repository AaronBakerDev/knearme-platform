# Complete Meta Graph Worker (Posts, Analytics, Ads Lifecycle, Webhook Security)

This ExecPlan is a living document. The sections Progress, Surprises & Discoveries, Decision Log, and Outcomes & Retrospective must be kept up to date as work proceeds.

This plan follows `/Users/aaronbaker/knearme-workspace/PLANS.md` and must be maintained in accordance with it.

## Purpose / Big Picture

After completing this plan, the Meta Graph Worker will provide full, working API coverage for posts, analytics, and the ads lifecycle (ad accounts, campaigns, ad sets, ads, creatives, ad images, ad videos, deletes, and insights) in addition to the existing auth, comments, and webhooks. The worker will also verify webhook signatures to prevent spoofed events. A user can run a deployment, execute concrete API requests for each action, and see successful responses from Meta, with tokens cached in KV and clear error handling for missing permissions or invalid inputs.

## Progress

- [x] (2026-01-05 19:22Z) Reviewed existing worker structure, OAuth flow, KV usage, and current action gaps.
- [x] (2026-01-05) Implement webhook signature validation with `X-Hub-Signature-256` in `src/handlers/webhooks.ts`.
- [x] (2026-01-05) Implement posts handlers and wire into `src/worker.ts` actions.
- [x] (2026-01-05) Implement analytics handlers and wire into `src/worker.ts` actions.
- [x] (2026-01-05) Implement ads handlers and wire into `src/worker.ts` actions.
- [x] (2026-01-05) Extend ads handlers to cover ad sets, ads, creatives, and ad image uploads, and add ad-level insights parameters.
- [x] (2026-01-05 21:15Z) Add ads list endpoints for creatives/images, ad video uploads, and delete actions for campaigns/ad sets/ads.
- [x] (2026-01-05) Add Vitest + unit coverage for posts, analytics, ads, and webhooks (TDD flow).
- [x] (2026-01-06) Add end-to-end curl scenarios and verify against live Meta app.
  - **Results:** 12 endpoints working, 2 skipped (OAuth browser flow), 34 blocked (permissions)
  - See `docs/ENDPOINT_TEST_RESULTS.md` for full details

## Surprises & Discoveries

- Observation: Wrangler warns that KV namespaces are not inherited by environments, so production must explicitly bind them.
  Evidence: `wrangler deploy --env production` warning in CLI output.

## Decision Log

- Decision: Keep OAuth flow and token cache design; use page/IG tokens for page
  and IG endpoints, and the user token for ads endpoints.
  Rationale: This matches the existing worker contract and reduces surface area for credential changes.
  Date/Author: 2026-01-05 / Codex
- Decision: Expand ads scope to include ad sets, ads, ad creatives, and ad image uploads, and to allow ad-level insights.
  Rationale: Campaign-only endpoints cannot launch ads; ad set and ad creation are required for end-to-end ads management.
  Date/Author: 2026-01-05 / Codex
- Decision: Add list endpoints for ad creatives and ad images, plus ad video uploads, to give agent callers full asset visibility.
  Rationale: Agents need to enumerate existing creatives and assets, and video ads require video uploads to complete the creative flow.
  Date/Author: 2026-01-05 / Codex
- Decision: Add delete actions for campaigns, ad sets, and ads, using `DELETE /{id}` with a fallback to `status=DELETED` if the API rejects deletion.
  Rationale: Full ads lifecycle requires explicit delete/archival operations beyond pause/resume.
  Date/Author: 2026-01-05 / Codex
- Decision: Use flexible `filtering` parameters for ad set and ad listing endpoints instead of limiting to single ID filters.
  Rationale: Agents need fine-grained control (e.g., by status, campaign, name) without additional backend changes.
  Date/Author: 2026-01-05 / Codex

## Outcomes & Retrospective

- **Completed (2026-01-06):** End-to-end validation against live Meta app completed.
  - **Working (17):** oauth_status, list_businesses, list_accounts, debug_token, set_default_business, get_posts, create_post, update_post, delete_post, schedule_post, get_recent_events, get_page_insights, list_ad_accounts, get_campaigns, get_ad_sets, get_ad_insights
  - **Blocked - Permissions (2):** Comments (needs Page Public Content Access feature), IG Insights (needs instagram_manage_insights)
  - **Skipped (29):** Write operations for ads to avoid creating real resources; IG comments not tested
  - **Code fix applied:** list_ad_accounts now uses `/me/adaccounts` instead of deprecated `/{id}/assigned_ad_accounts`
- Handler coverage includes posts, analytics, campaigns, ad sets, ads, creatives, ad images/videos, list endpoints, and delete actions with unit test scaffolding in place.
- All test resources cleaned up (3 test posts created and deleted).

## Context and Orientation

The worker lives at `/Users/aaronbaker/knearme-workspace/integrations/meta-graph-worker`.

Default deployments use `wrangler.toml` with no named environment and the
`WORKER_URL` configured there. Production uses `--env production` and the
production `WORKER_URL`.

The entry point is `src/worker.ts`, which routes actions by name. Existing handlers are in `src/handlers/`, auth logic in `src/auth/`, and common helpers in `src/utils/`. The `src/types/index.ts` file declares every action and the request/response shapes. The worker caches tokens and API responses in Cloudflare KV namespaces configured by `wrangler.toml`.

Tokens are fetched through the OAuth flow in `src/auth/meta-auth.ts`. Long-lived user tokens and page tokens are cached in KV. Instagram access uses the linked page token. The existing comments handlers use the page token for Graph API calls. The worker is meant to be called from an internal API client with a Bearer token; in production the token must match `API_SECRET_KEY`.

Campaign-level ads handlers already live in `src/handlers/ads.ts` and are wired in `src/worker.ts`. This plan extends them with ad set, ad, creative, and ad image operations, plus additional request parameters in `src/types/index.ts`.

## Meta Developer Setup (Dev Account)

Before implementation and validation, ensure the dev account is ready:

- Create/select a Meta app (Business type is typical).
- Add products: Facebook Login, Webhooks, Instagram Graph API. Ensure Marketing
  API access for ads.
- Configure OAuth redirect: `<WORKER_URL>/oauth/callback`.
- Configure Webhooks: `<WORKER_URL>/webhook` with `WEBHOOK_VERIFY_TOKEN` and
  subscribe to required fields (feed, comments, mentions, reactions).
- Ensure the Page and IG Business account are connected and the app has access.
- For ads: grant the app or a system user access to the ad account and confirm
  `ads_read` (and `ads_management` for writes).
- Run `oauth_connect` and complete the browser flow to cache tokens.

## Plan of Work

First, secure webhook ingestion by validating `X-Hub-Signature-256` using `FB_APP_SECRET` and rejecting invalid payloads. This prevents spoofed events in the `META_EVENTS` KV namespace. Implement a helper to compute the HMAC SHA-256 signature and compare against the header.

Second, add a `posts` handler module that implements `get_posts`, `create_post`, `update_post`, `delete_post`, and `schedule_post`. Use the Graph API endpoints for page feed and post publishing. Reuse the existing page access token retrieval and caching. Add explicit parameter validation in the handler and friendly error messages for common permission failures.

Third, add an `analytics` handler module for `get_page_insights` and
`get_ig_insights`. For pages, use the insights endpoint with metrics passed in
`params.metrics` and validate the metric list. For Instagram, use the IG insights
endpoint with `ig_account_id` and confirm required permissions for insights.
Cache insights responses for the TTL defined in `src/utils/cache.ts`.

Fourth, extend the existing `ads` handler module to include ad sets, ads, ad creatives, ad images, ad videos, and delete operations in addition to campaign operations. Add actions for `get_ad_sets`, `create_ad_set`, `update_ad_set`, `pause_ad_set`, `resume_ad_set`, `delete_ad_set`, `get_ads`, `create_ad`, `update_ad`, `pause_ad`, `resume_ad`, `delete_ad`, `get_ad_creatives`, `create_ad_creative`, `delete_ad_creative`, `get_ad_images`, `upload_ad_image`, `upload_ad_video`, plus `delete_campaign` for campaigns. Use the Marketing API endpoints with `ad_account_id` and entity IDs, and use the stored long-lived user token (not page tokens). Ensure the access token being used has `ads_read` for reads and `ads_management` for writes, and return actionable errors if permissions are missing. If `ads_management` is not app-reviewed yet, gate write actions with a clear error. For ad creatives, support promoting an existing Page post via `object_story_id`, a link-based creative using an `image_hash` from `upload_ad_image`, and a video creative using a `video_id` from `upload_ad_video`. Extend `get_ad_sets` and `get_ads` to accept `filtering` so callers can pass advanced filters, and extend `get_ad_insights` to accept `level` and `filtering` parameters so callers can request ad set or ad-level insights.

Fifth, update `src/handlers/index.ts`, `src/worker.ts`, and `src/types/index.ts` so the expanded ads actions and new request parameters are wired end-to-end. Each action must return a `MetaResponse` with `success`, `data`, and a human-readable `message`.

Finally, validate everything with real API calls using curl against the deployed worker and record the expected outputs. Add a short section in `docs/README.md` describing the new endpoints and required permissions.

## Testing Strategy (TDD)

Use Vitest for unit tests. For each handler:

1. Write failing tests for parameter validation and request construction.
2. Implement or adjust handler logic to pass.
3. Add regression tests for caching and error handling.

Unit tests should mock `fetch` plus token/cache helpers and live under
`src/**/__tests__/*.test.ts`.

## API Reference Notes (Context7)

Marketing API (ads):
- List ad accounts for a user: `GET /<BUSINESS_SCOPED_USER_ID>/assigned_ad_accounts`
  with `access_token`.
- List campaigns: `GET /act_<AD_ACCOUNT_ID>/campaigns` with `fields=...` (include
  `id`, `name`, `status`, `effective_status`, `objective` as baseline fields).
- Create campaign: `POST /vXX.X/act_<AD_ACCOUNT_ID>/campaigns` with
  `name`, `objective`, `status`, `special_ad_categories`, `access_token`.
- List ad sets: `GET /act_<AD_ACCOUNT_ID>/adsets` with `fields=...` (include
  `id`, `name`, `status`, `effective_status`, `campaign_id`, `daily_budget`,
  `lifetime_budget`, `start_time`, `end_time`).
- Create ad set: `POST /vXX.X/act_<AD_ACCOUNT_ID>/adsets` with `name`,
  `campaign_id`, `billing_event`, `optimization_goal`, `targeting`, and either
  `daily_budget` or `lifetime_budget`. Use `status` to start paused by default.
- List ad creatives: `GET /act_<AD_ACCOUNT_ID>/adcreatives` with `fields=...`
  (include `id`, `name`, `object_story_spec`, `effective_object_story_id`).
- List ad images: `GET /act_<AD_ACCOUNT_ID>/adimages` with `fields=...` (include
  `hash`, `name`, `url`).
- List ads: `GET /act_<AD_ACCOUNT_ID>/ads` with `fields=...` (include
  `id`, `name`, `status`, `effective_status`, `adset_id`, `creative{id}`).
- Create ad: `POST /vXX.X/act_<AD_ACCOUNT_ID>/ads` with `name`, `adset_id`,
  `creative` (with `creative_id`), and `status`.
- Upload ad image: `POST /vXX.X/act_<AD_ACCOUNT_ID>/adimages` with `url` to obtain
  an `image_hash` for creative link data.
- Upload ad video: `POST /vXX.X/act_<AD_ACCOUNT_ID>/advideos` with `file_url`
  (remote video URL) or `url` if the API accepts it, returning a `video_id`.
- Create ad creative: `POST /vXX.X/act_<AD_ACCOUNT_ID>/adcreatives` with `name`
  plus either `object_story_id` (promote an existing Page post) or
  `object_story_spec` with `page_id` and `link_data` including `link`, `message`,
  and `image_hash`.
- Ad insights: `GET /vXX.X/act_<AD_ACCOUNT_ID>/insights` with `fields=...` and
  optional `time_range={since,until}`, `level`, `time_increment`, `filtering`.
- Campaign, ad set, and ad update/pause/resume: confirm the update endpoint and
  accepted status values before implementation, then codify them here.
- Delete campaign, ad set, ad, or creative: prefer `DELETE /{id}` and fall back
  to `POST /{id}` with `status=DELETED` if the API rejects the delete verb.

Graph API (insights):
- Page insights: `GET /{page-id}/insights` with `metric=<metric list>`.
- IG insights: `GET /{instagram_business_account_id}/insights` with
  `metric=<metric list>`.

All examples should use `env.GRAPH_API_VERSION` (e.g. `v22.0`) instead of hard
coded versions.

## Concrete Steps

1. Confirm Meta Developer dev-account setup (see section above) and complete
   `oauth_connect` in the browser to cache tokens.

2. Implement webhook signature validation.
   - Edit `src/handlers/webhooks.ts` and add a signature check in `handleWebhookEvent`.
   - Compute HMAC SHA-256 over the raw request body (clone before parsing) and
     compare to `X-Hub-Signature-256`.
   - If missing or invalid, log and return HTTP 403.

3. Add new handlers.
   - Create `src/handlers/posts.ts` implementing post CRUD and scheduling.
   - Create `src/handlers/analytics.ts` implementing page and IG insights.
   - Extend `src/handlers/ads.ts` to implement ad account, campaign, ad set, ad,
     ad creative, ad image, ad video, and delete operations.
   - Use the endpoints in API Reference Notes; update this plan if any endpoint
     or required parameter differs after deeper validation.

4. Add tests (TDD).
   - Add Vitest configuration and scripts.
   - Write unit tests for posts, analytics, ads, and webhook signature validation.

5. Wire handlers into the worker.
   - Update `src/handlers/index.ts` to export new handlers.
   - Update `src/worker.ts` to call the handlers for each action.
   - Update `src/types/index.ts` with new action names, delete actions, and ad
     asset parameter fields (creative, image, video).

6. Update docs.
   - Extend `docs/README.md` to describe new actions, parameters, and required permissions.

7. Validate.
   - Deploy `wrangler deploy` from the worker directory (dev default).
   - Run curl requests for every action and confirm expected responses.
   - Deploy `wrangler deploy --env production` only after dev validation.

Expected command examples (run from the worker directory):

    npx wrangler deploy
    # Optional after dev validation:
    npx wrangler deploy --env production

Expected curl usage (replace placeholders):

    curl -X POST <WORKER_URL> \
      -H "Authorization: Bearer <API_SECRET_KEY>" \
      -H "Content-Type: application/json" \
      -d '{"action":"get_posts","params":{"page_id":"<PAGE_ID>"}}'

    curl -X POST <WORKER_URL> \
      -H "Authorization: Bearer <API_SECRET_KEY>" \
      -H "Content-Type: application/json" \
      -d '{"action":"create_ad_set","params":{"ad_account_id":"<AD_ACCOUNT_ID>","ad_set":{"name":"Test Ad Set","campaign_id":"<CAMPAIGN_ID>","billing_event":"IMPRESSIONS","optimization_goal":"REACH","daily_budget":1000,"targeting":{"geo_locations":{"countries":["US"]}},"status":"PAUSED"}}}'

    curl -X POST <WORKER_URL> \
      -H "Authorization: Bearer <API_SECRET_KEY>" \
      -H "Content-Type: application/json" \
      -d '{"action":"upload_ad_image","params":{"ad_account_id":"<AD_ACCOUNT_ID>","ad_image":{"url":"<IMAGE_URL>"}}}'

    curl -X POST <WORKER_URL> \
      -H "Authorization: Bearer <API_SECRET_KEY>" \
      -H "Content-Type: application/json" \
      -d '{"action":"create_ad_creative","params":{"ad_account_id":"<AD_ACCOUNT_ID>","ad_creative":{"name":"Creative","object_story_spec":{"page_id":"<PAGE_ID>","link_data":{"message":"Ad copy","link":"https://example.com"}}}}}'

    curl -X POST <WORKER_URL> \
      -H "Authorization: Bearer <API_SECRET_KEY>" \
      -H "Content-Type: application/json" \
      -d '{"action":"create_ad","params":{"ad_account_id":"<AD_ACCOUNT_ID>","ad":{"name":"Ad","adset_id":"<ADSET_ID>","creative":{"creative_id":"<CREATIVE_ID>"},"status":"PAUSED"}}}'

    curl -X POST <WORKER_URL> \
      -H "Authorization: Bearer <API_SECRET_KEY>" \
      -H "Content-Type: application/json" \
      -d '{"action":"get_ad_creatives","params":{"ad_account_id":"<AD_ACCOUNT_ID>"}}'

    curl -X POST <WORKER_URL> \
      -H "Authorization: Bearer <API_SECRET_KEY>" \
      -H "Content-Type: application/json" \
      -d '{"action":"get_ad_images","params":{"ad_account_id":"<AD_ACCOUNT_ID>"}}'

    curl -X POST <WORKER_URL> \
      -H "Authorization: Bearer <API_SECRET_KEY>" \
      -H "Content-Type: application/json" \
      -d '{"action":"upload_ad_video","params":{"ad_account_id":"<AD_ACCOUNT_ID>","ad_video":{"video_url":"<VIDEO_URL>"}}}'

    curl -X POST <WORKER_URL> \
      -H "Authorization: Bearer <API_SECRET_KEY>" \
      -H "Content-Type: application/json" \
      -d '{"action":"delete_ad","params":{"ad_id":"<AD_ID>"}}'

## Validation and Acceptance

Acceptance is achieved when:

1. A webhook POST with a valid `X-Hub-Signature-256` is accepted (HTTP 200), and an invalid signature returns HTTP 403.
2. `get_posts` returns a list of posts for a Page ID.
3. `create_post` creates a new post when `pages_manage_posts` is granted.
4. `get_page_insights` and `get_ig_insights` return metrics when valid IDs and metrics are provided.
5. `list_ad_accounts` returns ad accounts, and `get_campaigns` returns campaigns.
6. `pause_campaign` and `resume_campaign` update campaign status.
7. `get_ad_sets` returns ad sets, `create_ad_set` creates an ad set with targeting and budget, and `pause_ad_set`/`resume_ad_set` update ad set status.
8. `upload_ad_image` returns an image hash, `upload_ad_video` returns a video ID, `create_ad_creative` returns a creative ID, and `create_ad` creates an ad tied to an ad set.
9. `get_ad_creatives` and `get_ad_images` return lists of existing assets for the ad account.
10. `pause_ad` and `resume_ad` update ad status, and `delete_ad` removes or archives the ad.
11. `delete_ad_set` and `delete_campaign` remove or archive their respective entities.
12. `get_ad_insights` supports `level=adset` and `level=ad` with optional filtering by IDs.
13. Each action returns a `MetaResponse` with `success: true` on a correct call and a clear error message on missing parameters or permissions.

## Idempotence and Recovery

All code changes are additive and can be reapplied safely. If any step fails, re-run the command after fixing the specific issue. Webhook signature validation can be toggled for debugging by temporarily allowing a development bypass and then removing it before release. If deploy fails, rerun `npx wrangler deploy` (dev) or `npx wrangler deploy --env production` after correcting configuration or credentials.

## Artifacts and Notes

Record short curl transcripts for each action as evidence of successful responses. Keep them concise and redact tokens:

    {"success":true,"data":{...},"message":"Posts retrieved successfully"}

## Interfaces and Dependencies

Use existing Graph API access patterns in `src/handlers/comments.ts` as a reference. All new handlers must accept `(env: Env, ...)` and return `Promise<MetaResponse>`. Any new helper functions should live in `src/utils/` and be imported explicitly. All new handlers should use `getGraphApiUrl(env.GRAPH_API_VERSION)` from `src/types/index.ts` for consistency. Any new parameters should be added to `MetaRequestParams` in `src/types/index.ts`.

Extend `MetaAction` in `src/types/index.ts` with ads lifecycle actions: `get_ad_sets`, `create_ad_set`, `update_ad_set`, `pause_ad_set`, `resume_ad_set`, `delete_ad_set`, `get_ads`, `create_ad`, `update_ad`, `pause_ad`, `resume_ad`, `delete_ad`, `get_ad_creatives`, `create_ad_creative`, `delete_ad_creative`, `get_ad_images`, `upload_ad_image`, `upload_ad_video`, and `delete_campaign`. Add `ad_set_id`, `adset_id` (alias), `ad_id`, `ad_set`, `adset` (alias), `ad`, `ad_creative`, `creative` (alias), `ad_image`, `ad_video`, `image_url`, `video_url`, `level`, `filtering`, `breakdowns`, `summary`, and `sort` fields to `MetaRequestParams` so ads requests can carry the required payloads.

Define new interfaces in `src/types/index.ts`:

    export interface AdSetContent {
      name: string;
      campaign_id: string;
      billing_event: string;
      optimization_goal: string;
      daily_budget?: number;
      lifetime_budget?: number;
      start_time?: string;
      end_time?: string;
      status?: 'ACTIVE' | 'PAUSED';
      targeting: {
        geo_locations: {
          countries?: string[];
          regions?: { key: string }[];
          cities?: { key: string }[];
        };
        age_min?: number;
        age_max?: number;
        genders?: number[];
      };
    }

    export interface AdCreativeContent {
      name: string;
      object_story_id?: string;
      object_story_spec?: {
        page_id: string;
        link_data?: {
          link: string;
          message?: string;
          image_hash?: string;
          call_to_action?: Record<string, unknown>;
        };
        video_data?: {
          video_id: string;
          message?: string;
          title?: string;
          call_to_action?: Record<string, unknown>;
        };
      };
    }

    export interface AdContent {
      name: string;
      adset_id: string;
      creative?: { creative_id: string };
      creative_id?: string;
      status?: 'ACTIVE' | 'PAUSED';
    }

    export interface AdImageContent {
      url?: string;
      image_url?: string;
      bytes?: string;
      name?: string;
    }

    export interface AdVideoContent {
      video_url?: string;
      file_url?: string;
      name?: string;
      description?: string;
      thumbnail_url?: string;
    }

In `src/handlers/ads.ts`, add handler functions named `handleGetAdSets`, `handleCreateAdSet`, `handleUpdateAdSet`, `handlePauseAdSet`, `handleResumeAdSet`, `handleDeleteAdSet`, `handleGetAds`, `handleCreateAd`, `handleUpdateAd`, `handlePauseAd`, `handleResumeAd`, `handleDeleteAd`, `handleGetAdCreatives`, `handleCreateAdCreative`, `handleDeleteAdCreative`, `handleGetAdImages`, `handleUploadAdImage`, `handleUploadAdVideo`, and `handleDeleteCampaign`. Update the existing `handleGetAdInsights` signature to accept `level`, `filtering`, and other advanced parameters and pass them through to the Marketing API.

Plan revision notes: Initial ExecPlan created to cover missing worker actions and
webhook security, based on current repo state and required behaviors. Updated to
align repo path, dev setup, deployment targets, and ads token strategy. Updated
on 2026-01-05 to add missing ads endpoints (ad sets, ads, creatives, ad image
uploads) and align acceptance criteria with full ads lifecycle requirements
after identifying gaps in the existing ads scope. Updated on 2026-01-05 to add
Vitest-based TDD workflow and unit test coverage expectations. Updated on
2026-01-05 to include ad creatives/images listing, ad video uploads, delete
actions, and expanded filtering guidance based on ads lifecycle requirements.
