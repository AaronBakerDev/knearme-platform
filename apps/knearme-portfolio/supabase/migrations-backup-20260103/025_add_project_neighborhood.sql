-- Add neighborhood field to projects for more precise location display

ALTER TABLE projects ADD COLUMN IF NOT EXISTS neighborhood TEXT;

COMMENT ON COLUMN projects.neighborhood IS 'Neighborhood or local area where the project took place';
