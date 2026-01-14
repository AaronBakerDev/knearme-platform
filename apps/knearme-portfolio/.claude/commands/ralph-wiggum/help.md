# Ralph Wiggum Commands

Available commands for autonomous AI coding loops:

## `/ralph-wiggum/prd-builder`
Interactive interview to create a PRD. Asks questions, refines scope, generates Ralph-compatible JSON.

## `/ralph-wiggum/ralph-loop` (global)
Start a Ralph loop in current session. Available globally via plugin.

## `/ralph-wiggum/cancel-ralph` (global)
Cancel an active Ralph loop. Available globally via plugin.

---

## Shell Scripts (run from terminal)

```bash
# HITL - single iteration, watch and learn
./ralph-once.sh

# AFK - unattended loop
./afk-ralph.sh 10        # 10 iterations
./afk-ralph.sh 20 -s     # Docker sandbox
./afk-ralph.sh 30 -s -n  # With notifications
```

## Quick PRD Creation

```bash
# Copy template
cp .claude/ralph/prds/template.json .claude/ralph/prds/my-project.json

# Or use the interview
/ralph-wiggum/prd-builder
```

## Documentation

- Full docs: `.claude/ralph/README.md`
- PRD template: `.claude/ralph/prds/template.json`
- Prompts: `.claude/ralph/prompts/*.md`
