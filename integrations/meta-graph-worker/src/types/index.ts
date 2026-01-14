/**
 * Meta Graph Worker Type Definitions
 *
 * Central type definitions for the Meta Graph API Worker.
 * Handles Facebook Pages and Instagram Business accounts.
 *
 * @module types
 * @version 1.0.0
 * @description TypeScript interfaces for Meta Graph Worker
 * @see https://developers.facebook.com/docs/graph-api/reference
 */

/**
 * Environment variables interface for the Cloudflare Worker
 * @interface Env
 */
export interface Env {
  /** Meta App ID from developers.facebook.com */
  FB_APP_ID: string;
  /** Meta App Secret from developers.facebook.com */
  FB_APP_SECRET: string;
  /** Webhook verification token (self-generated) */
  WEBHOOK_VERIFY_TOKEN: string;
  /** API Security Key for MCP server communication */
  API_SECRET_KEY: string;
  /** Node environment (development/production) */
  NODE_ENV: string;
  /** Graph API version (e.g., "v22.0") */
  GRAPH_API_VERSION: string;
  /** Worker URL for OAuth callbacks */
  WORKER_URL?: string;

  /** KV Storage for caching Meta data and OAuth tokens */
  META_CACHE: KVNamespace;
  /** KV Storage for webhook events */
  META_EVENTS: KVNamespace;
  /** KV Storage for rate limiting */
  RATE_LIMITER: KVNamespace;
}

/**
 * Supported Meta API actions
 *
 * Categories:
 * - Authentication (6): oauth_status, oauth_connect, oauth_verify, list_accounts,
 *   list_businesses, set_default_business
 * - Comments (6): get_comments, reply_comment, hide_comment, unhide_comment, delete_comment, batch_get_comments
 * - Posts (5): get_posts, create_post, update_post, delete_post, schedule_post
 * - Analytics (2): get_page_insights, get_ig_insights
 * - Webhook events (1): get_recent_events
 * - Ads: list_ad_accounts, get_campaigns, create_campaign, update_campaign, pause_campaign, resume_campaign,
 *        delete_campaign, get_ad_insights, get_ad_sets, create_ad_set, update_ad_set, pause_ad_set,
 *        resume_ad_set, delete_ad_set, get_ads, create_ad, update_ad, pause_ad, resume_ad, delete_ad,
 *        get_ad_creatives, create_ad_creative, delete_ad_creative, get_ad_images, upload_ad_image,
 *        upload_ad_video
 */
export type MetaAction =
  // Authentication
  | 'oauth_status'
  | 'oauth_connect'
  | 'oauth_verify'
  | 'list_accounts'
  | 'debug_token'
  // Multi-business management
  | 'list_businesses'
  | 'set_default_business'
  // Comments
  | 'get_comments'
  | 'reply_comment'
  | 'hide_comment'
  | 'unhide_comment'
  | 'delete_comment'
  | 'batch_get_comments'
  // Posts
  | 'get_posts'
  | 'create_post'
  | 'update_post'
  | 'delete_post'
  | 'schedule_post'
  // Analytics
  | 'get_page_insights'
  | 'get_ig_insights'
  // Webhook events
  | 'get_recent_events'
  // Ads
  | 'list_ad_accounts'
  | 'get_campaigns'
  | 'create_campaign'
  | 'update_campaign'
  | 'pause_campaign'
  | 'resume_campaign'
  | 'delete_campaign'
  | 'get_ad_insights'
  | 'get_ad_sets'
  | 'create_ad_set'
  | 'update_ad_set'
  | 'pause_ad_set'
  | 'resume_ad_set'
  | 'delete_ad_set'
  | 'get_ads'
  | 'create_ad'
  | 'update_ad'
  | 'pause_ad'
  | 'resume_ad'
  | 'delete_ad'
  | 'get_ad_creatives'
  | 'create_ad_creative'
  | 'delete_ad_creative'
  | 'get_ad_images'
  | 'upload_ad_image'
  | 'upload_ad_video';

/**
 * Meta API Request interface
 * @interface MetaRequest
 */
export interface MetaRequest {
  /** The action to perform */
  action: MetaAction;
  /** Optional parameters specific to each action */
  params?: MetaRequestParams;
}

/**
 * Parameters for Meta API requests
 */
export interface MetaRequestParams {
  /** Page ID (format: 123456789) */
  page_id?: string;
  /** Instagram Business Account ID */
  ig_account_id?: string;
  /** Business-scoped user ID for ad account listing */
  business_scoped_user_id?: string;
  /** Post/Media ID */
  post_id?: string;
  /** Comment ID */
  comment_id?: string;
  /** Ad Account ID (format: act_123456789) */
  ad_account_id?: string;
  /** Ad set ID */
  ad_set_id?: string;
  /** Ad set ID (legacy alias) */
  adset_id?: string;
  /** Ad ID */
  ad_id?: string;
  /** Ad creative ID */
  ad_creative_id?: string;
  /** Creative ID (legacy alias) */
  creative_id?: string;
  /** Campaign ID */
  campaign_id?: string;
  /** Message text for comments/posts */
  message?: string;
  /** Number of items to return */
  limit?: number;
  /** Pagination cursor */
  after?: string;
  /** Pagination cursor */
  before?: string;
  /** Start date for analytics (YYYY-MM-DD or Unix timestamp) */
  since?: string;
  /** End date for analytics (YYYY-MM-DD or Unix timestamp) */
  until?: string;
  /** Metrics to retrieve */
  metrics?: string[];
  /** Fields to retrieve (Graph API fields param) */
  fields?: string[] | string;
  /** Insights level (account, campaign, adset, ad) */
  level?: 'account' | 'campaign' | 'adset' | 'ad';
  /** Insights date preset (e.g., last_7d) */
  date_preset?: string;
  /** Insights time increment */
  time_increment?: number | 'monthly' | 'all_days';
  /** Insights filtering */
  filtering?: unknown;
  /** Insights breakdowns */
  breakdowns?: string[] | string;
  /** Insights summary fields */
  summary?: string[] | string;
  /** Insights sort fields */
  sort?: string[] | string;
  /** Time period for insights */
  period?: 'day' | 'week' | 'days_28' | 'month' | 'lifetime';
  /** Post content */
  post?: PostContent;
  /** Campaign content */
  campaign?: CampaignContent;
  /** Ad set content */
  ad_set?: AdSetContent;
  /** Ad set content (legacy alias) */
  adset?: AdSetContent;
  /** Ad content */
  ad?: AdContent;
  /** Ad creative content */
  ad_creative?: AdCreativeContent;
  /** Ad creative content (legacy alias) */
  creative?: AdCreativeContent;
  /** Ad image content */
  ad_image?: AdImageContent;
  /** Ad video content */
  ad_video?: AdVideoContent;
  /** Image URL (legacy alias) */
  image_url?: string;
  /** Video URL (legacy alias) */
  video_url?: string;
  /** Remote file URL (alias for video uploads) */
  file_url?: string;
  /** Array of post IDs for batch operations */
  post_ids?: string[];
  /** OAuth authorization code */
  code?: string;
  /** OAuth state parameter */
  state?: string;
  /** Business alias for OAuth connect (new business) */
  business_alias?: string;
  /** Business ID/alias for scoped operations */
  business_id?: string;
  /** Webhook event type filter */
  event_type?: string;
  /** Additional dynamic parameters */
  [key: string]: unknown;
}

/**
 * Post content for creating/updating posts
 */
export interface PostContent {
  /** Post message/caption */
  message?: string;
  /** Link to share */
  link?: string;
  /** Photo URL for image posts */
  photo_url?: string;
  /** Video URL for video posts */
  video_url?: string;
  /** Scheduled publish time (Unix timestamp) */
  scheduled_publish_time?: number;
  /** Whether post is published */
  published?: boolean;
  /** Target audience targeting */
  targeting?: {
    geo_locations?: {
      countries?: string[];
      cities?: { key: string }[];
    };
  };
}

/**
 * Campaign content for creating/updating ads
 */
export interface CampaignContent {
  /** Campaign name */
  name?: string;
  /** Campaign objective */
  objective?:
    | 'AWARENESS'
    | 'TRAFFIC'
    | 'ENGAGEMENT'
    | 'LEADS'
    | 'APP_PROMOTION'
    | 'SALES';
  /** Campaign status */
  status?: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';
  /** Special ad categories */
  special_ad_categories?: string[];
  /** Daily budget in cents */
  daily_budget?: number;
  /** Lifetime budget in cents */
  lifetime_budget?: number;
  /** Start time (ISO 8601) */
  start_time?: string;
  /** End time (ISO 8601) */
  end_time?: string;
}

/**
 * Ad set content for creating/updating ad sets
 */
export interface AdSetContent {
  /** Ad set name */
  name?: string;
  /** Campaign ID */
  campaign_id?: string;
  /** Ad set status */
  status?: 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'DELETED';
  /** Daily budget in cents */
  daily_budget?: number;
  /** Lifetime budget in cents */
  lifetime_budget?: number;
  /** Billing event */
  billing_event?: string;
  /** Optimization goal */
  optimization_goal?: string;
  /** Bid amount */
  bid_amount?: number;
  /** Promoted object */
  promoted_object?: Record<string, unknown>;
  /** Targeting configuration */
  targeting?: Record<string, unknown>;
  /** Start time (ISO 8601) */
  start_time?: string;
  /** End time (ISO 8601) */
  end_time?: string;
  /** Additional fields */
  [key: string]: unknown;
}

/**
 * Ad content for creating/updating ads
 */
export interface AdContent {
  /** Ad name */
  name?: string;
  /** Ad set ID */
  adset_id?: string;
  /** Creative payload */
  creative?: Record<string, unknown>;
  /** Creative ID (maps to creative payload) */
  creative_id?: string;
  /** Ad status */
  status?: 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'DELETED';
  /** Additional fields */
  [key: string]: unknown;
}

/**
 * Ad creative content
 */
export interface AdCreativeContent {
  /** Creative name */
  name?: string;
  /** Story spec */
  object_story_spec?: Record<string, unknown>;
  /** Story ID (promote existing post) */
  object_story_id?: string;
  /** Asset feed spec (dynamic creative) */
  asset_feed_spec?: Record<string, unknown>;
  /** Image hash */
  image_hash?: string;
  /** Additional fields */
  [key: string]: unknown;
}

/**
 * Ad image content
 */
export interface AdImageContent {
  /** Remote image URL */
  url?: string;
  /** Remote image URL (alias) */
  image_url?: string;
  /** Base64 encoded image bytes */
  bytes?: string;
  /** Image name/filename */
  name?: string;
  /** Additional fields */
  [key: string]: unknown;
}

/**
 * Ad video content
 */
export interface AdVideoContent {
  /** Remote video URL */
  file_url?: string;
  /** Remote video URL (alias) */
  url?: string;
  /** Remote video URL (alias) */
  video_url?: string;
  /** Optional video title/name */
  name?: string;
  /** Optional video title */
  title?: string;
  /** Optional video description */
  description?: string;
  /** Raw upload source (if supported) */
  source?: string;
  /** Additional fields */
  [key: string]: unknown;
}

/**
 * Meta OAuth Token Response
 */
export interface MetaTokenResponse {
  /** OAuth2 access token */
  access_token: string;
  /** Token type (typically "bearer") */
  token_type: string;
  /** Expiration time in seconds */
  expires_in?: number;
}

/**
 * Long-lived token exchange response
 */
export interface LongLivedTokenResponse {
  /** Long-lived access token (60 days) */
  access_token: string;
  /** Token type */
  token_type: string;
  /** Expiration in seconds (~5184000 for 60 days) */
  expires_in: number;
}

/**
 * Page access token info
 */
export interface PageTokenInfo {
  /** Page ID */
  id: string;
  /** Page name */
  name: string;
  /** Page access token (never expires for admin) */
  access_token: string;
  /** Page category */
  category?: string;
  /** Tasks user can perform */
  tasks?: string[];
}

/**
 * Connected account info (stored in KV)
 */
export interface ConnectedAccount {
  /** Account ID */
  id: string;
  /** Account name */
  name: string;
  /** Account type */
  type: 'page' | 'instagram';
  /** Category (for pages) */
  category?: string;
  /** Instagram username (for IG accounts) */
  username?: string;
  /** Linked page ID (for IG accounts) */
  linked_page_id?: string;
  /** When token was obtained */
  connected_at: string;
  /** Token expiration (null = never expires) */
  expires_at?: string | null;
}

/**
 * Accounts index stored in KV
 */
export interface AccountsIndex {
  /** List of connected accounts */
  accounts: ConnectedAccount[];
  /** Default page ID for operations */
  default_page_id?: string;
  /** Default IG account ID */
  default_ig_id?: string;
  /** Last updated timestamp */
  updated_at: string;
  /** Business alias this index belongs to (multi-business support) */
  business_alias?: string;
  /** Business Manager ID from Meta (for reference) */
  business_manager_id?: string;
}

/**
 * Business info for multi-business support
 * Stored in businesses_list KV key
 */
export interface BusinessInfo {
  /** User-defined alias (e.g., "fmb", "knearme") */
  alias: string;
  /** Meta Business Manager ID (optional, for reference) */
  business_manager_id?: string;
  /** Human-readable name */
  name?: string;
  /** When this business was connected */
  connected_at: string;
  /** Is this the default business for API calls */
  is_default?: boolean;
}

/**
 * Master list of all connected businesses
 * Stored in businesses_list KV key
 */
export interface BusinessesList {
  /** Array of connected businesses */
  businesses: BusinessInfo[];
  /** Default business alias for API calls when business_id is omitted */
  default_business_alias?: string;
  /** Last updated timestamp */
  updated_at: string;
}

/**
 * Standardized Meta API Response
 */
export interface MetaResponse {
  /** Whether the request was successful */
  success: boolean;
  /** Response data */
  data?: unknown;
  /** Error message if failed */
  error?: string;
  /** Human-readable message */
  message?: string;
  /** Whether data was from cache */
  cached?: boolean;
  /** Rate limit info */
  rateLimit?: RateLimitInfo;
}

/**
 * Rate limit information
 */
export interface RateLimitInfo {
  /** Remaining requests */
  remaining: number;
  /** Reset timestamp */
  resetTime: number;
}

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  /** Whether request is allowed */
  allowed: boolean;
  /** Remaining requests */
  remaining: number;
  /** Reset timestamp */
  resetTime: number;
  /** Error message for blocked requests */
  error?: string;
}

/**
 * Webhook event from Meta
 */
export interface WebhookEvent {
  /** Object type (page, instagram) */
  object: 'page' | 'instagram';
  /** Event entries */
  entry: WebhookEntry[];
}

/**
 * Webhook entry
 */
export interface WebhookEntry {
  /** Page/Account ID */
  id: string;
  /** Event time */
  time: number;
  /** Changes array */
  changes?: WebhookChange[];
  /** Messaging array (for DMs) */
  messaging?: WebhookMessage[];
}

/**
 * Webhook change object
 */
export interface WebhookChange {
  /** Field that changed */
  field: 'comments' | 'feed' | 'mentions' | 'messages' | 'reactions';
  /** Change value */
  value: {
    /** Item type */
    item?: string;
    /** Comment ID */
    comment_id?: string;
    /** Post ID */
    post_id?: string;
    /** Parent ID */
    parent_id?: string;
    /** Sender ID */
    sender_id?: string;
    /** Message text */
    message?: string;
    /** Verb (add, edit, remove) */
    verb?: 'add' | 'edit' | 'remove';
    /** Created time */
    created_time?: number;
    /** Additional fields */
    [key: string]: unknown;
  };
}

/**
 * Webhook message (for DMs)
 */
export interface WebhookMessage {
  /** Sender info */
  sender: { id: string };
  /** Recipient info */
  recipient: { id: string };
  /** Timestamp */
  timestamp: number;
  /** Message content */
  message?: {
    mid: string;
    text?: string;
    attachments?: unknown[];
  };
}

/**
 * Valid actions list for validation
 */
export const VALID_ACTIONS: MetaAction[] = [
  // Authentication
  'oauth_status',
  'oauth_connect',
  'oauth_verify',
  'list_accounts',
  'debug_token',
  // Multi-business management
  'list_businesses',
  'set_default_business',
  // Comments
  'get_comments',
  'reply_comment',
  'hide_comment',
  'unhide_comment',
  'delete_comment',
  'batch_get_comments',
  // Posts
  'get_posts',
  'create_post',
  'update_post',
  'delete_post',
  'schedule_post',
  // Analytics
  'get_page_insights',
  'get_ig_insights',
  // Webhook events
  'get_recent_events',
  // Ads
  'list_ad_accounts',
  'get_campaigns',
  'create_campaign',
  'update_campaign',
  'pause_campaign',
  'resume_campaign',
  'delete_campaign',
  'get_ad_insights',
  'get_ad_sets',
  'create_ad_set',
  'update_ad_set',
  'pause_ad_set',
  'resume_ad_set',
  'delete_ad_set',
  'get_ads',
  'create_ad',
  'update_ad',
  'pause_ad',
  'resume_ad',
  'delete_ad',
  'get_ad_creatives',
  'create_ad_creative',
  'delete_ad_creative',
  'get_ad_images',
  'upload_ad_image',
  'upload_ad_video',
];

/**
 * Meta Graph API base URL builder
 * @param version - API version (e.g., "v22.0")
 */
export const getGraphApiUrl = (version: string = 'v22.0') =>
  `https://graph.facebook.com/${version}`;
