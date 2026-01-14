/**
 * Caching Utilities for Meta Graph Worker
 *
 * KV-based caching with TTL management.
 * Different cache durations based on data type.
 *
 * @module utils/cache
 */

import type { Env, AccountsIndex, BusinessesList } from '../types';

/**
 * Cache TTL configuration (in seconds)
 */
export const CACHE_TTL = {
  /** Comments - 5 minutes (frequently changing) */
  COMMENTS: 300,
  /** Posts - 15 minutes */
  POSTS: 900,
  /** Page insights - 1 hour */
  INSIGHTS: 3600,
  /** Account list - 1 day */
  ACCOUNTS: 86400,
  /** OAuth tokens - 55 days (refresh before 60 day expiry) */
  TOKENS: 4752000,
  /** Webhook events - 24 hours */
  EVENTS: 86400,
  /** Default - 5 minutes */
  DEFAULT: 300,
};

/**
 * Cache key prefixes for organization
 */
export const CACHE_PREFIX = {
  TOKEN: 'token:',
  PAGE_TOKEN: 'page_token:',
  IG_TOKEN: 'ig_token:',
  ACCOUNTS: 'accounts_index',
  BUSINESSES: 'businesses_list',
  COMMENTS: 'comments:',
  POSTS: 'posts:',
  INSIGHTS: 'insights:',
  EVENT: 'event:',
};

/**
 * Get cached data
 *
 * @param key - Cache key
 * @param env - Environment with KV storage
 * @returns Cached data or null
 */
export async function getFromCache<T>(
  key: string,
  env: Env
): Promise<T | null> {
  try {
    const data = await env.META_CACHE.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`Cache get error for ${key}:`, error);
    return null;
  }
}

/**
 * Store data in cache
 *
 * @param key - Cache key
 * @param data - Data to cache
 * @param ttl - Time to live in seconds
 * @param env - Environment with KV storage
 */
export async function setInCache(
  key: string,
  data: unknown,
  ttl: number,
  env: Env
): Promise<void> {
  try {
    await env.META_CACHE.put(key, JSON.stringify(data), {
      expirationTtl: ttl,
    });
  } catch (error) {
    console.error(`Cache set error for ${key}:`, error);
  }
}

/**
 * Delete from cache
 *
 * @param key - Cache key
 * @param env - Environment with KV storage
 */
export async function deleteFromCache(key: string, env: Env): Promise<void> {
  try {
    await env.META_CACHE.delete(key);
  } catch (error) {
    console.error(`Cache delete error for ${key}:`, error);
  }
}

/**
 * Build cache key for page-specific data
 *
 * @param prefix - Key prefix
 * @param pageId - Page ID
 * @param suffix - Optional suffix (e.g., post ID)
 * @returns Complete cache key
 */
export function buildCacheKey(
  prefix: string,
  pageId: string,
  suffix?: string
): string {
  return suffix ? `${prefix}${pageId}:${suffix}` : `${prefix}${pageId}`;
}

/**
 * Store page access token
 *
 * @param pageId - Page ID
 * @param token - Access token
 * @param env - Environment
 */
export async function storePageToken(
  pageId: string,
  token: string,
  env: Env
): Promise<void> {
  await setInCache(
    `${CACHE_PREFIX.PAGE_TOKEN}${pageId}`,
    { token, stored_at: new Date().toISOString() },
    CACHE_TTL.TOKENS,
    env
  );
}

/**
 * Get page access token
 *
 * @param pageId - Page ID
 * @param env - Environment
 * @returns Token or null
 */
export async function getPageToken(
  pageId: string,
  env: Env
): Promise<string | null> {
  const data = await getFromCache<{ token: string }>(
    `${CACHE_PREFIX.PAGE_TOKEN}${pageId}`,
    env
  );
  return data?.token || null;
}

/**
 * Store user access token (long-lived)
 *
 * @param token - Access token
 * @param expiresIn - Expiration time in seconds
 * @param env - Environment
 */
export async function storeUserToken(
  token: string,
  expiresIn: number,
  env: Env
): Promise<void> {
  await setInCache(
    `${CACHE_PREFIX.TOKEN}user`,
    {
      token,
      expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      stored_at: new Date().toISOString(),
    },
    expiresIn - 86400, // Store for slightly less than expiry
    env
  );
}

/**
 * Get user access token
 *
 * @param env - Environment
 * @returns Token or null
 */
export async function getUserToken(env: Env): Promise<string | null> {
  const data = await getFromCache<{ token: string; expires_at: string }>(
    `${CACHE_PREFIX.TOKEN}user`,
    env
  );
  if (!data) return null;

  // Check if token is still valid
  if (new Date(data.expires_at) < new Date()) {
    await deleteFromCache(`${CACHE_PREFIX.TOKEN}user`, env);
    return null;
  }

  return data.token;
}

/**
 * Store webhook event
 *
 * @param eventId - Unique event ID
 * @param event - Event data
 * @param env - Environment
 */
export async function storeWebhookEvent(
  eventId: string,
  event: unknown,
  env: Env
): Promise<void> {
  try {
    await env.META_EVENTS.put(
      `${CACHE_PREFIX.EVENT}${eventId}`,
      JSON.stringify({
        ...event,
        received_at: new Date().toISOString(),
      }),
      { expirationTtl: CACHE_TTL.EVENTS }
    );
  } catch (error) {
    console.error(`Event store error for ${eventId}:`, error);
  }
}

/**
 * Get webhook event
 *
 * @param eventId - Event ID
 * @param env - Environment
 * @returns Event data or null
 */
export async function getWebhookEvent(
  eventId: string,
  env: Env
): Promise<unknown | null> {
  try {
    const data = await env.META_EVENTS.get(`${CACHE_PREFIX.EVENT}${eventId}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Event get error for ${eventId}:`, error);
    return null;
  }
}

// =============================================================================
// Multi-Business Scoped Functions
// =============================================================================

/**
 * Store user access token for a specific business
 *
 * @param businessAlias - Business alias (e.g., "fmb", "knearme")
 * @param token - Access token
 * @param expiresIn - Expiration time in seconds
 * @param env - Environment
 */
export async function storeUserTokenForBusiness(
  businessAlias: string,
  token: string,
  expiresIn: number,
  env: Env
): Promise<void> {
  // Default to 60 days if expiresIn is invalid
  const safeExpiresIn = expiresIn && !isNaN(expiresIn) ? expiresIn : 5184000;

  await setInCache(
    `${CACHE_PREFIX.TOKEN}user:${businessAlias}`,
    {
      token,
      expires_at: new Date(Date.now() + safeExpiresIn * 1000).toISOString(),
      stored_at: new Date().toISOString(),
      business_alias: businessAlias,
    },
    Math.max(safeExpiresIn - 86400, 3600), // Store for slightly less than expiry, min 1 hour
    env
  );
}

/**
 * Get user access token for a specific business
 *
 * Includes legacy fallback: if businessAlias is 'default' and no token found,
 * checks legacy `token:user` key and migrates it.
 *
 * @param businessAlias - Business alias (e.g., "fmb", "knearme", "default")
 * @param env - Environment
 * @returns Token or null
 */
export async function getUserTokenForBusiness(
  businessAlias: string,
  env: Env
): Promise<string | null> {
  const data = await getFromCache<{ token: string; expires_at: string }>(
    `${CACHE_PREFIX.TOKEN}user:${businessAlias}`,
    env
  );

  if (data) {
    // Check if token is still valid
    if (new Date(data.expires_at) < new Date()) {
      await deleteFromCache(`${CACHE_PREFIX.TOKEN}user:${businessAlias}`, env);
      return null;
    }
    return data.token;
  }

  // Legacy fallback: if 'default' and no token found, check legacy key
  if (businessAlias === 'default') {
    const legacyData = await getFromCache<{ token: string; expires_at: string }>(
      `${CACHE_PREFIX.TOKEN}user`,
      env
    );

    if (legacyData) {
      // Check if legacy token is still valid
      if (new Date(legacyData.expires_at) < new Date()) {
        await deleteFromCache(`${CACHE_PREFIX.TOKEN}user`, env);
        return null;
      }

      // Migrate legacy token to new key format
      const remainingTime = Math.floor(
        (new Date(legacyData.expires_at).getTime() - Date.now()) / 1000
      );
      if (remainingTime > 0) {
        await storeUserTokenForBusiness('default', legacyData.token, remainingTime, env);
        console.log('Migrated legacy user token to default business key');
      }

      return legacyData.token;
    }
  }

  return null;
}

/**
 * Store accounts index for a specific business
 *
 * @param businessAlias - Business alias (e.g., "fmb", "knearme")
 * @param accountsIndex - Accounts index data
 * @param env - Environment
 */
export async function storeAccountsForBusiness(
  businessAlias: string,
  accountsIndex: AccountsIndex,
  env: Env
): Promise<void> {
  await setInCache(
    `${CACHE_PREFIX.ACCOUNTS}:${businessAlias}`,
    {
      ...accountsIndex,
      business_alias: businessAlias,
      updated_at: new Date().toISOString(),
    },
    CACHE_TTL.ACCOUNTS,
    env
  );
}

/**
 * Get accounts index for a specific business
 * Includes legacy fallback for 'default' business alias
 *
 * @param businessAlias - Business alias (e.g., "fmb", "knearme")
 * @param env - Environment
 * @returns AccountsIndex or null
 */
export async function getAccountsForBusiness(
  businessAlias: string,
  env: Env
): Promise<AccountsIndex | null> {
  // Try the scoped key first
  const data = await getFromCache<AccountsIndex>(
    `${CACHE_PREFIX.ACCOUNTS}:${businessAlias}`,
    env
  );

  if (data) {
    return data;
  }

  // Legacy fallback: if 'default' and no accounts found, check legacy key
  if (businessAlias === 'default') {
    const legacyData = await getFromCache<AccountsIndex>(
      CACHE_PREFIX.ACCOUNTS, // Legacy key without business alias suffix
      env
    );

    if (legacyData) {
      // Migrate legacy accounts to new key format
      const migratedData: AccountsIndex = {
        ...legacyData,
        business_alias: 'default',
      };
      await storeAccountsForBusiness('default', migratedData, env);
      console.log('Migrated legacy accounts index to default business key');

      // Also create a businesses list entry for this default business
      const existingList = await getBusinessesList(env);
      if (!existingList || existingList.businesses.length === 0) {
        await storeBusinessesList(
          {
            businesses: [
              {
                alias: 'default',
                name: 'Default Business',
                connected_at: legacyData.updated_at || new Date().toISOString(),
                is_default: true,
              },
            ],
            default_business_alias: 'default',
            updated_at: new Date().toISOString(),
          },
          env
        );
        console.log('Created businesses list for migrated default business');
      }

      return migratedData;
    }
  }

  return null;
}

/**
 * Store master businesses list
 *
 * @param businessesList - Master list of all connected businesses
 * @param env - Environment
 */
export async function storeBusinessesList(
  businessesList: BusinessesList,
  env: Env
): Promise<void> {
  await setInCache(
    CACHE_PREFIX.BUSINESSES,
    {
      ...businessesList,
      updated_at: new Date().toISOString(),
    },
    CACHE_TTL.ACCOUNTS, // Same TTL as accounts (1 day)
    env
  );
}

/**
 * Get master businesses list
 *
 * @param env - Environment
 * @returns BusinessesList or null
 */
export async function getBusinessesList(
  env: Env
): Promise<BusinessesList | null> {
  return await getFromCache<BusinessesList>(CACHE_PREFIX.BUSINESSES, env);
}

/**
 * Resolve a business ID/alias to the canonical alias
 *
 * Returns the alias if found, or falls back to default business.
 * Used to normalize business_id param to a consistent alias.
 *
 * @param businessId - Business ID or alias to resolve (optional)
 * @param env - Environment
 * @returns Resolved alias or undefined if no businesses configured
 */
export async function resolveBusinessAlias(
  businessId: string | undefined,
  env: Env
): Promise<string | undefined> {
  const businessesList = await getBusinessesList(env);

  // No businesses configured yet
  if (!businessesList || businessesList.businesses.length === 0) {
    return undefined;
  }

  // If businessId provided, try to find matching business
  if (businessId) {
    const found = businessesList.businesses.find(
      (b) => b.alias === businessId || b.business_manager_id === businessId
    );
    if (found) {
      return found.alias;
    }
    // businessId provided but not found - still return it (let caller handle error)
    return businessId;
  }

  // No businessId provided, return default
  return businessesList.default_business_alias;
}
