# Agent Architecture (Chat + Context System)

This directory documents how the portfolio chat agent works after the single-session refactor.
It focuses on how conversations are persisted, how context is loaded, and how summaries are produced.

## Overview

The agent is a Next.js + Supabase chat system that powers the portfolio creation and edit experience.
Key traits:
- **One active session per project** via `/api/chat/sessions/by-project/[projectId]` (shared across all chat entry points).
- **Eager project creation** on the first message (create mode) for immediate persistence.
- **Smart context loading** that swaps full history for summary + recent messages when the context budget is exceeded.
- **Server as source of truth** (no IndexedDB/offline layer).

## High-Level Architecture

```mermaid
flowchart TB
  User[Contractor] --> UI[Chat UI\nChatWizard]

  UI -->|stream chat| ChatAPI[/api/chat (unified)]
  UI -->|session + context| SessionAPI[/api/chat/sessions.../]
  UI -->|save messages| MessagesAPI[/api/chat/sessions/:id/messages/]
  UI -->|auto-summarize| SummarizeSessionAPI[/api/chat/sessions/:id/summarize/]

  SessionAPI --> ContextLoader[context-loader.ts]
  ContextLoader --> DB[(Supabase\nprojects, chat_sessions, chat_messages)]

  MessagesAPI --> DB

  SummarizeSessionAPI --> Memory[memory.ts\n(session_summary + key_facts)]
  Memory --> DB

  ChatAPI --> AI[Gemini via Vercel AI SDK]
  ChatAPI --> Tools[Tool schemas & UI artifacts]

  SummarizeConversationAPI[/api/ai/summarize-conversation/] --> ContextCompactor[context-compactor.ts]
  ContextCompactor --> DB
```

## Core Conversation Flow (Create Mode)

```mermaid
sequenceDiagram
  actor U as Contractor
  participant UI as ChatWizard
  participant S as /api/chat/sessions/by-project/:projectId
  participant C as /api/chat/sessions/:id/context
  participant L as context-loader.ts
  participant DB as Supabase

  U->>UI: Open project
  UI->>S: Get-or-create session
  S->>DB: select/create chat_sessions
  DB-->>S: session
  S-->>UI: session + isNew

  alt existing session
    UI->>C: GET context?projectId
    C->>L: loadConversationContext
    L->>DB: load project + session + messages
    DB-->>L: data
    L-->>C: context (full or summary+recent)
    C-->>UI: context payload
    UI->>UI: prepend summary as system message if compacted
  end
```

## Context Loading Decision

```mermaid
flowchart TD
  A[message_count from chat_sessions] --> B{shouldCompact?}
  B -- No --> C[Load all messages]
  B -- Yes --> D[Pick summary\nproject.conversation_summary or session.session_summary]
  D --> E[Load recent messages (10)]
  C --> F[Return context: messages + projectData]
  E --> F
```

Notes:
- **Budget constants** live in `src/lib/chat/context-loader.ts` (e.g., `MAX_CONTEXT_TOKENS = 30_000`).
- When compacted, the client prepends a system message built by `createSummarySystemMessage(...)`.

## Summarization & Memory Paths

There are two related summarization paths:

```mermaid
flowchart LR
  Trigger1[Session end or inactivity\nuseAutoSummarize] --> SummarizeSession[/api/chat/sessions/:id/summarize/]
  SummarizeSession --> Memory[memory.ts]
  Memory --> DB1[chat_sessions.session_summary\nchat_sessions.key_facts\nprojects.ai_memory]

  Trigger2[Manual/explicit compaction\n/ai/summarize-conversation] --> SummarizeConversation[/api/ai/summarize-conversation/]
  SummarizeConversation --> Compactor[context-compactor.ts]
  Compactor --> DB2[projects.conversation_summary\nchat_sessions.session_summary]
```

## Data Model (Relevant Tables)

```mermaid
erDiagram
  projects ||--o{ chat_sessions : has
  chat_sessions ||--o{ chat_messages : contains

  projects {
    uuid id
    text title
    text conversation_summary
    jsonb ai_context
    jsonb ai_memory
  }

  chat_sessions {
    uuid id
    uuid project_id
    text mode
    int message_count
    int estimated_tokens
    text session_summary
    jsonb key_facts
  }

  chat_messages {
    uuid id
    uuid session_id
    text role
    text content
    jsonb metadata
  }
```

## Key Files & APIs

- `src/components/chat/ChatWizard.tsx` – Unified create/edit chat UI and session bootstrap.
- `src/lib/chat/context-loader.ts` – Server-side smart context loading.
- `src/lib/chat/context-shared.ts` – Shared types/utilities for summary and project context.
- `src/lib/chat/context-compactor.ts` – Summarization for long conversations.
- `src/lib/chat/memory.ts` – Session summary + key facts + project memory.
- `src/app/api/chat/sessions/[id]/context/route.ts` – Context API endpoint.
- `src/app/api/chat/sessions/[id]/messages/route.ts` – Message persistence.
- `src/app/api/chat/sessions/[id]/summarize/route.ts` – Session-end summary + key facts.
- `src/app/api/ai/summarize-conversation/route.ts` – Compaction summary endpoint.
- `supabase/migrations/022_conversation_refactor.sql` – Schema updates for summaries + context.
- `supabase/migrations/023_archive_multi_session_data.sql` – Data migration to single-session model.

## Practical Notes

- **Single session per project** is shared across create/edit flows (no mode separation).
- Context loading always includes **project data** (title, type, location, extracted data, etc.).
- When the history is large, **summary + recent messages** are used instead of full history.
- The client **persists messages** via `/api/chat/sessions/:id/messages` after streaming completes.
- **Publish readiness**: `checkPublishReady` is for coaching; final gating uses `validateForPublish` (dry_run on `/api/projects/[id]/publish`).
- `chat_sessions.mode` is a legacy field and is no longer used for routing behavior.
- Auto-summarize only triggers once conversations exceed the context budget.

## Proposals

- `docs/09-agent/project-chat-unification.md` – Proposal to unify create/edit chat UI, persistence, and cleanup.
- `docs/09-agent/multi-agent-system-review.md` – Review of current multi-agent wiring, gaps, and recommendations.
