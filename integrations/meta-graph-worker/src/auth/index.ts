/**
 * Authentication Modules Index
 *
 * Re-exports all auth functions
 *
 * @module auth
 */

export * from './meta-auth';

/**
 * Validate API key authentication
 *
 * @param authHeader - Authorization header value
 * @param env - Environment configuration
 * @returns True if authenticated
 */
export function validateApiAuth(
  authHeader: string | null,
  env: { API_SECRET_KEY: string; NODE_ENV: string }
): boolean {
  // Development mode: accept any Bearer token
  if (env.NODE_ENV === 'development') {
    return authHeader?.startsWith('Bearer ') ?? false;
  }

  // Production: validate against API secret key
  if (!authHeader?.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.slice(7);
  return token === env.API_SECRET_KEY;
}
