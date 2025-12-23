/**
 * OAuth Token Validator.
 *
 * Validates access tokens issued by the KnearMe OAuth server.
 * Tokens are JWTs signed with the Supabase JWT secret.
 *
 * @see /docs/chatgpt-apps-sdk/AUTH_STATE_SECURITY.md
 */
import type { TokenPayload } from '../types/mcp.js';
/**
 * Token validation result.
 */
export type TokenValidationResult = {
    success: true;
    payload: TokenPayload;
} | {
    success: false;
    error: string;
};
/**
 * Validate an access token.
 *
 * @param token - The JWT access token to validate
 * @returns Validation result with payload or error
 */
export declare function validateToken(token: string): Promise<TokenValidationResult>;
/**
 * Check if a token is expired or will expire soon.
 *
 * @param payload - The token payload
 * @param bufferSeconds - How many seconds before expiry to consider "expiring soon"
 * @returns true if token is expired or expiring soon
 */
export declare function isTokenExpiring(payload: TokenPayload, bufferSeconds?: number): boolean;
/**
 * DEV MODE: Create a test token for development.
 * Only use this in development environments!
 */
export declare function createDevToken(contractorId: string, email: string): Promise<string>;
//# sourceMappingURL=token-validator.d.ts.map