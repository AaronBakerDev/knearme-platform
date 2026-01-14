# Meta Graph Worker - Endpoint Test Results

**Last Updated:** 2026-01-06
**API Version:** Meta Graph API v22.0
**Worker URL:** `https://meta-graph-worker.aaron23baker.workers.dev`
**Business Alias:** `fmb` (Fix My Brick)

## Summary Table

| # | Endpoint | Status | Error/Notes |
|---|----------|--------|-------------|
| **Account Management** ||||
| 1 | `oauth_status` | ✅ | Connected with 7 accounts |
| 2 | `oauth_connect` | ✅ | Browser flow works |
| 3 | `oauth_verify` | ✅ | OAuth code exchange works |
| 4 | `list_accounts` | ✅ | Found 6 accounts for fmb |
| 5 | `list_businesses` | ✅ | Found 2 businesses (default, fmb) |
| 6 | `debug_token` | ✅ | Token valid with 11 scopes |
| 7 | `set_default_business` | ✅ | Sets default to fmb |
| **Posts** ||||
| 9 | `get_posts` | ✅ | Returns posts with attachments, paging |
| 10 | `create_post` | ✅ | Creates unpublished/published posts |
| 11 | `update_post` | ✅ | Updates post message |
| 12 | `schedule_post` | ✅ | Schedules future posts |
| 13 | `delete_post` | ✅ | Deletes posts (cleanup verified) |
| **Comments** ||||
| 14 | `get_comments` | ✅ | **FIXED** - Works after adding `pages_read_user_content` |
| 15 | `reply_comment` | ⏭️ | Ready - needs comment ID to test |
| 16 | `hide_comment` | ⏭️ | Ready - needs comment ID to test |
| 17 | `unhide_comment` | ⏭️ | Ready - needs comment ID to test |
| 18 | `delete_comment` | ⏭️ | Ready - needs comment ID to test |
| 19 | `batch_get_comments` | ✅ | **FIXED** - Works with new permission |
| **Analytics** ||||
| 20 | `get_page_insights` | ✅ | Works with page_views_total (empty = no data) |
| 21 | `get_ig_insights` | ❌ | Requires App Review or test user setup |
| **Webhooks** ||||
| 22 | `get_recent_events` | ✅ | Returns stored webhook events (0 events currently) |
| **Ads - Accounts** ||||
| 23 | `list_ad_accounts` | ✅ | Returns 10 ad accounts via /me/adaccounts |
| **Ads - Campaigns (Read)** ||||
| 24 | `get_campaigns` | ✅ | Returns 25+ campaigns |
| 30 | `get_ad_insights` | ✅ | Works (empty data = no activity in period) |
| **Ads - Ad Sets (Read)** ||||
| 31 | `get_ad_sets` | ✅ | Returns ad sets with campaign associations |
| **Ads - Ads (Read)** ||||
| 37 | `get_ads` | ✅ | Returns ads with status info |
| **Ads - Creatives (Read)** ||||
| 43 | `get_ad_creatives` | ✅ | Returns creatives with thumbnails |
| **Ads - Media (Read)** ||||
| 46 | `get_ad_images` | ✅ | Returns 25 images |
| **Ads - Write Operations** ||||
| 25-29, 32-36, 38-42, 44-45, 47-48 | All write ops | ❌ | Requires `ads_management` (App Review) |

**Legend:** ✅ Working | ❌ Blocked | ⏭️ Ready (untested)

---

## Recent Changes (2026-01-06)

### Comments API - FIXED
**Problem:** Comments endpoints returned "(#10) requires pages_read_engagement or Page Public Content Access"

**Root Cause:** Token had `pages_read_engagement` but was missing `pages_read_user_content` for user-generated content.

**Solution:**
1. Added `pages_read_user_content` to OAuth scopes in `src/auth/meta-auth.ts`
2. Added permission in Meta Developer Console (Use Cases > Manage everything on your Page)
3. Re-authorized via OAuth flow

**Result:** Both `get_comments` and `batch_get_comments` now return successfully.

### Ads Read Endpoints - All Verified
All Ads read endpoints tested and working:
- `get_campaigns` - 25+ campaigns
- `get_ad_sets` - Ad sets with associations
- `get_ads` - Ads with status
- `get_ad_creatives` - Creatives with thumbnails
- `get_ad_images` - 25 images
- `get_ad_insights` - Works (empty = no activity)

### Ads Write Operations - Blocked
**Reason:** Only have `ads_read` scope, not `ads_management`

**Required for write ops:** `ads_management` permission needs App Review for production use.

---

## Detailed Test Results

### Phase 1: Account Management

#### 1. oauth_status ✅
```bash
curl -X POST https://meta-graph-worker.aaron23baker.workers.dev \
  -H "Authorization: Bearer dev-token" \
  -H "Content-Type: application/json" \
  -d '{"action": "oauth_status"}'
```
**Response:**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "accounts_count": 7,
    "needs_reconnect": false
  },
  "message": "Connected with 7 accounts"
}
```

#### 6. debug_token ✅ (Updated 2026-01-06)
```bash
curl -X POST https://meta-graph-worker.aaron23baker.workers.dev \
  -H "Authorization: Bearer dev-token" \
  -H "Content-Type: application/json" \
  -d '{"action": "debug_token", "params": {"page_id": "625829767276326"}}'
```
**Response:**
```json
{
  "success": true,
  "data": {
    "page_id": "625829767276326",
    "token_type": "PAGE",
    "is_valid": true,
    "scopes": [
      "pages_show_list",
      "ads_read",
      "business_management",
      "instagram_basic",
      "instagram_manage_comments",
      "pages_read_engagement",
      "pages_manage_metadata",
      "pages_read_user_content",
      "pages_manage_posts",
      "pages_manage_engagement",
      "public_profile"
    ]
  },
  "message": "Token debug info for page 625829767276326"
}
```
**Note:** Now includes `pages_read_user_content` and `pages_manage_engagement`.

---

### Phase 3: Comments (FIXED 2026-01-06)

#### 14. get_comments ✅
```bash
curl -X POST https://meta-graph-worker.aaron23baker.workers.dev \
  -H "Authorization: Bearer dev-token" \
  -H "Content-Type: application/json" \
  -d '{"action": "get_comments", "params": {"post_id": "625829767276326_122160912584841273", "page_id": "625829767276326"}}'
```
**Response:**
```json
{
  "success": true,
  "data": {
    "data": []
  },
  "message": "Comments retrieved successfully"
}
```
**Note:** Empty array means no comments on post - endpoint now works correctly.

#### 19. batch_get_comments ✅
```bash
curl -X POST https://meta-graph-worker.aaron23baker.workers.dev \
  -H "Authorization: Bearer dev-token" \
  -H "Content-Type: application/json" \
  -d '{"action": "batch_get_comments", "params": {"post_ids": ["625829767276326_122160912584841273", "625829767276326_122160571682841273"], "page_id": "625829767276326"}}'
```
**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {"postId": "625829767276326_122160912584841273", "success": true, "data": {"data": []}},
      {"postId": "625829767276326_122160571682841273", "success": true, "data": {"data": []}}
    ],
    "total_posts": 2,
    "successful_posts": 2,
    "failed_posts": 0
  },
  "message": "Fetched comments from 2/2 posts"
}
```

---

### Phase 4: Analytics

#### 21. get_ig_insights ❌
```bash
curl -X POST https://meta-graph-worker.aaron23baker.workers.dev \
  -H "Authorization: Bearer dev-token" \
  -H "Content-Type: application/json" \
  -d '{"action": "get_ig_insights", "params": {"ig_account_id": "17841434242883925", "period": "day", "metrics": ["impressions","reach"]}}'
```
**Response:**
```json
{
  "success": false,
  "error": "(#10) Application does not have permission for this action",
  "message": "Failed to get Instagram insights"
}
```
**Note:** Requires `instagram_business_manage_insights` permission. This permission is enabled in Developer Console but requires either:
1. App Review for production use, OR
2. Adding IG account as test user in development mode

---

### Phase 6-11: Ads Endpoints

#### 37. get_ads ✅ (Added 2026-01-06)
```bash
curl -X POST https://meta-graph-worker.aaron23baker.workers.dev \
  -H "Authorization: Bearer dev-token" \
  -H "Content-Type: application/json" \
  -d '{"action": "get_ads", "params": {"ad_account_id": "act_3603064173286670", "limit": 3}}'
```
**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "120232248619280162",
        "name": "Instagram post: #fixmybrick  #masonry #jewelstone",
        "adset_id": "120232248619120162",
        "campaign_id": "120232248618580162",
        "status": "ACTIVE",
        "effective_status": "ACTIVE"
      }
    ]
  },
  "message": "Ads retrieved successfully"
}
```

#### 43. get_ad_creatives ✅ (Added 2026-01-06)
```bash
curl -X POST https://meta-graph-worker.aaron23baker.workers.dev \
  -H "Authorization: Bearer dev-token" \
  -H "Content-Type: application/json" \
  -d '{"action": "get_ad_creatives", "params": {"ad_account_id": "act_3603064173286670", "limit": 3}}'
```
**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "120213990375260162",
        "name": "Fix My Brick - North York 2024-11-25-...",
        "effective_object_story_id": "191799947361359_122195288954226705",
        "thumbnail_url": "https://..."
      }
    ]
  },
  "message": "Ad creatives retrieved successfully"
}
```

#### 46. get_ad_images ✅ (Added 2026-01-06)
```bash
curl -X POST https://meta-graph-worker.aaron23baker.workers.dev \
  -H "Authorization: Bearer dev-token" \
  -H "Content-Type: application/json" \
  -d '{"action": "get_ad_images", "params": {"ad_account_id": "act_3603064173286670"}}'
```
**Response:**
```json
{
  "success": true,
  "data": {
    "data": [/* 25 images */]
  },
  "message": "Ad images retrieved successfully"
}
```

#### Ads Write Operations ❌
```bash
curl -X POST https://meta-graph-worker.aaron23baker.workers.dev \
  -H "Authorization: Bearer dev-token" \
  -H "Content-Type: application/json" \
  -d '{"action": "create_campaign", "params": {"ad_account_id": "act_3603064173286670", "campaign": {"name": "Test", "objective": "OUTCOME_TRAFFIC", "status": "PAUSED"}}}'
```
**Response:**
```json
{
  "success": false,
  "error": "Unsupported post request. Object with ID 'act_3603064173286670' does not exist, cannot be loaded due to missing permissions, or does not support this operation."
}
```
**Note:** Requires `ads_management` permission which needs App Review.

---

## Permission Status Summary

| Permission | Required For | Status | How to Enable |
|------------|--------------|--------|---------------|
| `pages_show_list` | List pages | ✅ Working | OAuth scope |
| `pages_read_engagement` | Page insights | ✅ Working | OAuth scope |
| `pages_read_user_content` | Comments | ✅ Working | OAuth scope + Dev Console |
| `pages_manage_posts` | Create/edit posts | ✅ Working | OAuth scope |
| `pages_manage_engagement` | Reply to comments | ✅ Working | OAuth scope + Dev Console |
| `instagram_basic` | IG profile/media | ✅ Working | OAuth scope |
| `instagram_manage_comments` | IG comments | ✅ Working | OAuth scope |
| `instagram_business_manage_insights` | IG analytics | ❌ Blocked | App Review or test user |
| `ads_read` | Read ad data | ✅ Working | OAuth scope |
| `ads_management` | Create/edit ads | ❌ Blocked | App Review |
| `business_management` | Business settings | ✅ Working | OAuth scope |

---

## Recommendations

### For Full Functionality

1. **IG Insights** (requires one of):
   - Submit for App Review with `instagram_business_manage_insights`
   - Add IG account as test user in Development mode

2. **Ads Write Operations** (requires):
   - Submit for App Review with `ads_management` permission

### Current OAuth Scopes (src/auth/meta-auth.ts)
```typescript
const OAUTH_SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_read_user_content',    // Added for comments
  'instagram_basic',
  // Note: instagram_business_manage_insights is enabled in app config
  // but accessed via Page token, not as OAuth scope
  'ads_read',
  'pages_manage_posts',
  'pages_manage_metadata',
  'pages_manage_engagement',    // Added for comment moderation
  'instagram_manage_comments',
  'business_management',
  // 'ads_management',           // Requires App Review
  // 'instagram_content_publish', // Requires App Review
].join(',');
```

---

## Testing Checklist

- [x] Comments API - Fixed by adding `pages_read_user_content`
- [x] Ads Read endpoints - All verified working
- [ ] IG Insights - Blocked (needs App Review)
- [ ] Ads Write endpoints - Blocked (needs App Review)
