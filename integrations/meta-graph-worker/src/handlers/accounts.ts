/**
 * Account Management Handlers
 *
 * Handles OAuth flow and account listing operations.
 * Supports multi-business management via business_alias parameter.
 *
 * @module handlers/accounts
 */

import type { Env, MetaResponse, BusinessesList } from '../types';
import { getGraphApiUrl } from '../types';
import {
  generateOAuthUrl,
  completeOAuthFlow,
  getStoredAccounts,
  checkOAuthStatus,
  resolveBusinessAlias,
  getAccessToken,
} from '../auth';
import {
  CACHE_PREFIX,
  deleteFromCache,
  getAccountsForBusiness,
  getBusinessesList,
  storeBusinessesList,
} from '../utils/cache';

/**
 * State value stored in KV for CSRF validation
 * Includes business_alias for multi-business OAuth flow
 */
interface OAuthStateValue {
  status: 'pending';
  business_alias?: string;
}

/**
 * Handle oauth_status action
 * Check current OAuth connection status
 */
export async function handleOAuthStatus(env: Env): Promise<MetaResponse> {
  try {
    const status = await checkOAuthStatus(env);

    return {
      success: true,
      data: status,
      message: status.connected
        ? `Connected with ${status.accounts_count} accounts`
        : 'Not connected - OAuth required',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to check OAuth status',
    };
  }
}

/**
 * Handle oauth_connect action
 * Generate OAuth URL for authorization
 *
 * Supports multi-business: pass businessAlias to scope the OAuth to a specific business.
 * The businessAlias is embedded in the state token and stored in KV for callback retrieval.
 *
 * @param env - Environment configuration
 * @param businessAlias - Optional business alias (e.g., "fmb", "knearme")
 */
export async function handleOAuthConnect(
  env: Env,
  businessAlias?: string
): Promise<MetaResponse> {
  try {
    // Generate OAuth URL with optional business alias embedded in state
    const { url, state } = generateOAuthUrl(env, businessAlias);

    // Store state with business_alias for CSRF validation and callback retrieval
    const stateValue: OAuthStateValue = {
      status: 'pending',
      business_alias: businessAlias,
    };
    await env.META_CACHE.put(`oauth_state:${state}`, JSON.stringify(stateValue), {
      expirationTtl: 600, // 10 minutes
    });

    return {
      success: true,
      data: {
        auth_url: url,
        state,
        business_alias: businessAlias,
        instructions: [
          '1. Open the auth_url in a browser',
          '2. Log in with Facebook and grant permissions',
          '3. After redirect, tokens will be stored automatically',
          '4. Use oauth_verify to confirm connection',
          businessAlias
            ? `5. Accounts will be stored under business: ${businessAlias}`
            : '5. Accounts will be stored under default business',
        ],
      },
      message: businessAlias
        ? `OAuth URL generated for business: ${businessAlias}`
        : 'OAuth URL generated. Open in browser to authorize.',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to generate OAuth URL',
    };
  }
}

/**
 * Handle OAuth callback (from Facebook redirect)
 *
 * Extracts businessAlias from state (format: "uuid:alias" or just "uuid")
 * and also checks the stored oauth_state KV value for business_alias.
 *
 * @param code - Authorization code
 * @param state - CSRF state token (may contain business alias)
 * @param env - Environment
 */
export async function handleOAuthCallback(
  code: string,
  state: string | null,
  env: Env
): Promise<MetaResponse> {
  try {
    let businessAlias: string | undefined;

    // Extract businessAlias from state parameter (format: "uuid:alias")
    if (state) {
      const parts = state.split(':');
      if (parts.length >= 2) {
        // State format is "uuid:businessAlias"
        businessAlias = parts.slice(1).join(':'); // Handle aliases with colons
      }

      // Also check stored state value for business_alias
      const storedStateRaw = await env.META_CACHE.get(`oauth_state:${state}`);
      if (storedStateRaw) {
        try {
          const storedState = JSON.parse(storedStateRaw) as OAuthStateValue;
          // Prefer stored business_alias if present (more reliable)
          if (storedState.business_alias) {
            businessAlias = storedState.business_alias;
          }
        } catch {
          // Legacy format: stored as plain string 'pending'
          console.log('Legacy oauth_state format detected');
        }
        // Clean up used state
        await env.META_CACHE.delete(`oauth_state:${state}`);
      } else {
        console.warn('Invalid or expired OAuth state');
        // Don't fail - state validation is optional
      }
    }

    // Complete OAuth flow with business alias
    const accountsIndex = await completeOAuthFlow(
      code,
      env,
      businessAlias || 'default'
    );

    return {
      success: true,
      data: {
        accounts: accountsIndex.accounts.map((a) => ({
          id: a.id,
          name: a.name,
          type: a.type,
          category: a.category,
          username: a.username,
        })),
        total_accounts: accountsIndex.accounts.length,
        pages: accountsIndex.accounts.filter((a) => a.type === 'page').length,
        instagram_accounts: accountsIndex.accounts.filter(
          (a) => a.type === 'instagram'
        ).length,
        business_alias: accountsIndex.business_alias,
      },
      message: `Successfully connected ${accountsIndex.accounts.length} accounts for business: ${accountsIndex.business_alias || 'default'}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'OAuth callback failed',
    };
  }
}

/**
 * Handle oauth_verify action
 * Verify OAuth connection is working
 */
export async function handleOAuthVerify(env: Env): Promise<MetaResponse> {
  try {
    const accountsIndex = await getStoredAccounts(env);

    if (!accountsIndex || accountsIndex.accounts.length === 0) {
      return {
        success: false,
        error: 'No accounts connected',
        message: 'Run oauth_connect first to authorize',
      };
    }

    return {
      success: true,
      data: {
        verified: true,
        accounts_count: accountsIndex.accounts.length,
        default_page_id: accountsIndex.default_page_id,
        default_ig_id: accountsIndex.default_ig_id,
        last_updated: accountsIndex.updated_at,
      },
      message: 'OAuth verified - connection is active',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to verify OAuth',
    };
  }
}

/**
 * Handle list_accounts action
 * List all connected Facebook Pages and Instagram accounts for a business.
 *
 * @param env - Environment configuration
 * @param businessId - Optional business ID/alias to scope the query
 */
export async function handleListAccounts(
  env: Env,
  businessId?: string
): Promise<MetaResponse> {
  try {
    // Resolve business alias (falls back to default if not provided)
    const businessAlias = await resolveBusinessAlias(businessId, env);

    // Get accounts for the resolved business
    const accountsIndex = await getAccountsForBusiness(businessAlias, env);

    if (!accountsIndex) {
      return {
        success: false,
        error: 'No accounts found',
        message: businessId
          ? `No accounts found for business: ${businessId}. Run oauth_connect with business_alias to authorize.`
          : 'Run oauth_connect to authorize and discover accounts',
      };
    }

    return {
      success: true,
      data: {
        accounts: accountsIndex.accounts,
        default_page_id: accountsIndex.default_page_id,
        default_ig_id: accountsIndex.default_ig_id,
        updated_at: accountsIndex.updated_at,
        business_alias: accountsIndex.business_alias || businessAlias,
      },
      message: `Found ${accountsIndex.accounts.length} connected accounts for business: ${accountsIndex.business_alias || businessAlias || 'default'}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to list accounts',
    };
  }
}

/**
 * Handle list_businesses action
 * List all connected businesses (multi-business management)
 *
 * @param env - Environment configuration
 */
export async function handleListBusinesses(env: Env): Promise<MetaResponse> {
  try {
    const businessesList: BusinessesList | null = await getBusinessesList(env);

    if (!businessesList || businessesList.businesses.length === 0) {
      return {
        success: true,
        data: {
          businesses: [],
          total_count: 0,
          default_business: null,
        },
        message:
          'No businesses connected. Use oauth_connect with business_alias param to connect a new business.',
      };
    }

    return {
      success: true,
      data: {
        businesses: businessesList.businesses.map((b) => ({
          alias: b.alias,
          name: b.name,
          business_manager_id: b.business_manager_id,
          connected_at: b.connected_at,
          is_default: b.is_default || b.alias === businessesList.default_business_alias,
        })),
        total_count: businessesList.businesses.length,
        default_business: businessesList.default_business_alias,
        updated_at: businessesList.updated_at,
      },
      message: `Found ${businessesList.businesses.length} connected business(es)`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to list businesses',
    };
  }
}

/**
 * Handle set_default_business action
 * Update the default business alias for API calls
 *
 * @param env - Environment configuration
 * @param businessId - Business alias or Business Manager ID
 */
export async function handleSetDefaultBusiness(
  env: Env,
  businessId: string
): Promise<MetaResponse> {
  try {
    if (!businessId) {
      throw new Error(
        'business_id or business_alias is required for set_default_business'
      );
    }

    const businessesList = await getBusinessesList(env);
    if (!businessesList || businessesList.businesses.length === 0) {
      return {
        success: false,
        error: 'No businesses connected',
        message: 'Use oauth_connect with business_alias to connect a business first',
      };
    }

    const match = businessesList.businesses.find(
      (b) => b.alias === businessId || b.business_manager_id === businessId
    );

    if (!match) {
      return {
        success: false,
        error: 'Business not found',
        message: `No business found for identifier: ${businessId}`,
      };
    }

    const updatedBusinesses = businessesList.businesses.map((business) => ({
      ...business,
      is_default: business.alias === match.alias,
    }));

    await storeBusinessesList(
      {
        ...businessesList,
        businesses: updatedBusinesses,
        default_business_alias: match.alias,
      },
      env
    );

    return {
      success: true,
      data: {
        default_business: match.alias,
        businesses: updatedBusinesses,
      },
      message: `Default business set to ${match.alias}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to set default business',
    };
  }
}

/**
 * Handle debug_token action
 * Debug a page's access token to see granted permissions
 *
 * Uses the Meta debug_token endpoint to inspect token permissions.
 * @see https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-info
 *
 * @param env - Environment configuration
 * @param pageId - Page ID to debug token for
 */
export async function handleDebugToken(
  env: Env,
  pageId: string
): Promise<MetaResponse> {
  try {
    if (!pageId) {
      return {
        success: false,
        error: 'page_id is required',
        message: 'Provide a page_id to debug its access token',
      };
    }

    // Get the page token
    const pageToken = await getAccessToken(pageId, env);

    // Create app access token (app_id|app_secret)
    const appAccessToken = `${env.FB_APP_ID}|${env.FB_APP_SECRET}`;

    // Call the debug_token endpoint
    const url = `${getGraphApiUrl(env.GRAPH_API_VERSION)}/debug_token`;
    const params = new URLSearchParams({
      input_token: pageToken,
      access_token: appAccessToken,
    });

    const response = await fetch(`${url}?${params.toString()}`);
    const data = (await response.json()) as {
      data?: {
        app_id?: string;
        type?: string;
        application?: string;
        data_access_expires_at?: number;
        expires_at?: number;
        is_valid?: boolean;
        scopes?: string[];
        granular_scopes?: Array<{
          scope: string;
          target_ids?: string[];
        }>;
        user_id?: string;
        error?: {
          code: number;
          message: string;
        };
      };
      error?: {
        message: string;
        code: number;
      };
    };

    if (data.error) {
      return {
        success: false,
        error: data.error.message,
        message: 'Failed to debug token',
      };
    }

    if (data.data?.error) {
      return {
        success: false,
        error: data.data.error.message,
        message: 'Token inspection failed',
      };
    }

    return {
      success: true,
      data: {
        page_id: pageId,
        token_type: data.data?.type,
        app_id: data.data?.app_id,
        application: data.data?.application,
        is_valid: data.data?.is_valid,
        expires_at: data.data?.expires_at,
        data_access_expires_at: data.data?.data_access_expires_at,
        scopes: data.data?.scopes || [],
        granular_scopes: data.data?.granular_scopes || [],
        user_id: data.data?.user_id,
      },
      message: `Token debug info for page ${pageId}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to debug token',
    };
  }
}
