---
name: agent-atlas
description: Self-documenting knowledge system for the KnearMe chat agent. Use when working on agent tools, chat API, artifacts, or orchestrator. Triggers on agent-related file changes, tool schema updates, or when asking about agent architecture.
---

# Agent Atlas - Self-Documenting Agent System Knowledge

> **Purpose**: Living documentation for the KnearMe chat agent system that stays synchronized with the code.

## Philosophy

This skill exists because:
1. **Complex systems drift** - The agent has 15+ tools, multiple agents, state transformations, and UI artifacts
2. **Documentation rots** - Static docs get stale within days of major changes
3. **Context is expensive** - Every session wastes time re-understanding the system
4. **Changes cascade** - Modifying one tool often affects others in non-obvious ways

The solution: **Make documentation a byproduct of understanding, not a separate task.**

---

## When to Invoke This Skill

### Automatic Triggers (via session hooks)
- Session starts in `knearme-portfolio` with agent-related work
- Changes detected in monitored files since last `CHANGE-LOG.md` entry

### Manual Triggers
```
/agent-atlas                    # Show current system state
/agent-atlas audit              # Check for documentation drift
/agent-atlas tool <name>        # Deep dive on specific tool
/agent-atlas flow <scenario>    # Trace data flow for scenario
/agent-atlas update             # Guided documentation update
```

---

## Core Reference Files

| File | Purpose | Update Frequency |
|------|---------|------------------|
| [`references/ARCHITECTURE.md`](references/ARCHITECTURE.md) | High-level system map with mermaid diagrams | Major restructuring |
| [`references/TOOL-CATALOG.md`](references/TOOL-CATALOG.md) | All tools with schemas, executors, artifacts | Any tool change |
| [`references/STATE-MODELS.md`](references/STATE-MODELS.md) | Data shapes and transformations | State changes |
| [`references/PHASE-FLOWS.md`](references/PHASE-FLOWS.md) | Chat phase state machine | Phase logic changes |
| [`references/ARTIFACT-GUIDE.md`](references/ARTIFACT-GUIDE.md) | UI components rendered from tools | UI changes |
| [`references/CHANGE-LOG.md`](references/CHANGE-LOG.md) | Chronological change history | Every significant change |
| [`references/ROADMAP.md`](references/ROADMAP.md) | Implementation phases and progress | Phase transitions |

## Related Documentation

The skill cross-references detailed planning docs:

| Directory | Content |
|-----------|---------|
| `docs/09-agent/` | Design docs, implementation plan, interviewer specs |
| `docs/09-agent/implementation-plan.md` | **Authoritative roadmap** with phases |
| `docs/09-agent/README.md` | System overview and API reference |

---

## Self-Update Protocol

### The Golden Rule
> **If you change agent code, update the atlas before committing.**

### What Constitutes a "Significant Change"

**Always document:**
- New tool added
- Tool schema modified
- Tool executor logic changed
- New agent created
- State shape modified
- Phase transition logic changed
- New UI artifact added
- Bug fix that reveals system behavior

**Skip documentation:**
- Typo fixes
- Console.log additions/removals
- Comment changes
- Pure formatting

### Update Workflow

```
1. Make your code change
2. Run: python scripts/audit_agent.py
3. Review drift report
4. Update affected reference file(s)
5. Add entry to CHANGE-LOG.md
6. Commit code + docs together
```

---

## Monitored Files

The audit script watches these files for changes:

```
# Core Chat API
src/app/api/chat/route.ts
src/app/api/chat/sessions/**/*.ts

# Tool System
src/lib/chat/tool-schemas.ts
src/lib/chat/tools-runtime.ts
src/lib/chat/chat-types.ts

# Prompts & Context
src/lib/chat/chat-prompts.ts
src/lib/chat/context-loader.ts
src/lib/chat/prompt-context.ts

# Agents
src/lib/agents/*.ts

# UI Artifacts
src/components/chat/artifacts/*.tsx
src/components/chat/ChatMessage.tsx
src/components/chat/ArtifactRenderer.tsx

# State Types
src/types/artifacts.ts
```

---

## Quick Reference: Current System State

### Tools (as of last audit)

**FAST_TURN_TOOLS** (auto-allowed):
- `extractProjectData` - Extract project info from conversation
- `requestClarification` - Ask user for clarity
- `promptForImages` - Trigger image upload UI
- `showPortfolioPreview` - Update preview panel
- `suggestQuickActions` - Show action chips
- `updateField` - Modify project field
- `regenerateSection` - AI rewrite section
- `reorderImages` - Change image order
- `validateForPublish` - Check publish readiness
- `checkPublishReady` - Quality check (moved from DEEP 2025-01-01)

**DEEP_CONTEXT_TOOLS** (require explicit request):
- `generatePortfolioContent` - Full AI content generation
- `composePortfolioLayout` - Block structure + image ordering

### Agents

| Agent | File | Purpose |
|-------|------|---------|
| Story Extractor | `story-extractor.ts` | Interprets user messages, updates state |
| Content Generator | `content-generator.ts` | Creates title, description, SEO |
| Layout Composer | `layout-composer.ts` | Structures description blocks |
| Quality Checker | `quality-checker.ts` | Validates publish readiness |

### State Flow

```
User Message
    ↓
Chat API (route.ts)
    ↓
Tool Selection (activeTools + toolChoice)
    ↓
Tool Executor (tools-runtime.ts)
    ↓
Agent Orchestration (if needed)
    ↓
State Update + UI Artifact
    ↓
Streaming Response
```

---

## Using the Audit Script

```bash
# Full audit - compare code to docs
python .claude/skills/agent-atlas/scripts/audit_agent.py

# Check specific category
python .claude/skills/agent-atlas/scripts/audit_agent.py --tools
python .claude/skills/agent-atlas/scripts/audit_agent.py --agents
python .claude/skills/agent-atlas/scripts/audit_agent.py --state

# Generate tool catalog from code (overwrites TOOL-CATALOG.md)
python .claude/skills/agent-atlas/scripts/audit_agent.py --generate-catalog

# Show what changed since last CHANGE-LOG entry
python .claude/skills/agent-atlas/scripts/audit_agent.py --since-last-change
```

---

## Templates

When adding new components, use these templates:

### New Tool
See `templates/tool-entry.md`

### New Agent
See `templates/agent-entry.md`

### Change Log Entry
See `templates/change-entry.md`

---

## Why This Works

1. **Low friction** - Audit takes seconds, templates are copy-paste
2. **Clear value** - Actually saves time when returning to agent work
3. **Gentle enforcement** - Session hooks remind you, don't block you
4. **Incremental** - Update only what changed, not everything
5. **Code proximity** - Scripts extract info from code, reducing manual work
6. **Single source of truth** - One place to look, always current

---

## Integration with Development

### IDE Setup
Add file watcher for monitored files → run audit on save

### Pre-commit Hook (optional)
```bash
# .claude/hooks/pre-commit
if git diff --cached --name-only | grep -E "(tool-schemas|tools-runtime|agents/)"; then
  python .claude/skills/agent-atlas/scripts/audit_agent.py --quick
fi
```

### Session Start
The skill checks for drift automatically when loaded.

---

## Maintenance

This skill itself should be updated when:
- New categories of agent components are added
- The audit script needs new patterns
- Reference file structure changes
- Monitoring patterns need adjustment

The skill is self-documenting: its own SKILL.md serves as the model for how documentation should work.
