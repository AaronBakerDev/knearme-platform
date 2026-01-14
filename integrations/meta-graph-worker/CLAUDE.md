# CLAUDE.md

This file provides guidance to Claude Code when working with the Meta Graph Worker project.

## Project Overview

This is an independent Cloudflare Worker that provides comprehensive API access to Meta Graph API (Facebook Pages and Instagram Business accounts). The worker acts as middleware between MCP servers/admin dashboards and Meta's APIs, handling authentication, rate limiting, and data caching.

**Version:** 1.0.0 | **API Version:** Meta Graph API v22.0
**Worker URL (dev):** `https://meta-graph-worker.aaron23baker.workers.dev`

## Architecture

```
MCP Server ←→ Cloudflare Worker ←→ Meta Graph API
                    ↓
              KV Storage
         (tokens, cache, events)
```

### Multi-Business Architecture

The worker supports multiple Meta Business Manager accounts with custom aliases:

```
KV Key Patterns:
├── token:user:{alias}           # User token per business (e.g., token:user:fmb)
├── accounts_index:{alias}       # Accounts per business
├── businesses_list              # Master list of all connected businesses
├── page_token:{pageId}          # Page tokens (globally unique)
└── ig_token:{igId}              # IG tokens (globally unique)
```

### Directory Structure
```
src/
├── worker.ts              # Main entry point (~850 lines)
├── handlers/
│   ├── accounts.ts        # OAuth flow, multi-business management
│   ├── comments.ts        # Comment CRUD operations
│   ├── posts.ts           # Post CRUD operations
│   ├── analytics.ts       # Page/IG insights
│   ├── ads.ts             # Ads management (26 handlers)
│   └── webhooks.ts        # Webhook verification & events
├── auth/
│   ├── meta-auth.ts       # OAuth2 flow, token management
│   └── index.ts           # Auth exports
├── utils/
│   ├── cors.ts            # Environment-based CORS
│   ├── cache.ts           # KV caching with TTLs, multi-business support
│   └── rate-limit.ts      # Sliding window rate limiting
└── types/
    └── index.ts           # TypeScript interfaces
```

## Current Capabilities

### Authentication (6 actions)
- `oauth_status` - Check OAuth connection status
- `oauth_connect` - Generate OAuth authorization URL (supports `business_alias` param)
- `oauth_verify` - Verify OAuth completed successfully
- `list_accounts` - List connected Pages/IG accounts (supports `business_id` param)
- `list_businesses` - List all connected business aliases
- `set_default_business` - Set default business for API calls

### Comments (6 actions)
- `get_comments` - Get comments on a post
- `reply_comment` - Reply to a comment
- `hide_comment` - Hide a comment
- `unhide_comment` - Unhide a comment
- `delete_comment` - Delete a comment
- `batch_get_comments` - Get comments from multiple posts

### Posts (5 actions)
- `get_posts` - List posts
- `create_post` - Create new post
- `update_post` - Update post
- `delete_post` - Delete post
- `schedule_post` - Schedule future post

### Analytics (2 actions)
- `get_page_insights` - Facebook Page analytics
- `get_ig_insights` - Instagram account analytics

### Ads (26 actions)
Full campaign, ad set, ad, and creative management.

## Connected Accounts (as of 2026-01-05)

### Business: `default` (7 accounts)
Legacy accounts from initial setup.

### Business: `fmb` (6 accounts)
Fix My Brick accounts:

| Type | Name | ID |
|------|------|-----|
| Page | Fix My Brick London | 625829767276326 |
| Instagram | @fixmybricklondon | 17841449469869646 |
| Page | Fix My Brick - Toronto | 191799947361359 |
| Instagram | @fixmybricknorthyork | 17841434242883925 |
| Page | Fix My Brick | 102602901496529 |
| Instagram | @fixmybrickinc | 17841403121902534 |

## OAuth Flow

### Multi-Business OAuth
```bash
# 1. Generate OAuth URL with business alias
curl -X POST https://meta-graph-worker.aaron23baker.workers.dev \
  -H "Authorization: Bearer dev-token" \
  -H "Content-Type: application/json" \
  -d '{"action": "oauth_connect", "params": {"business_alias": "fmb"}}'

# 2. Open auth_url in browser, grant permissions
# 3. Select Pages and Instagram accounts in consent screen
# 4. Also select Business Manager accounts (for business_management permission)

# 5. Verify connection
curl -X POST https://meta-graph-worker.aaron23baker.workers.dev \
  -H "Authorization: Bearer dev-token" \
  -d '{"action": "list_accounts", "params": {"business_id": "fmb"}}'
```

### Token Lifecycle
- **Short-lived token**: ~2 hours (from OAuth code exchange)
- **Long-lived token**: 60 days (exchanged automatically)
- **Page tokens**: Never expire for Page admins
- **IG tokens**: Use linked Page token

## Usage Examples

### List Businesses
```bash
curl -X POST https://meta-graph-worker.aaron23baker.workers.dev \
  -H "Authorization: Bearer dev-token" \
  -d '{"action": "list_businesses"}'
```

### List Accounts for Business
```bash
curl -X POST https://meta-graph-worker.aaron23baker.workers.dev \
  -H "Authorization: Bearer dev-token" \
  -d '{"action": "list_accounts", "params": {"business_id": "fmb"}}'
```

### Get Posts
```bash
curl -X POST https://meta-graph-worker.aaron23baker.workers.dev \
  -H "Authorization: Bearer dev-token" \
  -d '{
    "action": "get_posts",
    "params": {
      "page_id": "625829767276326",
      "limit": 10
    }
  }'
```

### Get Comments
```bash
curl -X POST https://meta-graph-worker.aaron23baker.workers.dev \
  -H "Authorization: Bearer dev-token" \
  -d '{
    "action": "get_comments",
    "params": {
      "post_id": "625829767276326_123456789",
      "page_id": "625829767276326",
      "limit": 25
    }
  }'
```

## Required Meta App Permissions

| Permission | Access Level | Purpose |
|------------|--------------|---------|
| `pages_show_list` | Standard | List connected Pages |
| `pages_read_engagement` | Standard | Read comments/reactions |
| `instagram_basic` | Standard | Read IG profile |
| `ads_read` | Standard | Read ad insights |
| `business_management` | Standard | **Required for Business Manager pages** |
| `pages_manage_posts` | **Advanced** | Create/edit posts |
| `pages_manage_metadata` | **Advanced** | Webhooks |
| `instagram_manage_comments` | **Advanced** | Reply/moderate |

> **Important**: The `business_management` permission is required to access pages linked to Meta Business Manager. Without it, `/me/accounts` returns empty even after selecting pages during OAuth.

## Endpoint Status (as of 2026-01-05)

### Working Endpoints ✅

| Category | Endpoint | Status | Notes |
|----------|----------|--------|-------|
| **OAuth** | `oauth_connect` | ✅ Working | Generates auth URL with business alias |
| **OAuth** | `oauth_callback` | ✅ Working | Token exchange and storage |
| **OAuth** | `oauth_verify` | ✅ Working | Connection verification |
| **OAuth** | `oauth_status` | ✅ Working | Status check |
| **Accounts** | `list_accounts` | ✅ Working | Lists connected Pages/IG |
| **Accounts** | `list_businesses` | ✅ Working | Lists business aliases |
| **Accounts** | `debug_token` | ✅ Working | Token inspection |
| **Posts** | `get_posts` | ✅ Working | Uses `/posts` endpoint (not `/feed`) |
| **Posts** | `create_post` | ✅ Working | Tested with unpublished post |
| **Instagram** | `get_ig_media` | ✅ Working | Via direct Graph API |
| **Webhooks** | Verification | ✅ Working | Echo test passes |

### Blocked Endpoints ❌

| Category | Endpoint | Error | Reason |
|----------|----------|-------|--------|
| **Comments** | `get_comments` | "requires pages_read_engagement" | `/feed` endpoint requires "Page Public Content Access" feature |
| **Insights** | `get_page_insights` | "invalid metric" | Metric syntax may need update |
| **Insights** | `get_ig_insights` | "does not have permission" | May require instagram_basic review |

### Key Finding: `/feed` vs `/posts` Endpoint Difference

The original `get_posts` handler used `/{page_id}/feed` which requires either:
1. `pages_read_engagement` permission approved through App Review, OR
2. The "Page Public Content Access" feature enabled

**The Fix**: Changed to `/{page_id}/posts` endpoint which works with Development Mode apps that have the token scope granted (even without App Review).

Similarly, `get_comments` uses `/{post_id}/comments` which has the same restriction. The comments endpoint likely needs the nested field approach: `/{post_id}?fields=comments` might work, but requesting comments as a subfield still triggers the same permission check.

### Token Permissions Verified

Using `debug_token` confirmed the page token has all requested scopes:
```
scopes: ["pages_show_list", "ads_read", "business_management", "instagram_basic",
         "instagram_manage_comments", "pages_read_engagement", "pages_manage_metadata",
         "pages_manage_posts", "public_profile"]
```

The token IS valid and HAS permissions - the issue is which Graph API endpoints work with Development Mode apps vs those requiring App Review or special features.

## Webhook Configuration

### Endpoint
```
GET/POST https://meta-graph-worker.aaron23baker.workers.dev/webhook
```

### Subscribed Fields
- `comments` - New/edited/deleted comments
- `feed` - Page feed changes
- `mentions` - Account mentions
- `reactions` - Post reactions

## Data & Caching

### KV Namespaces
- **META_CACHE** - Tokens, account data, API responses
- **META_EVENTS** - Webhook events (24h TTL)
- **RATE_LIMITER** - Rate limit tracking

### Cache TTLs
| Data Type | TTL |
|-----------|-----|
| Comments | 5 minutes |
| Posts | 15 minutes |
| Insights | 1 hour |
| Accounts | 1 day |
| Tokens | 55 days |
| Events | 24 hours |

## Development

### Commands
```bash
npm install        # Install dependencies
npm run dev        # Local development
npm run deploy     # Deploy to Cloudflare
npm run tail       # View logs
```

### Set Secrets
```bash
wrangler secret put FB_APP_ID
wrangler secret put FB_APP_SECRET
wrangler secret put WEBHOOK_VERIFY_TOKEN
wrangler secret put API_SECRET_KEY
```

## Important Notes

- **Rate Limit**: 60 requests/minute (conservative vs Meta's 200/hour)
- **CORS**: `*` in development
- **Development Mode**: Accepts `Bearer dev-token` for testing
- **Multi-Business**: Use `business_id` param to scope requests to specific business
- **Token Storage**: Page tokens stored globally; user tokens scoped by business alias

## Related Files

- **Setup Plan**: `docs/SETUP_EXECPLAN.md`
- **Implementation Plan**: `docs/EXECPLAN.md`
- **Multi-Business Plan**: `~/.claude/plans/cheeky-gathering-lantern.md`
