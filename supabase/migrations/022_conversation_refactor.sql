-- Migration: Conversation Refactoring for Single-Session Model
--
-- Adds columns to support:
-- 1. Smart context loading with conversation summaries
-- 2. Token budget tracking for context compaction
-- 3. Project-level conversation summary (distinct from session summaries)
--
-- @see /Users/aaronbaker/.claude/plans/splendid-finding-church.md
-- @see /src/lib/chat/context-loader.ts (to be created)

-- ============================================
-- 1. Add conversation_summary to projects
-- ============================================
-- Stores a compacted summary of the entire conversation history
-- Used when the full message history exceeds the context budget

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS conversation_summary TEXT;

COMMENT ON COLUMN projects.conversation_summary IS
  'Compacted summary of all conversation history for this project. Used for context loading when full history exceeds token budget.';

-- ============================================
-- 2. Ensure ai_context JSONB column exists on projects
-- ============================================
-- Stores structured context data extracted from conversation
-- (May already exist as ai_memory; this is a complement)

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS ai_context JSONB DEFAULT '{}';

COMMENT ON COLUMN projects.ai_context IS
  'Structured AI context data extracted from conversations (extracted_data, facts, preferences).';

-- ============================================
-- 3. Add message tracking to chat_sessions
-- ============================================
-- Tracks message count and estimated tokens for compaction decisions

ALTER TABLE chat_sessions
ADD COLUMN IF NOT EXISTS message_count INT DEFAULT 0;

ALTER TABLE chat_sessions
ADD COLUMN IF NOT EXISTS estimated_tokens INT DEFAULT 0;

COMMENT ON COLUMN chat_sessions.message_count IS
  'Number of messages in this session. Updated on each message save.';

COMMENT ON COLUMN chat_sessions.estimated_tokens IS
  'Estimated token count for context budget calculations.';

-- ============================================
-- 4. Ensure session_summary and key_facts exist
-- ============================================
-- These are used by memory.ts but may not have been migrated

ALTER TABLE chat_sessions
ADD COLUMN IF NOT EXISTS session_summary TEXT;

ALTER TABLE chat_sessions
ADD COLUMN IF NOT EXISTS key_facts JSONB DEFAULT '[]';

COMMENT ON COLUMN chat_sessions.session_summary IS
  'AI-generated summary of this session for context continuity.';

COMMENT ON COLUMN chat_sessions.key_facts IS
  'Array of key facts extracted from conversation (preferences, corrections, context).';

-- ============================================
-- 5. Create index for session lookup by project
-- ============================================
-- Optimizes the single-session-per-project pattern

CREATE INDEX IF NOT EXISTS idx_chat_sessions_project_updated
  ON chat_sessions(project_id, updated_at DESC);

-- ============================================
-- 6. Ensure ai_memory exists on projects (if not already)
-- ============================================
-- Used by memory.ts for project-level memory

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS ai_memory JSONB;

COMMENT ON COLUMN projects.ai_memory IS
  'Persistent AI memory that spans across all sessions for this project.';
