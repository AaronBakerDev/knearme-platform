/**
 * OAuth Token Validator for MCP endpoint.
 *
 * Validates access tokens issued by the KnearMe OAuth server.
 * Tokens are JWTs signed with ECC P-256 (ES256) and verified with the public key.
 *
 * @see /docs/chatgpt-apps-sdk/AUTH_STATE_SECURITY.md
 */

import * as jose from 'jose';
import type { TokenPayload } from './types';
import { logger } from '@/lib/logging';

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

export type TokenValidationResult =
  | { success: true; payload: TokenPayload }
  | { success: false; error: string };

/**
 * Validate an access token.
 */
export async function validateToken(token: string): Promise<TokenValidationResult> {
  if (!JWT_PUBLIC_KEY) {
    logger.error('[MCP Token Validator] JWT_PUBLIC_KEY not configured');
    return { success: false, error: 'Server configuration error' };
  }

  try {
    const publicKey = await getPublicKey();
    const { payload } = await jose.jwtVerify(token, publicKey, {
      algorithms: ['ES256'],
      audience: 'knearme-mcp-server',
      issuer: 'knearme-portfolio',
    });

    if (!payload.sub) {
      return { success: false, error: 'Token missing subject claim' };
    }

    if (!payload.contractor_id) {
      return { success: false, error: 'Token missing contractor_id claim' };
    }

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

    logger.error('[MCP Token Validator] Unexpected error', { error: err });
    return { success: false, error: 'Token validation failed' };
  }
}

// ECC P-256 private key for signing (only used in dev mode)
const JWT_PRIVATE_KEY = process.env.JWT_PRIVATE_KEY || '';

// Cache the imported private key
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
 * DEV MODE: Create a test token for development.
 */
export async function createDevToken(contractorId: string, email: string): Promise<string> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot create dev tokens in production');
  }

  const privateKey = await getPrivateKey();
  const now = Math.floor(Date.now() / 1000);

  const token = await new jose.SignJWT({
    sub: `dev-user-${contractorId}`,
    contractor_id: contractorId,
    email,
  })
    .setProtectedHeader({ alg: 'ES256' })
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .setIssuer('knearme-portfolio')
    .setAudience('knearme-mcp-server')
    .sign(privateKey);

  return token;
}
