# Agent Atlas Command

Manage the agent system knowledge base and create session handoff documents.

## Instructions

This command invokes the Agent Atlas skill for documentation and handoff management.

## Subcommands

- `handoff` — **Create a handoff document** summarizing this session's work (default if no subcommand)
- `audit` — Run philosophy audit to check for masonry references, magic numbers, prescriptive patterns
- `status` — Show current migration status and pending work
- `tool <name>` — Deep dive on a specific tool
- `flow <scenario>` — Trace data flow for a scenario

## Handoff Document Creation

When creating a handoff, the document will be saved to:
`todo/handoffs/YYYY-MM-DD-<brief-title>.md`

The handoff includes:
1. **Session Summary** — What was worked on
2. **Completed Items** — What got done with file references
3. **Remaining Work** — What's still pending
4. **Key Decisions** — Important choices made
5. **Next Steps** — Clear actions for the next session
6. **Files Modified** — List of changed files

## Usage Examples

```bash
/atlas                    # Create handoff document (default)
/atlas handoff           # Explicit handoff creation
/atlas audit             # Run philosophy audit
/atlas status            # Show migration status
/atlas tool extractProjectData  # Deep dive on tool
```

## Process

1. Read current todo list and recent changes
2. Check MIGRATIONS.md for current phase status
3. Gather modified files from this session
4. Generate handoff document with clear next steps
5. Save to `todo/handoffs/` directory

## User Input

$ARGUMENTS

If no arguments provided, default to creating a handoff document.
