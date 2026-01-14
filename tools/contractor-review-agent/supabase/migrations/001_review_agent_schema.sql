-- =============================================================================
-- Migration: 001_review_agent_schema
-- Description: Initial schema for contractor-review-agent
-- Created: 2024-12-30
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- Table: review_contractors
-- Description: Contractor businesses discovered via Google Maps API
-- =============================================================================
CREATE TABLE IF NOT EXISTS review_contractors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    place_id TEXT UNIQUE NOT NULL,
    cid TEXT,
    business_name TEXT NOT NULL,
    category TEXT,
    city TEXT NOT NULL,
    state TEXT,
    country TEXT NOT NULL DEFAULT 'USA',
    rating DECIMAL(2, 1),
    review_count INTEGER,
    address TEXT,
    phone TEXT,
    website TEXT,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    is_claimed BOOLEAN DEFAULT false,
    discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for review_contractors
CREATE INDEX IF NOT EXISTS idx_review_contractors_place_id ON review_contractors(place_id);
CREATE INDEX IF NOT EXISTS idx_review_contractors_city ON review_contractors(city);
CREATE INDEX IF NOT EXISTS idx_review_contractors_city_state ON review_contractors(city, state);
CREATE INDEX IF NOT EXISTS idx_review_contractors_rating ON review_contractors(rating DESC);
CREATE INDEX IF NOT EXISTS idx_review_contractors_review_count ON review_contractors(review_count DESC);
CREATE INDEX IF NOT EXISTS idx_review_contractors_category ON review_contractors(category);

-- =============================================================================
-- Table: review_data
-- Description: Individual reviews fetched from Google Reviews API
-- =============================================================================
CREATE TABLE IF NOT EXISTS review_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contractor_id UUID NOT NULL REFERENCES review_contractors(id) ON DELETE CASCADE,
    review_id TEXT,
    review_text TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    reviewer_name TEXT,
    review_date TIMESTAMPTZ,
    owner_response TEXT,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Unique constraint to prevent duplicate reviews
    CONSTRAINT unique_contractor_review UNIQUE (contractor_id, review_id)
);

-- Indexes for review_data
CREATE INDEX IF NOT EXISTS idx_review_data_contractor_id ON review_data(contractor_id);
CREATE INDEX IF NOT EXISTS idx_review_data_rating ON review_data(rating);
CREATE INDEX IF NOT EXISTS idx_review_data_review_date ON review_data(review_date DESC);

-- =============================================================================
-- Table: review_analysis
-- Description: AI-generated analysis of contractor reviews
-- =============================================================================
CREATE TABLE IF NOT EXISTS review_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contractor_id UUID NOT NULL REFERENCES review_contractors(id) ON DELETE CASCADE,
    analysis_json JSONB NOT NULL,
    analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- One analysis per contractor (latest wins)
    CONSTRAINT unique_contractor_analysis UNIQUE (contractor_id)
);

-- Indexes for review_analysis
CREATE INDEX IF NOT EXISTS idx_review_analysis_contractor_id ON review_analysis(contractor_id);
CREATE INDEX IF NOT EXISTS idx_review_analysis_analyzed_at ON review_analysis(analyzed_at DESC);

-- GIN index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_review_analysis_json ON review_analysis USING GIN (analysis_json);

-- =============================================================================
-- Table: review_articles
-- Description: Generated SEO articles based on review analysis
-- =============================================================================
CREATE TABLE IF NOT EXISTS review_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contractor_id UUID NOT NULL REFERENCES review_contractors(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    content_markdown TEXT NOT NULL,
    metadata_json JSONB,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- One article per contractor (latest wins)
    CONSTRAINT unique_contractor_article UNIQUE (contractor_id)
);

-- Indexes for review_articles
CREATE INDEX IF NOT EXISTS idx_review_articles_contractor_id ON review_articles(contractor_id);
CREATE INDEX IF NOT EXISTS idx_review_articles_slug ON review_articles(slug);
CREATE INDEX IF NOT EXISTS idx_review_articles_status ON review_articles(status);
CREATE INDEX IF NOT EXISTS idx_review_articles_generated_at ON review_articles(generated_at DESC);

-- GIN index for metadata JSONB queries
CREATE INDEX IF NOT EXISTS idx_review_articles_metadata ON review_articles USING GIN (metadata_json);

-- =============================================================================
-- Comments for documentation
-- =============================================================================
COMMENT ON TABLE review_contractors IS 'Contractor businesses discovered via Google Maps/Places API';
COMMENT ON TABLE review_data IS 'Individual Google reviews for each contractor';
COMMENT ON TABLE review_analysis IS 'AI-generated analysis of contractor reviews (Claude)';
COMMENT ON TABLE review_articles IS 'SEO articles generated from review analysis';

COMMENT ON COLUMN review_contractors.place_id IS 'Google Places API place_id (unique identifier)';
COMMENT ON COLUMN review_contractors.cid IS 'Google Maps CID (numeric ID)';
COMMENT ON COLUMN review_contractors.is_claimed IS 'Whether the business has claimed their Google listing';

COMMENT ON COLUMN review_data.review_id IS 'Google review unique ID (may be null for some reviews)';
COMMENT ON COLUMN review_data.owner_response IS 'Business owner response to the review';

COMMENT ON COLUMN review_analysis.analysis_json IS 'Structured ReviewAnalysis object with themes, sentiment, quotes, etc.';

COMMENT ON COLUMN review_articles.slug IS 'URL-friendly slug for the article (e.g., city-contractor-name-reviews)';
COMMENT ON COLUMN review_articles.metadata_json IS 'SEO metadata, structured data, and generation info';
COMMENT ON COLUMN review_articles.status IS 'Article status: draft (needs review) or published (live)';
