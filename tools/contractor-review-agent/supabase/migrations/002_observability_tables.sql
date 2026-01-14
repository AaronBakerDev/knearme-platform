-- Migration: 002_observability_tables
-- Purpose: Add tables for AI cost tracking and search history observability
-- Created: 2024-12-31

-- ============================================================================
-- AI USAGE LOG TABLE
-- Tracks all Gemini API calls for cost analysis and observability
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_usage_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Operation type: 'analyze' for review analysis, 'generate' for article generation
    operation TEXT NOT NULL CHECK (operation IN ('analyze', 'generate', 'discover')),

    -- Link to contractor (nullable for operations not tied to a specific contractor)
    contractor_id UUID REFERENCES review_contractors(id) ON DELETE SET NULL,

    -- Model information
    model TEXT NOT NULL,

    -- Token tracking
    input_tokens INTEGER,
    output_tokens INTEGER,
    total_tokens INTEGER NOT NULL,

    -- Cost tracking (in USD)
    cost_estimate DECIMAL(10, 6) NOT NULL,

    -- Performance tracking
    duration_ms INTEGER,

    -- Success/failure tracking
    success BOOLEAN DEFAULT true,
    error_message TEXT,

    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX idx_ai_usage_log_operation ON ai_usage_log(operation);
CREATE INDEX idx_ai_usage_log_contractor_id ON ai_usage_log(contractor_id);
CREATE INDEX idx_ai_usage_log_created_at ON ai_usage_log(created_at DESC);
CREATE INDEX idx_ai_usage_log_success ON ai_usage_log(success);

-- Enable RLS
ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;

-- Allow read access (dashboard needs to query this)
CREATE POLICY "Allow read access to ai_usage_log" ON ai_usage_log
    FOR SELECT USING (true);

-- Allow insert from service role
CREATE POLICY "Allow insert to ai_usage_log" ON ai_usage_log
    FOR INSERT WITH CHECK (true);

-- ============================================================================
-- SEARCHED CITIES TABLE
-- Tracks Google Maps discovery searches to prevent duplicates
-- ============================================================================

CREATE TABLE IF NOT EXISTS searched_cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Location information
    city TEXT NOT NULL,
    state TEXT,
    country TEXT NOT NULL DEFAULT 'USA',

    -- Search parameters
    search_term TEXT NOT NULL,

    -- Results
    contractors_found INTEGER DEFAULT 0,

    -- Timestamp
    searched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Prevent duplicate searches
    CONSTRAINT unique_search_combo UNIQUE (city, state, country, search_term)
);

-- Indexes for common query patterns
CREATE INDEX idx_searched_cities_city ON searched_cities(city);
CREATE INDEX idx_searched_cities_state ON searched_cities(state);
CREATE INDEX idx_searched_cities_searched_at ON searched_cities(searched_at DESC);

-- Enable RLS
ALTER TABLE searched_cities ENABLE ROW LEVEL SECURITY;

-- Allow read access (dashboard needs to query this)
CREATE POLICY "Allow read access to searched_cities" ON searched_cities
    FOR SELECT USING (true);

-- Allow insert from service role
CREATE POLICY "Allow insert to searched_cities" ON searched_cities
    FOR INSERT WITH CHECK (true);

-- ============================================================================
-- ADD TRACKING COLUMNS TO EXISTING TABLES
-- Add model_used, tokens_used, cost_estimate to analysis and articles tables
-- ============================================================================

-- Add tracking fields to review_analysis
ALTER TABLE review_analysis
ADD COLUMN IF NOT EXISTS model_used TEXT,
ADD COLUMN IF NOT EXISTS tokens_used INTEGER,
ADD COLUMN IF NOT EXISTS cost_estimate DECIMAL(10, 6);

-- Add tracking fields to review_articles
ALTER TABLE review_articles
ADD COLUMN IF NOT EXISTS model_used TEXT,
ADD COLUMN IF NOT EXISTS tokens_used INTEGER,
ADD COLUMN IF NOT EXISTS cost_estimate DECIMAL(10, 6);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE ai_usage_log IS 'Tracks all AI API calls for cost analysis and observability';
COMMENT ON COLUMN ai_usage_log.operation IS 'Type of AI operation: analyze, generate, or discover';
COMMENT ON COLUMN ai_usage_log.cost_estimate IS 'Estimated cost in USD based on token pricing';

COMMENT ON TABLE searched_cities IS 'Tracks Google Maps discovery searches to prevent duplicate API calls';
COMMENT ON COLUMN searched_cities.search_term IS 'The search query used (e.g., "masonry contractor")';
