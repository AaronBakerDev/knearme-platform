/**
 * OAuth Token Issuer.
 *
 * Issues JWT access tokens for authenticated contractors to use with the MCP server.
 * Tokens are signed with the Supabase JWT secret for easy validation.
 *
 * @see /docs/chatgpt-apps-sdk/AUTH_STATE_SECURITY.md
 * @see /mcp-server/src/auth/token-validator.ts - Validates tokens issued here
 */

import * as jose from 'jose';

/**
 * Token payload structure.
 * The MCP server expects these claims for authorization.
 */
export interface TokenPayload {
  /** Subject (Supabase user ID) */
  sub: string;
  /** Contractor ID for authorization */
  contractor_id: string;
  /** Contractor email */
  email: string;
  /** Issued at (Unix timestamp) */
  iat: number;
  /** Expiration (Unix timestamp) */
  exp: number;
}

/**
 * Options for token generation.
 */
export interface TokenOptions {
  /** Token expiration in seconds (default: 3600 = 1 hour) */
  expiresIn?: number;
}

// JWT secret from environment (same as MCP server uses for validation)
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET || '';

/**
 * Issue an access token for a contractor.
 *
 * The token includes the contractor_id claim which the MCP server uses
 * to authorize tool calls.
 *
 * @param userId - The Supabase user ID (auth.users.id)
 * @param contractorId - The contractor ID (contractors.id)
 * @param email - The contractor's email
 * @param options - Token options
 * @returns Signed JWT access token
 *
 * @throws Error if JWT_SECRET is not configured
 *
 * @example
 * ```typescript
 * const token = await issueAccessToken(
 *   user.id,
 *   contractor.id,
 *   user.email,
 *   { expiresIn: 3600 }
 * );
 * ```
 */
export async function issueAccessToken(
  userId: string,
  contractorId: string,
  email: string,
  options: TokenOptions = {}
): Promise<string> {
  if (!JWT_SECRET) {
    throw new Error('SUPABASE_JWT_SECRET not configured');
  }

  const { expiresIn = 3600 } = options;
  const now = Math.floor(Date.now() / 1000);

  const secret = new TextEncoder().encode(JWT_SECRET);

  const token = await new jose.SignJWT({
    sub: userId,
    contractor_id: contractorId,
    email,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + expiresIn)
    .setIssuer('knearme-portfolio')
    .setAudience('knearme-mcp-server')
    .sign(secret);

  return token;
}

/**
 * Issue a refresh token for a contractor.
 *
 * Refresh tokens have a longer lifetime and can be exchanged for new
 * access tokens without re-authentication.
 *
 * @param userId - The Supabase user ID
 * @param contractorId - The contractor ID
 * @param options - Token options (default: 7 days)
 * @returns Signed JWT refresh token
 */
export async function issueRefreshToken(
  userId: string,
  contractorId: string,
  options: TokenOptions = {}
): Promise<string> {
  if (!JWT_SECRET) {
    throw new Error('SUPABASE_JWT_SECRET not configured');
  }

  const { expiresIn = 7 * 24 * 3600 } = options; // 7 days default
  const now = Math.floor(Date.now() / 1000);

  const secret = new TextEncoder().encode(JWT_SECRET);

  const token = await new jose.SignJWT({
    sub: userId,
    contractor_id: contractorId,
    type: 'refresh',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + expiresIn)
    .setIssuer('knearme-portfolio')
    .setAudience('knearme-mcp-server')
    .sign(secret);

  return token;
}

/**
 * Decode and verify a refresh token.
 *
 * @param token - The refresh token to verify
 * @returns Decoded token payload or null if invalid
 */
export async function verifyRefreshToken(
  token: string
): Promise<{ sub: string; contractor_id: string } | null> {
  if (!JWT_SECRET) {
    return null;
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: ['HS256'],
      audience: 'knearme-mcp-server',
      issuer: 'knearme-portfolio',
    });

    if (payload.type !== 'refresh') {
      return null;
    }

    return {
      sub: payload.sub as string,
      contractor_id: payload.contractor_id as string,
    };
  } catch {
    return null;
  }
}
