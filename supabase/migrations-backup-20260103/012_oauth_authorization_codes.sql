-- Migration: 012_oauth_authorization_codes
-- Description: Create table for OAuth authorization codes (ChatGPT Apps SDK integration)
-- Date: 2024-12-23
--
-- This table stores short-lived authorization codes for the OAuth 2.1 PKCE flow.
-- Codes are generated during the /oauth/authorize step and consumed during /oauth/token.
--
-- @see /docs/chatgpt-apps-sdk/AUTH_STATE_SECURITY.md
-- @see /src/lib/oauth/auth-code-store.ts

-- OAuth authorization codes table
-- Stores codes that are exchanged for access tokens
CREATE TABLE IF NOT EXISTS oauth_authorization_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The authorization code (unique, indexed for fast lookup)
  code TEXT UNIQUE NOT NULL,

  -- OAuth client that requested the code
  client_id TEXT NOT NULL,

  -- Redirect URI for token delivery (must match during exchange)
  redirect_uri TEXT NOT NULL,

  -- User authentication context
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  email TEXT NOT NULL,

  -- PKCE parameters (required for OAuth 2.1)
  code_challenge TEXT NOT NULL,
  code_challenge_method TEXT NOT NULL CHECK (code_challenge_method IN ('S256', 'plain')),

  -- OAuth state parameter (for CSRF protection)
  state TEXT,

  -- Requested scopes
  scopes TEXT[] DEFAULT '{}',

  -- Expiration (5 minutes per OAuth spec)
  expires_at TIMESTAMPTZ NOT NULL,

  -- Single-use flag (prevents replay attacks)
  used BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast code lookup during token exchange
CREATE INDEX IF NOT EXISTS idx_oauth_codes_code ON oauth_authorization_codes(code);

-- Index for cleanup of expired codes
CREATE INDEX IF NOT EXISTS idx_oauth_codes_expires ON oauth_authorization_codes(expires_at);

-- Index for user lookup (for security: invalidate all codes on suspicious activity)
CREATE INDEX IF NOT EXISTS idx_oauth_codes_user ON oauth_authorization_codes(user_id);

-- RLS: Only admin operations (no direct user access to this table)
ALTER TABLE oauth_authorization_codes ENABLE ROW LEVEL SECURITY;

-- No RLS policies - this table is only accessed by admin client
-- The auth-code-store.ts uses createAdminClient() which bypasses RLS

-- Comment
COMMENT ON TABLE oauth_authorization_codes IS 'Short-lived OAuth authorization codes for ChatGPT Apps SDK integration';
