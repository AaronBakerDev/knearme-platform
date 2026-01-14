/**
 * OAuth Token Issuer.
 *
 * Issues JWT access tokens for authenticated contractors to use with the MCP server.
 * Tokens are signed with ECC P-256 (ES256) private key for asymmetric verification.
 *
 * @see /docs/chatgpt-apps-sdk/AUTH_STATE_SECURITY.md
 * @see /src/lib/mcp/token-validator.ts - Validates tokens issued here
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

// ECC P-256 private key for signing (ES256 algorithm)
const JWT_PRIVATE_KEY = process.env.JWT_PRIVATE_KEY || '';

// Cache the imported key to avoid re-parsing on every call
let privateKeyCache: CryptoKey | null = null;

/**
 * Get the private key for signing, with caching.
 */
async function getPrivateKey(): Promise<CryptoKey> {
  if (privateKeyCache) return privateKeyCache;

  if (!JWT_PRIVATE_KEY) {
    throw new Error('JWT_PRIVATE_KEY not configured');
  }

  privateKeyCache = await jose.importPKCS8(JWT_PRIVATE_KEY, 'ES256');
  return privateKeyCache;
}

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
  const privateKey = await getPrivateKey();

  const { expiresIn = 3600 } = options;
  const now = Math.floor(Date.now() / 1000);

  const token = await new jose.SignJWT({
    sub: userId,
    contractor_id: contractorId,
    email,
  })
    .setProtectedHeader({ alg: 'ES256' })
    .setIssuedAt(now)
    .setExpirationTime(now + expiresIn)
    .setIssuer('knearme-portfolio')
    .setAudience('knearme-mcp-server')
    .sign(privateKey);

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
  const privateKey = await getPrivateKey();

  const { expiresIn = 7 * 24 * 3600 } = options; // 7 days default
  const now = Math.floor(Date.now() / 1000);

  const token = await new jose.SignJWT({
    sub: userId,
    contractor_id: contractorId,
    type: 'refresh',
  })
    .setProtectedHeader({ alg: 'ES256' })
    .setIssuedAt(now)
    .setExpirationTime(now + expiresIn)
    .setIssuer('knearme-portfolio')
    .setAudience('knearme-mcp-server')
    .sign(privateKey);

  return token;
}

/**
 * Decode and verify a refresh token.
 *
 * @param token - The refresh token to verify
 * @returns Decoded token payload or null if invalid
 */
// ECC P-256 public key for verification (ES256 algorithm)
const JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY || '';

// Cache the imported public key
let publicKeyCache: CryptoKey | null = null;

/**
 * Get the public key for verification, with caching.
 */
async function getPublicKey(): Promise<CryptoKey> {
  if (publicKeyCache) return publicKeyCache;

  if (!JWT_PUBLIC_KEY) {
    throw new Error('JWT_PUBLIC_KEY not configured');
  }

  publicKeyCache = await jose.importSPKI(JWT_PUBLIC_KEY, 'ES256');
  return publicKeyCache;
}

export async function verifyRefreshToken(
  token: string
): Promise<{ sub: string; contractor_id: string } | null> {
  try {
    const publicKey = await getPublicKey();
    const { payload } = await jose.jwtVerify(token, publicKey, {
      algorithms: ['ES256'],
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
