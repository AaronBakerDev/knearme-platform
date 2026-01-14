/**
 * Meta OAuth2 Authentication Module
 *
 * Handles Facebook/Instagram OAuth flow:
 * 1. Generate authorization URL
 * 2. Exchange code for short-lived token
 * 3. Exchange for long-lived token (60 days)
 * 4. Get Page access tokens (never expire for admins)
 *
 * @module auth/meta-auth
 * @see https://developers.facebook.com/docs/facebook-login/guides/access-tokens
 */

import type {
  Env,
  MetaTokenResponse,
  LongLivedTokenResponse,
  PageTokenInfo,
  ConnectedAccount,
  AccountsIndex,
  BusinessInfo,
  BusinessesList,
} from '../types';
import { getGraphApiUrl } from '../types';
import {
  storeUserToken,
  storePageToken,
  getPageToken,
  getUserToken,
  setInCache,
  getFromCache,
  CACHE_PREFIX,
  CACHE_TTL,
  storeUserTokenForBusiness,
  storeAccountsForBusiness,
  getBusinessesList,
  storeBusinessesList,
} from '../utils/cache';

/**
 * Required OAuth scopes for FixMyBrick functionality
 *
 * Standard Access (no review needed):
 * - pages_show_list: List Pages user manages
 * - pages_read_engagement: Read comments/reactions
 * - instagram_basic: Read IG profile/media
 * - ads_read: Read ad insights
 *
 * Advanced Access (requires review):
 * - pages_manage_posts: Create/edit posts
 * - pages_manage_metadata: Subscribe webhooks
 * - instagram_manage_comments: Reply/moderate comments
 * - instagram_content_publish: Publish IG content
 * - ads_management: Manage campaigns
 */
const OAUTH_SCOPES = [
  // Standard Access
  'pages_show_list',
  'pages_read_engagement',
  'pages_read_user_content', // Read user comments/posts on Pages
  'instagram_basic',
  // NOTE: instagram_business_manage_insights is NOT an OAuth scope - it's an app permission
  // that requires either: (1) App Review, or (2) Instagram Tester setup in Development mode
  // @see https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/overview
  'ads_read',
  // Advanced Access (need app review)
  'pages_manage_posts',
  'pages_manage_metadata',
  'pages_manage_engagement', // Publish first comment, moderate comments
  'instagram_manage_comments',
  // Business Manager access - required for pages linked to a Business Manager
  // Without this, /me/accounts returns empty for Business-linked pages
  // @see https://developers.facebook.com/docs/graph-api/changelog/non-versioned-changes/nvc-2023
  'business_management',
  // Ads management - enabled as "Ready for testing" in app config
  'ads_management',
  // 'instagram_content_publish', // Add after app review
].join(',');

/**
 * Generate OAuth authorization URL
 *
 * Supports multi-business OAuth by embedding businessAlias in the state parameter.
 * State format: "uuid:businessAlias" or just "uuid" if no alias provided.
 *
 * @param env - Environment configuration
 * @param businessAlias - Optional business alias to embed in state (e.g., "fmb", "knearme")
 * @returns Authorization URL object with url and state
 */
export function generateOAuthUrl(
  env: Env,
  businessAlias?: string
): {
  url: string;
  state: string;
} {
  // Generate CSRF state token, optionally embedding business alias
  const uuid = crypto.randomUUID();
  const state = businessAlias ? `${uuid}:${businessAlias}` : uuid;
  const redirectUri = getCallbackUrl(env);

  const params = new URLSearchParams({
    client_id: env.FB_APP_ID,
    redirect_uri: redirectUri,
    scope: OAUTH_SCOPES,
    response_type: 'code',
    state,
  });

  const url = `https://www.facebook.com/${env.GRAPH_API_VERSION}/dialog/oauth?${params.toString()}`;

  return { url, state };
}

/**
 * Get callback URL for OAuth
 * Uses WORKER_URL environment variable if set, falls back to localhost for local dev
 */
function getCallbackUrl(env: Env): string {
  const baseUrl = env.WORKER_URL || 'http://localhost:8787';
  return `${baseUrl}/oauth/callback`;
}

/**
 * Exchange authorization code for access token
 *
 * @param code - Authorization code from OAuth callback
 * @param env - Environment configuration
 * @returns Short-lived access token
 */
export async function exchangeCodeForToken(
  code: string,
  env: Env
): Promise<MetaTokenResponse> {
  const redirectUri = getCallbackUrl(env);
  const url = `${getGraphApiUrl(env.GRAPH_API_VERSION)}/oauth/access_token`;

  const params = new URLSearchParams({
    client_id: env.FB_APP_ID,
    client_secret: env.FB_APP_SECRET,
    redirect_uri: redirectUri,
    code,
  });

  const response = await fetch(`${url}?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Token exchange failed: ${(error as { error?: { message?: string } }).error?.message || response.statusText}`
    );
  }

  return response.json() as Promise<MetaTokenResponse>;
}

/**
 * Exchange short-lived token for long-lived token (60 days)
 *
 * @param shortLivedToken - Short-lived access token
 * @param env - Environment configuration
 * @returns Long-lived access token
 */
export async function exchangeForLongLivedToken(
  shortLivedToken: string,
  env: Env
): Promise<LongLivedTokenResponse> {
  const url = `${getGraphApiUrl(env.GRAPH_API_VERSION)}/oauth/access_token`;

  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: env.FB_APP_ID,
    client_secret: env.FB_APP_SECRET,
    fb_exchange_token: shortLivedToken,
  });

  const response = await fetch(`${url}?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Long-lived token exchange failed: ${(error as { error?: { message?: string } }).error?.message || response.statusText}`
    );
  }

  return response.json() as Promise<LongLivedTokenResponse>;
}

/**
 * Get all Pages user has access to with their tokens
 *
 * @param userToken - User access token
 * @param env - Environment configuration
 * @returns Array of Page info with tokens
 */
export async function getUserPages(
  userToken: string,
  env: Env
): Promise<PageTokenInfo[]> {
  const url = `${getGraphApiUrl(env.GRAPH_API_VERSION)}/me/accounts`;

  const params = new URLSearchParams({
    access_token: userToken,
    fields: 'id,name,access_token,category,tasks',
  });

  const response = await fetch(`${url}?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Failed to get user pages: ${(error as { error?: { message?: string } }).error?.message || response.statusText}`
    );
  }

  const data = (await response.json()) as { data: PageTokenInfo[] };
  return data.data || [];
}

/**
 * Get Instagram Business Account linked to a Page
 *
 * @param pageId - Page ID
 * @param pageToken - Page access token
 * @param env - Environment configuration
 * @returns Instagram account info or null
 */
export async function getLinkedInstagramAccount(
  pageId: string,
  pageToken: string,
  env: Env
): Promise<{ id: string; username: string } | null> {
  const url = `${getGraphApiUrl(env.GRAPH_API_VERSION)}/${pageId}`;

  const params = new URLSearchParams({
    access_token: pageToken,
    fields: 'instagram_business_account{id,username}',
  });

  const response = await fetch(`${url}?${params.toString()}`);

  if (!response.ok) {
    console.warn(`Failed to get IG account for page ${pageId}`);
    return null;
  }

  const data = (await response.json()) as {
    instagram_business_account?: { id: string; username: string };
  };
  return data.instagram_business_account || null;
}

/**
 * Complete OAuth flow - exchange code and store all tokens
 *
 * Supports multi-business OAuth by storing tokens and accounts under the business alias.
 * Also updates the master businesses list.
 *
 * @param code - Authorization code
 * @param env - Environment configuration
 * @param businessAlias - Business alias for scoped storage (defaults to 'default')
 * @returns Connected accounts info
 */
export async function completeOAuthFlow(
  code: string,
  env: Env,
  businessAlias: string = 'default'
): Promise<AccountsIndex> {
  // Step 1: Exchange code for short-lived token
  const shortLivedToken = await exchangeCodeForToken(code, env);
  console.log('Got short-lived token');

  // Step 2: Exchange for long-lived token
  const longLivedToken = await exchangeForLongLivedToken(
    shortLivedToken.access_token,
    env
  );
  console.log(`Got long-lived token, expires in ${longLivedToken.expires_in}s`);

  // Step 3: Store user token for this business
  await storeUserTokenForBusiness(
    businessAlias,
    longLivedToken.access_token,
    longLivedToken.expires_in,
    env
  );

  // Step 4: Get all Pages and their tokens
  const pages = await getUserPages(longLivedToken.access_token, env);
  console.log(`Found ${pages.length} pages for business: ${businessAlias}`);

  const accounts: ConnectedAccount[] = [];
  const now = new Date().toISOString();

  // Step 5: Process each page
  for (const page of pages) {
    // Store Page token
    await storePageToken(page.id, page.access_token, env);

    // Add page to accounts
    accounts.push({
      id: page.id,
      name: page.name,
      type: 'page',
      category: page.category,
      connected_at: now,
      expires_at: null, // Page tokens don't expire for admins
    });

    // Step 6: Check for linked Instagram account
    const igAccount = await getLinkedInstagramAccount(
      page.id,
      page.access_token,
      env
    );

    if (igAccount) {
      // Store IG account with page token (IG uses page token)
      await setInCache(
        `${CACHE_PREFIX.IG_TOKEN}${igAccount.id}`,
        {
          token: page.access_token,
          page_id: page.id,
          stored_at: now,
        },
        CACHE_TTL.TOKENS,
        env
      );

      accounts.push({
        id: igAccount.id,
        name: `@${igAccount.username}`,
        type: 'instagram',
        username: igAccount.username,
        linked_page_id: page.id,
        connected_at: now,
        expires_at: null,
      });
    }
  }

  // Step 7: Build accounts index with business alias
  const accountsIndex: AccountsIndex = {
    accounts,
    default_page_id: accounts.find((a) => a.type === 'page')?.id,
    default_ig_id: accounts.find((a) => a.type === 'instagram')?.id,
    updated_at: now,
    business_alias: businessAlias,
  };

  // Step 8: Store accounts index for this business
  await storeAccountsForBusiness(businessAlias, accountsIndex, env);

  // Step 9: Update master businesses list
  await addBusinessToList(businessAlias, env);

  return accountsIndex;
}

/**
 * Get stored accounts index
 *
 * @param env - Environment configuration
 * @returns Accounts index or null
 */
export async function getStoredAccounts(env: Env): Promise<AccountsIndex | null> {
  return getFromCache<AccountsIndex>(CACHE_PREFIX.ACCOUNTS, env);
}

/**
 * Get access token for a specific Page
 *
 * @param pageId - Page ID
 * @param env - Environment configuration
 * @returns Access token or throws error
 */
export async function getAccessToken(
  pageId: string,
  env: Env
): Promise<string> {
  const token = await getPageToken(pageId, env);
  if (!token) {
    throw new Error(`No access token found for page ${pageId}. Run oauth_connect first.`);
  }
  return token;
}

/**
 * Get access token for Instagram account
 *
 * @param igAccountId - Instagram account ID
 * @param env - Environment configuration
 * @returns Access token or throws error
 */
export async function getInstagramAccessToken(
  igAccountId: string,
  env: Env
): Promise<string> {
  const data = await getFromCache<{ token: string; page_id: string }>(
    `${CACHE_PREFIX.IG_TOKEN}${igAccountId}`,
    env
  );

  if (!data?.token) {
    throw new Error(
      `No access token found for Instagram account ${igAccountId}. Run oauth_connect first.`
    );
  }

  return data.token;
}

/**
 * Add a business to the master businesses list
 *
 * Creates the list if it doesn't exist. Updates connected_at if business already exists.
 * Sets is_default=true if this is the first business being added.
 *
 * @param businessAlias - Business alias (e.g., "fmb", "knearme")
 * @param env - Environment configuration
 */
export async function addBusinessToList(
  businessAlias: string,
  env: Env
): Promise<void> {
  const now = new Date().toISOString();
  let businessesList = await getBusinessesList(env);

  if (!businessesList) {
    // Create new businesses list with this as the first (default) business
    businessesList = {
      businesses: [
        {
          alias: businessAlias,
          connected_at: now,
          is_default: true,
        },
      ],
      default_business_alias: businessAlias,
      updated_at: now,
    };
  } else {
    // Check if business already exists
    const existingIndex = businessesList.businesses.findIndex(
      (b) => b.alias === businessAlias
    );

    if (existingIndex >= 0) {
      // Update existing business's connected_at timestamp
      businessesList.businesses[existingIndex].connected_at = now;
    } else {
      // Add new business - set as default only if it's the first one
      const isFirst = businessesList.businesses.length === 0;
      businessesList.businesses.push({
        alias: businessAlias,
        connected_at: now,
        is_default: isFirst,
      });

      // If first business, also set as default
      if (isFirst) {
        businessesList.default_business_alias = businessAlias;
      }
    }
  }

  await storeBusinessesList(businessesList, env);
  console.log(`Added/updated business "${businessAlias}" in businesses list`);
}

/**
 * Resolve business alias from business_id parameter
 *
 * Falls back to:
 * 1. Provided businessId if present
 * 2. default_business_alias from businesses list
 * 3. First business alias in the list
 * 4. 'default' as final fallback
 *
 * @param businessId - Business ID/alias from request params (optional)
 * @param env - Environment configuration
 * @returns Resolved business alias
 */
export async function resolveBusinessAlias(
  businessId: string | undefined,
  env: Env
): Promise<string> {
  // If businessId provided, use it directly
  if (businessId) {
    return businessId;
  }

  // Try to get default from businesses list
  const businessesList = await getBusinessesList(env);

  if (businessesList) {
    // Use default_business_alias if set
    if (businessesList.default_business_alias) {
      return businessesList.default_business_alias;
    }

    // Fallback to first business alias
    if (businessesList.businesses.length > 0) {
      return businessesList.businesses[0].alias;
    }
  }

  // Final fallback
  return 'default';
}

/**
 * Check OAuth status
 *
 * @param env - Environment configuration
 * @returns OAuth status info
 */
export async function checkOAuthStatus(env: Env): Promise<{
  connected: boolean;
  accounts_count: number;
  needs_reconnect: boolean;
  oauth_url?: string;
}> {
  const accountsIndex = await getStoredAccounts(env);
  const userToken = await getUserToken(env);

  if (!accountsIndex || accountsIndex.accounts.length === 0) {
    const { url } = generateOAuthUrl(env);
    return {
      connected: false,
      accounts_count: 0,
      needs_reconnect: true,
      oauth_url: url,
    };
  }

  // Check if user token is expired or about to expire
  const needsReconnect = !userToken;

  if (needsReconnect) {
    const { url } = generateOAuthUrl(env);
    return {
      connected: true,
      accounts_count: accountsIndex.accounts.length,
      needs_reconnect: true,
      oauth_url: url,
    };
  }

  return {
    connected: true,
    accounts_count: accountsIndex.accounts.length,
    needs_reconnect: false,
  };
}
