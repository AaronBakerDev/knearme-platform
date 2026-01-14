---
description: Start a KnearMe sprint work session - check progress, find next tasks, and begin working
---

# KnearMe Sprint Workflow

You are starting a sprint work session for the KnearMe Portfolio project.

## Step 1: Check Sprint Progress

Run the progress script to see current status:

```bash
./.claude/skills/knearme-sprint-workflow/scripts/check_progress.sh
```

## Step 2: Read Current Phase Files

Read the current phase file to understand what needs to be done:

1. Check the README for the current phase: `knearme-portfolio/todo/README.md`
2. Read the active phase file (currently `knearme-portfolio/todo/ai-sdk-phase-1-foundation.md`)
3. Read the central plan index: `knearme-portfolio/docs/ai-sdk/plan.md`

## Step 3: Find Next Tasks

Identify the next incomplete tasks:
- Look for `[ ]` checkboxes in the phase file
- Prioritize by section order (earlier sections first)
- Check for blockers or dependencies

## Step 4: Set Up Session Tracking

Use TodoWrite to track the tasks you'll work on this session. Pull tasks from the phase file.

## Step 5: Begin Work

Follow the phase file tasks. As you complete each task:
1. Mark it `[x]` in the phase file immediately
2. Update your TodoWrite list
3. Move to the next task

## Step 6: Phase Completion Handoff

**IMPORTANT:** When you complete a phase (all checkboxes marked), you MUST create a handoff section in the NEXT phase file:

1. Open the next phase file (e.g., if you finished Phase 2, open `ai-sdk-phase-3-*.md`)
2. Add a `## Handoff from Phase N` section at the top (after the header/goal)
3. Include:
   - **What Was Built** — New files, hooks, components, tools created
   - **Key Files to Reference** — File tree showing where everything lives
   - **Patterns to Follow** — How to extend/use what was built
   - **Ready for Next Phase** — What's available to build upon

Example structure:
```markdown
## Handoff from Phase 2

### What Was Built
- List new hooks, components, tools
- Note key integrations made

### Key Files to Reference
- File tree of relevant paths

### Patterns to Follow
1. How to add new X
2. How state flows through Y

### Ready for Phase N
- What the next phase can now do
```

Also update:
- `knearme-portfolio/todo/README.md` — Mark completed phase ✅, set next phase 🔄 Current

## Reference Files

- **Sprint Skill:** `.claude/skills/knearme-sprint-workflow/SKILL.md`
- **Technical Docs:** `knearme-portfolio/CLAUDE.md`
- **Phase Files:** `knearme-portfolio/todo/ai-sdk-phase-*.md`

## Sub-Agent Patterns

When working on tasks, use appropriate agents:
- **Database/schema:** Use Supabase MCP `apply_migration`
- **New components:** Use `feature-dev:code-architect` first
- **API routes:** Explore existing patterns, then implement
- **Code review:** Use `feature-dev:code-reviewer` after significant changes

## Session Notes (2026-01-02)

- Code review completed for Phase 10 done items (orchestrator + subagents).
- Findings logged in assistant response: timeout cleanup in subagent spawn, image handoff defaults for Story Agent, storage_path used as image URL, and a mismatch between story_complete action vs design delegation.
- Code review completed for private draft image bucket work (project-images-draft + proxy flow).
- Findings logged in assistant response: Next/Image auth proxy risk for draft images in chat photo grid, alt-text index mismatch if some images fail to download, and analyze-images downloads all images even though analysis caps at 4.
