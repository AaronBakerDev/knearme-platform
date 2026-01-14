-- Tool lead capture for PDF exports
-- Stores email addresses of users who download PDF estimates

CREATE TABLE IF NOT EXISTS tool_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  tool_slug TEXT NOT NULL,
  inputs JSONB,
  results JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- UTM tracking for marketing attribution
  source_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tool_leads_email ON tool_leads(email);
CREATE INDEX IF NOT EXISTS idx_tool_leads_tool_slug ON tool_leads(tool_slug);
CREATE INDEX IF NOT EXISTS idx_tool_leads_created_at ON tool_leads(created_at DESC);

-- RLS: Only service role can access (no public access needed)
ALTER TABLE tool_leads ENABLE ROW LEVEL SECURITY;

-- No public policies - only service role can insert/select
-- This protects user data and ensures leads are only captured via the API

COMMENT ON TABLE tool_leads IS 'Captures email addresses from users who download PDF estimates. Used for lead generation and follow-up marketing.';
COMMENT ON COLUMN tool_leads.inputs IS 'JSON of tool form inputs at time of export';
COMMENT ON COLUMN tool_leads.results IS 'JSON of calculated results at time of export';
