/**
 * Authorization Code Store.
 *
 * Stores OAuth authorization codes temporarily until they're exchanged for tokens.
 * Codes are short-lived (5 minutes) and single-use.
 *
 * This implementation uses Supabase for persistence. A database table
 * `oauth_authorization_codes` is created by migration 012.
 *
 * @see /docs/chatgpt-apps-sdk/AUTH_STATE_SECURITY.md
 */

import { createAdminClient } from '@/lib/supabase/server';
import crypto from 'crypto';

/**
 * Authorization code data.
 */
export interface AuthorizationCode {
  /** The authorization code */
  code: string;
  /** Client ID that requested the code */
  client_id: string;
  /** Redirect URI that was used */
  redirect_uri: string;
  /** Supabase user ID */
  user_id: string;
  /** Contractor ID */
  contractor_id: string;
  /** User email */
  email: string;
  /** PKCE code challenge */
  code_challenge: string;
  /** PKCE code challenge method */
  code_challenge_method: 'S256' | 'plain';
  /** OAuth state parameter */
  state?: string;
  /** Requested scopes */
  scopes: string[];
  /** Expiration timestamp (Unix) */
  expires_at: number;
  /** Whether the code has been used */
  used: boolean;
}

/**
 * Input for creating a new authorization code.
 */
export type AuthorizationCodeInput = Omit<AuthorizationCode, 'code' | 'expires_at' | 'used'>;

/**
 * Authorization code lifetime in seconds (5 minutes per OAuth spec).
 */
const CODE_LIFETIME_SECONDS = 300;

/**
 * Generate a cryptographically secure authorization code.
 *
 * @returns A random 32-byte hex string
 */
export function generateAuthorizationCode(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Store a new authorization code.
 *
 * @param input - Authorization code data (without code, expires_at, used)
 * @returns The generated authorization code
 *
 * @example
 * ```typescript
 * const code = await storeAuthorizationCode({
 *   client_id: 'knearme-chatgpt-app',
 *   redirect_uri: 'https://chatgpt.com/...',
 *   user_id: 'uuid',
 *   contractor_id: 'uuid',
 *   email: 'contractor@example.com',
 *   code_challenge: 'abc123...',
 *   code_challenge_method: 'S256',
 *   scopes: ['portfolio:read', 'portfolio:write'],
 * });
 * ```
 */
export async function storeAuthorizationCode(
  input: AuthorizationCodeInput
): Promise<string> {
  const code = generateAuthorizationCode();
  const expires_at = Math.floor(Date.now() / 1000) + CODE_LIFETIME_SECONDS;

  // Note: oauth_authorization_codes is not in generated types (new table)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;

  const { error } = await supabase
    .from('oauth_authorization_codes')
    .insert({
      code,
      client_id: input.client_id,
      redirect_uri: input.redirect_uri,
      user_id: input.user_id,
      contractor_id: input.contractor_id,
      email: input.email,
      code_challenge: input.code_challenge,
      code_challenge_method: input.code_challenge_method,
      state: input.state || null,
      scopes: input.scopes,
      expires_at: new Date(expires_at * 1000).toISOString(),
      used: false,
    });

  if (error) {
    console.error('[OAuth] Failed to store auth code:', error);
    throw new Error('Failed to store authorization code');
  }

  return code;
}

/**
 * Retrieve and consume an authorization code.
 *
 * Marks the code as used to prevent replay attacks.
 * Returns null if code is invalid, expired, or already used.
 *
 * @param code - The authorization code to retrieve
 * @returns The authorization code data or null
 */
export async function consumeAuthorizationCode(
  code: string
): Promise<AuthorizationCode | null> {
  // Note: oauth_authorization_codes is not in generated types (new table)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;

  // Define expected row shape
  type AuthCodeRow = {
    code: string;
    client_id: string;
    redirect_uri: string;
    user_id: string;
    contractor_id: string;
    email: string;
    code_challenge: string;
    code_challenge_method: string;
    state: string | null;
    scopes: string[];
    expires_at: string;
    used: boolean;
  };

  // Fetch the code
  const { data, error } = await supabase
    .from('oauth_authorization_codes')
    .select('*')
    .eq('code', code)
    .single();

  const row = data as AuthCodeRow | null;

  if (error || !row) {
    console.warn('[OAuth] Auth code not found:', code.slice(0, 8) + '...');
    return null;
  }

  // Check if already used
  if (row.used) {
    console.warn('[OAuth] Auth code already used:', code.slice(0, 8) + '...');
    // Security: delete all codes for this user (potential attack)
    await supabase
      .from('oauth_authorization_codes')
      .delete()
      .eq('user_id', row.user_id);
    return null;
  }

  // Check expiration
  const expiresAt = new Date(row.expires_at).getTime() / 1000;
  if (expiresAt < Date.now() / 1000) {
    console.warn('[OAuth] Auth code expired:', code.slice(0, 8) + '...');
    // Clean up expired code
    await supabase
      .from('oauth_authorization_codes')
      .delete()
      .eq('code', code);
    return null;
  }

  // Mark as used (single-use)
  const { error: updateError } = await supabase
    .from('oauth_authorization_codes')
    .update({ used: true })
    .eq('code', code);

  if (updateError) {
    console.error('[OAuth] Failed to mark code as used:', updateError);
    return null;
  }

  return {
    code: row.code,
    client_id: row.client_id,
    redirect_uri: row.redirect_uri,
    user_id: row.user_id,
    contractor_id: row.contractor_id,
    email: row.email,
    code_challenge: row.code_challenge,
    code_challenge_method: row.code_challenge_method as 'S256' | 'plain',
    state: row.state ?? undefined,
    scopes: row.scopes || [],
    expires_at: expiresAt,
    used: true,
  };
}

/**
 * Clean up expired authorization codes.
 *
 * Should be called periodically (e.g., via cron) to prevent table bloat.
 */
export async function cleanupExpiredCodes(): Promise<number> {
  // Note: oauth_authorization_codes is not in generated types (new table)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;

  const { count, error } = await supabase
    .from('oauth_authorization_codes')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('[OAuth] Failed to cleanup expired codes:', error);
    return 0;
  }

  return count || 0;
}
