-- Add missing columns for project creation API
-- These are needed by the MCP project creation flow

-- description_manual: tracks if description was manually provided vs AI-generated
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description_manual BOOLEAN DEFAULT FALSE;

-- state: stores the state/province for the project location
ALTER TABLE projects ADD COLUMN IF NOT EXISTS state TEXT;

-- Add comment for documentation
COMMENT ON COLUMN projects.description_manual IS 'True if description was manually provided, false if AI-generated';
COMMENT ON COLUMN projects.state IS 'State/province for project location';
