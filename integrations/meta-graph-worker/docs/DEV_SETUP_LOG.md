# Meta Graph Worker - Development Setup Log

> **Date:** January 5, 2026
> **Project:** KnearMe Graph Integration
> **Status:** Configuration Complete - Deployed

---

## Table of Contents

1. [Meta App Configuration](#meta-app-configuration)
2. [Use Cases & Permissions](#use-cases--permissions)
3. [OAuth Configuration](#oauth-configuration)
4. [Webhook Configuration](#webhook-configuration)
5. [Cloudflare Worker Configuration](#cloudflare-worker-configuration)
6. [Secrets Management](#secrets-management)
7. [Deployment Checklist](#deployment-checklist)
8. [Quick Reference Commands](#quick-reference-commands)

---

## Meta App Configuration

| Property | Value |
|----------|-------|
| **App Name** | KnearMe Graph Integration |
| **App ID** | `33433788782901465` |
| **Business ID** | `2034590223481218` |
| **Business Portfolio** | Fix My Brick - Franchise Manager |
| **App Dashboard URL** | https://developers.facebook.com/apps/33433788782901465/dashboard/ |

### App Settings Location
- **App Secret:** App Settings > Basic > App Secret (Click "Show" to reveal)
- **App ID:** App Settings > Basic > App ID

---

## Use Cases & Permissions

The following use cases have been added to the Meta App:

### 1. Create & Manage Ads with Marketing API
- Enables ad account access
- Campaign creation and management
- Ad insights and analytics

### 2. Manage Everything on Your Page
- Full Page management capabilities
- Post creation, editing, deletion
- Comment moderation
- Page insights access

### 3. Embed Facebook, Instagram and Threads Content
- oEmbed access for content embedding
- Cross-platform content display

### 4. Manage Messaging & Content on Instagram
- Instagram Business account access
- Comment management on Instagram
- Instagram insights
- Content publishing to Instagram

### Required Permissions (Standard Access)
| Permission | Purpose |
|------------|---------|
| `pages_show_list` | List connected Facebook Pages |
| `pages_read_engagement` | Read comments, reactions, shares |
| `instagram_basic` | Read Instagram profile and media |
| `ads_read` | Read ad account insights |

### Required Permissions (Advanced Access - Requires App Review)
| Permission | Purpose |
|------------|---------|
| `pages_manage_posts` | Create/edit/delete posts |
| `pages_manage_metadata` | Webhook subscriptions |
| `instagram_manage_comments` | Reply to/moderate IG comments |

---

## OAuth Configuration

### Redirect URI
```
https://meta-graph-worker.aaron23baker.workers.dev/oauth/callback
```

### Configuration Location
- **Facebook Login** > Settings > Valid OAuth Redirect URIs

### OAuth Flow Endpoints

| Endpoint | URL |
|----------|-----|
| **Authorization** | `https://www.facebook.com/v22.0/dialog/oauth` |
| **Token Exchange** | `https://graph.facebook.com/v22.0/oauth/access_token` |
| **Worker Callback** | `https://meta-graph-worker.aaron23baker.workers.dev/oauth/callback` |

### OAuth Scopes Requested
```
pages_show_list,pages_read_engagement,instagram_basic,ads_read,
pages_manage_posts,pages_manage_metadata,instagram_manage_comments
```

---

## Webhook Configuration

### Webhook Endpoint
```
https://meta-graph-worker.aaron23baker.workers.dev/webhook
```

### Verification Details
| Property | Value |
|----------|-------|
| **Product** | Page |
| **Callback URL** | `https://meta-graph-worker.aaron23baker.workers.dev/webhook` |
| **Verify Token** | `knearme_webhook_verify_2026` |

### Webhook Fields to Subscribe
After webhook verification is complete, subscribe to these fields:

| Field | Description |
|-------|-------------|
| `comments` | New, edited, or deleted comments on posts |
| `feed` | Changes to Page feed (new posts, shares) |
| `mentions` | When Page/account is mentioned |
| `reactions` | Reactions on posts (likes, loves, etc.) |

### Webhook Setup Location
- **App Dashboard** > Products > Webhooks > Page

---

## Cloudflare Worker Configuration

### Worker Details
| Property | Value |
|----------|-------|
| **Worker Name** | `meta-graph-worker` |
| **Account ID** | `81de8f20db1fc8b3d9cb9802dc151725` |
| **Dev URL** | `https://meta-graph-worker.aaron23baker.workers.dev` |
| **Production Route** | `api.knearme.co/*` |
| **Compatibility Date** | 2024-12-31 |
| **Graph API Version** | v22.0 |

### KV Namespaces

| Binding | ID | Purpose |
|---------|-------|---------|
| `META_CACHE` | `ca981cc1bc9b4851aaa595852e023557` | Token storage, API response caching |
| `META_EVENTS` | `5da47442986f484d8f48f844073d6b37` | Webhook event storage (24h TTL) |
| `RATE_LIMITER` | `acab83cb612245b9a0be87daf432e158` | Rate limit tracking |

### Environment Variables (from wrangler.toml)
```toml
[vars]
NODE_ENV = "development"
GRAPH_API_VERSION = "v22.0"
WORKER_URL = "https://meta-graph-worker.aaron23baker.workers.dev"
```

---

## Secrets Management

### Required Secrets

| Secret Name | Source | Description |
|-------------|--------|-------------|
| `FB_APP_ID` | Meta App Dashboard | `33433788782901465` |
| `FB_APP_SECRET` | App Settings > Basic | Click "Show" to reveal |
| `WEBHOOK_VERIFY_TOKEN` | Self-generated | `knearme_webhook_verify_2026` |
| `API_SECRET_KEY` | Self-generated | Secure token for API authentication |

### Setting Secrets via Wrangler

```bash
cd /Users/aaronbaker/knearme-workspace/integrations/meta-graph-worker

# Set Meta App ID
wrangler secret put FB_APP_ID
# Enter: 33433788782901465

# Set Meta App Secret (get from App Dashboard)
wrangler secret put FB_APP_SECRET
# Enter: [App Secret from Meta Dashboard]

# Set Webhook Verify Token
wrangler secret put WEBHOOK_VERIFY_TOKEN
# Enter: knearme_webhook_verify_2026

# Set API Secret Key (generate a secure token)
wrangler secret put API_SECRET_KEY
# Enter: [Generate with: openssl rand -hex 32]
```

### Generating API Secret Key
```bash
# Generate a secure 64-character hex token
openssl rand -hex 32
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Get App Secret from Meta App Settings > Basic
- [ ] Generate API Secret Key (`openssl rand -hex 32`)
- [ ] Set all 4 secrets via wrangler

### Deployment

- [ ] Deploy worker: `npm run deploy`
- [ ] Verify worker is accessible at dev URL

### Post-Deployment

- [ ] Complete webhook verification in Meta App Dashboard
- [ ] Subscribe to webhook fields (comments, feed, mentions, reactions)
- [ ] Test OAuth flow by calling the `oauth_connect` action
- [ ] Verify webhook events are being received

### Testing

- [ ] Test `oauth_status` action
- [ ] Test `oauth_connect` action (get auth URL)
- [ ] Complete OAuth in browser
- [ ] Test `oauth_verify` action
- [ ] Test `list_accounts` action
- [ ] Test `get_comments` action with a real post

---

## Quick Reference Commands

### Worker Development
```bash
cd /Users/aaronbaker/knearme-workspace/integrations/meta-graph-worker

# Install dependencies
npm install

# Local development
npm run dev

# Deploy to development
npm run deploy

# Deploy to production
npm run deploy:production

# View live logs
npm run tail
```

### API Testing
```bash
# Check OAuth status
curl -X POST https://meta-graph-worker.aaron23baker.workers.dev \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "oauth_status"}'

# Get OAuth URL
curl -X POST https://meta-graph-worker.aaron23baker.workers.dev \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "oauth_connect"}'

# List connected accounts
curl -X POST https://meta-graph-worker.aaron23baker.workers.dev \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "list_accounts"}'
```

### Webhook Verification (happens automatically)
When Meta sends verification request:
```
GET /webhook?hub.mode=subscribe&hub.challenge=CHALLENGE&hub.verify_token=knearme_webhook_verify_2026
```
Worker responds with `hub.challenge` if token matches.

---

## Troubleshooting

### Common Issues

**OAuth Redirect Mismatch**
- Ensure redirect URI in Meta App matches exactly: `https://meta-graph-worker.aaron23baker.workers.dev/oauth/callback`

**Webhook Verification Fails**
- Verify the worker is deployed and accessible
- Check that `WEBHOOK_VERIFY_TOKEN` secret matches: `knearme_webhook_verify_2026`

**Rate Limiting**
- Worker implements 60 requests/minute limit
- Check `RATE_LIMITER` KV for current state

**Token Expiration**
- Long-lived tokens expire after 60 days
- Page tokens never expire for Page admins
- Monitor token refresh in `META_CACHE` KV

---

## Related Documentation

| Document | Location |
|----------|----------|
| Execution Plan | `/docs/EXECPLAN.md` |
| FB/IG Publishing Plan | `/docs/FB_IG_PUBLISHING_EXECPLAN.md` |
| Setup Execution Plan | `/docs/SETUP_EXECPLAN.md` |
| Project CLAUDE.md | `/CLAUDE.md` |

---

*Last Updated: January 5, 2026*
