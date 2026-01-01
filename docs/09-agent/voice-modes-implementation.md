# Voice Interaction Modes: Full Scope and Implementation

> Status: In progress (Phase 3)
> Date: January 1, 2026
> Owner: Product + Engineering

This document defines the complete scope and implementation plan for three
interaction modes with the Interviewer agent:

1) Text -> Text
2) Voice -> Text
3) Voice -> Voice

The agent behavior, tool use, and project-building flow must remain identical
across modes. The differences are input and output modalities only.

---

## Goals

- Preserve the single Interviewer persona and behavior across all modes.
- Provide the most magical experience by default (Voice -> Voice) when safe.
- Degrade gracefully to Voice -> Text or Text -> Text based on conditions.
- Persist all conversations (including transcripts) in the same chat system.
- Keep the preview building in real time as the contractor speaks.

## Non-goals (initial release)

- Multi-persona UI or visible back-office agents.
- Rewriting the chat tool layer or prompt system.
- Adding new LLM providers beyond the current Gemini stack.
- Full offline voice support.

---

## Mode Definitions

### 1) Text -> Text
- Input: typed messages
- Output: typed replies
- Transport: existing `/api/chat` stream
- Best for: low bandwidth, no mic, users who prefer reading

### 2) Voice -> Text
- Input: spoken answer
- Output: typed replies
- Transport: record -> transcribe -> inject into `/api/chat`
- Best for: noisy environments (quick corrections) or unstable latency

### 3) Voice -> Voice
- Input: spoken answer (streaming)
- Output: spoken replies (streaming audio) + live transcript
- Transport: Live API WebSocket session with audio in/out
- Best for: strongest "magic" feel (hands-free, conversational)

---

## User-first Decision Tree

Start -> Does the contractor want to speak?
- No -> Text -> Text
- Yes -> Are mic + permissions available?
  - No -> Text -> Text (offer enable steps, do not block)
  - Yes -> Is the network latency stable + low?
    - Yes -> Voice -> Voice (default)
    - No -> Voice -> Text

Override rules:
- If user chooses "Read responses" -> Voice -> Text
- If user chooses "Just type" -> Text -> Text
- If voice mode fails mid-session -> auto-switch to Voice -> Text

---

## UX Flow (shared behavior)

All modes share the Interviewer behavior:
- One short question at a time.
- Quick acknowledgement of the last answer.
- Continuous preview updates.
- Never block progress.

### Text -> Text UI
- Standard chat input
- Action chips for quick responses
- Preview updates after each message

### Voice -> Text UI
- Push-to-talk button (primary)
- Live waveform + timer while recording
- Transcript shown immediately after processing
- "Edit" and "Re-record" actions
- "Switch to typing" always visible

### Voice -> Voice UI
- Push-to-talk or tap-to-talk (configurable)
- Live transcript under the waveform
- Agent audio playback with a clear "interrupt" affordance
- If Live API signals interruption, flush audio buffer immediately

---

## Architecture Summary

### Current Chat Architecture (shared)
- `/api/chat` streams responses using the unified system prompt.
- Tools run server-side, with tool schemas in `src/lib/chat/tool-schemas.ts`.
- Conversations stored in `chat_sessions` and `chat_messages`.

### New: Mode Manager Layer

Introduce a client-side "Mode Manager" that chooses a transport:

- `TextTransport` -> existing `/api/chat`
- `VoiceToTextTransport` -> record/transcribe then `/api/chat`
- `VoiceToVoiceTransport` -> Live API WebSocket session

Each transport must:
- send user input in a common format
- receive assistant output in a common format
- emit a normalized transcript for persistence and context compaction

---

## Implementation Notes (current)

- Mode Manager hook added in `src/components/chat/hooks/useVoiceModeManager.ts`.
- Chat input now shows a Talk/Type toggle and uses the existing Voice -> Text pipeline.
- Live API (Voice -> Voice) is implemented with:
  - `/api/ai/live-session` (ephemeral token + session config)
  - `/api/chat/tools` (server-side tool execution for live sessions)
  - `useLiveVoiceSession` + `VoiceLiveControls` for push-to-talk audio, transcripts, and tool bridging.
- Phase 3 refinements:
  - Barge-in: skip assistant audio while the user is speaking, flush playback on interruption.
  - Transcript throttling to reduce UI churn during streaming updates.
  - Expanded Live API tool coverage (generation/layout/publish check) with deep-tool gating
    based on explicit user intent in `/api/chat/tools`.
  - Live tool errors return `output-error` tool parts without killing the session.

### Runtime Configuration

- `NEXT_PUBLIC_VOICE_VOICE_ENABLED=true` to surface the Voice -> Voice toggle.
- `GEMINI_LIVE_MODEL` to override the Live API model if needed (default:
  `gemini-2.5-flash-native-audio-preview-12-2025`). Prefixing with `models/` is
  accepted and normalized.

### Live API References

- https://ai.google.dev/gemini-api/docs/live?example=mic-stream
- https://ai.google.dev/gemini-api/docs/live-guide
- https://ai.google.dev/gemini-api/docs/live-tools
- https://ai.google.dev/gemini-api/docs/live-session
- https://ai.google.dev/gemini-api/docs/ephemeral-tokens
- https://ai.google.dev/api/live

---

## Detailed Implementation

### A) Client: Mode Manager

Create a shared state machine for interview I/O:

State:
- `mode`: 'text' | 'voice_text' | 'voice_voice'
- `status`: 'idle' | 'listening' | 'processing' | 'speaking' | 'error'
- `transcriptBuffer`: string
- `networkQuality`: 'good' | 'degraded'

Key behaviors:
- Automatically choose the best mode on start.
- Provide a visible manual toggle (always).
- Auto-switch to Voice -> Text when Live API fails or latency spikes.
- Never interrupt the Interviewer prompt or tool flow.

### B) Voice -> Text (record + transcribe)

Pipeline:
1) Use `useVoiceRecording` (already implemented) to record audio.
2) POST audio to `/api/ai/transcribe`.
3) Inject transcript as a user message in `/api/chat`.
4) Render assistant reply as text.

Action items:
- Wrap `useVoiceRecording` with the Mode Manager.
- Attach transcript as `parts` for consistent storage.
- Optional: allow "live partial transcript" in Phase 2.

Transcriber abstraction:
- `transcribeAudio(blob): Promise<string>`
- default uses current Whisper path
- optional Google STT or Gemini audio for future swap

### C) Voice -> Voice (Live API)

Live API flow (client-driven WebSocket):
1) Client requests ephemeral token from `/api/ai/live-session`.
2) Client opens a Live API WebSocket session.
3) Client streams PCM 16 kHz audio frames.
4) Server sends PCM 24 kHz audio frames + transcripts.
5) Tool calls are bridged to the server for execution.
6) Transcripts are persisted to chat.

Key client tasks:
- Replace MediaRecorder with AudioWorklet to produce PCM 16 kHz.
- Playback PCM 24 kHz output via AudioWorklet.
- Handle `interrupted` server signals by flushing playback buffer.

Tool bridging:
- Live API emits tool calls -> client -> `/api/chat/tools` (new endpoint)
- Server executes tool + returns result
- Client sends tool result back to Live session

Persistence:
- For each user/assistant turn, save transcript text to `chat_messages`
- Attach `parts` to preserve alignment with existing context loader

### Voice Safeguards (Prevent Runaway Cost + Accidental Recording)

Safeguards apply to both Voice -> Text and Voice -> Voice. The system should
stop recording or stop streaming audio when the user is not actively speaking.

Core safeguards:
- Push-to-talk as the default for Voice -> Voice (no always-on mic).
- Voice activity gating: only stream frames while speech is detected.
- Silence cutoff: stop streaming after 1-2 seconds of silence.
- Idle timeout: auto-end the voice session after 20-30 seconds of inactivity.
- Visibility guard: on tab background or phone lock, stop mic and close session.
- Explicit stop control: show a clear "Stop listening" affordance while active.
- Session cap: enforce a max live session duration with a "Tap to continue"
  reconnect flow.
- Auto-fallback: if the Live API disconnects or fails, switch to Voice -> Text.
- No silent streaming: never send PCM silence frames continuously.

### Fair Use Caps (Initial)

- Free plan: up to 30 minutes per month of Voice -> Text.
- Pro plan: up to 200 minutes per month of Voice -> Voice.
- After cap, auto-switch to Voice -> Text so work never blocks.

### D) Shared Prompting and Tooling

- Use the same interviewer prompt and context injection as `/api/chat`.
- Keep fast-turn tools available in voice modes.
- Avoid full deep-context tools unless explicitly invoked.

---

## Proposed API Additions

### 1) `POST /api/ai/live-session`
- Returns ephemeral token + session config
- Config includes:
  - model name
  - response modality (TEXT or AUDIO)
  - system prompt with project context
  - tool schemas

### 2) `POST /api/chat/tools`
- Executes tool calls on behalf of Live API sessions
- Validates and returns tool results in a standard schema

---

## Data Model Updates

Optional, but recommended for analytics and debugging:

- `chat_sessions.voice_mode` (text | voice_text | voice_voice)
- `chat_messages.voice_metadata` (jsonb: latency, transcript_confidence)
- `interview_sessions.transcript_mode` (voice_text | voice_voice)

Keep transcripts stored as plain text in `chat_messages` for context loading.

---

## Observability and Monitoring

Track:
- Voice start success rate
- Live session connection failures
- Average transcription latency
- Average audio round-trip latency (voice -> response)
- Auto-switch frequency

Add telemetry hooks in:
- `src/lib/observability/traced-ai.ts`
- voice client mode manager

---

## Security

- Live API should use ephemeral tokens to avoid exposing long-lived keys.
- All tool execution remains server-side.
- Validate tool inputs on the server and enforce RLS.
- Ensure audio storage remains temporary unless explicitly retained.

---

## Cost Model (Snapshot)

NOTE: Update pricing and formulas with the latest published numbers prior to
launch. Keep a "Pricing last verified" field in the ops dashboard.

Live API (Gemini native audio):
- Audio input tokens are priced higher than text input.
- Audio output tokens are the highest cost category.
- Cost depends on audio length, speaking rate, and tokenization.

Alternative (Speech-to-Text + Text-only LLM + Text-to-Speech):
- STT cost is typically per minute of audio.
- TTS cost is typically per character of generated text.

Recommendation:
- Use Live API for "magic" sessions.
- Provide Voice -> Text fallback for cost control and unstable networks.

---

## Rollout Phases

### Phase 0: Decision and baseline
- Confirm which service handles voice transcription in Voice -> Text.
- Decide whether to keep Whisper as fallback.

### Phase 1: Mode Manager + Voice -> Text
- Introduce a mode selector UI and state machine.
- Route audio transcripts through existing `/api/chat`.
- Record baseline metrics for transcription latency.

### Phase 2: Live API Voice -> Voice (MVP)
- Add `/api/ai/live-session` + client WebSocket session.
- Audio capture + playback with PCM conversion.
- Minimal tool bridging.

### Phase 3: Live API refinement
- Add barge-in handling and smooth interruption.
- Improve preview update throttling.
- Expand tool coverage and error recovery.

### Phase 4: UX polish
- Streamlined UI for busy, one-handed use.
- "Magic" moments (instant recap, fast preview updates).

---

## Open Questions

- Should Voice -> Text use Live API (TEXT mode) or a separate STT service?
- How do we handle long sessions beyond Live API time limits?
- Do we keep Whisper as a fallback, or fully migrate to Google services?

---

## Appendix: UX Copy (Draft)

- Mode toggle: "Talk" | "Talk, hear me" | "Type"
- Fallback banner: "Connection is rough. I will keep listening and respond in text."
- Permission help: "We need your mic to take voice answers. You can type instead."
