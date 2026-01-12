# Phase 1 Case Study Decommission Checklist

## Goal
Stop new writes from the legacy case study pipeline (directory-platforms/mvp) while preserving existing data for reference and avoiding breakage in the canonical portfolio app.

## Scope
- Legacy writers: directory-platforms/mvp UI hooks and Supabase Edge Functions.
- Tables: case_studies, case_study_details, case_study_images, chat_messages, agent_handoff_log.
- Functions: analyze-images, process-case-study, generate-draft (directory-platforms/mvp/supabase/functions).

## Checklist
- Confirm all write paths in directory-platforms/mvp:
  - UI hooks and data helpers (supabaseClient.ts, useCaseStudyChat, ImageUploader, case study components).
  - Edge Functions that insert/update case studies or chat messages.
- Add a kill switch plan:
  - Option A: Disable invocation paths in UI (stop calling process-case-study/analyze-images).
  - Option B: Add feature-flag guard in Edge Functions (return early when disabled).
- Monitor write activity for a cooldown window (e.g., 2-4 weeks):
  - Verify no new rows in case_studies, case_study_details, case_study_images, chat_messages, agent_handoff_log.
  - Verify portfolio app still functions without these writes.
- Disable legacy Edge Functions after the cooldown period:
  - Remove scheduled invocations, disable or delete function configs.
  - Document the date and method used for disablement.
- Mark tables as legacy read-only (optional):
  - Update RLS or access policies to block new inserts by legacy clients.
  - Keep read access for historical audits.
- Archive the directory-platforms/mvp pipeline code once no writes occur.

## Verification
- No new rows appear in the five case study tables for the agreed cooldown window.
- No errors in the portfolio app related to case study workflows.
- review-agent-dashboard and contractor-review-agent are unaffected.

## Rollback
- Re-enable Edge Functions and UI triggers if new writes are required.
- Document the reason and update shared_db_contract.md accordingly.
