# Decommission legacy case study pipeline in directory-platforms/mvp

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This plan must be maintained in accordance with `PLANS.md` at the repository root.

## Purpose / Big Picture

The goal is to stop new writes from the legacy case study pipeline in `directory-platforms/mvp` while keeping existing case study data readable and avoiding breakage in the canonical portfolio app. After this change, the legacy UI will behave in a read-only mode with a clear deprecation message, Supabase Edge Functions will refuse new writes with a consistent disabled response, and operators can verify that no new rows are created in case study tables. This is observable by trying to create or edit a case study in the MVP app and seeing a decommission notice without any new database writes, and by invoking the Edge Functions and receiving a disabled response.

## Progress

- [ ] (2026-01-05 02:23Z) Add a case study pipeline feature flag to the MVP client and wire it into the case study UI to prevent new writes.
- [ ] (2026-01-05 02:23Z) Add server-side guards to Supabase Edge Functions to refuse new case study writes when the pipeline is disabled.
- [ ] (2026-01-05 02:23Z) Update documentation and environment guidance to reflect the decommission state and how to re-enable if needed.
- [ ] (2026-01-05 02:23Z) Validate that no new rows are written to case study tables and that the MVP UI is read-only.

## Surprises & Discoveries

- Observation: The canonical migration shows `chat_messages` keyed by `session_id`, while the MVP code writes `case_study_id`, so schema validation must be confirmed in the live database before relying on table-level checks.
  Evidence: `knearme-portfolio/supabase/migrations/20260103055338_remote_schema.sql` defines `chat_messages.session_id`, while `directory-platforms/mvp/src/lib/supabaseClient.ts` writes `case_study_id`.

## Decision Log

- Decision: Implement a kill switch via environment variables in both the MVP client and the Edge Functions, and treat the pipeline as disabled unless explicitly enabled.
  Rationale: The pipeline is being decommissioned, so a default-disabled behavior prevents accidental writes while keeping re-enable capability for rollback or audits.
  Date/Author: 2026-01-05 02:23Z / Codex

## Outcomes & Retrospective

Pending until implementation completes.

## Context and Orientation

The legacy case study pipeline lives in `directory-platforms/mvp`. The client UI writes to tables `case_studies`, `case_study_details`, `case_study_images`, `chat_messages`, and `agent_handoff_log` via `directory-platforms/mvp/src/lib/supabaseClient.ts`, and calls Supabase Edge Functions in `directory-platforms/mvp/supabase/functions` named `process-case-study`, `analyze-images`, and `generate-draft`. An Edge Function is a serverless HTTP handler hosted by Supabase that can write to the database; a kill switch is a configuration flag that prevents those handlers from mutating data. The canonical app is `knearme-portfolio`, so this plan only disables new writes from the MVP pipeline and does not delete data or tables.

## Plan of Work

First, add a client-side feature flag in the MVP app to ensure no new writes occur from the UI. Centralize the flag in a small helper module and use it in `Dashboard.tsx`, `useCaseStudyChat.tsx`, `ImageUploader.tsx`, and `ChatInterface.tsx` to disable create, send, upload, and delete actions while still allowing read-only views. The UI should show a clear message that the case study workflow is deprecated.

Next, add a server-side guard to each Supabase Edge Function so they return a disabled response before parsing or writing data when the kill switch is off. This ensures any direct invocation of the functions is blocked even if the UI is bypassed.

Finally, update the documentation and environment guidance in `.agent/System` and the MVP README so operators know how to control the flag. Validate by running the MVP app locally and by checking Supabase tables for new rows after simulated use.

## Concrete Steps

From the repository root, move into the MVP project and check for local agent rules before editing:

    cd directory-platforms/mvp
    ls AGENTS.md

If `AGENTS.md` exists, read and follow its instructions before continuing.

Create a client-side feature flag helper at `directory-platforms/mvp/src/lib/caseStudyPipeline.ts` that exports a boolean such as `caseStudyPipelineEnabled`. Use `import.meta.env.VITE_CASE_STUDY_PIPELINE_ENABLED === "true"` and default to false when the variable is missing. Update `directory-platforms/mvp/README.md` to document the new `VITE_CASE_STUDY_PIPELINE_ENABLED` flag and its effect.

Update `directory-platforms/mvp/src/pages/Dashboard.tsx` to disable `createNewCaseStudy` when the pipeline is disabled, and show a visible deprecation notice near the header. Ensure the New Case Study button is disabled and does not call `db.caseStudies.insert` when the flag is off.

Update `directory-platforms/mvp/src/hooks/useCaseStudyChat.tsx` to skip `initializeChat` and short-circuit `handleSendMessage` when disabled, returning a toast or inline warning instead of inserting chat messages or invoking `process-case-study`.

Update `directory-platforms/mvp/src/components/case-study/ChatInterface.tsx` to accept a `disabled` prop, disable the textarea and submit button, and display a short message indicating the workflow is deprecated and read-only. Wire this new prop through `ChatContainer.tsx` and `CaseStudyEditor.tsx`.

Update `directory-platforms/mvp/src/components/case-study/ImageUploader.tsx` to disable upload and delete actions when the pipeline is disabled. This should prevent writes to `case_study_images`, `case_studies`, and the `case-study-images` storage bucket while still allowing image previews for existing records.

Add a kill switch in each Edge Function at `directory-platforms/mvp/supabase/functions/process-case-study/index.ts`, `directory-platforms/mvp/supabase/functions/analyze-images/index.ts`, and `directory-platforms/mvp/supabase/functions/generate-draft/index.ts`. After handling CORS OPTIONS, check `Deno.env.get("CASE_STUDY_PIPELINE_ENABLED") === "true"`; if not enabled, return a JSON response with a 410 status and a message like `{"error":"case study pipeline disabled"}` without performing any database writes. Record the environment variable in the function documentation or README so operators know where to set it.

Update `.agent/System/shared_db_contract.md` and `.agent/System/legacy_systems_inventory.md` to note that the pipeline is now disabled by default and the kill switch is live. Add a short entry to `.agent/System/phase1_case_study_decommission_checklist.md` marking the code-level guardrails as complete.

## Validation and Acceptance

Run the MVP app and confirm that creating a new case study is blocked, chat input is disabled, and image uploads or deletions are prevented with a clear deprecation notice. Invoke the Supabase Edge Functions with test requests and confirm they return a 410 response when `CASE_STUDY_PIPELINE_ENABLED` is not set to true. In the Supabase SQL editor, check that `case_studies`, `case_study_details`, `case_study_images`, `agent_handoff_log`, and `chat_messages` do not receive new rows after these attempts. Acceptance is met when the UI is read-only, the Edge Functions refuse writes, and no new rows appear during verification.

## Idempotence and Recovery

The feature flag and Edge Function guards are reversible by setting `VITE_CASE_STUDY_PIPELINE_ENABLED=true` in the MVP environment and `CASE_STUDY_PIPELINE_ENABLED=true` in the Supabase Edge Function environment. If a rollback is required, re-enable the flags and remove the UI deprecation messaging, then redeploy the MVP app and Edge Functions.

## Artifacts and Notes

A successful change should produce a visible notice in the MVP UI and an Edge Function response similar to:

    HTTP/1.1 410 Gone
    {"error":"case study pipeline disabled"}

## Interfaces and Dependencies

This change introduces two configuration flags. The MVP client uses `VITE_CASE_STUDY_PIPELINE_ENABLED` (true enables the legacy pipeline; any other value disables it). The Edge Functions use `CASE_STUDY_PIPELINE_ENABLED` with the same semantics. The plan depends on the existing case study UI modules under `directory-platforms/mvp/src/pages` and `directory-platforms/mvp/src/components/case-study`, the data helper in `directory-platforms/mvp/src/lib/supabaseClient.ts`, and the Supabase Edge Functions under `directory-platforms/mvp/supabase/functions`.

## Revision Notes

Initial plan created to disable the legacy MVP case study pipeline with client and server kill switches, without removing data or tables.
