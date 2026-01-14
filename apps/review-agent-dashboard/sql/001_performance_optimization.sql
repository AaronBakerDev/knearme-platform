-- Performance Optimization Migration
-- Run this in Supabase SQL Editor to improve contractor page performance
--
-- Issues addressed:
-- 1. Full table scans for filter dropdowns (getUniqueCities, getUniqueStates)
-- 2. Slow ILIKE searches on business_name
-- 3. Missing indexes on frequently filtered columns
--
-- @see /Users/aaronbaker/knearme-workspace/review-agent-dashboard/src/lib/supabase/queries.ts

-- =============================================================================
-- PART 1: RPC Functions for DISTINCT queries
-- =============================================================================
-- These functions replace client-side deduplication with database-level DISTINCT

-- Get unique cities for filter dropdown
CREATE OR REPLACE FUNCTION get_unique_cities()
RETURNS TABLE(city TEXT) AS $$
  SELECT DISTINCT rc.city
  FROM review_contractors rc
  WHERE rc.city IS NOT NULL AND rc.city != ''
  ORDER BY rc.city;
$$ LANGUAGE SQL STABLE;

COMMENT ON FUNCTION get_unique_cities IS
  'Returns distinct cities from review_contractors for filter dropdowns.
   Much faster than SELECT ALL + client-side deduplication.';

-- Get unique states for filter dropdown
CREATE OR REPLACE FUNCTION get_unique_states()
RETURNS TABLE(state TEXT) AS $$
  SELECT DISTINCT rc.state
  FROM review_contractors rc
  WHERE rc.state IS NOT NULL AND rc.state != ''
  ORDER BY rc.state;
$$ LANGUAGE SQL STABLE;

COMMENT ON FUNCTION get_unique_states IS
  'Returns distinct states from review_contractors for filter dropdowns.
   Much faster than SELECT ALL + client-side deduplication.';

-- =============================================================================
-- PART 2: Indexes for filter performance
-- =============================================================================
-- These indexes speed up WHERE clauses on common filter columns

-- Index for city filter (used in contractor list filters)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_review_contractors_city
  ON review_contractors(city);

-- Index for state filter (used in contractor list filters)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_review_contractors_state
  ON review_contractors(state);

-- Index for rating filter and ORDER BY rating
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_review_contractors_rating
  ON review_contractors(rating DESC NULLS LAST);

-- Composite index for city + state filters together
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_review_contractors_city_state
  ON review_contractors(city, state);

-- =============================================================================
-- PART 3: Trigram index for text search
-- =============================================================================
-- Enables fast ILIKE searches with leading wildcards (%search%)

-- Enable pg_trgm extension for trigram indexing
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram index on business_name for fast ILIKE searches
-- This makes queries like: WHERE business_name ILIKE '%pro%' much faster
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_review_contractors_business_name_trgm
  ON review_contractors USING GIN (business_name gin_trgm_ops);

-- =============================================================================
-- PART 4: Foreign key indexes (often missing but critical)
-- =============================================================================

-- Index on review_data.contractor_id (speeds up JOINs and WHERE clauses)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_review_data_contractor_id
  ON review_data(contractor_id);

-- Index on review_analysis.contractor_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_review_analysis_contractor_id
  ON review_analysis(contractor_id);

-- Index on review_articles.contractor_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_review_articles_contractor_id
  ON review_articles(contractor_id);

-- Index on review_articles.status (for filtering published/draft)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_review_articles_status
  ON review_articles(status);

-- =============================================================================
-- VERIFICATION QUERIES (run after migration to confirm indexes exist)
-- =============================================================================
--
-- Check indexes exist:
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'review_contractors';
--
-- Check RPC functions exist:
-- SELECT proname, prosrc FROM pg_proc WHERE proname IN ('get_unique_cities', 'get_unique_states');
--
-- Test performance improvement:
-- EXPLAIN ANALYZE SELECT DISTINCT city FROM review_contractors WHERE city IS NOT NULL ORDER BY city;
-- EXPLAIN ANALYZE SELECT * FROM review_contractors WHERE business_name ILIKE '%pro%' LIMIT 10;
