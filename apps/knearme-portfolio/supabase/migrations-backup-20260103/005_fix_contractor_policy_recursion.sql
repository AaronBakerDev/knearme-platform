-- Fix infinite recursion in contractors RLS policy
-- Issue: "infinite recursion detected in policy for relation 'contractors'"
-- Cause: Public contractors SELECT policy referenced projects, whose SELECT
-- policies reference contractors, creating a recursive evaluation loop.

-- 1) Helper function that bypasses RLS to check published projects
CREATE OR REPLACE FUNCTION public.contractor_has_published_project(c_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.contractor_id = c_id
      AND p.status = 'published'
  );
$$;

COMMENT ON FUNCTION public.contractor_has_published_project IS
  'Returns true when the contractor has at least one published project. Uses SECURITY DEFINER to avoid RLS recursion.';

-- 2) Replace the recursive policy with function-based check
DROP POLICY IF EXISTS "Public can view contractors with published projects" ON public.contractors;

CREATE POLICY "Public can view contractors with published projects"
ON public.contractors FOR SELECT
USING (public.contractor_has_published_project(id));

