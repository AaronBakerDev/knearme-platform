# AI SDK Phase 8 — Agent Architecture

> Goal: Improve agent reliability, observability, and capability.
> Source of truth: `docs/ai-sdk/implementation-roadmap.md`

## Agent Reliability
- [x] Increase tool step limit (3 → 10) in chat route
- [x] Add `requestClarification` tool + ClarificationCard artifact
- [x] Add uncertainty thresholds + clarification prompts

## Observability
- [x] Implement Langfuse client + traced model wrapper
- [x] Add tracing middleware in chat route
- [x] Track cost + latency in spans
- [x] Add KPI events (time-to-publish, interview completion, regeneration usage)

## Type Safety
- [x] Improve tool context typing (`ToolContext` / projectId / sessionId)
- [x] Enforce typed tool inputs/outputs across tools

## Deliverables
- [x] Multi-tool responses supported without truncation
- [x] Clarification flow visible to users
- [x] Tracing + KPI dashboards available

## References
- `docs/ai-sdk/implementation-roadmap.md`
- `docs/ai-sdk/observability-spec.md`
- `docs/ai-sdk/chat-artifacts-spec.md`
