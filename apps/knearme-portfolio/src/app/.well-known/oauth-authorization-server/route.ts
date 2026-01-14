/**
 * OAuth Authorization Server Metadata Endpoint.
 *
 * Returns OAuth 2.0/2.1 authorization server metadata per RFC 8414.
 * ChatGPT discovers this to find authorization and token endpoints.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc8414
 * @see /docs/chatgpt-apps-sdk/AUTH_STATE_SECURITY.md
 */

import { NextResponse } from 'next/server';

/**
 * GET /.well-known/oauth-authorization-server
 *
 * Returns authorization server metadata including:
 * - authorization_endpoint: Where to redirect for user auth
 * - token_endpoint: Where to exchange codes for tokens
 * - PKCE support (required for OAuth 2.1)
 */
export async function GET() {
  // Base URL from environment (without trailing slash)
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

  const metadata = {
    // Authorization server identifier
    issuer: baseUrl,

    // Endpoints
    authorization_endpoint: `${baseUrl}/api/oauth/authorize`,
    token_endpoint: `${baseUrl}/api/oauth/token`,

    // Note: We don't support dynamic client registration
    // registration_endpoint: `${baseUrl}/api/oauth/register`,

    // Supported response types
    response_types_supported: ['code'],

    // Supported grant types
    grant_types_supported: [
      'authorization_code',
      'refresh_token',
    ],

    // PKCE support (required for OAuth 2.1)
    code_challenge_methods_supported: ['S256', 'plain'],

    // Token endpoint authentication methods
    // ChatGPT sends client_id in request body (not Basic auth)
    token_endpoint_auth_methods_supported: [
      'none',           // Public clients (ChatGPT)
      'client_secret_post', // Confidential clients
    ],

    // Supported scopes
    scopes_supported: [
      'portfolio:read',
      'portfolio:write',
      'profile:read',
      'offline_access', // For refresh tokens
    ],

    // UI locales supported
    ui_locales_supported: ['en'],

    // Service documentation
    service_documentation: 'https://knearme.com/docs/chatgpt-integration',

    // Revocation endpoint (not implemented yet)
    // revocation_endpoint: `${baseUrl}/api/oauth/revoke`,
  };

  return NextResponse.json(metadata, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
}
