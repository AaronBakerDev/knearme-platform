/**
 * OAuth Protected Resource Metadata Endpoint.
 *
 * Returns metadata about this resource server per RFC 8707.
 * ChatGPT discovers this endpoint to find the authorization server.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc8707
 * @see /docs/chatgpt-apps-sdk/AUTH_STATE_SECURITY.md
 */

import { NextResponse } from 'next/server';

/**
 * GET /.well-known/oauth-protected-resource
 *
 * Returns resource server metadata including:
 * - resource: The resource server identifier (this server)
 * - authorization_servers: List of OAuth servers that can issue tokens
 * - scopes_supported: Available OAuth scopes
 */
export async function GET() {
  // Base URL from environment (without trailing slash)
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

  const metadata = {
    // Resource server identifier
    resource: baseUrl,

    // Authorization server(s) that can issue tokens for this resource
    // We use the same server for both resource and auth server
    authorization_servers: [baseUrl],

    // Supported OAuth scopes
    // These scopes control what MCP tools the token can access
    scopes_supported: [
      'portfolio:read',   // Read projects, list, status
      'portfolio:write',  // Create, update, finalize projects
      'profile:read',     // Read contractor profile
    ],

    // Token types supported
    bearer_methods_supported: ['header'],
  };

  return NextResponse.json(metadata, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
}
