# Onboarding Conversation (Single Session)

## Goal
Ensure every business has exactly one long-lived onboarding conversation. The conversation is the source of truth for profile discovery and is resumable across devices and reloads.

## Data Model
- Table: `public.conversations`
- Purpose: `onboarding`
- Uniqueness: one onboarding conversation per business (enforced by a partial unique index on `(business_id)` where `purpose = 'onboarding'`).
- Storage:
  - `messages` (JSONB array): `{ id, role, content, created_at }`
  - `extracted` (JSONB): serialized `DiscoveryState`
  - `summary` (TEXT): optional compaction (future)

## API Behavior
`GET /api/onboarding`
- Authenticates user and loads the business record.
- Returns feature flag + onboarding status.
- Gets or creates the onboarding conversation.
- Returns persisted `messages` and `state`.
- If new, inserts the greeting as the first assistant message.

`POST /api/onboarding`
- Accepts a single user message.
- Loads the existing onboarding conversation.
- Runs the Discovery Agent with recent message history.
- Appends user + assistant messages to the stored conversation.
- Updates `extracted` with the latest `DiscoveryState`.

## Transcription
- `/api/ai/transcribe` permits authenticated users with incomplete profiles, so onboarding voice input works before profile completion.
- Project interview transcription still validates project ownership when metadata is provided.

## Rationale
- Keeps onboarding continuous and resumable with one conversation per business.
- Avoids client-side message replays or message count caps.
- Aligns with `docs/philosophy/agentic-first-experience.md` guidance for the `conversations` table.
