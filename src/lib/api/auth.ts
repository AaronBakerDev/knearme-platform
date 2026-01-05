/**
 * Authentication utilities for API routes.
 * Provides reusable auth guards and contractor lookup.
 *
 * Supports two auth methods:
 * 1. Supabase session cookies (web app)
 * 2. Bearer JWT tokens with contractor_id claim (MCP/ChatGPT apps)
 *
 * @see /docs/06-security/threat-model.md
 * @see /docs/chatgpt-apps-sdk/AUTH_STATE_SECURITY.md
 */

import { headers } from 'next/headers';
import * as jose from 'jose';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logging';
import type { Business, Contractor } from '@/types/database';

// ECC P-256 public key for MCP token verification (ES256 algorithm)
const JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY || '';

// Cache the imported public key
let publicKeyCache: CryptoKey | null = null;

/**
 * Get the public key for verification, with caching.
 */
async function getPublicKey(): Promise<CryptoKey | null> {
  if (publicKeyCache) return publicKeyCache;

  if (!JWT_PUBLIC_KEY) {
    return null;
  }

  try {
    publicKeyCache = await jose.importSPKI(JWT_PUBLIC_KEY, 'ES256');
    return publicKeyCache;
  } catch {
    logger.error('[Auth] Failed to import JWT_PUBLIC_KEY');
    return null;
  }
}

export interface AuthResult {
  user: {
    id: string;
    email: string;
  };
  contractor: Contractor;
  /** Auth method: 'session' (web app) or 'bearer' (MCP/ChatGPT) */
  authMethod: 'session' | 'bearer';
}

export interface AuthError {
  type: 'UNAUTHORIZED' | 'PROFILE_INCOMPLETE';
  message: string;
}

/**
 * Verify the user is authenticated and has a complete contractor profile.
 * Returns the user and contractor data, or an error.
 *
 * @example
 * const auth = await requireAuth();
 * if ('type' in auth) {
 *   return apiError(auth.type, auth.message);
 * }
 * const { user, contractor } = auth;
 */
export async function requireAuth(): Promise<AuthResult | AuthError> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      type: 'UNAUTHORIZED',
      message: 'Authentication required. Please log in.',
    };
  }

  // Get contractor profile
  const { data: contractor, error: profileError } = await supabase
    .from('contractors')
    .select('*')
    .eq('auth_user_id', user.id)
    .single();

  // Type assertion for contractor
  const contractorData = contractor as Contractor | null;

  if (profileError || !contractorData) {
    return {
      type: 'UNAUTHORIZED',
      message: 'Contractor profile not found.',
    };
  }

  // Check profile completeness
  if (!contractorData.business_name || !contractorData.city) {
    return {
      type: 'PROFILE_INCOMPLETE',
      message: 'Please complete your profile setup.',
    };
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? '',
    },
    contractor: contractorData,
    authMethod: 'session' as const,
  };
}

/**
 * Check if auth result is an error.
 */
export function isAuthError(result: AuthResult | AuthError): result is AuthError {
  return 'type' in result;
}

/**
 * Get the appropriate Supabase client based on auth method.
 * - Session auth: Use regular client (RLS works with session)
 * - Bearer auth: Use admin client (no session, need to bypass RLS)
 */
export async function getAuthClient(authResult: AuthResult) {
  if (authResult.authMethod === 'bearer') {
    // Bearer auth has no Supabase session, use admin client
    return createAdminClient();
  }
  // Session auth, use regular client with RLS
  return createClient();
}

// ============================================================================
// BEARER TOKEN AUTH (for MCP/ChatGPT Apps)
// ============================================================================

/**
 * JWT payload structure for MCP tokens.
 */
interface McpTokenPayload {
  sub: string;
  contractor_id: string;
  email?: string;
}

/**
 * Validate a Bearer JWT token and return the contractor.
 * Used by MCP server and ChatGPT apps for API authentication.
 *
 * @param token - JWT access token with contractor_id claim
 * @returns AuthResult if valid, AuthError if invalid
 */
async function validateBearerToken(token: string): Promise<AuthResult | AuthError> {
  const publicKey = await getPublicKey();
  if (!publicKey) {
    logger.error('[Auth] JWT_PUBLIC_KEY not configured for Bearer token validation');
    return {
      type: 'UNAUTHORIZED',
      message: 'Server configuration error.',
    };
  }

  try {
    const { payload } = await jose.jwtVerify(token, publicKey, {
      algorithms: ['ES256'],
      audience: 'knearme-mcp-server',
      issuer: 'knearme-portfolio',
    });

    const mcpPayload = payload as unknown as McpTokenPayload;

    if (!mcpPayload.contractor_id) {
      return {
        type: 'UNAUTHORIZED',
        message: 'Invalid token: missing contractor_id.',
      };
    }

    // Use admin client to bypass RLS and lookup contractor by ID
    const supabase = createAdminClient();
    const { data: contractor, error } = await supabase
      .from('contractors')
      .select('*')
      .eq('id', mcpPayload.contractor_id)
      .single();

    if (error || !contractor) {
      return {
        type: 'UNAUTHORIZED',
        message: 'Contractor not found.',
      };
    }

    const contractorData = contractor as Contractor;

    return {
      user: {
        id: mcpPayload.sub,
        email: mcpPayload.email || '',
      },
      contractor: contractorData,
      authMethod: 'bearer' as const,
    };
  } catch (err) {
    if (err instanceof jose.errors.JWTExpired) {
      return { type: 'UNAUTHORIZED', message: 'Token expired.' };
    }
    if (err instanceof jose.errors.JWTInvalid || err instanceof jose.errors.JWSSignatureVerificationFailed) {
      return { type: 'UNAUTHORIZED', message: 'Invalid token.' };
    }
    logger.error('[Auth] Bearer token validation error', { error: err });
    return { type: 'UNAUTHORIZED', message: 'Token validation failed.' };
  }
}

/**
 * Unified auth that tries Bearer token first, then falls back to Supabase session.
 * This enables both MCP/ChatGPT apps and web app to use the same API routes.
 *
 * @example
 * const auth = await requireAuthUnified();
 * if ('type' in auth) {
 *   return apiError(auth.type, auth.message);
 * }
 */
export async function requireAuthUnified(): Promise<AuthResult | AuthError> {
  // Try Bearer token first (for MCP/ChatGPT apps)
  const headersList = await headers();
  const authHeader = headersList.get('authorization');

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    return validateBearerToken(token);
  }

  // Fall back to Supabase session (for web app)
  return requireAuth();
}

// ============================================================================
// BUSINESS-AWARE AUTH (Primary - Use These for New Code)
// ============================================================================

/**
 * Auth result using the primary Business type.
 * Use this for new code instead of AuthResult.
 */
export interface BusinessAuthResult {
  user: {
    id: string;
    email: string;
  };
  business: Business;
  /** Auth method: 'session' (web app) or 'bearer' (MCP/ChatGPT) */
  authMethod: 'session' | 'bearer';
}

/**
 * Verify the user is authenticated and has a complete business profile.
 * Returns the user and business data, or an error.
 *
 * This is the primary auth function for new code - queries the `businesses` table.
 *
 * @example
 * const auth = await requireAuthBusiness();
 * if ('type' in auth) {
 *   return apiError(auth.type, auth.message);
 * }
 * const { user, business } = auth;
 */
export async function requireAuthBusiness(): Promise<BusinessAuthResult | AuthError> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      type: 'UNAUTHORIZED',
      message: 'Authentication required. Please log in.',
    };
  }

  // Get business profile from businesses table
  const { data: business, error: profileError } = await supabase
    .from('businesses')
    .select('*')
    .eq('auth_user_id', user.id)
    .single();

  // Type assertion for business
  const businessData = business as Business | null;

  if (profileError || !businessData) {
    return {
      type: 'UNAUTHORIZED',
      message: 'Business profile not found.',
    };
  }

  // Check profile completeness (using Business fields)
  if (!businessData.name) {
    return {
      type: 'PROFILE_INCOMPLETE',
      message: 'Please complete your profile setup.',
    };
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? '',
    },
    business: businessData,
    authMethod: 'session' as const,
  };
}

/**
 * Check if auth result is an error (works for both AuthResult and BusinessAuthResult).
 */
export function isBusinessAuthError(
  result: BusinessAuthResult | AuthError
): result is AuthError {
  return 'type' in result;
}

/**
 * JWT payload structure for MCP tokens (business-aware).
 */
interface McpBusinessTokenPayload {
  sub: string;
  business_id: string;
  email?: string;
}

/**
 * Validate a Bearer JWT token and return the business.
 * Used by MCP server and ChatGPT apps for API authentication.
 *
 * @param token - JWT access token with business_id claim
 * @returns BusinessAuthResult if valid, AuthError if invalid
 */
async function validateBearerTokenBusiness(
  token: string
): Promise<BusinessAuthResult | AuthError> {
  const publicKey = await getPublicKey();
  if (!publicKey) {
    logger.error('[Auth] JWT_PUBLIC_KEY not configured for Bearer token validation');
    return {
      type: 'UNAUTHORIZED',
      message: 'Server configuration error.',
    };
  }

  try {
    const { payload } = await jose.jwtVerify(token, publicKey, {
      algorithms: ['ES256'],
      audience: 'knearme-mcp-server',
      issuer: 'knearme-portfolio',
    });

    const mcpPayload = payload as unknown as McpBusinessTokenPayload;

    // Support both business_id (new) and contractor_id (legacy) claims
    const businessId =
      mcpPayload.business_id ||
      (payload as unknown as McpTokenPayload).contractor_id;

    if (!businessId) {
      return {
        type: 'UNAUTHORIZED',
        message: 'Invalid token: missing business_id.',
      };
    }

    // Use admin client to bypass RLS and lookup business by ID
    const supabase = createAdminClient();
    const { data: business, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single();

    if (error || !business) {
      return {
        type: 'UNAUTHORIZED',
        message: 'Business not found.',
      };
    }

    const businessData = business as Business;

    return {
      user: {
        id: mcpPayload.sub,
        email: mcpPayload.email || '',
      },
      business: businessData,
      authMethod: 'bearer' as const,
    };
  } catch (err) {
    if (err instanceof jose.errors.JWTExpired) {
      return { type: 'UNAUTHORIZED', message: 'Token expired.' };
    }
    if (
      err instanceof jose.errors.JWTInvalid ||
      err instanceof jose.errors.JWSSignatureVerificationFailed
    ) {
      return { type: 'UNAUTHORIZED', message: 'Invalid token.' };
    }
    logger.error('[Auth] Bearer token validation error', { error: err });
    return { type: 'UNAUTHORIZED', message: 'Token validation failed.' };
  }
}

/**
 * Unified auth that tries Bearer token first, then falls back to Supabase session.
 * Uses the Business type for new code.
 *
 * @example
 * const auth = await requireAuthUnifiedBusiness();
 * if ('type' in auth) {
 *   return apiError(auth.type, auth.message);
 * }
 * const { user, business } = auth;
 */
export async function requireAuthUnifiedBusiness(): Promise<
  BusinessAuthResult | AuthError
> {
  // Try Bearer token first (for MCP/ChatGPT apps)
  const headersList = await headers();
  const authHeader = headersList.get('authorization');

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    return validateBearerTokenBusiness(token);
  }

  // Fall back to Supabase session (for web app)
  return requireAuthBusiness();
}

/**
 * Get the appropriate Supabase client based on auth method (business-aware).
 * - Session auth: Use regular client (RLS works with session)
 * - Bearer auth: Use admin client (no session, need to bypass RLS)
 */
export async function getAuthClientBusiness(authResult: BusinessAuthResult) {
  if (authResult.authMethod === 'bearer') {
    // Bearer auth has no Supabase session, use admin client
    return createAdminClient();
  }
  // Session auth, use regular client with RLS
  return createClient();
}
