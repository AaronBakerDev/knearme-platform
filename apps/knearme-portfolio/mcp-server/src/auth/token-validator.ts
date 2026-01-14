/**
 * OAuth Token Validator.
 *
 * Validates access tokens issued by the KnearMe OAuth server.
 * Tokens are JWTs signed with the Supabase JWT secret.
 *
 * @see /docs/chatgpt-apps-sdk/AUTH_STATE_SECURITY.md
 */

import * as jose from 'jose';
import type { TokenPayload } from '../types/mcp.js';

// JWT secret from environment (Supabase JWT secret)
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET || '';

/**
 * Token validation result.
 */
export type TokenValidationResult =
  | { success: true; payload: TokenPayload }
  | { success: false; error: string };

/**
 * Validate an access token.
 *
 * @param token - The JWT access token to validate
 * @returns Validation result with payload or error
 */
export async function validateToken(token: string): Promise<TokenValidationResult> {
  if (!JWT_SECRET) {
    console.error('[Token Validator] JWT_SECRET not configured');
    return { success: false, error: 'Server configuration error' };
  }

  try {
    // Decode and verify the JWT
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: ['HS256'],
      audience: 'knearme-mcp-server',
      issuer: 'knearme-portfolio',
    });

    // Validate required claims
    if (!payload.sub) {
      return { success: false, error: 'Token missing subject claim' };
    }

    if (!payload.contractor_id) {
      return { success: false, error: 'Token missing contractor_id claim' };
    }

    // Check expiration (jose handles this, but double-check)
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return { success: false, error: 'Token expired' };
    }

    return {
      success: true,
      payload: {
        sub: payload.sub as string,
        contractor_id: payload.contractor_id as string,
        email: (payload.email as string) || '',
        iat: payload.iat || 0,
        exp: payload.exp || 0,
      },
    };
  } catch (err) {
    if (err instanceof jose.errors.JWTExpired) {
      return { success: false, error: 'Token expired' };
    }
    if (err instanceof jose.errors.JWTInvalid) {
      return { success: false, error: 'Invalid token' };
    }
    if (err instanceof jose.errors.JWSSignatureVerificationFailed) {
      return { success: false, error: 'Token signature invalid' };
    }

    console.error('[Token Validator] Unexpected error:', err);
    return { success: false, error: 'Token validation failed' };
  }
}

/**
 * Check if a token is expired or will expire soon.
 *
 * @param payload - The token payload
 * @param bufferSeconds - How many seconds before expiry to consider "expiring soon"
 * @returns true if token is expired or expiring soon
 */
export function isTokenExpiring(payload: TokenPayload, bufferSeconds = 300): boolean {
  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now + bufferSeconds;
}

/**
 * DEV MODE: Create a test token for development.
 * Only use this in development environments!
 */
export async function createDevToken(contractorId: string, email: string): Promise<string> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot create dev tokens in production');
  }

  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }

  const secret = new TextEncoder().encode(JWT_SECRET);
  const now = Math.floor(Date.now() / 1000);

  const token = await new jose.SignJWT({
    sub: `dev-user-${contractorId}`,
    contractor_id: contractorId,
    email,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + 3600) // 1 hour
    .setIssuer('knearme-portfolio')
    .setAudience('knearme-mcp-server')
    .sign(secret);

  return token;
}
