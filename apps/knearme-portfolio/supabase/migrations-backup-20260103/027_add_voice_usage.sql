-- Voice usage tracking for fair-use caps
-- Migration: 027_add_voice_usage.sql
-- Created: 2024-12-31

CREATE TABLE IF NOT EXISTS voice_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contractor_id UUID REFERENCES contractors(id) ON DELETE SET NULL,
  session_id UUID,  -- chat session ID
  mode TEXT NOT NULL CHECK (mode IN ('voice_text', 'voice_voice')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  token_count INTEGER,  -- for future billing
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for querying usage
CREATE INDEX idx_voice_usage_user_id ON voice_usage(user_id);
CREATE INDEX idx_voice_usage_created_at ON voice_usage(created_at);
CREATE INDEX idx_voice_usage_mode ON voice_usage(mode);

-- RLS policies
ALTER TABLE voice_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own voice usage"
  ON voice_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own voice usage"
  ON voice_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice usage"
  ON voice_usage FOR UPDATE
  USING (auth.uid() = user_id);
