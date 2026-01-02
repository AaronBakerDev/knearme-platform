-- Phase 11.5.1: Code Review Fixes
-- Addresses issues CR-2 and CR-3 from 2026-01-02 code review
--
-- CR-2: Add missing indexes on business_id columns
-- CR-3: Change SECURITY DEFINER to SECURITY INVOKER on business_has_published_project
--
-- Created: 2026-01-02
-- Applied: 2026-01-02

-- CR-2: Add missing indexes on business_id columns
-- Note: chat_sessions.business_id doesn't exist (migration 033 conditional block didn't run)

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_business_id
  ON public.push_subscriptions(business_id);

CREATE INDEX IF NOT EXISTS idx_voice_usage_business_id
  ON public.voice_usage(business_id);

-- projects.business_id index may already exist, add if missing
CREATE INDEX IF NOT EXISTS idx_projects_business_id
  ON public.projects(business_id);

-- CR-3: Fix SECURITY DEFINER on business_has_published_project
-- The function checks public data (published projects) and doesn't need
-- elevated privileges. SECURITY DEFINER was unnecessary.
-- Omitting SECURITY DEFINER defaults to SECURITY INVOKER.

CREATE OR REPLACE FUNCTION public.business_has_published_project(business_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.projects
        WHERE business_id = business_uuid
        AND status = 'published'
    );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.business_has_published_project(UUID) IS
  'Check if a business has at least one published project. Used in RLS policies for public visibility.';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Check indexes exist:
-- SELECT indexname, tablename FROM pg_indexes WHERE indexname LIKE '%business_id%' AND schemaname = 'public';
--
-- Check function security (prosecdef = false means SECURITY INVOKER):
-- SELECT proname, prosecdef FROM pg_proc WHERE proname = 'business_has_published_project';
