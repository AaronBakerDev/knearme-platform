-- Migration: Add service_types table for dynamic service type management
-- Part of Phase 3: Architecture Changes (multi-trade support)
--
-- PHILOSOPHY: Move from hardcoded NATIONAL_SERVICE_TYPES to database-driven
-- configuration. This enables:
-- 1. Adding new service types without code changes
-- 2. Trade-agnostic platform expansion
-- 3. Dynamic SEO page generation
--
-- See: .claude/skills/agent-atlas/references/MIGRATIONS.md

-- Create service_types table
CREATE TABLE IF NOT EXISTS public.service_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Core identifiers
    service_id TEXT UNIQUE NOT NULL,        -- Internal ID (e.g., 'chimney-repair')
    url_slug TEXT UNIQUE NOT NULL,          -- URL slug (may differ for SEO)
    label TEXT NOT NULL,                    -- Display name (e.g., 'Chimney Repair & Rebuild')
    short_description TEXT NOT NULL,        -- ~100 chars for cards

    -- SEO Content
    long_description TEXT,                  -- HTML content (~300-400 words)
    seo_title TEXT,                         -- Page title
    seo_description TEXT,                   -- Meta description (max 155 chars)

    -- Structured Content (JSONB for flexibility)
    common_issues TEXT[],                   -- Array of common problems
    keywords TEXT[],                        -- Target search keywords
    process_steps JSONB,                    -- Steps with title, description, duration
    cost_factors JSONB,                     -- Factors with label, description, range
    faqs JSONB,                             -- Questions and answers

    -- Configuration
    trade TEXT DEFAULT 'construction',      -- Trade category (masonry, plumbing, etc.)
    is_published BOOLEAN DEFAULT true,      -- Control visibility
    sort_order INT DEFAULT 0,               -- Display order in UI
    icon_emoji TEXT,                        -- Emoji for display

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for frequent queries
CREATE INDEX IF NOT EXISTS idx_service_types_published ON public.service_types(is_published);
CREATE INDEX IF NOT EXISTS idx_service_types_trade ON public.service_types(trade);
CREATE INDEX IF NOT EXISTS idx_service_types_sort_order ON public.service_types(sort_order);

-- Enable RLS
ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;

-- Public read access (service types are public)
CREATE POLICY "Service types are publicly readable"
    ON public.service_types
    FOR SELECT
    USING (is_published = true);

-- NO SEED DATA
--
-- PHILOSOPHY: Service types should EMERGE, not be prescribed.
--
-- How service types get created:
-- 1. Admin adds them deliberately when targeting a market (SEO strategy)
-- 2. Future: Auto-discovered from project patterns in the system
-- 3. Future: DataForSEO integration identifies search demand
--
-- Projects are NOT constrained to existing service types.
-- The AI derives project_type from conversation, which may or may not
-- match an existing service_type for SEO purposes.
--
-- See: docs/philosophy/universal-portfolio-agents.md

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_service_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER service_types_updated_at
    BEFORE UPDATE ON public.service_types
    FOR EACH ROW
    EXECUTE FUNCTION update_service_types_updated_at();

-- Add comment for documentation
COMMENT ON TABLE public.service_types IS 'SEO landing page configuration. Service types EMERGE from business discovery and market targeting - not prescribed. Projects are not constrained to these types.';
