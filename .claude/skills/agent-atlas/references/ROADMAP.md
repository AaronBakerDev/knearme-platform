# Agent System Roadmap

> Current state and design decisions for the agent system.

---

## Philosophy Status

The agent system follows **Orchestrator + Subagents** architecture:
- ✅ Philosophy migrations complete (Phases 1-4)
- 🔄 Phase 10: Implementing Orchestrator + Subagents pattern
- See [`AGENT-PERSONAS.md`](AGENT-PERSONAS.md) for agent definitions
- See [`PHILOSOPHY.md`](PHILOSOPHY.md) for principles

---

## Agent Architecture

> **Pattern:** Account Manager coordinates specialist subagents.
> **Principle:** Don't overload the orchestrator with all the tools.

```
┌─────────────────────────────────────────────────┐
│           ACCOUNT MANAGER (Orchestrator)         │
│       Lightweight tools • Delegates complex work │
└───────────────────────┬─────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   ┌─────────┐    ┌─────────┐    ┌─────────┐
   │  STORY  │    │ DESIGN  │    │ QUALITY │
   │  AGENT  │    │  AGENT  │    │  AGENT  │
   └─────────┘    └─────────┘    └─────────┘
```

| Agent | Role | Tools |
|-------|------|-------|
| **Account Manager** | User-facing, routes, synthesizes | read, delegateTask |
| **Story Agent** | Conversation, images, content | extract, multimodal |
| **Design Agent** | Layout, tokens, preview | compose, render |
| **Quality Agent** | Assessment, advisory | assess, suggest |

### Key Principles

- **Orchestrator has lightweight tools** - Delegates heavy work to subagents
- **Subagents are specialists** - Each has focused context and tools
- **Parallel when possible** - Independent tasks run simultaneously
- **Quality is advisory** - Suggests, doesn't block publishing

---

## Current Tools

**Account Manager Tools** (orchestration):
- `read` - Quick lookups, project state
- `delegateTask` - Spawn subagents for complex work

**Story Agent Tools**:
- `extractNarrative` - Extract story from conversation
- `analyzeImages` - Multimodal image understanding
- `generateContent` - Write content in business voice
- `signalCheckpoint` - Signal orchestrator when ready

**Design Agent Tools**:
- `selectTokens` - Choose from design token library
- `composeLayout` - Generate semantic blocks
- `selectHero` - Pick best hero image
- `renderPreview` - Generate portfolio preview

**Quality Agent Tools**:
- `assessReadiness` - Contextual quality check
- `identifyGaps` - Find missing elements
- `suggestImprovements` - Advisory suggestions

---

## Design Decisions

| Decision | Outcome |
|----------|---------|
| Orchestration pattern | Account Manager + Subagents |
| Tool distribution | Lightweight orchestrator, heavy subagents |
| Quality gates | Advisory only, "publish anyway" always allowed |
| Image handling | Multimodal (Story Agent sees images directly) |
| Design constraints | Token-based guardrails |
| Parallel execution | Independent subagents run simultaneously |
| AI SDK integration | Vercel AI SDK with Gemini models |
| State management | Shared ProjectState across agents |

---

## Implementation Status

| Component | Status | Location |
|-----------|--------|----------|
| Discovery Agent (onboarding) | ✅ Done | `src/lib/agents/discovery.ts` |
| Account Manager (orchestrator) | 🔄 Enhance | `src/lib/agents/orchestrator.ts` |
| Story Agent | 🔄 Enhance | `src/lib/agents/story-extractor.ts` |
| Design Agent | 🔄 Build | `src/lib/agents/ui-composer.ts` |
| Quality Agent | 🔄 Enhance | `src/lib/agents/quality-checker.ts` |
| Design Tokens | ✅ Exists | `src/lib/design/tokens.ts` |

---

## Related Documentation

| Document | Content |
|----------|---------|
| [`AGENT-PERSONAS.md`](AGENT-PERSONAS.md) | Agent definitions and personas |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | System architecture |
| [`PHILOSOPHY.md`](PHILOSOPHY.md) | Design principles |
| [`MIGRATIONS.md`](MIGRATIONS.md) | Migration history |
| `todo/ai-sdk-phase-10-persona-agents.md` | Implementation plan |
