/**
 * OAuth Token Endpoint.
 *
 * Exchanges authorization codes for access tokens (OAuth 2.1 with PKCE).
 * Also handles refresh token grants for obtaining new access tokens.
 *
 * Token Types:
 * - Access Token: Short-lived JWT (1 hour) for MCP tool calls
 * - Refresh Token: Long-lived JWT (7 days) for obtaining new access tokens
 *
 * @see /docs/chatgpt-apps-sdk/AUTH_STATE_SECURITY.md
 * @see /mcp-server/src/auth/token-validator.ts - Validates tokens issued here
 */

import { NextRequest, NextResponse } from 'next/server';
import { consumeAuthorizationCode } from '@/lib/oauth/auth-code-store';
import { verifyCodeVerifier } from '@/lib/oauth/pkce';
import {
  issueAccessToken,
  issueRefreshToken,
  verifyRefreshToken,
} from '@/lib/oauth/token-issuer';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * OAuth client configuration.
 */
const OAUTH_CLIENT_ID = process.env.OAUTH_CLIENT_ID || 'knearme-chatgpt-app';
const OAUTH_CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET || '';

/**
 * Token lifetimes in seconds.
 */
const ACCESS_TOKEN_LIFETIME = 3600; // 1 hour
const REFRESH_TOKEN_LIFETIME = 7 * 24 * 3600; // 7 days

/**
 * Standard OAuth error response.
 */
function errorResponse(
  error: string,
  description: string,
  status: number = 400
): NextResponse {
  return NextResponse.json(
    { error, error_description: description },
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
      },
    }
  );
}

/**
 * POST /api/oauth/token
 *
 * Token endpoint supporting:
 * - authorization_code grant (with PKCE)
 * - refresh_token grant
 */
export async function POST(request: NextRequest) {
  // Parse form body (OAuth token requests use application/x-www-form-urlencoded)
  let formData: URLSearchParams;
  try {
    const body = await request.text();
    formData = new URLSearchParams(body);
  } catch {
    return errorResponse('invalid_request', 'Invalid request body');
  }

  const grantType = formData.get('grant_type');

  // Validate client authentication
  const clientId = formData.get('client_id');
  const clientSecret = formData.get('client_secret');

  if (!clientId || clientId !== OAUTH_CLIENT_ID) {
    return errorResponse('invalid_client', 'Invalid client_id', 401);
  }

  // For confidential clients, verify client_secret
  // ChatGPT is a public client, so client_secret is optional
  if (clientSecret && OAUTH_CLIENT_SECRET && clientSecret !== OAUTH_CLIENT_SECRET) {
    return errorResponse('invalid_client', 'Invalid client_secret', 401);
  }

  // Handle grant type
  switch (grantType) {
    case 'authorization_code':
      return handleAuthorizationCodeGrant(formData);
    case 'refresh_token':
      return handleRefreshTokenGrant(formData);
    default:
      return errorResponse('unsupported_grant_type', `Unsupported grant_type: ${grantType}`);
  }
}

/**
 * Handle authorization_code grant.
 *
 * Exchanges an authorization code for access and refresh tokens.
 * Validates PKCE code_verifier against stored code_challenge.
 */
async function handleAuthorizationCodeGrant(
  formData: URLSearchParams
): Promise<NextResponse> {
  const code = formData.get('code');
  const redirectUri = formData.get('redirect_uri');
  const codeVerifier = formData.get('code_verifier');

  // Validate required parameters
  if (!code) {
    return errorResponse('invalid_request', 'Missing code parameter');
  }

  if (!redirectUri) {
    return errorResponse('invalid_request', 'Missing redirect_uri parameter');
  }

  if (!codeVerifier) {
    return errorResponse('invalid_request', 'Missing code_verifier parameter (PKCE required)');
  }

  // Retrieve and consume the authorization code
  const authCode = await consumeAuthorizationCode(code);

  if (!authCode) {
    return errorResponse('invalid_grant', 'Invalid, expired, or already used authorization code');
  }

  // Validate redirect_uri matches
  if (authCode.redirect_uri !== redirectUri) {
    return errorResponse('invalid_grant', 'redirect_uri does not match');
  }

  // Verify PKCE code_verifier
  const pkceValid = verifyCodeVerifier(
    codeVerifier,
    authCode.code_challenge,
    authCode.code_challenge_method
  );

  if (!pkceValid) {
    return errorResponse('invalid_grant', 'Invalid code_verifier (PKCE verification failed)');
  }

  // Issue tokens
  try {
    const accessToken = await issueAccessToken(
      authCode.user_id,
      authCode.contractor_id,
      authCode.email,
      { expiresIn: ACCESS_TOKEN_LIFETIME }
    );

    const refreshToken = await issueRefreshToken(
      authCode.user_id,
      authCode.contractor_id,
      { expiresIn: REFRESH_TOKEN_LIFETIME }
    );

    return NextResponse.json(
      {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: ACCESS_TOKEN_LIFETIME,
        refresh_token: refreshToken,
        scope: authCode.scopes.join(' '),
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          Pragma: 'no-cache',
        },
      }
    );
  } catch (error) {
    console.error('[OAuth Token] Failed to issue tokens:', error);
    return errorResponse('server_error', 'Failed to issue tokens', 500);
  }
}

/**
 * Handle refresh_token grant.
 *
 * Exchanges a refresh token for a new access token.
 */
async function handleRefreshTokenGrant(
  formData: URLSearchParams
): Promise<NextResponse> {
  const refreshToken = formData.get('refresh_token');

  if (!refreshToken) {
    return errorResponse('invalid_request', 'Missing refresh_token parameter');
  }

  // Verify the refresh token
  const payload = await verifyRefreshToken(refreshToken);

  if (!payload) {
    return errorResponse('invalid_grant', 'Invalid or expired refresh token');
  }

  // Look up the user to get current email
  // Note: RLS types return `never` due to Row Level Security policies
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;
  const { data: contractorData, error } = await supabase
    .from('contractors')
    .select('email')
    .eq('id', payload.contractor_id)
    .single();

  const contractor = contractorData as { email: string } | null;

  if (error || !contractor) {
    return errorResponse('invalid_grant', 'Contractor no longer exists');
  }

  // Issue new access token
  try {
    const accessToken = await issueAccessToken(
      payload.sub,
      payload.contractor_id,
      contractor.email,
      { expiresIn: ACCESS_TOKEN_LIFETIME }
    );

    // Optionally issue a new refresh token (token rotation)
    const newRefreshToken = await issueRefreshToken(
      payload.sub,
      payload.contractor_id,
      { expiresIn: REFRESH_TOKEN_LIFETIME }
    );

    return NextResponse.json(
      {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: ACCESS_TOKEN_LIFETIME,
        refresh_token: newRefreshToken,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          Pragma: 'no-cache',
        },
      }
    );
  } catch (error) {
    console.error('[OAuth Token] Failed to refresh tokens:', error);
    return errorResponse('server_error', 'Failed to issue tokens', 500);
  }
}
