# Document shared DB usage and plan phased decommission of legacy systems

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This plan must be maintained in accordance with `PLANS.md` at the repository root.

## Purpose / Big Picture

The goal is to preserve knowledge from predecessor apps and the ad hoc agents that still share the Supabase database so we can refactor or decommission safely. After this work, the workspace will contain a shared database contract document, a legacy systems inventory that explains how each app uses the DB and what must be preserved, and a phased decommission strategy that avoids breaking active workflows. This is observable by opening the new `.agent/System` docs and seeing a clear mapping of tables to applications, plus a phased plan that names what stays, what is archived, and how to verify nothing breaks.

## Progress

- [x] (2026-01-05 02:10Z) Inventory all apps that touch the shared Supabase database and record their data access patterns.
- [x] (2026-01-05 02:10Z) Create shared database contract documentation and legacy system inventory in `.agent/System`.
- [x] (2026-01-05 02:10Z) Define and document a phased decommission strategy with validation steps.
- [x] (2026-01-05 02:10Z) Update `.agent/README.md` to index the new documentation artifacts.

## Surprises & Discoveries

- Observation: Multiple apps include real Supabase credentials in local .env files, which increases risk during decommissioning and refactors.
  Evidence: .env files exist under knearme-portfolio/, review-agent-dashboard/, contractor-review-agent/, rank-tracking/next-tracker/, rank-tracking/local-beacon/, and directory-platforms/supabase/.

## Decision Log

- Decision: Treat `knearme-portfolio/` as the canonical application while documenting all other apps and agents as legacy-but-active dependencies.
  Rationale: The user stated that the portfolio app is the primary app going forward while other systems are still in use and share the database.
  Date/Author: 2026-01-05 01:50Z / Codex
- Decision: Classify business-agent and business-agent-codex as active but non-DB systems until evidence of DB usage appears.
  Rationale: No Supabase usage was found in their src directories; user noted possible local SQLite usage that is not present in the repo.
  Date/Author: 2026-01-05 02:10Z / Codex

## Outcomes & Retrospective

Completed the shared DB contract, legacy inventory, and phased decommission strategy. The .agent index now points to these docs so future refactors can proceed with a clear dependency map.

## Context and Orientation

This workspace is a multi-project repository. The canonical application going forward is `knearme-portfolio/`, but several other apps and agents still run and share the same Supabase database, including `review-agent-dashboard/`, `contractor-review-agent/`, `business-agent/`, and `business-agent-codex/`. The predecessor apps under `directory-platforms/` and `rank-tracking/` were used to build toward the portfolio app but may still contain logic or schema assumptions. A “legacy system” in this plan means any app or agent that is not the canonical portfolio app but still reads or writes shared data. “Decommission” means intentionally reducing usage over time, moving remaining responsibilities to the canonical app, and eventually archiving or removing the legacy code with evidence that nothing breaks. A “shared DB contract” means a concise mapping of database tables and critical data flows to the applications that own or depend on them.

## Plan of Work

Begin by building an inventory of every application or agent that connects to Supabase or other databases. Use repository searches and local configuration files to identify Supabase clients, environment variables, SQL migrations, and typed database definitions. Record findings in a new `.agent/System/legacy_systems_inventory.md` file that lists each system, what it does, how it connects to data, and whether it is active.

Next, document the shared database contract in `.agent/System/shared_db_contract.md`. Summarize the shared schema sources, list the high-risk tables that multiple apps touch, and identify the presumed owner for each critical area such as portfolios, reviews, and rank-tracking data. Include a short description of invariants that must remain true during refactors, such as required columns or status enums.

Finally, author a phased decommission strategy in `.agent/System/decommission_strategy.md`. The strategy should define three phases: documentation and dependency mapping, migration of responsibilities to `knearme-portfolio/`, and archive or removal of unused systems. Each phase must include observable checks, such as a list of functions or scripts that must still run, and how to verify them without production impact.

When the documents are created, update `.agent/README.md` to link to the new files and include guidance on when to read them.

## Concrete Steps

Run the following commands from the repository root to locate data access points and usage patterns:

    rg -n "supabase" -g '!**/node_modules/**'
    rg -n "SUPABASE|supabase" -g '*.env*' -g '!**/node_modules/**'
    rg -n "createClient|createAdminClient" -g '!**/node_modules/**'
    rg -n "drizzle|schema" directory-platforms -g '!**/node_modules/**'
    rg -n "Database" rank-tracking/next-tracker/src/types/supabase.ts
    rg -n "Contractor|Project|Lead" rank-tracking/local-beacon/packages/database/src

Create the documentation files:

    cat > .agent/System/legacy_systems_inventory.md
    cat > .agent/System/shared_db_contract.md
    cat > .agent/System/decommission_strategy.md

Update the index:

    $EDITOR .agent/README.md

Expected outputs should confirm that the new files exist and are linked:

    ls .agent/System

        legacy_systems_inventory.md
        shared_db_contract.md
        decommission_strategy.md

## Validation and Acceptance

The change is accepted when the new system documentation exists and is indexed in `.agent/README.md`. The legacy systems inventory must name each active app or agent, how it connects to the database, and whether it is a candidate for phase-out. The shared DB contract must map high-risk tables to owning systems and state invariants that refactors must preserve. The decommission strategy must define phases with specific verification checks and clearly state that `knearme-portfolio/` remains the canonical app.

## Idempotence and Recovery

These steps are safe to rerun because they only add or update documentation. If a document needs correction, overwrite the single file without changing others. No destructive actions are permitted in this plan until the migration phase is executed and validated.

## Artifacts and Notes

A successful run should produce the following files under `.agent/System`:

    legacy_systems_inventory.md
    shared_db_contract.md
    decommission_strategy.md

## Interfaces and Dependencies

This plan adds documentation artifacts only. The interfaces are the documentation files and their referenced paths to data sources such as `knearme-portfolio/supabase/migrations/20260103055338_remote_schema.sql`, `rank-tracking/next-tracker/src/types/supabase.ts`, and the various Supabase client modules under each app. The dependencies include Supabase (shared Postgres), any local SQLite usage in agent tools, and schema definitions in Drizzle and D1 where they are used as historical references.

## Revision Notes

Initial plan created to document shared DB usage and define a phased decommission strategy for legacy systems and ad hoc agents.
2026-01-05 02:10Z: Updated progress, discovery notes, and outcomes after creating the system docs and indexing them.
