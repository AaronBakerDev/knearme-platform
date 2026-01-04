-- Migration: 024_add_description_blocks.sql
-- Description: Add structured description blocks to projects

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS description_blocks JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.projects.description_blocks IS
  'Structured description blocks for rich rendering (callouts, lists, stats, etc.).';
