# Change Entry Template

Copy this template when adding an entry to CHANGE-LOG.md.

---

## YYYY-MM-DD

### Short Change Title

**Category**: Tool Schema | Tool Executor | Agent | State Model | UI Artifact | Phase Logic | Tool Classification

**Files Changed**:
- `path/to/file1.ts`
- `path/to/file2.ts`

**Before** (if applicable):
```typescript
// Previous code or state
```

**After** (if applicable):
```typescript
// New code or state
```

**Description**:
Brief explanation of what changed and why.

**Rationale**:
Why this change was made. What problem it solves.

**Impact**:
- Impact 1 (e.g., "Tool now available without explicit request")
- Impact 2 (e.g., "Fixes validation error for location updates")

---

## Categories

Use these category labels:

| Category | When to Use |
|----------|-------------|
| **Tool Schema** | Zod schema changes in tool-schemas.ts |
| **Tool Executor** | Executor logic changes in tools-runtime.ts |
| **Tool Classification** | Moving tools between FAST/DEEP |
| **Agent** | Changes to agent files |
| **State Model** | SharedProjectState or type changes |
| **UI Artifact** | Artifact component changes |
| **Phase Logic** | Orchestrator phase handling |
| **API Route** | Chat route changes |
| **Prompt** | System prompt changes |

---

## Significance Guidelines

**Always document**:
- New tool added
- Tool schema modified
- Tool executor logic changed
- Tool classification changed
- New agent created
- State shape modified
- Phase transition logic changed
- New UI artifact added
- Bug fix that reveals system behavior

**Skip documentation**:
- Typo fixes
- Console.log additions/removals
- Comment changes
- Pure formatting
- Test file changes (unless they reveal behavior)
