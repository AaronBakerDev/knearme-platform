# Documentation System PRD

## Purpose
Create and maintain a compact, high-signal documentation layer that lets new agents understand the workspace without rereading the entire repo.

## Scope
- Maintain the .agent folder as the source of architectural context, SOPs, and task plans.
- Keep .agent/README.md as the entry point and index.
- Keep CLAUDE.md aligned with documentation rules.

## Goals
- Summarize tech stack, structure, data models, and integrations in one architecture snapshot.
- Provide clear guidance on when and how to update docs.
- Track task plans and PRDs in .agent/Tasks.

## Non-goals
- Replacing project-specific README or CLAUDE files.
- Mirroring every file or change in the repository.

## Users
- AI agents working in this workspace.
- Humans onboarding to the workspace architecture.

## Requirements
- .agent/System/project_architecture.md exists and stays current.
- .agent/SOP/documentation_standards.md describes how to maintain docs.
- .agent/SOP/mistakes_log.md exists for logging issues.
- .agent/Tasks contains PRDs or ExecPlans for future work.
- commands/update-doc.md provides the update prompt.
- CLAUDE.md includes Documentation Rules pointing to .agent.

## Acceptance
- A new agent can open .agent/README.md and locate architecture, SOPs, and task plans.
- Architecture summary covers stack, structure, data models, and integrations.
- Documentation rules are visible in CLAUDE.md.
