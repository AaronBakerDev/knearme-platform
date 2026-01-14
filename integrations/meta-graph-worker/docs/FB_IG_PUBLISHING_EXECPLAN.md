# Full Facebook and Instagram Publishing Coverage

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This plan must be maintained in accordance with `PLANS.md` at the repository root.

## Purpose / Big Picture

After completing this plan, the Meta Graph Worker can publish and schedule Facebook Page posts and publish Instagram Business content across the common formats that Meta’s APIs allow. A caller can create Page feed posts (text, link, photo, video, and multi-photo), schedule Page posts where the API supports scheduling, and publish Instagram feed posts, carousels, reels, and stories. The user-visible proof is that curl requests to the worker return success responses, and the new posts appear in the Page feed or Instagram profile/story, with container status checks returning `FINISHED` before publishing for IG videos and reels.

## Progress

- [ ] (2026-01-05 20:18Z) Confirm the Facebook Page and Instagram Business publishing scope and finalize the action/parameter contract for the worker.
- [ ] (2026-01-05 20:18Z) Extend OAuth scopes and request types for Instagram publishing and Facebook multi-media posts.
- [ ] (2026-01-05 20:18Z) Implement Facebook Page multi-photo and scheduled media publishing enhancements in `src/handlers/posts.ts`.
- [ ] (2026-01-05 20:18Z) Implement Instagram media container creation, status checks, and publishing handlers, then wire them into `src/worker.ts`.
- [ ] (2026-01-05 20:18Z) Update docs and validate all new actions with real Page and IG Business assets.

## Surprises & Discoveries

- Observation: None yet.
  Evidence: Not observed yet.

## Decision Log

- Decision: Use explicit Instagram publishing actions that mirror the required container lifecycle (create, status, publish) instead of forcing a long-running, single request.
  Rationale: Instagram videos, reels, and carousels require asynchronous processing; separating creation and publish avoids Worker timeouts while keeping the flow explicit for callers.
  Date/Author: 2026-01-05 / Codex
- Decision: Treat Instagram scheduling as out of scope unless a supported API parameter is confirmed during validation.
  Rationale: The Instagram Graph content publishing flow does not guarantee scheduled publishing; we will not invent unsupported behavior.
  Date/Author: 2026-01-05 / Codex

## Outcomes & Retrospective

Pending. Implementation work has not started yet.

## Context and Orientation

The Meta Graph Worker lives at `integrations/meta-graph-worker`. It is a Cloudflare Worker that receives JSON actions at `POST /` and routes them in `integrations/meta-graph-worker/src/worker.ts`. Facebook Page publishing handlers are in `integrations/meta-graph-worker/src/handlers/posts.ts`. OAuth scopes are declared in `integrations/meta-graph-worker/src/auth/meta-auth.ts`. All action names and request parameter shapes are defined in `integrations/meta-graph-worker/src/types/index.ts`. Documentation of current capabilities is in `integrations/meta-graph-worker/docs/README.md`.

A “Facebook Page post” in this plan means a post that appears in a Page’s feed and is created through the Graph API with a Page access token. An “Instagram Business post” means a feed post, carousel, reel, or story published via the Instagram Graph API. An “Instagram media container” is a temporary object created by the API that represents the media to be published; the container must reach a `FINISHED` status before it can be published. A “carousel” is a multi-image or multi-video post composed of child media items.

This plan focuses only on publishing actions. Comment replies, hiding, and deletion are already implemented in `integrations/meta-graph-worker/src/handlers/comments.ts` and are not modified here. Ads and analytics work remain covered by `integrations/meta-graph-worker/docs/EXECPLAN.md`.

## Plan of Work

Start by defining the publishing scope and the action contract in `integrations/meta-graph-worker/src/types/index.ts`. Add Instagram publishing actions to `MetaAction` and add a new `InstagramPostContent` interface to describe IG content inputs. Extend `MetaRequestParams` with `ig_post`, `creation_id`, and any IG-specific fields required for reels, stories, and carousels. Extend `PostContent` for Facebook to include `photo_urls` (multiple images) so callers can request a multi-photo feed post. Keep all new fields optional and validate them explicitly in handlers to produce human-readable errors when required parameters are missing.

Update OAuth scopes in `integrations/meta-graph-worker/src/auth/meta-auth.ts` by enabling `instagram_content_publish` (and ensuring `pages_manage_posts` remains included) so IG publishing is authorized after app review. Document the new scope requirements in `integrations/meta-graph-worker/docs/README.md` so operators understand which permissions are needed for publishing.

Enhance Facebook Page publishing in `integrations/meta-graph-worker/src/handlers/posts.ts`. Add support for multi-photo posts by uploading each photo with `published=false` to `/{page_id}/photos`, collecting the returned `id` values, and then creating a feed post with `attached_media[0]=...` JSON objects that reference the photo IDs. Add scheduling support for media posts where the API accepts `scheduled_publish_time` combined with `published=false` on the photo or video upload. If the API rejects scheduled media for the Page, return a clear error message that explains the limitation and suggests using text/link scheduling instead. Keep existing single-photo and single-video paths intact for backward compatibility.

Implement Instagram publishing handlers in a new module, for example `integrations/meta-graph-worker/src/handlers/instagram.ts`. The handler should create media containers by calling `/{ig_account_id}/media` with the correct `media_type` and media URL fields, return the `creation_id`, expose a status check action that calls `/{creation_id}?fields=status_code,status`, and provide a publish action that calls `/{ig_account_id}/media_publish` with `creation_id`. For carousels, the handler should create each child container with `is_carousel_item=true`, then create the parent container with `media_type=CAROUSEL` and the `children` list. Reels should be created with `media_type=REELS` and `video_url`, and stories with `media_type=STORIES` and `image_url` or `video_url`. Use `getInstagramAccessToken` for all IG calls. Return `MetaResponse` objects that include the creation ID, publish result, and any status fields.

Wire the new handlers into `integrations/meta-graph-worker/src/handlers/index.ts` and add new action cases to `integrations/meta-graph-worker/src/worker.ts` with parameter validation. Each new action must return the standardized `MetaResponse` shape with `success`, `data`, and `message`. Update `integrations/meta-graph-worker/docs/README.md` to mark the posting actions as implemented and to document the new IG publishing actions, required permissions, and parameter shapes. If this plan changes the prior assumptions in `integrations/meta-graph-worker/docs/EXECPLAN.md`, update the posting section there to avoid conflicting guidance.

## Concrete Steps

Work from the worker directory so relative paths and scripts are correct.

    cd /Users/aaronbaker/knearme-workspace/integrations/meta-graph-worker

Implement the code changes described above in these files: `src/types/index.ts`, `src/auth/meta-auth.ts`, `src/handlers/posts.ts`, the new `src/handlers/instagram.ts`, `src/handlers/index.ts`, `src/worker.ts`, and `docs/README.md`.

Run linting if available and deploy to the dev worker:

    npm run lint
    npm run deploy

Use the worker endpoint to exercise each publish flow. Replace placeholders with real IDs and URLs.

    curl -X POST <WORKER_URL> \
      -H "Authorization: Bearer <API_SECRET_KEY>" \
      -H "Content-Type: application/json" \
      -d '{"action":"create_post","params":{"page_id":"<PAGE_ID>","post":{"message":"Hello FB"}}}'

    curl -X POST <WORKER_URL> \
      -H "Authorization: Bearer <API_SECRET_KEY>" \
      -H "Content-Type: application/json" \
      -d '{"action":"create_post","params":{"page_id":"<PAGE_ID>","post":{"photo_urls":["<PHOTO_URL_1>","<PHOTO_URL_2>"],"message":"Album test"}}}'

    curl -X POST <WORKER_URL> \
      -H "Authorization: Bearer <API_SECRET_KEY>" \
      -H "Content-Type: application/json" \
      -d '{"action":"create_ig_media","params":{"ig_account_id":"<IG_ID>","ig_post":{"media_type":"IMAGE","image_url":"<IMAGE_URL>","caption":"IG feed test"}}}'

    curl -X POST <WORKER_URL> \
      -H "Authorization: Bearer <API_SECRET_KEY>" \
      -H "Content-Type: application/json" \
      -d '{"action":"get_ig_media_status","params":{"creation_id":"<CREATION_ID>"}}'

    curl -X POST <WORKER_URL> \
      -H "Authorization: Bearer <API_SECRET_KEY>" \
      -H "Content-Type: application/json" \
      -d '{"action":"publish_ig_media","params":{"ig_account_id":"<IG_ID>","creation_id":"<CREATION_ID>"}}'

## Validation and Acceptance

Acceptance requires that a Page feed post, a Page multi-photo post, an Instagram feed post, an Instagram carousel, an Instagram reel, and an Instagram story can be created through the worker and are visible in the corresponding Page or IG account. For Instagram video and reel content, `get_ig_media_status` must return a status indicating processing completion before publishing, and `publish_ig_media` must return success with a media ID. For Facebook scheduling, a scheduled post must show a future `scheduled_publish_time` and appear in the Page’s scheduled posts list; if the API does not allow scheduled media uploads, the worker must return an explicit error explaining the limitation. Each action should return a `MetaResponse` with `success: true` and a clear message on success, and a human-readable error on missing parameters or permissions.

## Idempotence and Recovery

These changes are additive and can be applied repeatedly without destructive effects. If an IG container is created but not yet published, re-run the status check until it is ready and then publish; if a publish call fails, re-run it with the same `creation_id`. If a multi-photo upload fails mid-way, re-run the request with the same photo URLs and let the handler upload fresh unpublished photos. If OAuth permissions are missing, re-run the OAuth flow after updating the scopes and retry the publish action.

## Artifacts and Notes

Keep short, redacted curl transcripts for each posting type in a private note. Example snippets:

    {"success":true,"data":{"id":"1234567890"},"message":"Post created successfully"}
    {"success":true,"data":{"creation_id":"1790..."},"message":"Instagram media container created"}
    {"success":true,"data":{"status_code":"FINISHED"},"message":"Instagram media status retrieved"}
    {"success":true,"data":{"id":"1790..."},"message":"Instagram media published successfully"}

## Interfaces and Dependencies

In `integrations/meta-graph-worker/src/types/index.ts`, extend `MetaAction` and `MetaRequestParams` to include Instagram publishing actions and fields. Add a new `InstagramPostContent` interface similar to the following, and extend `PostContent` with `photo_urls` for Facebook multi-photo posts:

    export interface InstagramPostContent {
      media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL' | 'REELS' | 'STORIES';
      image_url?: string;
      video_url?: string;
      caption?: string;
      cover_url?: string;
      share_to_feed?: boolean;
      thumb_offset?: number;
      children?: { image_url?: string; video_url?: string }[];
      location_id?: string;
      user_tags?: { username: string; x: number; y: number }[];
    }

In `integrations/meta-graph-worker/src/handlers/instagram.ts`, define:

    export async function handleCreateInstagramMedia(
      igAccountId: string,
      content: InstagramPostContent,
      env: Env
    ): Promise<MetaResponse>

    export async function handleGetInstagramMediaStatus(
      creationId: string,
      env: Env
    ): Promise<MetaResponse>

    export async function handlePublishInstagramMedia(
      igAccountId: string,
      creationId: string,
      env: Env
    ): Promise<MetaResponse>

Ensure these functions use `getInstagramAccessToken` from `integrations/meta-graph-worker/src/auth/meta-auth.ts` and `getGraphApiUrl` from `integrations/meta-graph-worker/src/types/index.ts`. In `integrations/meta-graph-worker/src/worker.ts`, route new actions to these handlers and validate parameters before invoking them.

Plan revision notes: Initial draft created on 2026-01-05 to cover full Facebook Page and Instagram Business publishing capabilities requested by the user.
