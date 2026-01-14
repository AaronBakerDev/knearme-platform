# Phase 14 — Agent Architecture Polish

> **Priority:** Low
> **Source:** Phase 10 Code Review (2026-01-02)
> **Status:** Deferred — address when relevant or as time permits

## Goal

Address low-priority issues identified during Phase 10 (Orchestrator + Subagents) code review. These are polish items that don't affect core functionality but improve consistency and robustness.

---

## Deferred Items from Phase 10 Code Review

### 1. Design Agent rationale not surfaced

**Location:** `src/lib/agents/orchestrator.ts:519-522`

**Issue:** Design Agent returns a `rationale` field explaining its design choices, but `delegateToDesignAgent` doesn't surface it as a message to the user.

**Fix:**
```typescript
return {
  state: newState,
  actions: [{ type: 'delegate', subagent: 'design', result: delegationResult }],
  message: designResult.rationale,  // Add this line
};
```

**Impact:** Users would see why the design was chosen, improving transparency.

- [ ] Surface `designResult.rationale` as message in `delegateToDesignAgent`

---

### 2. Design error result missing fields

**Location:** `src/lib/agents/subagents/spawn.ts:340-341`

**Issue:** Error results for Design Agent don't include `designTokens` or `blocks` fields. Callers checking for these fields on error results get `undefined`.

**Current:**
```typescript
case 'design':
  return base as DesignAgentResult;
```

**Fix:**
```typescript
case 'design':
  return {
    ...base,
    designTokens: undefined,
    blocks: undefined,
    rationale: undefined,
  } as DesignAgentResult;
```

**Impact:** Consistent error result shape across all subagents.

- [ ] Add missing fields to Design Agent error result

---

### 3. Empty images array replaces existing

**Location:** `src/lib/agents/orchestrator.ts:333`

**Issue:** In `mergeProjectState`, if `updates.images` is an empty array `[]`, it's truthy and replaces `existing.images`. This could unexpectedly clear images.

**Current:**
```typescript
images: updates.images || existing.images,
```

**Fix:**
```typescript
images: (updates.images && updates.images.length > 0) ? updates.images : existing.images,
```

**Impact:** Prevents accidental image loss during state merges.

- [ ] Fix images merge logic to preserve existing when update is empty

---

### 4. Unused `startTime` variable in spawn

**Location:** `src/lib/agents/subagents/spawn.ts:202`

**Issue:** `startTime` is captured but never used for logging. The parallel spawn logs duration, but individual spawn doesn't.

**Options:**
1. Add duration logging: `console.log(\`[spawnSubagent] ${type} completed in ${Date.now() - startTime}ms\`);`
2. Remove unused variable

- [ ] Either log spawn duration or remove unused variable

---

## Architectural Notes (No Action Required)

| Observation | Status |
|-------------|--------|
| Quality `assessment.ready` ignored | By design — "advisory only" philosophy |
| Array dedup may reorder | Documented — Set dedup could change order |

---

## Acceptance Criteria

- [ ] All items fixed or explicitly deferred with rationale
- [ ] Build passes (`npm run build`)
- [ ] No new TypeScript errors

---

## References

- Phase 10 sprint doc: `todo/ai-sdk-phase-10-persona-agents.md`
- Orchestrator: `src/lib/agents/orchestrator.ts`
- Spawn infrastructure: `src/lib/agents/subagents/spawn.ts`
