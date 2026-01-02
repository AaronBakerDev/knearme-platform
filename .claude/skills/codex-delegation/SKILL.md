---
name: codex-delegation
description: Delegate complex multi-file tasks to OpenAI Codex CLI (cx). Use when tasks involve 5+ files, bulk operations, bug sweeps, refactoring, test generation, or migrations. Provides command templates, approval modes, and monitoring patterns.
---

# Codex Delegation

## Overview

Effectively delegate complex, multi-file tasks to OpenAI Codex CLI (`cx`) for autonomous execution. This skill provides command templates, permission configurations, and monitoring patterns.

## Decision Tree: Delegate or Do It Yourself?

```
Is the task well-defined with clear success criteria?
├─ No → Do it yourself (Codex needs clear instructions)
└─ Yes → Does it involve 5+ files?
         ├─ No → Do it yourself (faster for small changes)
         └─ Yes → Does it need MCP/browser/external tools?
                  ├─ Yes → Do it yourself (Codex can't use MCP)
                  └─ No → Can success be verified by lint/tests?
                          ├─ Yes → DELEGATE TO CODEX
                          └─ No → Consider splitting the task
```

**Delegate to Codex:**
- Bug sweeps across multiple files
- Refactoring patterns codebase-wide
- Test generation for existing code
- Documentation generation from code
- Migration tasks (API changes, dependency updates)
- Bulk renaming/updating patterns

**Do it yourself:**
- Quick single-file edits
- Tasks needing user clarification
- Browser automation, MCP tools, external APIs
- Creative/design decisions
- Security-sensitive operations

---

## Quick Start

### Full Autonomy Mode (Recommended)
```bash
cx exec -c 'sandbox_mode="danger-full-access"' "your task" 2>&1 | tee /tmp/cx.log &
tail -f /tmp/cx.log
```

### Config Overrides (-c flag)
| Config Key | Values | Purpose |
|------------|--------|---------|
| `approval_policy` | `"never"`, `"auto-edit"`, `"always"` | Control prompts |
| `sandbox_mode` | `"danger-full-access"`, `"workspace-write"`, `"read-only"` | Filesystem access |

Combined example:
```bash
cx exec -c 'approval_policy="never"' -c 'sandbox_mode="danger-full-access"' "task"
```

---

## Task Templates

### Bug Sweep
```bash
cx exec -c 'sandbox_mode="danger-full-access"' "
Fix the following bugs:

1. CRITICAL - src/file1.ts:45 - Add null check for user.id
2. HIGH - src/file2.ts:23 - Handle expired token gracefully
3. MEDIUM - src/file3.ts:100 - Add validation for input

Apply fixes carefully, maintaining existing functionality.
Run lint after: npm run lint
" 2>&1 | tee /tmp/codex-bugsweep.log &
```

### Refactoring
```bash
cx exec -c 'sandbox_mode="danger-full-access"' "
Refactor all uses of deprecated API:

Before: oldFunction(arg1, arg2)
After:  newFunction({ first: arg1, second: arg2 })

Search src/ directory. Update imports as needed.
Maintain backwards compatibility.
Run tests after: npm test
" 2>&1 | tee /tmp/codex-refactor.log &
```

### Test Generation
```bash
cx exec -c 'sandbox_mode="danger-full-access"' "
Generate unit tests for src/lib/utils/*.ts

Requirements:
- Use vitest
- Follow patterns in existing __tests__/ files
- Aim for 80%+ coverage of exported functions
- Include edge cases and error conditions
" 2>&1 | tee /tmp/codex-tests.log &
```

### Type Safety Audit
```bash
cx exec -c 'sandbox_mode="danger-full-access"' "
Audit and fix TypeScript issues:

1. Replace 'any' types with proper types where possible
2. Add missing return types to exported functions
3. Fix type assertions that could fail at runtime

Focus on src/lib/ directory.
Run: npx tsc --noEmit after each file.
" 2>&1 | tee /tmp/codex-types.log &
```

---

## Monitoring & Control

### Start with Logging
```bash
cx exec -c 'sandbox_mode="danger-full-access"' "task" 2>&1 | tee /tmp/cx.log &
CX_PID=$!
```

### Monitor Progress
```bash
# Real-time streaming
tail -f /tmp/cx.log

# Check if running
ps -p $CX_PID && echo "Running..." || echo "Done"

# Search for issues
grep -i "error\|failed" /tmp/cx.log
```

### Stop Running Task
```bash
# Graceful
kill $CX_PID

# Force
kill -9 $CX_PID

# Find by name
pkill -f "codex"
```

---

## Prompt Engineering

### Good Prompt Anatomy
```
[WHAT] Clear task description
[WHERE] Specific file paths or patterns
[HOW] Requirements, constraints, examples
[VERIFY] How to check success (lint, tests)
```

### Example: Good vs Bad

**Bad:**
```
Fix the auth bugs
```

**Good:**
```
Fix authentication bugs:

1. src/lib/auth/session.ts:45
   - Issue: Accessing user.id without null check
   - Fix: Add `if (!user) return null` before access

2. src/lib/auth/middleware.ts:23
   - Issue: Expired tokens throw unhandled error
   - Fix: Wrap in try/catch, return 401 response

Verification: npm run lint && npm run test:auth
```

---

## Error Recovery

### Codex Made Bad Changes
```bash
# View what changed
git diff

# Revert all changes
git checkout -- .

# Or stash for review
git stash
git stash show -p
```

### Codex Stuck/Infinite Loop
```bash
# Kill by PID
kill -9 $CX_PID

# Kill all Codex processes
pkill -9 -f codex
```

### Partial Success
If Codex completed some tasks but failed others:
1. Review the log: `cat /tmp/cx.log`
2. Commit successful changes: `git add -p`
3. Re-run with remaining tasks only

---

## Configuration

### Global Defaults (~/.codex/config.yaml)
```yaml
approval: never
model: gpt-5.2-codex
provider: openai
reasoning_effort: xhigh
reasoning_summaries: auto
```

### Per-Project (.codex/config.yaml)
```yaml
# More conservative for production code
approval: auto-edit
sandbox: true
```

---

## Limitations

Codex **cannot**:
- Use MCP servers (Supabase, browser, etc.)
- Access external APIs/internet (in sandbox)
- Run interactive commands (vim, less)
- Make subjective design decisions
- Access credentials not in environment

**Workaround**: Break tasks into Codex-compatible parts and MCP-requiring parts.

---

## Integration Pattern

1. **Analyze** (Claude Code): Identify issues with grep/read
2. **Plan** (Claude Code): Write detailed prompt
3. **Delegate** (Codex): `cx exec -c 'sandbox_mode="danger-full-access"'`
4. **Monitor** (Claude Code): `tail -f /tmp/cx.log`
5. **Verify** (Claude Code): Run lint/tests, review diff
6. **Commit** (Claude Code): Stage and commit changes

## Resources

### scripts/
Helper scripts for common Codex operations.

### references/
- `approval-modes.md` - Detailed approval mode documentation
- `prompt-patterns.md` - Effective prompt patterns
