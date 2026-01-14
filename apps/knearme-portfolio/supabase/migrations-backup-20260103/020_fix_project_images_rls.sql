-- Fix project_images RLS policy to prevent recursion issues
--
-- Problem: The original policy queries `projects` which has its own RLS,
-- causing evaluation conflicts when using nested relations in Supabase queries.
-- This caused the dashboard to show project counts but fail to fetch actual data.
--
-- Solution: Use the get_auth_contractor_ids() helper function (SECURITY DEFINER)
-- which bypasses nested RLS evaluation, matching how projects table policies work.
--
-- @see /docs/03-architecture/data-model.md
-- @see /supabase/migrations/006_fix_projects_rls.sql (similar fix for projects)

-- Drop existing policies
DROP POLICY IF EXISTS "Contractors can manage own project images" ON public.project_images;
DROP POLICY IF EXISTS "Public can view images of published projects" ON public.project_images;

-- Recreate contractor policy using the helper function
-- This avoids nested RLS evaluation on the projects table
CREATE POLICY "Contractors can manage own project images"
ON public.project_images FOR ALL
USING (
  project_id IN (
    SELECT id FROM public.projects
    WHERE contractor_id IN (SELECT get_auth_contractor_ids())
  )
)
WITH CHECK (
  project_id IN (
    SELECT id FROM public.projects
    WHERE contractor_id IN (SELECT get_auth_contractor_ids())
  )
);

-- Public policy for viewing images of published projects (unchanged logic)
CREATE POLICY "Public can view images of published projects"
ON public.project_images FOR SELECT
USING (
  project_id IN (
    SELECT id FROM public.projects
    WHERE status = 'published'
  )
);

-- Add comment documenting the fix
COMMENT ON POLICY "Contractors can manage own project images" ON public.project_images IS
  'Uses get_auth_contractor_ids() to avoid RLS recursion. See migration 020.';
