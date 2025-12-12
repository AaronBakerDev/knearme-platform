-- ============================================
-- Directory Views Migration
-- ============================================
-- Purpose: Create materialized views for efficient directory browsing
--
-- This migration creates three materialized views from the places table:
-- 1. directory_places: Filtered and enriched places data with SEO-friendly slugs
-- 2. directory_state_stats: Aggregated statistics by state
-- 3. directory_city_stats: Aggregated statistics by city
--
-- Refresh Strategy: Materialized views should be refreshed daily via cron job
-- Usage: SELECT * FROM directory_places WHERE state_slug = 'colorado' AND city_slug = 'denver'
-- ============================================

-- ============================================
-- 1. Create directory_places materialized view
-- ============================================
-- Filters places to target contractor categories and adds computed slug columns
-- for SEO-friendly URLs

CREATE MATERIALIZED VIEW IF NOT EXISTS public.directory_places AS
SELECT
    -- Original columns
    id,
    title,
    category,
    rating,
    rating_count,
    address,
    city,
    province_state,
    phone_number,
    website,
    latitude,
    longitude,
    cid,
    slug,

    -- Computed slug columns for SEO routing
    LOWER(REPLACE(TRIM(province_state), ' ', '-')) AS state_slug,
    LOWER(REPLACE(TRIM(city[1]), ' ', '-')) AS city_slug,
    LOWER(REPLACE(TRIM(category), ' ', '-')) AS category_slug
FROM
    public.places
WHERE
    -- Filter to target contractor categories
    category IN (
        'Masonry contractor',
        'Chimney sweep',
        'Chimney services',
        'Roofing contractor',
        'Concrete contractor',
        'General contractor',
        'Fireplace store',
        'Stone supplier',
        'Masonry supply store',
        'Construction company'
    )
    -- Filter out invalid records
    AND title IS NOT NULL
    AND province_state IS NOT NULL
    AND ARRAY_LENGTH(city, 1) > 0
    AND city[1] IS NOT NULL;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_directory_places_state
    ON public.directory_places (state_slug);

CREATE INDEX IF NOT EXISTS idx_directory_places_city
    ON public.directory_places (state_slug, city_slug);

CREATE INDEX IF NOT EXISTS idx_directory_places_category
    ON public.directory_places (state_slug, city_slug, category_slug);

CREATE INDEX IF NOT EXISTS idx_directory_places_slug
    ON public.directory_places (slug);

COMMENT ON MATERIALIZED VIEW public.directory_places IS
'Filtered and enriched places data for directory browsing. Includes SEO-friendly slug columns. Refresh daily.';

-- ============================================
-- 2. Create directory_state_stats materialized view
-- ============================================
-- Aggregated statistics by state for directory navigation

CREATE MATERIALIZED VIEW IF NOT EXISTS public.directory_state_stats AS
SELECT
    state_slug,
    province_state AS state_name,
    COUNT(DISTINCT id) AS business_count,
    COUNT(DISTINCT city_slug) AS city_count,
    ROUND(AVG(rating)::numeric, 2) AS avg_rating
FROM
    public.directory_places
GROUP BY
    state_slug,
    province_state
ORDER BY
    business_count DESC;

-- Create index for efficient state lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_directory_state_stats_slug
    ON public.directory_state_stats (state_slug);

COMMENT ON MATERIALIZED VIEW public.directory_state_stats IS
'Aggregated statistics by state for directory navigation. Refresh daily.';

-- ============================================
-- 3. Create directory_city_stats materialized view
-- ============================================
-- Aggregated statistics by city for directory navigation

CREATE MATERIALIZED VIEW IF NOT EXISTS public.directory_city_stats AS
SELECT
    state_slug,
    city_slug,
    city[1] AS city_name,
    province_state AS state_name,
    COUNT(DISTINCT id) AS business_count,
    COUNT(DISTINCT category_slug) AS category_count,
    ROUND(AVG(rating)::numeric, 2) AS avg_rating
FROM
    public.directory_places
GROUP BY
    state_slug,
    city_slug,
    city[1],
    province_state
ORDER BY
    business_count DESC;

-- Create indexes for efficient city lookups
CREATE INDEX IF NOT EXISTS idx_directory_city_stats_state
    ON public.directory_city_stats (state_slug);

CREATE UNIQUE INDEX IF NOT EXISTS idx_directory_city_stats_city
    ON public.directory_city_stats (state_slug, city_slug);

COMMENT ON MATERIALIZED VIEW public.directory_city_stats IS
'Aggregated statistics by city for directory navigation. Refresh daily.';

-- ============================================
-- Refresh Function (optional - for manual refresh)
-- ============================================
-- Create a function to refresh all directory views at once

CREATE OR REPLACE FUNCTION public.refresh_directory_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.directory_places;
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.directory_state_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.directory_city_stats;
END;
$$;

COMMENT ON FUNCTION public.refresh_directory_views() IS
'Refreshes all directory materialized views. Should be called daily via cron job.';

-- ============================================
-- Grant Permissions
-- ============================================
-- Allow public read access to directory views (for anonymous browsing)

GRANT SELECT ON public.directory_places TO anon, authenticated;
GRANT SELECT ON public.directory_state_stats TO anon, authenticated;
GRANT SELECT ON public.directory_city_stats TO anon, authenticated;

-- Grant execute permission on refresh function (service role only)
GRANT EXECUTE ON FUNCTION public.refresh_directory_views() TO service_role;
