-- Migration: 003_search_indexes.sql
-- Description: Add indexes to searched_cities table for scalable queries
--
-- These indexes optimize the searches page which performs:
-- - Filter by state/city
-- - Sort by searched_at, contractors_found
-- - Count distinct cities/states
-- - Duplicate detection (city + state + search_term grouping)

-- Index for state filter and distinct state queries
CREATE INDEX IF NOT EXISTS idx_searched_cities_state
  ON searched_cities(state)
  WHERE state IS NOT NULL;

-- Index for city filter and distinct city queries
CREATE INDEX IF NOT EXISTS idx_searched_cities_city
  ON searched_cities(city);

-- Index for search_term filtering
CREATE INDEX IF NOT EXISTS idx_searched_cities_search_term
  ON searched_cities(search_term);

-- Index for date sorting (already exists from 002, but adding for completeness)
-- CREATE INDEX IF NOT EXISTS idx_searched_cities_searched_at
--   ON searched_cities(searched_at DESC);

-- Composite index for duplicate detection queries (GROUP BY city, state, search_term)
CREATE INDEX IF NOT EXISTS idx_searched_cities_duplicate_check
  ON searched_cities(city, state, search_term);

-- Composite index for filtered + sorted queries (state filter + date sort)
CREATE INDEX IF NOT EXISTS idx_searched_cities_state_date
  ON searched_cities(state, searched_at DESC)
  WHERE state IS NOT NULL;

-- Composite index for filtered + sorted queries (city filter + date sort)
CREATE INDEX IF NOT EXISTS idx_searched_cities_city_date
  ON searched_cities(city, searched_at DESC);
