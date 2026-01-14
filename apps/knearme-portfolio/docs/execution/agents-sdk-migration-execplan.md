# Migrate from Vercel AI SDK to OpenAI Agents SDK (TypeScript)

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This plan must be maintained in accordance with `../PLANS.md` (located one level above the repository root).

## Purpose / Big Picture

Standardize all agentic flows on OpenAI Responses API and the OpenAI Agents SDK (TypeScript), replacing the Vercel AI SDK orchestration and Gemini models. This migration should simplify orchestration, unlock OpenAI hosted tools (web search, file search, computer use, code interpreter, image generation), and centralize observability using Agents SDK tracing. A developer can validate success by running onboarding and chat flows end-to-end with the new Agents runtime while preserving existing UI artifacts, conversation persistence, and tool-driven state updates.

## Progress

- [x] (2026-01-11) Confirmed migration decisions: Option C custom stream contract, tiered GPT-5.* model responsibilities, clean cutover, and OpenAI mini audio models for voice.
- [x] (2026-01-11) Defined custom stream event contract and client parser plan in `docs/04-apis/agents-sdk-streaming-contract.md`.
- [ ] (TBD) Inventory AI SDK usage and prioritize migration order.
- [ ] (TBD) Introduce OpenAI Agents SDK foundation (client, model config, tracing, sessions).
- [ ] (TBD) Migrate core chat/onboarding streaming endpoints to Agents SDK.
- [ ] (TBD) Replace Gemini-dependent content generation and image analysis with Responses API + structured outputs.
- [ ] (TBD) Replace web search and other tools with OpenAI hosted tools.
- [ ] (TBD) Remove Vercel AI SDK dependencies and update observability.
- [ ] (TBD) Validate, load-test, and ship.

## Surprises & Discoveries

- Observation: `PLANS.md` and `EXECPLAN_TEMPLATE.md` are referenced in `AGENTS.md` but are not present at the repository root.
  Evidence: repo root listing does not contain `PLANS.md` or `EXECPLAN_TEMPLATE.md`.
- Observation: The current AI stack mixes agent orchestration, tool schemas, and UI artifact rendering around Vercel AI SDK `parts`.
  Evidence: `src/components/chat` and `src/lib/chat` rely on AI SDK v6 message/tool parts.

## Decision Log

- Decision: Standardize all agentic workflows on OpenAI Responses API and OpenAI Agents SDK (TypeScript).
  Rationale: Built-in tools and Agents SDK orchestration are only available with OpenAI Responses models.
  Date/Author: 2026-01-11 / Codex
- Decision: Use a custom server-streamed event contract (Option C) to preserve UI artifacts while replacing streaming internals.
  Rationale: Clean cutover from AI SDK with minimal UI changes and stable event semantics.
  Date/Author: 2026-01-11 / Codex
- Decision: Use Agents SDK tracing as the default observability, with optional bridge to Langfuse if needed.
  Rationale: Reduce reliance on AI SDK telemetry while keeping metrics continuity.
  Date/Author: 2026-01-11 / Codex
- Decision: Adopt tiered GPT-5.* model responsibilities (5.1 for orchestration/tool-heavy, 5-mini for general chat, 5-nano for lightweight tasks).
  Rationale: Balance quality, latency, and cost per workflow.
  Date/Author: 2026-01-11 / Codex
- Decision: Clean cutover from Vercel AI SDK and Gemini with OpenAI as the single provider.
  Rationale: Required for hosted tools and simpler operations.
  Date/Author: 2026-01-11 / Codex
- Decision: Use OpenAI mini audio models for voice (STT/TTS) to keep costs low.
  Rationale: Voice flows can be cheaper without impacting agent quality.
  Date/Author: 2026-01-11 / Codex

## Outcomes & Retrospective

Work not yet executed. Outcome will be recorded after implementation and validation.

## Context and Orientation

The current AI runtime is based on the Vercel AI SDK with Gemini models. Server-side generation lives in `src/app/api/chat/route.ts` and `src/app/api/onboarding/route.ts`, with additional AI utilities in `src/lib/ai/*` (content generation, image analysis, transcription). Agent orchestration lives in `src/lib/agents/*`, while chat UI rendering expects AI SDK `parts` and tool outputs in `src/components/chat/*`. Observability uses OpenTelemetry via the Vercel AI SDK (`src/lib/observability/*`).

The migration replaces these runtime layers with OpenAI Responses API and the Agents SDK. Tooling should leverage OpenAI hosted tools where possible (web search, file search, computer use, code interpreter, image generation). Function tools and MCP tools will remain for business logic and UI artifacts.

## Plan of Work

Phase 0: Inventory and decision checkpoints

- Map every AI SDK usage and classify it into: chat streaming, structured output generation, image analysis, transcription, web search, tool execution, or UI artifact rendering.
- Decide which flows will use Agent orchestration vs direct Responses API calls (for non-agent utilities like transcription).
- Define the custom server-streamed event contract and plan the client streaming parser (replacing `@ai-sdk/react`).

Phase 1: OpenAI foundation layer

- Add a new OpenAI client module and Responses model config in `src/lib/openai/*`.
- Implement a single “Agents runtime” module to host:
  - Model selection (default OpenAI Responses model)
  - Agent definitions (instructions, tools)
  - Shared run options (maxTurns, timeouts, streaming config)
- Add tracing configuration (enable by default, opt-out for PII-sensitive flows).
- Add session abstraction (OpenAI Conversations session or local DB-backed session).
- Define the model responsibility matrix (gpt-5.1, gpt-5-mini, gpt-5-nano) and map each workflow.

Phase 2: Replace AI utilities (non-agent flows)

- Migrate `src/lib/ai/content-generation.ts` to Responses API structured output.
- Migrate `src/lib/ai/image-analysis.ts` to Responses API multimodal structured output.
- Migrate `src/lib/ai/transcription.ts` to OpenAI speech-to-text endpoint (non-agent).
- Migrate voice output (if used) to OpenAI text-to-speech mini model.
- Keep existing Zod schemas in `src/lib/ai/schemas.ts`, but update parsing to Responses API helpers.

Phase 3: Migrate agent orchestration and tools

- Convert `src/lib/agents/*` to Agents SDK Agents with explicit tool definitions.
- Replace AI SDK tool schema handling with Agents SDK `tool()` definitions and Zod schemas.
- Replace custom web search agent (`src/lib/agents/web-search.ts`) with hosted `web_search` tool.
- Wire MCP tools using Agents SDK MCP integration for any external tool servers.

Phase 4: Server streaming endpoints

- Replace `POST /api/chat` and `POST /api/onboarding` to run Agents SDK with streaming.
- Define the custom server-streamed event schema and map Agents SDK stream events into it.
- Preserve artifact rendering expectations (`src/components/chat/artifacts/*`) by mapping tool outputs into existing artifact payloads.

Phase 5: Observability and telemetry

- Replace Langfuse OpenTelemetry hooks with Agents SDK tracing.
- If Langfuse continuity is required, implement a trace processor to export spans or add a lightweight adapter.
- Update docs and dashboards to reflect new telemetry sources.

Phase 6: Decommission AI SDK dependencies

- Remove `ai`, `@ai-sdk/*`, and Gemini provider dependencies once all flows are migrated.
- Delete or archive AI SDK-specific docs under `docs/ai-sdk` if no longer relevant.
- Update `package.json` and environment variable references.

Phase 7: Validation and rollout

- Run regression tests for onboarding, chat, and portfolio generation flows.
- Add performance checks for latency and token usage under Responses API.
- Roll out behind a feature flag if needed (e.g., `OPENAI_AGENTS_RUNTIME=true`).

## Concrete Steps

Work from the repository root at `/Users/aaronbaker/knearme-workspace/knearme-portfolio`.

1) Inventory AI SDK usage.

   rg -n "@ai-sdk|generateText|streamText|useChat|tool parts" -S src

2) Create foundational OpenAI modules and a skeleton Agents runtime (no behavior change yet).

3) Migrate non-agent utilities first (`content-generation`, `image-analysis`, `transcription`) and validate with unit tests.

4) Migrate agent orchestration and tool definitions, then replace `/api/onboarding` and `/api/chat` streaming.

5) Update UI streaming parsing if the event schema changes.

6) Remove AI SDK dependencies and clean docs.

## Validation and Acceptance

Acceptance is met when all of the following are true.

- Onboarding chat completes successfully using Agents SDK with built-in tools and persists the same state as before.
- `/api/chat` streaming works end-to-end and renders existing chat artifacts without regressions.
- Content generation and image analysis produce valid structured outputs under Responses API with the existing Zod schemas.
- Observability includes trace spans for agent runs and tools, and no critical telemetry regressions are observed.
- `npm run lint` and `npm run build` succeed.

## Idempotence and Recovery

All changes should be phased and reversible. Prefer a clean cutover, but keep a fast rollback path (short-lived feature flag or git revert) while validating production. If a new Agents tool definition breaks a flow, revert the single tool and re-run the targeted tests before continuing.

## Artifacts and Notes

Include short evidence snippets in this section as changes are made (e.g., updated run config, updated tool schemas, or test output). Use short indented blocks rather than code fences to avoid breaking the ExecPlan format.

## Interfaces and Dependencies

The implementation must define or update these interfaces and helpers.

- New: `src/lib/openai/client.ts` (OpenAI client config + env validation)
- New: `src/lib/openai/agents-runtime.ts` (Agent registry, shared run settings)
- Update: `src/lib/ai/providers.ts` (replace Gemini config with OpenAI model config)
- Update: `src/lib/ai/content-generation.ts` (Responses API structured output)
- Update: `src/lib/ai/image-analysis.ts` (Responses API multimodal)
- Update: `src/lib/ai/transcription.ts` (OpenAI speech-to-text)
- Update: `src/lib/voice/*` (OpenAI text-to-speech mini model, if voice output is required)
- Update: `src/lib/agents/*` (Agents SDK definitions and tool wiring)
- Update: `src/app/api/chat/route.ts` and `src/app/api/onboarding/route.ts` (streaming from Agents SDK)
- Update: `src/components/chat/*` (if streaming format changes)
- Update: `src/lib/observability/*` (Agents SDK tracing)

## Open Questions

- Confirm the exact OpenAI audio model IDs for STT/TTS in the voice flow.
- Is a short-lived rollback flag required for the first production deploy?

## Plan Update Notes

Plan created on 2026-01-11 to frame the Agents SDK migration and to capture missing `PLANS.md`/`EXECPLAN_TEMPLATE.md` discovery. Updated on 2026-01-11 with streaming and model decisions.
