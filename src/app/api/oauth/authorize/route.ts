/**
 * OAuth Authorization Endpoint.
 *
 * Handles the OAuth 2.1 authorization code flow with PKCE.
 * ChatGPT redirects users here to authenticate and authorize the app.
 *
 * Flow:
 * 1. ChatGPT redirects user with OAuth params (client_id, redirect_uri, etc.)
 * 2. We validate params and check if user is authenticated
 * 3. If not authenticated, redirect to login with return URL
 * 4. If authenticated, generate auth code and redirect back to ChatGPT
 *
 * @see /docs/chatgpt-apps-sdk/AUTH_STATE_SECURITY.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { storeAuthorizationCode } from '@/lib/oauth/auth-code-store';

/**
 * Allowed ChatGPT redirect URIs.
 *
 * SECURITY: Only these exact URIs are allowed for OAuth redirects.
 * @see AUTH_STATE_SECURITY.md - Redirect URIs section
 */
const ALLOWED_REDIRECT_URIS = [
  'https://chatgpt.com/connector_platform_oauth_redirect',
  'https://platform.openai.com/apps-manage/oauth',
];

/**
 * OAuth client configuration.
 *
 * In production, this would be stored in a database.
 * For ChatGPT Apps SDK, we use a single known client.
 */
const OAUTH_CLIENT_ID = process.env.OAUTH_CLIENT_ID || 'knearme-chatgpt-app';

/**
 * GET /api/oauth/authorize
 *
 * Authorization endpoint for OAuth 2.1 PKCE flow.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Extract OAuth parameters
  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const responseType = searchParams.get('response_type');
  const state = searchParams.get('state');
  const codeChallenge = searchParams.get('code_challenge');
  const codeChallengeMethod = searchParams.get('code_challenge_method') || 'S256';
  const scope = searchParams.get('scope') || 'portfolio:read portfolio:write';

  // Build error redirect helper
  const errorRedirect = (error: string, description: string) => {
    if (redirectUri && ALLOWED_REDIRECT_URIS.includes(redirectUri)) {
      const errorUrl = new URL(redirectUri);
      errorUrl.searchParams.set('error', error);
      errorUrl.searchParams.set('error_description', description);
      if (state) errorUrl.searchParams.set('state', state);
      return NextResponse.redirect(errorUrl);
    }
    // If redirect_uri is invalid, show error page
    return NextResponse.json(
      { error, error_description: description },
      { status: 400 }
    );
  };

  // Validate required parameters
  if (!clientId) {
    return errorRedirect('invalid_request', 'Missing client_id parameter');
  }

  if (clientId !== OAUTH_CLIENT_ID) {
    return errorRedirect('invalid_client', 'Unknown client_id');
  }

  if (!redirectUri) {
    return errorRedirect('invalid_request', 'Missing redirect_uri parameter');
  }

  if (!ALLOWED_REDIRECT_URIS.includes(redirectUri)) {
    // Don't redirect to untrusted URI - show error directly
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Invalid redirect_uri' },
      { status: 400 }
    );
  }

  if (responseType !== 'code') {
    return errorRedirect('unsupported_response_type', 'Only response_type=code is supported');
  }

  // PKCE is required for OAuth 2.1
  if (!codeChallenge) {
    return errorRedirect('invalid_request', 'Missing code_challenge (PKCE required)');
  }

  if (codeChallengeMethod !== 'S256' && codeChallengeMethod !== 'plain') {
    return errorRedirect('invalid_request', 'Invalid code_challenge_method');
  }

  // Check if user is authenticated
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    // Not authenticated - redirect to login
    // Store OAuth params in session/URL to resume after login
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const loginUrl = new URL('/login', baseUrl);

    // Store the full authorize URL as return destination
    loginUrl.searchParams.set('redirect', request.url);

    return NextResponse.redirect(loginUrl);
  }

  // Get contractor profile for the authenticated user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: contractor, error: contractorError } = await (supabase as any)
    .from('contractors')
    .select('id, email')
    .eq('auth_user_id', user.id)
    .single();

  if (contractorError || !contractor) {
    return errorRedirect(
      'access_denied',
      'No contractor profile found. Please complete profile setup first.'
    );
  }

  // Parse requested scopes
  const scopes = scope.split(' ').filter(Boolean);

  // Generate and store authorization code
  try {
    const code = await storeAuthorizationCode({
      client_id: clientId,
      redirect_uri: redirectUri,
      user_id: user.id,
      contractor_id: contractor.id,
      email: user.email || contractor.email,
      code_challenge: codeChallenge,
      code_challenge_method: codeChallengeMethod as 'S256' | 'plain',
      state: state || undefined,
      scopes,
    });

    // Redirect back to ChatGPT with authorization code
    const successUrl = new URL(redirectUri);
    successUrl.searchParams.set('code', code);
    if (state) successUrl.searchParams.set('state', state);

    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error('[OAuth Authorize] Failed to generate auth code:', error);
    return errorRedirect('server_error', 'Failed to generate authorization code');
  }
}
