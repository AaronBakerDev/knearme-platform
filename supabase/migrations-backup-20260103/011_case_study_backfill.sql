-- Migration: 011_case_study_backfill.sql
-- Description: Backfill existing projects with case-study data
--
-- This migration populates the new case-study fields for existing projects:
-- - hero_image_id: Set to first image by display_order (if any)
-- - state: Copy from contractor profile
-- - summary: Extract first 1-2 sentences from description (if exists)
-- - description_manual: Default to FALSE
--
-- @see /docs/chatgpt-apps-sdk/PORTFOLIO_MIGRATION_PLAN.md

-- ============================================================================
-- BACKFILL hero_image_id
-- ============================================================================

-- Set hero_image_id to the first image (by display_order) for each project
-- Only update where hero_image_id is NULL and images exist
UPDATE public.projects p
SET hero_image_id = (
  SELECT pi.id
  FROM public.project_images pi
  WHERE pi.project_id = p.id
  ORDER BY pi.display_order ASC, pi.created_at ASC
  LIMIT 1
)
WHERE p.hero_image_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.project_images pi2 WHERE pi2.project_id = p.id
  );

-- ============================================================================
-- BACKFILL state FROM CONTRACTOR
-- ============================================================================

-- Copy state from contractor profile where project.state is NULL
UPDATE public.projects p
SET state = c.state
FROM public.contractors c
WHERE p.contractor_id = c.id
  AND p.state IS NULL
  AND c.state IS NOT NULL;

-- ============================================================================
-- BACKFILL summary FROM DESCRIPTION
-- ============================================================================

-- Extract first 1-2 sentences from description as summary
-- Strategy: Take text up to the first period followed by space, or first 200 chars
-- Only update where summary is NULL and description exists
UPDATE public.projects p
SET summary = (
  CASE
    -- If description has a sentence ending (. followed by space or end)
    WHEN p.description ~ '\.\s' THEN
      -- Take up to first sentence (max 300 chars for safety)
      LEFT(
        SUBSTRING(p.description FROM '^[^.]+\.'),
        300
      )
    -- If description is short enough, use as-is
    WHEN LENGTH(p.description) <= 200 THEN
      p.description
    -- Otherwise truncate at word boundary around 180 chars
    ELSE
      CONCAT(
        LEFT(p.description, 180 - POSITION(' ' IN REVERSE(LEFT(p.description, 180)))),
        '...'
      )
  END
)
WHERE p.summary IS NULL
  AND p.description IS NOT NULL
  AND LENGTH(p.description) > 0;

-- ============================================================================
-- ENSURE description_manual DEFAULTS
-- ============================================================================

-- Set description_manual to FALSE for all existing projects where it's NULL
-- (should already be FALSE from column default, but ensure consistency)
UPDATE public.projects
SET description_manual = FALSE
WHERE description_manual IS NULL;

-- ============================================================================
-- LOG BACKFILL RESULTS (for audit)
-- ============================================================================

-- This creates a temporary audit record. In production, you might want to
-- log this to an audit table instead.
DO $$
DECLARE
  hero_count INTEGER;
  state_count INTEGER;
  summary_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO hero_count
  FROM public.projects WHERE hero_image_id IS NOT NULL;

  SELECT COUNT(*) INTO state_count
  FROM public.projects WHERE state IS NOT NULL;

  SELECT COUNT(*) INTO summary_count
  FROM public.projects WHERE summary IS NOT NULL;

  RAISE NOTICE 'Backfill complete: % projects with hero_image, % with state, % with summary',
    hero_count, state_count, summary_count;
END $$;
