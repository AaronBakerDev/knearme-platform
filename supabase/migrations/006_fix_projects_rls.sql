-- Fix infinite recursion by breaking the loop at the projects table level
-- The project policies were recursively checking contractors, which checked projects
-- We replace the direct subquery with a SECURITY DEFINER function

-- 1. Helper function
CREATE OR REPLACE FUNCTION get_auth_contractor_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id FROM contractors WHERE auth_user_id = auth.uid();
$$;

-- 2. Update projects policies to use the function
DROP POLICY IF EXISTS "Contractors can view own projects" ON projects;
DROP POLICY IF EXISTS "Contractors can insert own projects" ON projects;
DROP POLICY IF EXISTS "Contractors can update own projects" ON projects;
DROP POLICY IF EXISTS "Contractors can delete own projects" ON projects;

CREATE POLICY "Contractors can view own projects"
ON projects
FOR SELECT
TO public
USING (
  contractor_id IN (SELECT get_auth_contractor_ids())
);

CREATE POLICY "Contractors can insert own projects"
ON projects
FOR INSERT
TO public
WITH CHECK (
  contractor_id IN (SELECT get_auth_contractor_ids())
);

CREATE POLICY "Contractors can update own projects"
ON projects
FOR UPDATE
TO public
USING (
  contractor_id IN (SELECT get_auth_contractor_ids())
);

CREATE POLICY "Contractors can delete own projects"
ON projects
FOR DELETE
TO public
USING (
  contractor_id IN (SELECT get_auth_contractor_ids())
);
