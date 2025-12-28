-- Migration: Add mode column to chat_sessions table
--
-- This allows distinguishing between 'create' mode (new project wizard)
-- and 'edit' mode (editing existing projects via AI assistant).
--
-- @see /src/app/api/chat/sessions/route.ts - API that uses this column
-- @see /todo/ai-sdk-phase-6-edit-mode.md - Code review finding #1 & #2

-- Add mode column with check constraint
ALTER TABLE chat_sessions
ADD COLUMN IF NOT EXISTS mode text DEFAULT 'create'
CHECK (mode IN ('create', 'edit'));

-- Add comment for documentation
COMMENT ON COLUMN chat_sessions.mode IS 'Session mode: create (new project wizard) or edit (editing existing project)';

-- Create index for filtering sessions by mode
CREATE INDEX IF NOT EXISTS idx_chat_sessions_mode ON chat_sessions(mode);
