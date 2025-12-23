/**
 * OAuth 2.1 Library.
 *
 * Implements OAuth 2.1 with PKCE for ChatGPT Apps SDK integration.
 * This library provides helpers for the authorization and token endpoints.
 *
 * @see /docs/chatgpt-apps-sdk/AUTH_STATE_SECURITY.md
 */

export { verifyCodeVerifier, generateCodeChallenge, isValidCodeVerifier } from './pkce';
export type { CodeChallengeMethod } from './pkce';

export {
  issueAccessToken,
  issueRefreshToken,
  verifyRefreshToken,
} from './token-issuer';
export type { TokenPayload, TokenOptions } from './token-issuer';

export {
  storeAuthorizationCode,
  consumeAuthorizationCode,
  generateAuthorizationCode,
  cleanupExpiredCodes,
} from './auth-code-store';
export type { AuthorizationCode, AuthorizationCodeInput } from './auth-code-store';
