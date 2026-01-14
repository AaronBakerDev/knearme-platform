# Contractor ChatGPT App (Case-Study Projects)

This section describes how the contractor interface should live inside ChatGPT, while the public web app remains the system of record for SEO, browsing, and full data management.

## Goals

- Contractors generate case-study projects inside ChatGPT with minimal friction.
- ChatGPT produces the narrative and draft copy without extra model calls in our backend.
- The web app remains the canonical data store and a rich UI for deeper work.
- Projects are **case studies** we showcase, not a contractor's full work history.

## Non-goals

- Rebuilding the entire web app inside ChatGPT.
- Long, multi-step admin workflows inside ChatGPT widgets.
- Heavy data browsing or analytics inside ChatGPT.

## Project definition (case studies)

A "project" is a public-facing case study. It is curated content that highlights outcomes, process, and media. It is not a raw log of everything a contractor has done.

Key attributes:
- Title and short summary
- Challenge / Solution / Results narrative
- Service type and location
- Media gallery and hero image
- Optional materials, techniques, duration, outcomes

## Required vs. recommended fields

**Required to publish**
- Title
- Project type (service)
- City + state
- At least 1 image
- Hero image (auto-set to first image if missing; still stored explicitly)

**Recommended (for engagement)**
- Summary (1-2 sentences)
- Challenge, Solution, Results (short sections)
- Outcome highlights (2-4 bullets)
- Before/after labels when available
- Materials, techniques, duration, tags
- SEO title + description

**Optional**
- Client type (residential/commercial)
- Budget range
- Warranty or maintenance notes
- Testimonial or quote

## Implementation decisions (locked)

1) **Project location storage**
   - Store `city` + `state` on the project record (copied from contractor at creation).
   - Allow editing per project to keep case studies stable for SEO even if profile changes.

2) **Description behavior (API-owned)**
   - Default to auto-composed `description` from summary + sections + outcomes.
   - Allow manual override in the web app via `description_manual` (or equivalent).
     - If manual, do not overwrite on section updates.
     - If auto, recompute on any narrative update.
     - If empty on publish, compose once before validation.

3) **Hero image default + publish**
   - Auto-set `hero_image_id` on first upload if empty.
   - Publish requires `hero_image_id`, but does not require explicit selection.

4) **Publish gating vs. UX**
   - Only block on the minimum required fields above.
   - Treat narrative sections and media labels as recommended (non-blocking).
   - Always show a "recommended" checklist in the widget and web UI.

5) **Media flow (widget-first)**
   - MCP server only requests signed upload URLs and creates image records.
   - The ChatGPT widget downloads files from the runtime and uploads to storage.
   - Show progress + preview in the widget; allow reordering and hero selection there.
   - Fallback: if runtime download is unavailable, open a web uploader via `openExternal`.

## Primary workflow

1. Contractor asks for a new case study in ChatGPT.
2. Model calls `create_project_draft` with only the required inputs.
3. Tool returns a compact draft plus missing fields.
4. Contractor uploads photos or links assets.
5. ChatGPT synthesizes a case study narrative from the photos and notes.
6. Widget renders a draft review and media organizer; user can edit text or reorder media.
7. ChatGPT can also re-order media or rewrite sections on request.
8. Widget calls `finalize_project` to create the project.
9. ChatGPT confirms and returns a deep link to the web app for full management.

## Conversational prompts (example)

- "What is the most impressive part of this project?" (summary seed)
- "What problem did the client have?" (challenge)
- "What did you do to fix it?" (solution)
- "What changed after you finished?" (results)
- "Do you want this photo to be the hero image?" (hero selection)
- "Do you have a before photo?" (optional before/after labeling)

## Tool surface (proposed)

### `create_project_draft`

Creates a draft with minimal inputs. ChatGPT is responsible for the narrative and summary copy; the tool should return structured fields for persistence and UI.

Input:
- `business_name`
- `location`
- `industry`
- `project_type`
- `notes` (optional)

Output:
- `structuredContent`: `project_id`, `summary`, `missing_fields`
- `_meta`: full draft (sections, tags, media slots, optional copy)

### `add_project_media`

Adds images to a project draft. Used when the contractor uploads photos or provides URLs.

Input:
- `project_id`
- `media` (array of image IDs or URLs)

Output:
- `structuredContent`: `media_count`, `missing_fields`
- `_meta`: full media list with metadata

### `reorder_project_media`

Reorders media assets. Used by drag-and-drop in the widget or via ChatGPT requests.

### `set_project_hero_media`

Sets the hero image explicitly. Default to the first image if not set.

### `set_project_media_labels`

Optional. Label images as `before`, `after`, `progress`, `detail` when available.

### `update_project_sections`

Updates specific narrative sections: `summary`, `challenge`, `solution`, `results`, and `outcomes`.

### `update_project_meta`

Updates title, tags, materials, techniques, duration, SEO fields.

### `finalize_project`

Creates a real project. Destructive; require confirmation.

### `get_project_status`

Returns current status and next actions.

### `list_contractor_projects`

Returns recent projects with summary and links to the web app.

## UI widgets

1. **Draft review widget**
   - Summary + narrative sections
   - Edit inline fields
   - CTA: Finalize project

2. **Media organizer widget**
   - Gallery with drag-and-drop reordering
   - Hero image selection
   - Optional before/after labels

3. **Status widget**
   - Status timeline + next action
   - Quick links to the web app

4. **Project list widget**
   - Last 5-10 projects
   - Status chips + open links

## ChatGPT-driven synthesis

The model should do the heavy lifting for copy:

- Summary and narrative sections are authored by ChatGPT.
- Tools provide structured facts (location, type, materials, metrics) and persist the final text.
- When photos are uploaded, ChatGPT can describe or classify them using the model's native vision, then call `update_project_sections` and `reorder_project_media`.

Store image IDs in `widgetState` so the model can reason about them across turns.

## Content generation strategy (avoid extra model calls)

Goal: Use ChatGPT's native model inside the app as the content generator so we do not pay for separate OpenAI API calls.

How:
- Let ChatGPT write summaries, narratives, and outcomes directly in the conversation.
- Tools should return structured data and IDs, not long-form prose.
- The widget should present structured data and allow edits, not generate content on its own.

If we call OpenAI APIs from our backend for copy generation, we will incur API billing. The Apps SDK itself runs inside ChatGPT, so the model is already available to the user in that context.

Note: OpenAI has not published separate Apps SDK pricing details yet. As of December 2025, ChatGPT subscriptions and API billing are distinct, so avoid API calls if the intent is to keep costs off the API meter. Verify this before launch.

## Data boundaries

- ChatGPT provides the narrative; the server provides authoritative data and persistence.
- Any PII or sensitive data must stay out of `structuredContent`.
- Use `_meta` for large payloads or UI-only data.

## Auth + permissions

- Require OAuth for write tools.
- Enforce contractor-level access checks in the MCP server.
- Use `destructiveHint` for `finalize_project`.

## Web app hand-off

Every project created in ChatGPT should include a stable URL back to the web app for:

- Full data review
- Attachment management
- Detailed analytics or billing
