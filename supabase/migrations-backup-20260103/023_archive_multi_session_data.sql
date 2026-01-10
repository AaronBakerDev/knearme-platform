-- Migration: Archive Multi-Session Data
--
-- Part of the refactoring from "multiple sessions per project" to
-- "one continuous conversation per project".
--
-- This migration:
-- 1. Archives older sessions, keeping only the most recent per project
-- 2. Copies session summaries to project level
-- 3. Updates message counts for existing sessions
--
-- @see /Users/aaronbaker/.claude/plans/splendid-finding-church.md
-- @see 022_conversation_refactor.sql for schema changes

-- ============================================
-- 1. Archive older sessions (keep most recent per project)
-- ============================================
-- For projects that have multiple 'create' mode sessions,
-- keep only the most recent one active and archive the rest.

DO $do$
DECLARE
  archived_count INT;
  updated_summaries INT;
  updated_counts INT;
BEGIN
  IF to_regclass('public.chat_sessions') IS NULL THEN
    RAISE NOTICE 'Skipping migration 023: chat_sessions table does not exist.';
    RETURN;
  END IF;

  WITH ranked_sessions AS (
    SELECT
      id,
      project_id,
      ROW_NUMBER() OVER (
        PARTITION BY project_id
        ORDER BY updated_at DESC
      ) as rn
    FROM chat_sessions
    WHERE mode = 'create'
      AND project_id IS NOT NULL
  )
  UPDATE chat_sessions
  SET mode = 'archived'
  WHERE id IN (
    SELECT id FROM ranked_sessions WHERE rn > 1
  );

  -- ============================================
  -- 2. Copy session summaries to project level
  -- ============================================
  -- For sessions that have summaries, copy them to the project's
  -- conversation_summary field (if project doesn't already have one).

  UPDATE projects p
  SET conversation_summary = cs.session_summary
  FROM chat_sessions cs
  WHERE cs.project_id = p.id
    AND cs.session_summary IS NOT NULL
    AND p.conversation_summary IS NULL
    AND cs.mode = 'create';

  -- ============================================
  -- 3. Copy key_facts from session to project ai_context
  -- ============================================
  -- Merge session key_facts into project ai_context

  UPDATE projects p
  SET ai_context = COALESCE(p.ai_context, '{}')::jsonb ||
    jsonb_build_object('key_facts', cs.key_facts)
  FROM chat_sessions cs
  WHERE cs.project_id = p.id
    AND cs.key_facts IS NOT NULL
    AND jsonb_array_length(cs.key_facts) > 0
    AND cs.mode = 'create'
    AND (p.ai_context IS NULL OR NOT p.ai_context ? 'key_facts');

  -- ============================================
  -- 4. Update message counts for existing sessions
  -- ============================================
  -- Count actual messages and update the message_count field

  UPDATE chat_sessions cs
  SET message_count = (
    SELECT COUNT(*)
    FROM chat_messages cm
    WHERE cm.session_id = cs.id
  )
  WHERE cs.message_count = 0
    AND cs.mode IN ('create', 'edit');

  -- ============================================
  -- 5. Estimate tokens for existing sessions
  -- ============================================
  -- Rough estimate: 150 tokens per message (average)

  UPDATE chat_sessions cs
  SET estimated_tokens = message_count * 150
  WHERE estimated_tokens = 0
    AND message_count > 0;

  SELECT COUNT(*) INTO archived_count
  FROM chat_sessions WHERE mode = 'archived';

  SELECT COUNT(*) INTO updated_summaries
  FROM projects WHERE conversation_summary IS NOT NULL;

  SELECT COUNT(*) INTO updated_counts
  FROM chat_sessions WHERE message_count > 0;

  RAISE NOTICE 'Migration 023 complete: % sessions archived, % projects with summaries, % sessions with counts',
    archived_count, updated_summaries, updated_counts;
END $do$;
