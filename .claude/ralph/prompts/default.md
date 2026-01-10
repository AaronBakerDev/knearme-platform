# Ralph Wiggum - Default Feature Development Prompt

You are working on the FixMyBrick marketing platform. Your job is to make incremental progress on the PRD (Product Requirements Document) by implementing ONE feature at a time.

## Your Mission

1. **Get Your Bearings**
   - Read the PRD file to understand what features exist
   - Read the progress file to see what was recently done
   - Check `git log --oneline -5` to see recent commits
   - Identify features where `passes: false`

2. **Choose ONE Task**
   - Select the highest-priority incomplete feature
   - Priority order: architectural work > integrations > core features > polish
   - If a feature has blockers noted, skip it for now
   - Announce which feature you're working on

3. **Implement the Feature**
   - Follow existing codebase patterns and conventions
   - Keep changes focused and minimal
   - Add appropriate comments for complex logic
   - Reference related files in comments where helpful

4. **Run Feedback Loops**
   Before declaring victory, verify your work:
   ```bash
   # TypeScript check (if applicable)
   npm run typecheck 2>/dev/null || npx tsc --noEmit

   # Tests (if applicable)
   npm run test 2>/dev/null || echo "No test script"

   # Linting (if applicable)
   npm run lint 2>/dev/null || echo "No lint script"
   ```

   Do NOT proceed if feedback loops fail. Fix issues first.

5. **Update the PRD**
   - Only change the `passes` field from `false` to `true`
   - Only mark as passing after VERIFIED testing
   - Never remove or edit feature descriptions
   - Never mark something as done that isn't fully working

6. **Update Progress File**
   Append a concise entry:
   ```
   ## [DATE] - [Feature ID]
   - Task: [what you did]
   - Files changed: [list]
   - Decisions: [any architectural choices]
   - Notes for next iteration: [anything important]
   ```

7. **Git Commit**
   Make a descriptive commit:
   ```bash
   git add -A
   git commit -m "feat([feature-id]): [brief description]

   - [bullet points of what changed]

   PRD: [X/Y features passing]"
   ```

## Critical Rules

- **ONE FEATURE ONLY** - Do not work on multiple features
- **SMALL STEPS** - Prefer multiple small commits over one large one
- **HONEST MARKING** - Only mark `passes: true` when verified working
- **CLEAN STATE** - Leave codebase ready for the next iteration
- **NO SHORTCUTS** - Don't skip edge cases or error handling

## Completion Signal

If ALL features in the PRD have `passes: true`, output exactly:
```
<promise>COMPLETE</promise>
```

This signals that the entire PRD is done. Do NOT output this unless every single feature passes.

## Context: FixMyBrick

- **Business**: Masonry contractor with 20+ years experience
- **Tech Stack**: Next.js, React, TypeScript, Supabase, Cloudflare
- **Coding Style**: Follow patterns in existing codebase
- **Quality Bar**: Production code - must be maintainable

Now, read the PRD and progress file, choose your task, and begin.
