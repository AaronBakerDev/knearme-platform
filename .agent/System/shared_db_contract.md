# Shared Database Contract

## Scope
This contract documents the shared Supabase Postgres schema used across active apps and agents. The canonical application is `knearme-portfolio/`, but several supporting systems read and write shared tables.

## Sources of truth
- Primary schema snapshot: knearme-portfolio/supabase/migrations/20260103055338_remote_schema.sql.
- Review pipeline types: contractor-review-agent/src/lib/types.ts.
- Legacy schema references (removed repos): .agent/System/legacy_systems_reference.md.

## Ownership map (domains -> owners -> tables)
- Portfolio core (owner: knearme-portfolio)
  - businesses, contractors, services, service_areas, service_types, service_requests.
  - projects, project_images, portfolio_items, portfolio_images.
  - listings, providers, provider_services, places, categories.
  - business_certifications, certifications, business_features, features.
- Content and publishing (owner: knearme-portfolio)
  - blog_posts, blog_authors, blog_comments, blog_tags, blog_post_tags, blog_post_categories, blog_related_posts, blog_seo_metrics.
  - documents, search_entries.
- Chat and agent memory (owner: knearme-portfolio)
  - chat_sessions, chat_messages, conversations, agent_memory.
  - interview_sessions.
- Case study pipeline (legacy; no new writes)
  - case_studies, case_study_details, case_study_images, agent_handoff_log.
- Review pipeline (primary writer: contractor-review-agent; review-agent-dashboard updates status)
  - review_contractors, review_data, review_analysis, review_articles.
  - ai_usage_log is used for tracking usage in dashboards and agents.
- Rank tracking (legacy; no active writers)
  - rt_users, rt_properties, rt_keywords, rt_locations, rt_rank_history, rt_tracking_configs.
  - rt_resource_* tables (resource center and SEO tracking).
- Telemetry and AI usage (mixed ownership)
  - ai_usage_log (contractor-review-agent; dashboard reads).
  - voice_usage, prompt_cap_* (knearme-portfolio).
- Legacy directory artifacts (no active writers)
  - _deprecated_directory_businesses, places_backup, queries, query_locations, location_query_status.

## Table-by-table write ownership matrix
Notes:
- "knearme-portfolio" is the canonical owner for active app tables.
- "legacy" means no active writer; keep read-only unless a reactivation plan exists.
- "verify" means no code reference found; confirm before schema changes.

| Table | Write owner(s) | Notes |
| --- | --- | --- |
| blog_posts | knearme-portfolio | CMS content. |
| _deprecated_directory_businesses | legacy | Archived directory data. |
| agent_handoff_log | legacy | Case study pipeline artifact. |
| agent_memory | knearme-portfolio | Agent memory store. |
| ai_usage_log | contractor-review-agent | Review pipeline usage logging; dashboard reads. |
| blog_authors | knearme-portfolio | CMS authors. |
| blog_comments | knearme-portfolio | CMS comments. |
| blog_post_categories | knearme-portfolio | CMS join table. |
| blog_post_tags | knearme-portfolio | CMS join table. |
| blog_related_posts | knearme-portfolio | CMS related posts. |
| blog_seo_metrics | knearme-portfolio | CMS SEO metrics. |
| blog_tags | knearme-portfolio | CMS tags. |
| business_certifications | knearme-portfolio | Business metadata. |
| business_features | knearme-portfolio | Business metadata. |
| businesses | knearme-portfolio | Core business profiles. |
| case_studies | legacy | Decommissioned case study pipeline. |
| case_study_details | legacy | Decommissioned case study pipeline. |
| case_study_images | legacy | Decommissioned case study pipeline. |
| categories | knearme-portfolio | Taxonomy (verify active writes). |
| certifications | knearme-portfolio | Taxonomy (verify active writes). |
| chat_messages | knearme-portfolio | Chat message history. |
| chat_sessions | knearme-portfolio | Chat session state. |
| contractors | knearme-portfolio | Contractor profiles. |
| conversations | knearme-portfolio | Conversation history and summaries. |
| places | knearme-portfolio | Place records (verify active writes). |
| documents | knearme-portfolio | Document storage (verify active writes). |
| features | knearme-portfolio | Feature taxonomy. |
| interview_sessions | knearme-portfolio | Interview/AI pipeline sessions. |
| listings | knearme-portfolio | Directory listings (verify active writes). |
| location_query_status | legacy | Directory search artifact; verify before changes. |
| n8n_chat_histories | external (n8n) | 22 rows; no update timestamps available; pg_stat_user_tables shows only 22 inserts. |
| oauth_authorization_codes | knearme-portfolio | OAuth/PKCE flow. |
| places_backup | legacy | Archived backup table. |
| portfolio_images | knearme-portfolio | Portfolio media (verify active writes). |
| portfolio_items | knearme-portfolio | Portfolio entries (verify active writes). |
| project_images | knearme-portfolio | Project media assets. |
| projects | knearme-portfolio | Project records. |
| prompt_cap_executions | knearme-portfolio | Prompt cap logs (verify active writes). |
| prompt_cap_feedback | knearme-portfolio | Prompt cap feedback (verify active writes). |
| prompt_cap_templates | knearme-portfolio | Prompt cap templates (verify active writes). |
| prompt_cap_variables | knearme-portfolio | Prompt cap variables (verify active writes). |
| provider_services | knearme-portfolio | Provider/service mapping (verify active writes). |
| providers | knearme-portfolio | Provider records (verify active writes). |
| push_subscriptions | knearme-portfolio | Web push subscriptions. |
| queries | legacy | Directory search artifact; verify before changes. |
| query_locations | legacy | Directory search artifact; verify before changes. |
| search_entries | knearme-portfolio | Search index (verify active writes). |
| review_analysis | contractor-review-agent | Review analysis pipeline. |
| review_articles | contractor-review-agent; review-agent-dashboard | Dashboard updates status; portfolio reads. |
| review_contractors | contractor-review-agent | Review pipeline contractors. |
| review_data | contractor-review-agent | Review ingestion and tagging. |
| reviews | inactive (no writer) | 0 rows; pg_stat_user_tables shows 0 inserts/updates/deletes. |
| rt_api_keys | legacy | Rank tracking (no active writer). |
| rt_audit_results | legacy | Rank tracking (no active writer). |
| rt_keywords | legacy | Rank tracking (no active writer). |
| rt_locations | legacy | Rank tracking (no active writer). |
| rt_rank_history | legacy | Rank tracking (no active writer). |
| rt_tracking_configs | legacy | Rank tracking (no active writer). |
| rt_properties | legacy | Rank tracking (no active writer). |
| rt_resource_authors | legacy | Rank tracking (no active writer). |
| rt_resource_categories | legacy | Rank tracking (no active writer). |
| rt_resource_headings | legacy | Rank tracking (no active writer). |
| rt_resource_interactions | legacy | Rank tracking (no active writer). |
| rt_resource_related | legacy | Rank tracking (no active writer). |
| rt_resource_seo_performance | legacy | Rank tracking (no active writer). |
| rt_resource_tag_map | legacy | Rank tracking (no active writer). |
| rt_resource_tags | legacy | Rank tracking (no active writer). |
| rt_resource_types | legacy | Rank tracking (no active writer). |
| rt_resources | legacy | Rank tracking (no active writer). |
| rt_users | legacy | Rank tracking (no active writer). |
| searched_cities | contractor-review-agent | Review pipeline searches; dashboard reads. |
| service_areas | knearme-portfolio | Service coverage (verify active writes). |
| service_requests | knearme-portfolio | Service request intake (verify active writes). |
| service_types | knearme-portfolio | Service taxonomy (verify active writes). |
| services | knearme-portfolio | Service taxonomy (verify active writes). |
| users | knearme-portfolio | App-level user profiles (auth users live in auth.users). |
| voice_usage | knearme-portfolio | Voice usage tracking. |

## Cross-app invariants (keep stable during refactors)
- review_contractors is the primary entity for review ingestion; review_data, review_analysis, and review_articles must continue to reference it by contractor_id.
- case_studies.current_stage must remain compatible with enum values: interview, writer_draft, review, finalized.
- Status enums in the canonical schema must remain compatible with existing values: business_status, listing_status, post_status, provider_status, review_status, service_status, user_role.
- review-agent-dashboard uses RPC functions get_unique_cities and get_unique_states; preserve or replace with compatible endpoints before removal.
- Legacy edge functions (removed repos) depended on table names and columns; confirm no deployed functions still rely on these tables before schema changes.

## Deprecation notes
- The legacy case study pipeline (formerly directory-platforms/mvp) is scheduled for Phase 1 decommission. Freeze new writes before disabling its Edge Functions. See .agent/System/phase1_case_study_decommission_checklist.md.
- Rank tracking (rt_* tables) is useful as a future feature but not part of the MVP; avoid schema changes until an integration plan is approved.
- Directory platform schemas were removed from the workspace; use .agent/System/legacy_systems_reference.md for historical context only.
- The legacy code folders `directory-platforms/` and `rank-tracking/` were removed from the workspace on 2026-01-05; retain this contract as the shared DB reference.

## Notes and cautions
- Multiple apps use service-role access, which bypasses RLS. Limit new writes to the canonical app when possible.
- .env files in several apps point to the same Supabase project; do not rotate or delete keys without coordinating across all active systems.
- If new schema changes are required, update the canonical migration in knearme-portfolio and then validate downstream agents (contractor-review-agent and review-agent-dashboard) for compatibility.
