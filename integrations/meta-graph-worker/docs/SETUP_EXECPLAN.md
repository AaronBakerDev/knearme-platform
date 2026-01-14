# Set up Meta app, accounts, and Cloudflare worker for meta-graph-worker

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This plan must be maintained in accordance with `PLANS.md` at the repository root.

## Purpose / Big Picture

After completing this plan, the Meta developer app named “KnearMe Graph Integration” is configured, the Fix My Brick test accounts are connected, and the Cloudflare worker is deployed with the correct secrets and environment variables. You can complete OAuth, list connected accounts, and successfully call the worker for auth, comments, webhooks, and (after running the implementation plan at `integrations/meta-graph-worker/docs/EXECPLAN.md`) posts, analytics, and ads. The setup is inventory-tracked in a local, non-git note so future work can restart without hunting for IDs.

## Progress

- [x] (2026-01-05 20:51Z) Create and store a private inventory of the Meta app, assets, and account IDs for all Fix My Brick test accounts.
- [x] (2026-01-05 20:51Z) Configure the Meta app products, OAuth redirect, and webhooks for the dev `WORKER_URL`.
- [x] (2026-01-05 20:51Z) Confirm Fix My Brick Pages, IG Business accounts, and ad accounts are linked and added to app roles or testers.
- [x] (2026-01-05 20:51Z) Set Cloudflare KV bindings, secrets, and deploy the worker for dev.
- [x] (2026-01-05 20:51Z) Complete OAuth, confirm `list_accounts`, and validate auth/comments/webhooks on dev.
- [ ] (pending) Run the implementation plan at `integrations/meta-graph-worker/docs/EXECPLAN.md`, then validate posts, analytics, and ads endpoints end to end.

## Surprises & Discoveries

- Observation: Worker deployed to `aaron23baker.workers.dev` subdomain, not `floral-breeze-0a38.workers.dev` as originally configured.
  Evidence: Wrangler deploy output showed different subdomain. Required updating wrangler.toml WORKER_URL and Meta app OAuth/webhook URLs.
- Observation: OAuth scopes require app permissions to be configured in "Use cases" before they can be requested.
  Evidence: Initial OAuth failed with "Invalid Scopes" error until `pages_manage_posts`, `pages_manage_metadata`, `instagram_basic`, and `instagram_manage_comments` were added via the Meta Developer Dashboard Use Cases section.
- Observation: Instagram API has two setup paths - "Instagram login" and "Facebook login" - each with different permissions.
  Evidence: Had to add permissions in both "API setup with Instagram login" and "API setup with Facebook login" sections to cover all use cases.
- Observation: **CRITICAL** - Pages linked to Meta Business Manager require `business_management` permission to be returned by `/me/accounts`.
  Evidence: OAuth callback returned 0 accounts despite selecting pages during consent. After adding `business_management` to OAuth scopes and re-authenticating, all 6 Fix My Brick accounts were returned. See https://developers.facebook.com/docs/graph-api/changelog/non-versioned-changes/nvc-2023
- Observation: Multi-business OAuth requires selecting Business Manager accounts in addition to Pages during consent flow.
  Evidence: Facebook consent flow now shows separate selection screens for Pages, Instagram accounts, and Businesses when `business_management` permission is requested.

## Decision Log

- Decision: Create a separate setup-focused ExecPlan to inventory assets and configure the Meta app and Cloudflare worker before implementing missing endpoints.
  Rationale: Setup and permissions are prerequisites for all endpoint testing, and deserve a dedicated, repeatable guide.
  Date/Author: 2026-01-05 / Codex
- Decision: Use the dev environment first and the app name “KnearMe Graph Integration,” with Fix My Brick accounts as the test set.
  Rationale: User confirmed dev-first greenfield and specified the app name and test scope.
  Date/Author: 2026-01-05 / Codex
- Decision: Do not store secrets in git; store only references to secrets in a private inventory note.
  Rationale: App secrets and API keys must remain outside source control.
  Date/Author: 2026-01-05 / Codex

## Outcomes & Retrospective

**Setup completed successfully on 2026-01-05.**

### Results
- Meta app "KnearMe Graph Integration" (ID: 33433788782901465) created and configured
- Worker deployed to `https://meta-graph-worker.aaron23baker.workers.dev`
- OAuth flow completed with 7 accounts connected (5 Pages, 2 Instagram accounts) under `default` business
- Webhook verification passed (echo test successful)
- `list_accounts` endpoint validated and returning correct data

### Multi-Business Setup (2026-01-05 21:49Z)
- Added `business_management` permission to OAuth scopes in `src/auth/meta-auth.ts`
- Created `fmb` business alias for Fix My Brick accounts
- Connected 6 accounts under `fmb` business:
  - Fix My Brick London (Page) + @fixmybricklondon (IG)
  - Fix My Brick - Toronto (Page) + @fixmybricknorthyork (IG)
  - Fix My Brick (Page) + @fixmybrickinc (IG)
- Verified `list_accounts` with `business_id: "fmb"` returns correct data
- Verified `list_businesses` returns both `default` and `fmb` businesses

### Connected Accounts
| Type | Name | ID |
|------|------|-----|
| Page | From Brick To Stone | 198632683327221 |
| Page | Marvellous Contracting Inc. | 105772737912215 |
| Page | O.N.S Auto | 110159590417382 |
| Instagram | @onsauto | 17841412282952791 |
| Page | Let's Get Social | 102014541749740 |
| Page | Cannifind.co | 101933907847176 |
| Instagram | @cannifind.co | 17841422951432437 |

### What Worked Well
- Existing KV namespace IDs in wrangler.toml were valid and didn't need recreation
- Worker code handled OAuth callback and token exchange correctly
- Meta Business Manager integration streamlined page/Instagram access

### What Could Be Improved
- Document the correct worker subdomain earlier in the process
- Pre-configure all necessary permissions in Meta app before starting OAuth flow
- Create a checklist of required Use Case permissions for faster setup

## Context and Orientation

The worker lives at `/Users/aaronbaker/knearme-workspace/integrations/meta-graph-worker`. The main configuration lives in `integrations/meta-graph-worker/wrangler.toml`, which defines the dev `WORKER_URL`, KV namespace bindings, and environment variables. The setup expectations are summarized in `integrations/meta-graph-worker/docs/README.md`. The implementation gaps for posts, analytics, and ads are covered in `integrations/meta-graph-worker/docs/EXECPLAN.md`, which must be completed after this setup plan to make all endpoints functional.

A “Meta App” is the developer application configured in the Meta Developer Dashboard. A “Facebook Page” is a business Page owned by Fix My Brick. An “Instagram Business account” is an Instagram profile linked to a Facebook Page. An “ad account” is the account that owns ad campaigns. A “Cloudflare Worker” is the deployed script in `src/worker.ts` that exposes API endpoints. A “KV namespace” is Cloudflare’s key-value storage used by the worker for tokens and caching. `WORKER_URL` is the public base URL of the worker, and `API_SECRET_KEY` is the Bearer token used to authorize requests in production.

## Plan of Work

First, create a private inventory note outside the repository and record the Meta app name, App ID, product enablement state, and the full list of Fix My Brick assets (Page IDs, IG Business IDs, ad account IDs) so the setup can be repeated without re-discovery. This inventory must not include secrets, but should include where the secrets are stored.

Next, configure the Meta app named “KnearMe Graph Integration.” Enable Facebook Login, Webhooks, Instagram Graph API, and Marketing API (if ads will be used). Set the OAuth redirect to `<WORKER_URL>/oauth/callback`, configure the webhook callback at `<WORKER_URL>/webhook` with the chosen verify token, and subscribe to the fields used by the worker: comments, feed, mentions, and reactions. Add the Fix My Brick test accounts to the app’s roles or testers so they can authorize in development mode.

Confirm the OAuth scopes requested by the worker match the current configuration in `src/auth/meta-auth.ts`: `pages_show_list`, `pages_read_engagement`, `instagram_basic`, `ads_read`, `pages_manage_posts`, `pages_manage_metadata`, `instagram_manage_comments`.

Then, ensure that all Fix My Brick Pages and Instagram Business accounts are connected and that each test user is an admin of those assets. Confirm ad account access if ads endpoints are in scope, and capture the asset IDs in the inventory note.

After the Meta app is configured, set Cloudflare secrets and variables for the worker. Confirm or update KV namespace bindings in `wrangler.toml`, set the dev `WORKER_URL`, and deploy the worker to the dev environment. This step makes the OAuth redirect and webhook endpoint live.

Finally, perform the OAuth flow to cache tokens, validate the existing auth/comments/webhooks endpoints, and then run the implementation plan at `integrations/meta-graph-worker/docs/EXECPLAN.md` to add posts, analytics, and ads endpoints. After implementation, run the end-to-end validations described below.

## Concrete Steps

Create a private inventory note outside git and record asset IDs and references to where secrets are stored. Use a location like `~/.knearme/meta-graph-worker-inventory.md` or another private location. The inventory should contain the app name, App ID, `WORKER_URL`, and the full list of Fix My Brick Page, IG Business, and ad account IDs. Do not store the App Secret or API keys in this file; instead, record where those secrets are stored (for example, in a password manager entry name).

From `/Users/aaronbaker/knearme-workspace/integrations/meta-graph-worker`, ensure KV namespaces exist. If you need new ones, run:

    npx wrangler kv:namespace create META_CACHE
    npx wrangler kv:namespace create META_EVENTS
    npx wrangler kv:namespace create RATE_LIMITER

Each command prints a new ID. If new IDs are created, update the bindings in `integrations/meta-graph-worker/wrangler.toml` to match. Re-run the command only if the namespace does not exist; if it already exists, skip creation and keep the existing IDs in `wrangler.toml`.

Set secrets for the worker (run each command and paste the secret when prompted):

    npx wrangler secret put FB_APP_ID
    npx wrangler secret put FB_APP_SECRET
    npx wrangler secret put WEBHOOK_VERIFY_TOKEN
    npx wrangler secret put API_SECRET_KEY

Confirm the dev `WORKER_URL` in `integrations/meta-graph-worker/wrangler.toml` matches the value you will use in the Meta app settings. If it changes, update it before deploying.

Deploy the worker in dev mode from `/Users/aaronbaker/knearme-workspace/integrations/meta-graph-worker`:

    npx wrangler deploy

The output should show a published worker URL that matches `WORKER_URL`.

Generate the OAuth URL by calling the worker and open it in a browser:

    curl -X POST <WORKER_URL> \
      -H "Authorization: Bearer dev-token" \
      -H "Content-Type: application/json" \
      -d '{"action":"oauth_connect"}'

Expect a JSON response containing an `auth_url`. Open that URL, authenticate as a Fix My Brick test user, and complete the consent screen. This will redirect to `<WORKER_URL>/oauth/callback` and cache tokens.

Verify the connection by listing accounts:

    curl -X POST <WORKER_URL> \
      -H "Authorization: Bearer dev-token" \
      -H "Content-Type: application/json" \
      -d '{"action":"list_accounts"}'

Expect a response with pages and linked Instagram accounts. Compare the IDs to your inventory.

Validate webhooks by simulating a verification request:

    curl "<WORKER_URL>/webhook?hub.mode=subscribe&hub.verify_token=<WEBHOOK_VERIFY_TOKEN>&hub.challenge=12345"

Expect the response body to be `12345`. A mismatch indicates the verify token is wrong.

Validate comments endpoints using a real post ID from a Fix My Brick Page. Use the examples in `integrations/meta-graph-worker/docs/README.md`, and confirm successful responses.

After completing the setup, run `integrations/meta-graph-worker/docs/EXECPLAN.md` to implement posts, analytics, and ads actions. Then validate each action with a real asset ID and record successful responses in your private inventory note.

## Validation and Acceptance

Acceptance for this setup plan is achieved when the inventory note exists and includes all Fix My Brick asset IDs, the Meta app is configured with the correct products and redirect/webhook URLs, and the worker is deployed with the correct secrets and `WORKER_URL`. The OAuth flow must succeed, `list_accounts` must return all expected Pages and Instagram accounts, and the webhook verification endpoint must echo the challenge for the configured verify token. After the implementation plan is executed, posts, analytics, and ads endpoints must return successful responses against real assets.

## Idempotence and Recovery

The setup steps are safe to repeat. Re-running `wrangler secret put` overwrites the secret value, which is safe if you provide the same value or intentionally rotate it. If a KV namespace ID changes, update `integrations/meta-graph-worker/wrangler.toml` and redeploy. If OAuth fails, repeat `oauth_connect` and complete the browser flow again; the worker will overwrite cached tokens. If webhook verification fails, confirm the verify token in both Meta and Cloudflare secrets, then retry.

## Artifacts and Notes

Keep short evidence snippets in your private inventory note, such as the `list_accounts` response and the webhook verification echo. Example structure:

    Meta App: KnearMe Graph Integration
    App ID: 123456789012345
    WORKER_URL (dev): https://meta-graph-worker.aaron23baker.workers.dev
    Pages: Fix My Brick - City A (ID 111...), Fix My Brick - City B (ID 222...)
    IG Business: @fixmybrick_citya (ID 333...), @fixmybrick_cityb (ID 444...)
    Ad accounts: act_555..., act_666...
    Secrets stored in: 1Password entry "KnearMe Graph Integration"
    list_accounts result saved: 2026-01-05
    webhook verify echo: 12345

## Interfaces and Dependencies

The setup depends on the Cloudflare Worker defined by `src/worker.ts` and its configuration in `integrations/meta-graph-worker/wrangler.toml`. It assumes the existing auth and comments actions defined in `integrations/meta-graph-worker/docs/README.md` are working and that OAuth redirects use `WORKER_URL`. The setup also depends on the Meta app being configured with Facebook Login, Webhooks, Instagram Graph API, and (for ads) Marketing API, and on the Fix My Brick test accounts having asset access. Completion of the implementation plan at `integrations/meta-graph-worker/docs/EXECPLAN.md` is required for posts, analytics, and ads actions to be available.

Plan revision notes: Initial version created to inventory and configure the Meta app, assets, and Cloudflare worker before completing missing endpoint implementations.
