-- =============================================================================
-- Migration: 002_category_array_and_search_terms
-- Description: Convert category from TEXT to TEXT[] and add search_terms column
-- Created: 2024-12-31
-- Applied via: Supabase MCP
-- =============================================================================

-- 1. Drop existing B-tree index (incompatible with arrays)
DROP INDEX IF EXISTS idx_review_contractors_category;

-- 2. Convert category from TEXT to TEXT[]
ALTER TABLE review_contractors
  ALTER COLUMN category DROP DEFAULT,
  ALTER COLUMN category TYPE text[]
    USING CASE
      WHEN category IS NULL OR btrim(category) = '' THEN ARRAY[]::text[]
      ELSE ARRAY[category]
    END,
  ALTER COLUMN category SET DEFAULT '{}'::text[];

-- 3. Add new search_terms column
ALTER TABLE review_contractors
  ADD COLUMN IF NOT EXISTS search_terms text[] DEFAULT '{}'::text[];

-- 4. Create GIN indexes for efficient array operations
CREATE INDEX IF NOT EXISTS idx_review_contractors_category_gin
  ON review_contractors USING gin (category);

CREATE INDEX IF NOT EXISTS idx_review_contractors_search_terms_gin
  ON review_contractors USING gin (search_terms);

-- 5. Add helpful comments
COMMENT ON COLUMN review_contractors.category IS 'Google Maps business categories (array). Source: DataForSEO API.';
COMMENT ON COLUMN review_contractors.search_terms IS 'Discovery search terms that found this contractor (e.g., "masonry contractors denver").';
