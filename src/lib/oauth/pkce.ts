/**
 * PKCE (Proof Key for Code Exchange) helpers for OAuth 2.1.
 *
 * Implements server-side PKCE verification for the authorization code flow.
 * ChatGPT sends the code_challenge during authorization and code_verifier
 * during token exchange.
 *
 * @see /docs/chatgpt-apps-sdk/AUTH_STATE_SECURITY.md
 */

import { createHash } from 'crypto';

/**
 * Supported code challenge methods.
 * OAuth 2.1 requires S256; plain is supported for backwards compatibility.
 */
export type CodeChallengeMethod = 'S256' | 'plain';

/**
 * Verify a PKCE code_verifier against the stored code_challenge.
 *
 * @param codeVerifier - The code_verifier sent during token exchange
 * @param codeChallenge - The code_challenge stored during authorization
 * @param method - The code_challenge_method (S256 or plain)
 * @returns true if verification passes
 *
 * @example
 * ```typescript
 * // During token exchange
 * const isValid = verifyCodeVerifier(
 *   req.body.code_verifier,
 *   storedAuthCode.code_challenge,
 *   storedAuthCode.code_challenge_method
 * );
 * ```
 */
export function verifyCodeVerifier(
  codeVerifier: string,
  codeChallenge: string,
  method: CodeChallengeMethod = 'S256'
): boolean {
  if (!codeVerifier || !codeChallenge) {
    return false;
  }

  if (method === 'plain') {
    return codeVerifier === codeChallenge;
  }

  // S256: BASE64URL(SHA256(code_verifier)) == code_challenge
  const hash = createHash('sha256').update(codeVerifier).digest();
  const computed = base64UrlEncode(hash);

  return computed === codeChallenge;
}

/**
 * Generate a code_challenge from a code_verifier (for testing).
 *
 * @param codeVerifier - The random code verifier string
 * @param method - The code_challenge_method (S256 or plain)
 * @returns The computed code_challenge
 */
export function generateCodeChallenge(
  codeVerifier: string,
  method: CodeChallengeMethod = 'S256'
): string {
  if (method === 'plain') {
    return codeVerifier;
  }

  const hash = createHash('sha256').update(codeVerifier).digest();
  return base64UrlEncode(hash);
}

/**
 * Validate a code_verifier format.
 *
 * Per RFC 7636, code_verifier must be:
 * - 43-128 characters long
 * - Only contain [A-Z], [a-z], [0-9], "-", ".", "_", "~"
 *
 * @param codeVerifier - The code_verifier to validate
 * @returns true if valid format
 */
export function isValidCodeVerifier(codeVerifier: string): boolean {
  if (!codeVerifier || codeVerifier.length < 43 || codeVerifier.length > 128) {
    return false;
  }

  // RFC 7636 allowed characters: [A-Za-z0-9\-._~]
  const validCharsRegex = /^[A-Za-z0-9\-._~]+$/;
  return validCharsRegex.test(codeVerifier);
}

/**
 * Base64 URL encode a buffer (no padding).
 *
 * @param buffer - The buffer to encode
 * @returns Base64 URL encoded string without padding
 */
function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
