---
name: dev-agent-team
description: Hybrid development agent team. Claude Code orchestrates (plans, verifies, uses MCP), Codex agents execute bulk operations. Use for complex multi-file tasks requiring specialized expertise.
---

# Development Agent Team

## Philosophy

**Claude Code** = Brain (analysis, planning, verification, MCP, user interaction)
**Codex Agents** = Hands (bulk execution, file changes, pattern application)

This hybrid model gives you:
- Creative decisions and clarification (me)
- MCP tools: Supabase, browser, external APIs (me)
- Bulk file operations across 5+ files (Codex)
- Specialized expertise per task type (Codex personas)

---

## The Team

| Agent | Persona File | Specialization |
|-------|-------------|----------------|
| **Implementer** | `config/agents/implementer.md` | Write code, fix bugs, add features |
| **Reviewer** | `config/agents/reviewer.md` | Code review, quality checks, security audit |
| **Tester** | `config/agents/tester.md` | Test generation, coverage analysis |
| **Refactorer** | `config/agents/refactorer.md` | Cleanup, migrations, pattern updates |
| **Documenter** | `config/agents/documenter.md` | JSDoc, README, inline comments |
| **Scout** | `config/agents/scout.md` | Fast diff review, red flag detection, approval gate |

---

## Orchestration Flow

```
User Request
     ↓
Claude Code (ANALYZE)
├── Understand scope and requirements
├── Break into discrete tasks
├── Identify which tasks need Codex
└── Plan execution order
     ↓
Claude Code (PREPARE)
├── Create handoff file with context
├── Select appropriate Codex agent
├── Write specific task prompt
└── Determine verification criteria
     ↓
Codex Agent (EXECUTE)          ←── MONITOR with monitor-agent.sh
├── Read handoff context            (poll every 15s, check for errors)
├── Execute bulk operations
├── Output structured results
└── Log changes made
     ↓
Scout Agent (REVIEW)           ←── MANDATORY GATE
├── Scan git diff for red flags
├── Check for secrets, deletions
├── Verify scope (no unrelated changes)
└── Output: APPROVE | BLOCK | NEEDS_REVIEW
     ↓
Claude Code (VERIFY)           ←── Only if Scout approved
├── Run verify-changes.sh (lint/tests/build)
├── Review any Scout warnings
├── Check verification criteria
└── Iterate or revert if needed
     ↓
Claude Code (FINALIZE)
├── Stage appropriate changes
├── Create commit message
└── Update documentation if needed
```

### The Scout Gate

**CRITICAL: Never commit without Scout review.**

After ANY Codex agent completes:

```bash
# Option A: Run Scout agent via Codex
codex -c 'sandbox_mode="danger-full-access"' exec "$(cat config/agents/scout.md)

Review the current git diff and provide a Scout Report."

# Option B: Run verification script locally
./scripts/verify-changes.sh

# If BLOCKED: revert changes
git checkout -- .

# If NEEDS_REVIEW: manually inspect
git diff | less
```

---

## When to Delegate vs Do It Yourself

### Delegate to Codex When:
- Task involves 5+ files
- Task is well-defined with clear patterns
- Success is verifiable (lint, tests, build)
- No MCP or external tools needed
- No user clarification needed mid-task

### Do It Yourself When:
- 1-3 files (faster to just do it)
- Need MCP tools (Supabase, browser, APIs)
- Creative decisions required
- User clarification likely needed
- Security-sensitive operations

---

## Quick Start

### 1. Prepare Handoff Context

Before calling Codex, I should create a handoff file:

```bash
# Create handoff with full context
cat > /tmp/handoff-$(date +%s).md << 'EOF'
# Task: [Title]

## Context
[What the user is trying to accomplish]

## Scope
[Files/directories to modify]

## Requirements
1. [Specific requirement]
2. [Another requirement]

## Constraints
- [What NOT to change]
- [Patterns to follow]

## Verification
```bash
npm run lint && npm run test
```

## Reference Files
- [Path to example/pattern to follow]
EOF
```

### 2. Select Agent and Execute

```bash
# Load agent persona and run
AGENT="implementer"
HANDOFF="/tmp/handoff-123.md"
PERSONA=".claude/skills/dev-agent-team/config/agents/${AGENT}.md"

cx exec -c 'sandbox_mode="danger-full-access"' \
  "$(cat $PERSONA)

TASK CONTEXT:
$(cat $HANDOFF)" 2>&1 | tee /tmp/codex-${AGENT}.log &
```

### 3. Monitor and Verify

```bash
# Monitor progress
tail -f /tmp/codex-${AGENT}.log

# When done, verify
npm run lint
npm run test
git diff --stat
```

---

## Agent Prompt Templates

### Implementer: Bug Sweep
```
Fix the following bugs:

1. [SEVERITY] - [file:line] - [description]
   - Current: [what happens]
   - Expected: [what should happen]
   - Fix: [how to fix]

2. [next bug...]

Requirements:
- Maintain existing functionality
- Follow project patterns
- Run lint after each file

Verification: npm run lint
```

### Reviewer: Security Audit
```
Audit the following files for security issues:

Files: [file patterns]

Check for:
1. SQL injection vulnerabilities
2. XSS opportunities
3. Missing input validation
4. Hardcoded secrets
5. Insecure dependencies

For each issue found:
1. Log file and line
2. Describe the vulnerability
3. Apply the fix
4. Add comment explaining the fix

Verification: npm run lint && npm audit
```

### Tester: Coverage Generation
```
Generate unit tests for:

Files: [file patterns]

Requirements:
- Use vitest
- Follow patterns in existing __tests__/
- Cover all exported functions
- Include edge cases and error conditions
- Aim for 80%+ coverage

Reference: [path to example test]

Verification: npm run test -- --coverage
```

### Refactorer: Pattern Migration
```
Refactor all uses of [old pattern] to [new pattern]:

Before:
```[language]
[old code]
```

After:
```[language]
[new code]
```

Scope: [directories]

Constraints:
- Maintain backwards compatibility
- Update all imports
- Preserve existing tests

Verification: npm run build && npm run test
```

### Documenter: JSDoc Update
```
Add/update JSDoc comments for:

Files: [file patterns]

Requirements:
- Document all exported functions
- Include @param and @returns
- Add @example where helpful
- Document thrown errors with @throws
- Follow TSDoc standard

Reference: [path to well-documented file]

Verification: npm run lint
```

---

## Error Recovery

### Codex Made Bad Changes
```bash
git diff                 # See what changed
git checkout -- .        # Revert all
git stash                # Or stash for review
```

### Codex Got Stuck
```bash
pkill -9 -f codex        # Kill all Codex processes
```

### Partial Success
1. Review log: `cat /tmp/codex-*.log`
2. Stage good changes: `git add -p`
3. Re-run with remaining tasks only

---

## Integration with codex-delegation Skill

This skill extends `codex-delegation` with:
- Specialized agent personas
- Structured handoff protocol
- Claude Code orchestration patterns

For basic Codex usage without personas, use `codex-delegation`.

---

## Memory & State

### Per-Task Logs
- `/tmp/codex-{agent}-{timestamp}.log` - Execution logs
- `/tmp/handoff-{timestamp}.md` - Task context

### Persistent State (optional)
- `.claude/skills/dev-agent-team/data/recent-tasks.md` - Track recent delegations
- Git history - Changes are tracked via commits

---

## Best Practices

1. **Always verify** - Run Scout + verify-changes.sh after Codex completes
2. **Small batches** - 5-10 files per delegation, not 50
3. **Clear prompts** - Use SWFV framework (Scope, Where, Format, Verify)
4. **Review diffs** - Check `git diff` before committing
5. **Iterate** - If Codex missed something, re-run with specific fixes
6. **Monitor actively** - Poll output every 15-30s during execution
7. **Kill early** - If agent goes off-rails, `pkill -9 -f codex` immediately

---

## Monitoring & Verification Scripts

### scripts/monitor-agent.sh

Real-time monitoring during agent execution:

```bash
# Start agent in background
codex ... 2>&1 | tee /tmp/agent-output.log &

# Monitor in another terminal (or same terminal after backgrounding)
./scripts/monitor-agent.sh /tmp/agent-output.log 15

# Output every 15 seconds:
# [12:34:56] +47 lines (total: 892)
#    → Writing to src/lib/chat/tool-schemas.ts
# [12:35:11] +23 lines (total: 915)
#    → Running npm run lint
```

### scripts/verify-changes.sh

Run BEFORE committing any agent changes:

```bash
./scripts/verify-changes.sh

# Output:
# 🔍 Running linter... ✓ Lint passed
# 🔨 Running build... ✓ Build passed
# 🧪 Running tests... ✓ Tests passed
# 🔒 Security scan... ✓ No hardcoded secrets detected
#
# APPROVED: All checks passed

# With strict mode (warnings = failures):
./scripts/verify-changes.sh --strict
```

### Verification Checks

| Check | What It Catches |
|-------|-----------------|
| Lint | Syntax errors, style issues |
| Build | Type errors, import issues |
| Tests | Broken functionality |
| Secret scan | Hardcoded API keys, passwords |
| Console leak | Sensitive data in logs |
| ESLint disable | Excessive rule suppression |

---

## Complete Delegation Workflow

```bash
# 1. Prepare handoff
cat > /tmp/task.md << 'EOF'
[Agent persona + task description]
EOF

# 2. Start agent with monitoring
codex -c 'sandbox_mode="danger-full-access"' exec "$(cat /tmp/task.md)" \
  2>&1 | tee /tmp/agent.log &
AGENT_PID=$!

# 3. Monitor progress (in same or different terminal)
./scripts/monitor-agent.sh /tmp/agent.log 15 &

# 4. Wait for completion
wait $AGENT_PID

# 5. Run Scout review
./scripts/verify-changes.sh
# OR: Run Scout agent via Codex

# 6. If APPROVED, review and commit
git diff --stat
git add -p  # Stage selectively
git commit -m "..."

# 7. If BLOCKED, revert
git checkout -- .
```
