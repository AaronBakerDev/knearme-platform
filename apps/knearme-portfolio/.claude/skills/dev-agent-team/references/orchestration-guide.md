# Orchestration Guide

## How Claude Code + Codex Agents Work Together

```
┌─────────────────────────────────────────────────────────────┐
│                     Claude Code (Orchestrator)              │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Analyze  │→ │ Prepare  │→ │ Delegate │→ │ Verify   │   │
│  │          │  │ Handoff  │  │ to Codex │  │ Results  │   │
│  └──────────┘  └──────────┘  └────┬─────┘  └──────────┘   │
│                                    │                        │
└────────────────────────────────────┼────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────┐
│                     Codex Agent (Executor)                  │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Load     │→ │ Execute  │→ │ Log      │→ │ Output   │   │
│  │ Persona  │  │ Changes  │  │ Progress │  │ Results  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Orchestration Patterns

### Pattern 1: Single Agent Task

**Best for:** Focused tasks within one domain

```
User: "Fix the 5 bugs from the code review"
          │
          ▼
Claude Code: Analyze bugs, identify files
          │
          ▼
Codex Implementer: Fix bugs across files
          │
          ▼
Claude Code: Verify (lint, tests, review diff)
          │
          ▼
Claude Code: Commit changes
```

### Pattern 2: Pipeline Execution

**Best for:** Sequential tasks with handoffs

```
User: "Add auth to the new API endpoints"
          │
          ▼
Claude Code: Plan implementation
          │
          ▼
Codex Implementer: Add auth middleware
          │
          ▼
Codex Tester: Generate auth tests
          │
          ▼
Codex Reviewer: Security audit
          │
          ▼
Claude Code: Verify and commit
```

### Pattern 3: Parallel Execution

**Best for:** Independent tasks that can run simultaneously

```
User: "Improve code quality across the codebase"
          │
          ├──────────────────┬──────────────────┐
          ▼                  ▼                  ▼
Codex Refactorer:    Codex Documenter:   Codex Tester:
Clean up utils       Add JSDoc           Generate tests
          │                  │                  │
          └──────────────────┴──────────────────┘
                             │
                             ▼
                 Claude Code: Merge and verify
```

---

## Task Handoff Protocol

### Creating a Handoff

Before delegating, I (Claude Code) create a context document:

```markdown
# Task: [Title]

## Context
[Background the agent needs]

## Scope
- Files: [specific paths or patterns]
- Boundaries: [what NOT to touch]

## Requirements
1. [Specific requirement with acceptance criteria]
2. [Another requirement]

## Patterns to Follow
[Reference existing patterns in the codebase]

## Verification
```bash
npm run lint
npm run test -- path/to/tests
```

## Notes
[Any additional context or constraints]
```

### Handoff Location
- Short tasks: Include in prompt
- Complex tasks: Write to `/tmp/handoff-{timestamp}.md`

---

## Agent Selection Guide

| Task Type | Primary Agent | May Also Use |
|-----------|--------------|--------------|
| Bug fixes | Implementer | Reviewer |
| New features | Implementer | Tester, Documenter |
| Security audit | Reviewer | Implementer (for fixes) |
| Test coverage | Tester | - |
| Technical debt | Refactorer | Reviewer |
| API changes | Implementer | Documenter, Tester |
| Pattern migration | Refactorer | Implementer |
| Documentation | Documenter | - |

---

## Verification Checklist

After every Codex delegation:

### Immediate Checks
```bash
# 1. Lint passes
npm run lint

# 2. Build succeeds
npm run build

# 3. Tests pass
npm run test
```

### Review Steps
```bash
# 4. Review changes
git diff

# 5. Check for unintended changes
git diff --stat

# 6. Verify specific requirements
# (task-dependent)
```

### If Issues Found
1. **Minor issues:** Fix directly, don't re-delegate
2. **Missed requirements:** Re-run with specific prompt
3. **Wrong approach:** Revert and reconsider

---

## Common Orchestration Workflows

### Bug Sweep Workflow
```
1. Claude Code: Parse bug report, create task list
2. Codex Implementer: Fix bugs
3. Claude Code: Verify each fix
4. Codex Reviewer: Security check on changes
5. Claude Code: Commit with detailed message
```

### Feature Development Workflow
```
1. Claude Code: Design and plan (may use Plan mode)
2. Claude Code: Create initial structure
3. Codex Implementer: Bulk implementation
4. Claude Code: Review, adjust, integrate
5. Codex Tester: Generate tests
6. Codex Documenter: Add JSDoc
7. Claude Code: Final review and commit
```

### Refactoring Workflow
```
1. Claude Code: Identify scope and strategy
2. Codex Refactorer: Apply pattern changes
3. Claude Code: Verify behavior preserved
4. Codex Reviewer: Check for issues
5. Claude Code: Commit with ADR if needed
```

---

## Error Handling

### Codex Fails to Complete
```bash
# Check log for errors
cat /tmp/codex-*.log | grep -i error

# Common causes:
# - Syntax errors in prompt
# - File access issues
# - Too broad a scope
```

### Codex Makes Wrong Changes
```bash
# Revert everything
git checkout -- .

# Or stash for analysis
git stash
git stash show -p
```

### Codex Gets Stuck
```bash
# Kill and retry with smaller scope
pkill -9 -f codex
```

---

## Best Practices

1. **Start small** - Delegate one category at a time
2. **Clear prompts** - Use SWFV framework
3. **Verify early** - Run lint after first file
4. **Review diffs** - Don't blindly trust changes
5. **Iterate** - Multiple small delegations > one large
