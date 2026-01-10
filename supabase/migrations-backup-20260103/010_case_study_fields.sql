-- Migration: 010_case_study_fields.sql
-- Description: Add case-study narrative fields for ChatGPT Apps SDK integration
--
-- This migration adds structured narrative fields to support the ChatGPT app
-- where contractors create case-study projects via conversational AI.
--
-- Key fields:
-- - summary: 1-2 sentence hook for the case study
-- - challenge/solution/results: Structured narrative sections
-- - outcome_highlights: Array of 2-4 bullet point outcomes
-- - hero_image_id: FK to project_images for hero selection
-- - state: Project-specific state (copied from contractor, editable per project)
-- - client_type/budget_range: Optional context fields
-- - description_manual: Flag to prevent auto-recomposition of description
--
-- @see /docs/chatgpt-apps-sdk/PORTFOLIO_SCHEMA_CHANGES.md

-- ============================================================================
-- ADD NARRATIVE FIELDS
-- ============================================================================

-- Summary: 1-2 sentence hook for the case study
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS summary TEXT;

-- Narrative sections for case-study structure
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS challenge TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS solution TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS results TEXT;

-- Outcome highlights: 2-4 bullet point outcomes
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS outcome_highlights TEXT[] DEFAULT '{}';

-- ============================================================================
-- ADD HERO IMAGE SUPPORT
-- ============================================================================

-- Hero image FK to project_images
-- This references the image to use as the primary/hero image for the project
-- Set to NULL on delete (if hero image is deleted, allow manual re-selection)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS hero_image_id UUID;

-- Add FK constraint with ON DELETE SET NULL
-- Using DO block to make idempotent (won't fail if constraint exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_hero_image_fk'
  ) THEN
    ALTER TABLE public.projects
      ADD CONSTRAINT projects_hero_image_fk
      FOREIGN KEY (hero_image_id)
      REFERENCES public.project_images(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Index for hero image lookups (useful for joins)
CREATE INDEX IF NOT EXISTS idx_projects_hero_image_id
  ON public.projects(hero_image_id)
  WHERE hero_image_id IS NOT NULL;

-- ============================================================================
-- ADD LOCATION FIELDS
-- ============================================================================

-- State: Project-specific state (allows SEO stability if contractor moves)
-- Copied from contractor profile at creation, but editable per project
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS state TEXT;

-- ============================================================================
-- ADD CONTEXT FIELDS
-- ============================================================================

-- Client type: residential, commercial, municipal, or other
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS client_type TEXT;

-- Budget range: <5k, 5k-10k, 10k-25k, 25k-50k, 50k+
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS budget_range TEXT;

-- ============================================================================
-- ADD DESCRIPTION CONTROL FLAG
-- ============================================================================

-- description_manual: When TRUE, description is manually edited and should not
-- be auto-recomposed when narrative fields change. Default FALSE means
-- description is auto-composed from summary + sections + outcome_highlights.
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS description_manual BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- ADD CHECK CONSTRAINTS
-- ============================================================================

-- Validate client_type enum values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_client_type_check'
  ) THEN
    ALTER TABLE public.projects
      ADD CONSTRAINT projects_client_type_check
      CHECK (client_type IS NULL OR client_type IN ('residential', 'commercial', 'municipal', 'other'));
  END IF;
END $$;

-- Validate budget_range enum values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_budget_range_check'
  ) THEN
    ALTER TABLE public.projects
      ADD CONSTRAINT projects_budget_range_check
      CHECK (budget_range IS NULL OR budget_range IN ('<5k', '5k-10k', '10k-25k', '25k-50k', '50k+'));
  END IF;
END $$;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN public.projects.summary IS '1-2 sentence hook for the case study (ChatGPT-generated)';
COMMENT ON COLUMN public.projects.challenge IS 'What was the problem or constraint (ChatGPT-generated)';
COMMENT ON COLUMN public.projects.solution IS 'What the contractor did to solve it (ChatGPT-generated)';
COMMENT ON COLUMN public.projects.results IS 'Outcome or impact of the work (ChatGPT-generated)';
COMMENT ON COLUMN public.projects.outcome_highlights IS 'Array of 2-4 bullet point outcomes';
COMMENT ON COLUMN public.projects.hero_image_id IS 'FK to project_images for hero image selection';
COMMENT ON COLUMN public.projects.state IS 'Project state (copied from contractor, editable for SEO stability)';
COMMENT ON COLUMN public.projects.client_type IS 'Type of client: residential, commercial, municipal, other';
COMMENT ON COLUMN public.projects.budget_range IS 'Budget range: <5k, 5k-10k, 10k-25k, 25k-50k, 50k+';
COMMENT ON COLUMN public.projects.description_manual IS 'When TRUE, description is manually edited and not auto-composed';
