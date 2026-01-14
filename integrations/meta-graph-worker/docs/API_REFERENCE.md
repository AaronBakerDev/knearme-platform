# Meta Graph Worker API Reference

**Base URL:** `https://meta-graph-worker.aaron23baker.workers.dev`
**Auth:** `Authorization: Bearer dev-token`
**Method:** All endpoints use `POST` with JSON body
**Graph API Version:** v22.0

## Request Format

```bash
curl -X POST "https://meta-graph-worker.aaron23baker.workers.dev" \
  -H "Authorization: Bearer dev-token" \
  -H "Content-Type: application/json" \
  -d '{"action": "<action_name>", "params": {...}}'
```

---

## Permission Requirements Summary

| Permission | Type | Required For |
|------------|------|--------------|
| `pages_show_list` | Standard | List Pages user manages |
| `pages_read_engagement` | Standard | Read comments, reactions, posts |
| `pages_read_user_content` | Standard | Read visitor posts on Page |
| `pages_manage_posts` | **Advanced** | Create, edit, delete posts |
| `pages_manage_metadata` | **Advanced** | Webhook subscriptions |
| `instagram_basic` | Standard | Read IG profile and media |
| `instagram_manage_comments` | **Advanced** | Reply/moderate IG comments |
| `business_management` | Standard | Access Business Manager-linked Pages |
| `ads_read` | Standard | Read ad account data |
| `ads_management` | **Advanced** | Create/manage campaigns |

> **Note:** "Advanced" permissions require Meta App Review for production use.

---

## Endpoint Testing Status

| Status | Meaning |
|--------|---------|
| :white_check_mark: | Tested and working |
| :x: | Blocked - needs fix or App Review |
| :grey_question: | Untested |

---

## 1. Account Management (9 endpoints)

### oauth_status :white_check_mark:
Check current OAuth connection status.

```json
{"action": "oauth_status"}
```

### oauth_connect :white_check_mark:
Generate OAuth authorization URL.

```json
{"action": "oauth_connect", "params": {"business_alias": "fmb"}}
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `business_alias` | string | No | Custom alias for this business (e.g., "fmb", "knearme") |

### oauth_verify :white_check_mark:
Verify OAuth connection is active.

```json
{"action": "oauth_verify"}
```

### list_accounts :white_check_mark:
List connected Facebook Pages and Instagram accounts.

```json
{"action": "list_accounts", "params": {"business_id": "fmb"}}
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `business_id` | string | No | Filter by business alias |

### list_businesses :white_check_mark:
List all connected business aliases.

```json
{"action": "list_businesses"}
```

### debug_token :white_check_mark:
Inspect a page token's permissions.

```json
{"action": "debug_token", "params": {"page_id": "625829767276326"}}
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `page_id` | string | Yes | Page ID to debug token for |

### set_default_business :grey_question:
Set the default business for API calls.

```json
{"action": "set_default_business", "params": {"business_id": "fmb"}}
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `business_id` | string | Yes | Business alias to set as default |

---

## 2. Posts (5 endpoints)

**Graph API Endpoints Used:**
- Read: `GET /{page-id}/posts` (NOT `/feed` - see note below)
- Create: `POST /{page-id}/feed`
- Update: `POST /{post-id}`
- Delete: `DELETE /{post-id}`

**Required Permissions:**
- Read posts: `pages_read_engagement`
- Create/Update/Delete: `pages_manage_posts`
- User must have `CREATE_CONTENT` task on the Page

> **Important:** We use `/posts` instead of `/feed` because `/feed` requires the "Page Public Content Access" feature which needs App Review. The `/posts` endpoint works in Development Mode.

### get_posts :white_check_mark:
List posts from a Facebook Page.

```json
{"action": "get_posts", "params": {"page_id": "625829767276326", "limit": 10}}
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `page_id` | string | Yes | Facebook Page ID |
| `limit` | number | No | Max posts to return (default: 25) |
| `after` | string | No | Pagination cursor |
| `fields` | string/array | No | Fields to return |

**Default Fields:** `id, message, story, created_time, permalink_url, attachments{media_type,url,media}`

### create_post :white_check_mark:
Create a new post on a Page.

```json
{
  "action": "create_post",
  "params": {
    "page_id": "625829767276326",
    "post": {
      "message": "Hello from the API!",
      "published": true
    }
  }
}
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `page_id` | string | Yes | Facebook Page ID |
| `post.message` | string | No* | Post text content |
| `post.link` | string | No* | URL to share |
| `post.photo_url` | string | No* | Photo URL to post |
| `post.video_url` | string | No* | Video URL to post |
| `post.published` | boolean | No | false = draft (default: true) |
| `post.scheduled_publish_time` | number | No | Unix timestamp for scheduling |

*At least one of message, link, photo_url, or video_url required

### update_post :grey_question:
Update an existing post.

```json
{
  "action": "update_post",
  "params": {
    "page_id": "625829767276326",
    "post_id": "625829767276326_123456789",
    "post": {
      "message": "Updated message"
    }
  }
}
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `page_id` | string | Yes | Facebook Page ID |
| `post_id` | string | Yes | Post ID to update |
| `post.message` | string | No | New message text |
| `post.link` | string | No | New link URL |

### delete_post :white_check_mark:
Delete a post.

```json
{
  "action": "delete_post",
  "params": {
    "page_id": "625829767276326",
    "post_id": "625829767276326_123456789"
  }
}
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `page_id` | string | Yes | Facebook Page ID |
| `post_id` | string | Yes | Post ID to delete |

### schedule_post :grey_question:
Schedule a post for future publishing.

```json
{
  "action": "schedule_post",
  "params": {
    "page_id": "625829767276326",
    "post": {
      "message": "Scheduled post",
      "scheduled_publish_time": 1736200800
    }
  }
}
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `page_id` | string | Yes | Facebook Page ID |
| `post.message` | string | Yes | Post text content |
| `post.scheduled_publish_time` | number | Yes | Unix timestamp (must be 10min-6months in future) |

---

## 3. Comments (6 endpoints)

**Graph API Endpoints Used:**
- Read: `GET /{post-id}/comments`
- Reply: `POST /{comment-id}/comments`
- Hide/Unhide: `POST /{comment-id}` with `is_hidden` param
- Delete: `DELETE /{comment-id}`

**Required Permissions:**
- Read comments: `pages_read_engagement` + "Page Public Content Access" feature
- Reply/Hide/Delete: `pages_manage_engagement` or `pages_read_engagement`

> **Blocker:** The `/comments` endpoint requires the "Page Public Content Access" feature even with `pages_read_engagement` permission. This feature requires App Review. The worker code may need updating to use a different approach.

### get_comments :x:
Get comments on a post.

**Status:** Blocked - requires "Page Public Content Access" feature

```json
{
  "action": "get_comments",
  "params": {
    "post_id": "625829767276326_123456789",
    "page_id": "625829767276326",
    "limit": 25
  }
}
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `post_id` | string | Yes | Post ID to get comments from |
| `page_id` | string | Yes | Facebook Page ID |
| `limit` | number | No | Max comments to return (default: 25) |

### reply_comment :grey_question:
Reply to a comment.

```json
{
  "action": "reply_comment",
  "params": {
    "comment_id": "123456789",
    "page_id": "625829767276326",
    "message": "Thanks for your comment!"
  }
}
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `comment_id` | string | Yes | Comment ID to reply to |
| `page_id` | string | Yes | Facebook Page ID |
| `message` | string | Yes | Reply message text |

### hide_comment :grey_question:
Hide a comment from public view.

```json
{
  "action": "hide_comment",
  "params": {
    "comment_id": "123456789",
    "page_id": "625829767276326"
  }
}
```

### unhide_comment :grey_question:
Unhide a previously hidden comment.

```json
{
  "action": "unhide_comment",
  "params": {
    "comment_id": "123456789",
    "page_id": "625829767276326"
  }
}
```

### delete_comment :grey_question:
Delete a comment.

```json
{
  "action": "delete_comment",
  "params": {
    "comment_id": "123456789",
    "page_id": "625829767276326"
  }
}
```

### batch_get_comments :grey_question:
Get comments from multiple posts at once.

```json
{
  "action": "batch_get_comments",
  "params": {
    "post_ids": ["post_id_1", "post_id_2", "post_id_3"],
    "page_id": "625829767276326",
    "limit": 10
  }
}
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `post_ids` | array | Yes | Array of post IDs |
| `page_id` | string | Yes | Facebook Page ID |
| `limit` | number | No | Comments per post (default: 10) |

---

## 4. Analytics (2 endpoints)

**Graph API Endpoints Used:**
- Page: `GET /{page-id}/insights/{metric}`
- Instagram: `GET /{ig-user-id}/insights`

**Required Permissions:**
- Page insights: `pages_read_engagement`, `read_insights`
- IG insights: `instagram_basic`, `instagram_manage_insights`

**Available Page Metrics:**
- `page_impressions` - Total impressions
- `page_engaged_users` - Users who engaged
- `page_post_engagements` - Post engagements
- `page_fans` - Total page likes
- `page_views_total` - Page views

**Available IG Metrics:**
- `impressions` - Total impressions
- `reach` - Unique accounts reached
- `follower_count` - Current followers
- `profile_views` - Profile views

### get_page_insights :x:
Get Facebook Page analytics.

**Status:** Blocked - metric syntax needs update (use `/insights/{metric}` format)

```json
{
  "action": "get_page_insights",
  "params": {
    "page_id": "625829767276326",
    "metrics": ["page_impressions", "page_engaged_users"],
    "period": "day"
  }
}
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `page_id` | string | Yes | Facebook Page ID |
| `metrics` | array | No | Metrics to retrieve |
| `period` | string | No | day, week, days_28 |
| `since` | string | No | Start date (YYYY-MM-DD) |
| `until` | string | No | End date (YYYY-MM-DD) |

### get_ig_insights :x:
Get Instagram account analytics.

**Status:** Blocked - requires `instagram_manage_insights` permission (needs App Review)

```json
{
  "action": "get_ig_insights",
  "params": {
    "ig_account_id": "17841449469869646",
    "metrics": ["impressions", "reach"],
    "period": "day"
  }
}
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `ig_account_id` | string | Yes | Instagram Business Account ID |
| `metrics` | array | No | Metrics to retrieve |
| `period` | string | No | day, week, days_28 |

---

## 5. Webhooks (3 endpoints)

### Webhook Verification :white_check_mark:
Handled automatically via GET `/webhook`

### Webhook Events
Incoming webhooks are stored in KV and can be retrieved.

### get_recent_events :grey_question:
Get recent webhook events.

```json
{"action": "get_recent_events", "params": {"limit": 50}}
```

---

## 6. Ads Management (26 endpoints)

**Graph API Endpoints Used:**
- Ad Accounts: `GET /me/adaccounts`
- Campaigns: `GET/POST /{ad-account-id}/campaigns`
- Ad Sets: `GET/POST /{ad-account-id}/adsets`
- Ads: `GET/POST /{ad-account-id}/ads`
- Creatives: `GET/POST /{ad-account-id}/adcreatives`
- Images: `GET/POST /{ad-account-id}/adimages`

**Required Permissions:**
- Read ads data: `ads_read`
- Create/manage ads: `ads_management` (requires App Review)

**Ad Account ID Format:** Always prefixed with `act_` (e.g., `act_123456789`)

**Campaign Objectives:**
- `OUTCOME_AWARENESS` - Brand awareness
- `OUTCOME_ENGAGEMENT` - Post engagement
- `OUTCOME_LEADS` - Lead generation
- `OUTCOME_SALES` - Conversions
- `OUTCOME_TRAFFIC` - Website traffic

**Ad Set Billing Events:**
- `IMPRESSIONS` - Pay per 1000 impressions
- `LINK_CLICKS` - Pay per click
- `POST_ENGAGEMENT` - Pay per engagement

### Ad Accounts

#### list_ad_accounts :grey_question:
List available ad accounts.

```json
{"action": "list_ad_accounts"}
```

**Returns:** Array of ad accounts user has access to, with `act_` prefixed IDs.

### Campaigns (7 endpoints)

#### get_campaigns :grey_question:
```json
{
  "action": "get_campaigns",
  "params": {
    "ad_account_id": "act_123456789",
    "limit": 25
  }
}
```

#### create_campaign :grey_question:
```json
{
  "action": "create_campaign",
  "params": {
    "ad_account_id": "act_123456789",
    "campaign": {
      "name": "My Campaign",
      "objective": "CONVERSIONS",
      "status": "PAUSED"
    }
  }
}
```

#### update_campaign :grey_question:
```json
{
  "action": "update_campaign",
  "params": {
    "campaign_id": "123456789",
    "campaign": {"name": "Updated Name"}
  }
}
```

#### pause_campaign :grey_question:
```json
{"action": "pause_campaign", "params": {"campaign_id": "123456789"}}
```

#### resume_campaign :grey_question:
```json
{"action": "resume_campaign", "params": {"campaign_id": "123456789"}}
```

#### delete_campaign :grey_question:
```json
{"action": "delete_campaign", "params": {"campaign_id": "123456789"}}
```

#### get_ad_insights :grey_question:
```json
{
  "action": "get_ad_insights",
  "params": {
    "ad_account_id": "act_123456789",
    "level": "campaign",
    "date_preset": "last_7d"
  }
}
```

### Ad Sets (6 endpoints)

#### get_ad_sets :grey_question:
```json
{
  "action": "get_ad_sets",
  "params": {
    "campaign_id": "123456789",
    "limit": 25
  }
}
```

#### create_ad_set :grey_question:
```json
{
  "action": "create_ad_set",
  "params": {
    "ad_account_id": "act_123456789",
    "ad_set": {
      "name": "My Ad Set",
      "campaign_id": "123456789",
      "daily_budget": 1000,
      "billing_event": "IMPRESSIONS",
      "optimization_goal": "REACH",
      "targeting": {"geo_locations": {"countries": ["US"]}}
    }
  }
}
```

#### update_ad_set :grey_question:
```json
{
  "action": "update_ad_set",
  "params": {
    "ad_set_id": "123456789",
    "ad_set": {"name": "Updated Name"}
  }
}
```

#### pause_ad_set :grey_question:
```json
{"action": "pause_ad_set", "params": {"ad_set_id": "123456789"}}
```

#### resume_ad_set :grey_question:
```json
{"action": "resume_ad_set", "params": {"ad_set_id": "123456789"}}
```

#### delete_ad_set :grey_question:
```json
{"action": "delete_ad_set", "params": {"ad_set_id": "123456789"}}
```

### Ads (6 endpoints)

#### get_ads :grey_question:
```json
{
  "action": "get_ads",
  "params": {
    "ad_set_id": "123456789",
    "limit": 25
  }
}
```

#### create_ad :grey_question:
```json
{
  "action": "create_ad",
  "params": {
    "ad_account_id": "act_123456789",
    "ad": {
      "name": "My Ad",
      "adset_id": "123456789",
      "creative": {"creative_id": "123456789"}
    }
  }
}
```

#### update_ad :grey_question:
```json
{
  "action": "update_ad",
  "params": {
    "ad_id": "123456789",
    "ad": {"name": "Updated Name"}
  }
}
```

#### pause_ad :grey_question:
```json
{"action": "pause_ad", "params": {"ad_id": "123456789"}}
```

#### resume_ad :grey_question:
```json
{"action": "resume_ad", "params": {"ad_id": "123456789"}}
```

#### delete_ad :grey_question:
```json
{"action": "delete_ad", "params": {"ad_id": "123456789"}}
```

### Creatives (3 endpoints)

#### get_ad_creatives :grey_question:
```json
{
  "action": "get_ad_creatives",
  "params": {
    "ad_account_id": "act_123456789",
    "limit": 25
  }
}
```

#### create_ad_creative :grey_question:
```json
{
  "action": "create_ad_creative",
  "params": {
    "ad_account_id": "act_123456789",
    "creative": {
      "name": "My Creative",
      "object_story_spec": {
        "page_id": "625829767276326",
        "link_data": {
          "link": "https://example.com",
          "message": "Check this out!"
        }
      }
    }
  }
}
```

#### delete_ad_creative :grey_question:
```json
{"action": "delete_ad_creative", "params": {"creative_id": "123456789"}}
```

### Images & Videos (3 endpoints)

#### get_ad_images :grey_question:
```json
{
  "action": "get_ad_images",
  "params": {
    "ad_account_id": "act_123456789"
  }
}
```

#### upload_ad_image :grey_question:
```json
{
  "action": "upload_ad_image",
  "params": {
    "ad_account_id": "act_123456789",
    "image_url": "https://example.com/image.jpg"
  }
}
```

#### upload_ad_video :grey_question:
```json
{
  "action": "upload_ad_video",
  "params": {
    "ad_account_id": "act_123456789",
    "video_url": "https://example.com/video.mp4"
  }
}
```

---

## Connected Accounts Reference

### Business: `fmb` (Fix My Brick)

| Type | Name | ID |
|------|------|-----|
| Page | Fix My Brick London | `625829767276326` |
| Instagram | @fixmybricklondon | `17841449469869646` |
| Page | Fix My Brick - Toronto | `191799947361359` |
| Instagram | @fixmybricknorthyork | `17841434242883925` |
| Page | Fix My Brick | `102602901496529` |
| Instagram | @fixmybrickinc | `17841403121902534` |

---

## Testing Checklist

### Accounts
- [x] oauth_status
- [x] oauth_connect
- [x] oauth_verify
- [x] list_accounts
- [x] list_businesses
- [x] debug_token
- [ ] set_default_business

### Posts
- [x] get_posts
- [x] create_post
- [ ] update_post
- [x] delete_post
- [ ] schedule_post

### Comments
- [ ] get_comments (blocked)
- [ ] reply_comment
- [ ] hide_comment
- [ ] unhide_comment
- [ ] delete_comment
- [ ] batch_get_comments

### Analytics
- [ ] get_page_insights (blocked)
- [ ] get_ig_insights (blocked)

### Webhooks
- [x] verification
- [ ] get_recent_events

### Ads (all untested)
- [ ] list_ad_accounts
- [ ] get_campaigns
- [ ] create_campaign
- [ ] update_campaign
- [ ] pause_campaign
- [ ] resume_campaign
- [ ] delete_campaign
- [ ] get_ad_insights
- [ ] get_ad_sets
- [ ] create_ad_set
- [ ] update_ad_set
- [ ] pause_ad_set
- [ ] resume_ad_set
- [ ] delete_ad_set
- [ ] get_ads
- [ ] create_ad
- [ ] update_ad
- [ ] pause_ad
- [ ] resume_ad
- [ ] delete_ad
- [ ] get_ad_creatives
- [ ] create_ad_creative
- [ ] delete_ad_creative
- [ ] get_ad_images
- [ ] upload_ad_image
- [ ] upload_ad_video

---

## Summary

| Category | Total | Tested | Blocked | Untested |
|----------|-------|--------|---------|----------|
| Accounts | 9 | 7 | 0 | 2 |
| Posts | 5 | 4 | 0 | 1 |
| Comments | 6 | 0 | 1 | 5 |
| Analytics | 2 | 0 | 2 | 0 |
| Webhooks | 3 | 1 | 0 | 2 |
| Ads | 26 | 0 | 0 | 26 |
| **Total** | **51** | **12** | **3** | **36** |
