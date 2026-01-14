# Unified Chat UI Feature Spec

> **Version:** 0.1  
> **Last Updated:** January 2, 2026  
> **Status:** Proposed  
> **Owners:** Product + Eng

---

## Overview

Adopt the project chat UI ("Void Interface") as the single chat surface for all conversational experiences. This unifies onboarding and project workflows into one UI shell while allowing different agents, tools, and artifacts to plug in per context.

---

## Goals

1. **One chat UI surface** used by both project chat and onboarding chat.
2. **Pluggable agent behavior** (endpoint, tools, artifacts) without rewriting UI.
3. **Consistent interaction patterns** across contexts (input, messages, typing, errors).
4. **Maintain existing onboarding logic** (Discovery Agent + Supabase conversation storage).

### Non-Goals

- Replacing or rewriting the Discovery Agent or project chat agent.
- Changing onboarding data persistence (still uses `conversations` table).
- Redesigning the LivePortfolioCanvas or project artifacts.
- Shipping new onboarding flows or new tools.

---

## Target Users

- **Contractors** onboarding into KnearMe.
- **Contractors** creating or editing portfolio projects.

---

## UX Requirements

### Shared UI Shell (Project Chat UI)

- Centered message column (max width 720px) with the same typography and spacing.
- Floating pill input with attachment, mic, send actions.
- Consistent loading / typing indicator, scroll behavior, and "jump to latest".
- Support for tool-driven artifacts inline in the message stream.
- Voice input support consistent with project chat.

### Onboarding Specifics

- Onboarding uses the same "Void Interface" styling.
- Business search results render as **an artifact** inside the chat stream.
- Selecting a business triggers the same confirmation message as today.

---

## Functional Requirements

1. **Shared Chat Surface Component**
   - A single component renders the message list and input area.
   - Optional slots for top overlays (errors/success) and above-input actions.
2. **Agent/Context Adapter**
   - Each chat context defines its endpoint, message mapping, and artifact registry.
3. **Onboarding Messages**
   - Onboarding messages are normalized to `UIMessage` parts (`type: "text"`).
4. **Business Search Results**
   - Search results appear as a tool-part artifact and are clickable.
5. **No behavior regression**
   - Project chat retains canvas panel, preview overlay, quick actions, and image flow.
   - Onboarding retains current agent logic and success redirect.

---

## Technical Design

### New Shared Component

**`src/components/chat/ChatSurface.tsx`**

Responsibilities:
- Renders `ChatMessages`.
- Renders `ChatInput`.
- Exposes optional slots:
  - `headerSlot` (e.g., onboarding mic hint).
  - `preInputSlot` (e.g., quick actions).
  - `overlaySlot` (errors/success/loading).

### Onboarding Adapter

**`src/components/onboarding/OnboardingChat.tsx`**

- Converts onboarding `Message` objects to `UIMessage` with parts:
  - `{ type: 'text', text: content }`.
- Appends a synthetic tool part when `state.searchResults` exists:
  - `tool-showBusinessSearchResults` with output payload.
- Handles artifact actions to send the confirmation message.

### Business Search Artifact

Add a new artifact:

- **Type:** `showBusinessSearchResults`
- **Location:** `src/components/chat/artifacts/BusinessSearchResultsArtifact.tsx`
- **Renderer:** register in `ArtifactRenderer` map.
- **Output shape:** array of `DiscoveredBusiness` + optional prompt copy.

### Artifact Types

Update `src/types/artifacts.ts`:
- Add new `ArtifactType`: `showBusinessSearchResults`.
- Define output type for the artifact.

---

## Data & API

### Onboarding

No API changes required. Onboarding remains:

- `GET /api/onboarding` (conversation + state)
- `POST /api/onboarding` (send message)

### Project Chat

No API changes required. Project chat continues to use:

- `POST /api/chat` (streaming chat)
- `GET /api/chat/sessions/[id]/context` (history + tool parts)

---

## Analytics & Metrics

Track with existing chat events; add onboarding-specific:

- `onboarding_chat_viewed`
- `onboarding_chat_message_sent`
- `onboarding_business_selected`
- `onboarding_completed`

Success indicators:

- % onboarding completions
- Time to completion
- Drop-off rate per step/message count

---

## Accessibility

- Maintain `role="log"` and live region behavior from `ChatMessages`.
- Keyboard navigation must work for business selection artifacts.
- Focus states visible on all interactive controls.

---

## Performance

- No additional data fetches beyond current onboarding calls.
- Business artifact should render without image loading (text-first).
- Avoid reflow by keeping message list stable and memoized.

---

## Risks & Mitigations

- **Risk:** Onboarding UI regression by switching to project chat shell.  
  **Mitigation:** Keep onboarding logic intact; only swap rendering.
- **Risk:** Artifact plumbing adds complexity.  
  **Mitigation:** Keep onboarding artifacts limited to search results.
- **Risk:** Accessibility regressions in artifact cards.  
  **Mitigation:** Use existing card patterns with keyboard support.

---

## Open Questions

1. Keep onboarding mic hint chip at top, or remove for cleaner first impression?
2. Should onboarding include quick action chips (likely no, for now)?

---

## Implementation Plan

1. **Add ChatSurface**
   - Create `src/components/chat/ChatSurface.tsx`.
   - Use in `ChatWizard` for the chat column.
2. **Normalize Onboarding Messages**
   - Convert to `UIMessage` parts.
   - Swap custom list for `ChatMessages`.
3. **Business Search Artifact**
   - Implement `BusinessSearchResultsArtifact`.
   - Register in `ArtifactRenderer` + types.
4. **Wire Onboarding Actions**
   - Emit `onArtifactAction` to call `sendMessage(...)`.
5. **QA + Docs**
   - Update `docs/09-agent/README.md` if needed.
   - Manual check onboarding + project chat.

---

## Acceptance Criteria

- Onboarding chat uses the same UI shell as project chat.
- Business search results appear as inline artifacts.
- Selecting a business continues the conversation correctly.
- Project chat behavior is unchanged (canvas, preview, artifacts, voice).
- No new API endpoints required.

---

## Test Plan

- Manual flow:
  1. `/profile/setup` loads onboarding chat.
  2. Send message -> assistant responds in project chat UI.
  3. If search results appear, select one and verify confirmation message.
  4. Complete onboarding and confirm redirect to `/dashboard`.
  5. `/projects/[id]` still shows full chat + canvas.

---

## Checklist (All Items)

- [ ] Product goals + non-goals defined
- [ ] UX requirements defined
- [ ] Functional requirements defined
- [ ] Technical design documented
- [ ] Data/API impact reviewed
- [ ] Analytics/events listed
- [ ] Accessibility requirements reviewed
- [ ] Performance considerations listed
- [ ] Risks + mitigations listed
- [ ] Open questions captured
- [ ] Implementation plan scoped
- [ ] Acceptance criteria defined
- [ ] Test plan defined
