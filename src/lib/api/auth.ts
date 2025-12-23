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
import type { Contractor } from '@/types/database';

// JWT secret for MCP token validation (same as Supabase JWT secret)
// In development, falls back to a test secret for local testing
const DEV_JWT_SECRET = 'dev-test-secret-32-chars-minimum';
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET ||
  (process.env.NODE_ENV !== 'production' ? DEV_JWT_SECRET : '');

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: contractor, error: profileError } = await (supabase as any)
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
  if (!JWT_SECRET) {
    console.error('[Auth] JWT_SECRET not configured for Bearer token validation');
    return {
      type: 'UNAUTHORIZED',
      message: 'Server configuration error.',
    };
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: ['HS256'],
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: contractor, error } = await (supabase as any)
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
    console.error('[Auth] Bearer token validation error:', err);
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
