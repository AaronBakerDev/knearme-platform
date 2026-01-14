# Stabilize Onboarding Agent Runtime and Data Capture

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This plan must be maintained in accordance with `../PLANS.md` (located one level above the repository root).

## Purpose / Big Picture

Contractors should be able to complete onboarding in the chat experience even when DataForSEO is unavailable, using information gathered from web search or direct conversation. Service area businesses must be able to finish onboarding without storing a street address. After this change, the canonical onboarding runtime is the streaming `/api/onboarding` path, and profile persistence consistently uses the best available data source while honoring `hideAddress`. A developer can see this working by completing onboarding in `/profile/setup` without an address and observing that the profile persists and the reveal artifact hides the address.

## Progress

- [x] (2026-01-10 04:18Z) Reviewed onboarding runtime paths and documented the canonical streaming path and persistence gaps.
- [x] (2026-01-10 04:35Z) Align the onboarding runtime around `/api/onboarding` and deprecate the unused `runDiscoveryAgent` path.
- [x] (2026-01-10 04:35Z) Extend web search and discovery state to capture address/phone/website when available and merge into persistence.
- [x] (2026-01-10 04:35Z) Allow completion without address when `hideAddress` is set and persist `hideAddress` in the business profile.
- [x] (2026-01-10 04:35Z) Add tests covering hideAddress persistence and web search fallbacks, then update onboarding docs.

## Surprises & Discoveries

- Observation: The production onboarding UI uses `/api/onboarding` streaming, while `runDiscoveryAgent` is unused and already diverged in fallback logic.
  Evidence: `src/components/onboarding/OnboardingChat.tsx` calls `/api/onboarding`, while `src/lib/agents/discovery.ts` exports `runDiscoveryAgent` with no call sites.
- Observation: `saveOnboardingProfile` reads address/phone/website only from `state.discoveredData`, but that field is never populated.
  Evidence: `src/app/api/onboarding/route.ts` reads `state.discoveredData`, and `src/lib/agents/discovery/tool-processing.ts` never sets it.
- Observation: Address is required for persistence even though the schema and prompt treat it as optional for service area businesses.
  Evidence: `src/app/api/onboarding/route.ts` gate requires `updatedState.address`, while `src/lib/agents/discovery/schemas.ts` marks `address` optional.

## Decision Log

- Decision: Treat `/api/onboarding` (streamText) as the canonical onboarding runtime and remove or deprecate `runDiscoveryAgent` to avoid drift.
  Rationale: The UI depends on streaming tool parts, and the alternative runtime is unused.
  Date/Author: 2026-01-10 / Codex
- Decision: Persist the best available contact data regardless of source, with explicit priority order and `hideAddress` enforcement.
  Rationale: Onboarding should not fail when DataForSEO is unavailable, and service area businesses must not be blocked.
  Date/Author: 2026-01-10 / Codex
- Decision: Keep `runDiscoveryAgent` as a deprecated, non-streaming wrapper rather than removing it.
  Rationale: The streaming runtime remains canonical, but a test harness entry point avoids reintroducing drift later.
  Date/Author: 2026-01-10 / Codex
- Decision: Move contact resolution into a shared module for testing and reuse.
  Rationale: Route-level helpers are hard to test; a shared module allows unit tests that cover hideAddress and web search fallbacks.
  Date/Author: 2026-01-10 / Codex

## Outcomes & Retrospective

Work not yet executed. Outcome will be recorded after implementation and validation.

## Context and Orientation

Onboarding is a conversation-first flow that lives at `/profile/setup`, which renders `src/components/onboarding/OnboardingChat.tsx`. The chat sends user messages to `POST /api/onboarding` in `src/app/api/onboarding/route.ts`, which runs a Discovery Agent prompt and tool calls via the Vercel AI SDK streaming API. The conversation state is persisted in the `conversations` table as `messages` and `extracted` (the JSON-serialized `DiscoveryState`). The Discovery Agent tools live in `src/lib/agents/discovery.ts`, with state updates in `src/lib/agents/discovery/tool-processing.ts`. Business lookup uses DataForSEO via `src/lib/tools/business-discovery`, and web search fallback uses `src/lib/agents/web-search.ts`.

A "tool part" is the structured tool-call output returned by the AI SDK and rendered as a chat artifact (for example business search results or the profile reveal). `DiscoveryState` is the in-memory JSON structure that tracks onboarding fields such as business name, contact info, services, and flags like `hideAddress`.

## Plan of Work

First, confirm the canonical runtime decision by removing or deprecating `runDiscoveryAgent` and updating `src/lib/agents/index.ts` and any references or docs that mention the alternate path. Keep the streaming `/api/onboarding` implementation as the single source of truth to avoid logic drift.

Next, extend the web search agent and discovery state to capture contact data when available. Update `src/lib/agents/web-search.ts` to request `website`, `phone`, and `address` (with optional `city` and `state` if present). Update the `WebSearchAgentResult` type and `DiscoveryState.webSearchInfo` in `src/lib/agents/discovery/types.ts` to include those fields, then update `src/lib/agents/discovery/tool-processing.ts` so `webSearchBusiness` merges these values into `state.website`, `state.phone`, `state.address`, and `state.city/state` when they are missing. Use `parseLocationFromAddress` from `src/lib/tools/business-discovery/client.ts` if an address is present but city/state are not.

Then, make `hideAddress` flow through tool outputs. Update `executeSaveProfile` and `SaveProfileResult` in `src/lib/agents/discovery.ts` and `src/lib/agents/discovery/tool-types.ts` to include `hideAddress`. Update `executeShowProfileReveal` and `ProfileRevealResult` to include `hideAddress` so the artifact can hide the address consistently. In `processDiscoveryToolCalls`, set `state.hideAddress` when it is present in the save or reveal outputs, and set `state.discoveredData` on `confirmBusiness` so DataForSEO data remains available for storage without being required.

After state is richer, adjust persistence in `src/app/api/onboarding/route.ts`. Use a shared helper in `src/lib/agents/discovery/contact-resolution.ts` to resolve address, phone, and website using an explicit priority order: user-provided state, then web search info, then confirmed listing data. Apply `hideAddress` by forcing the resolved address to null and removing any stored address from `location` JSON. Store `hide_address: true` in the `location` JSON when applicable so later profile reads can honor the preference. Update the `saveOnboardingProfile` gate so it no longer requires address, only the required fields (business name, phone, city, state, services) and a completed state, and update the `hasCompleteProfile` calculation in `requireOnboardingAuth` to treat `hide_address` as an acceptable substitute for missing address.

Finally, extend tests and docs. Add test coverage in `src/lib/agents/discovery/__tests__/tool-correctness.test.ts` or a new route-level test to cover `hideAddress` propagation, web-search contact merges, and the new persistence gate behavior. Update `docs/03-architecture/onboarding-conversation.md` and `docs/specs/typeform-onboarding-spec.md` to document the canonical runtime and the data source precedence rules.

## Concrete Steps

Work from the repository root at `/Users/aaronbaker/knearme-workspace/knearme-portfolio`.

1) Confirm the unused runtime and locate call sites.

    rg -n "runDiscoveryAgent" -S src

   Expect only the definition and exports; if any call sites exist, document them in the Decision Log before proceeding.

2) Implement the runtime cleanup and data capture changes described in the Plan of Work. Keep edits small and compile often.

3) Run the unit tests relevant to discovery tool processing and any new tests you add.

    npm run test:unit -- src/lib/agents/discovery/__tests__/tool-correctness.test.ts

   Expect PASS output for the updated tests.

4) Run linting before final review.

    npm run lint

   Expect no lint errors.

## Validation and Acceptance

Acceptance is met when all of the following are true.

A contractor can complete onboarding in `/profile/setup` without providing a street address if they indicate they are a service area business, and the reveal artifact shows only city/state while hiding the address.

When DataForSEO is unavailable but the web search tool returns a website or phone number, those values appear in the persisted business profile and in subsequent onboarding state.

The onboarding completion check in `GET /api/onboarding` reports `hasCompleteProfile: true` for a service area business with `hide_address` set and missing address.

The automated tests added or updated for tool processing and persistence pass, and `npm run lint` succeeds.

## Idempotence and Recovery

All edits are additive and safe to apply more than once. If a change to the onboarding route or tool schema fails, revert the single file and re-run the unit tests before attempting the next edit. If a test fails after changes to the web search prompt or state types, update the type definitions and test fixtures first, then re-run the targeted tests until they pass.

## Artifacts and Notes

Include short evidence snippets in this section as changes are made, such as the updated helper function signature, the updated test output, and the specific line showing `hide_address` in the location JSON. Use short indented blocks rather than code fences to avoid breaking the ExecPlan format.

## Interfaces and Dependencies

The implementation must define or update these interfaces and helpers.

In `src/lib/agents/web-search.ts`, extend the `WebSearchAgentResult` and its `businessInfo` payload to include `website`, `phone`, and `address` (and optional `city` and `state` when extracted).

In `src/lib/agents/discovery/types.ts`, extend `DiscoveryState.webSearchInfo` to include the same contact fields and add `hideAddress` if it is not already persisted in state.

In `src/lib/agents/discovery/tool-types.ts`, update `SaveProfileResult` and `ProfileRevealResult` so `hideAddress` can flow to artifacts and persistence.

In `src/lib/agents/discovery/contact-resolution.ts`, define:

    export function resolveOnboardingContact(state: DiscoveryState): {
      address: string | null;
      phone: string | null;
      website: string | null;
      city: string | null;
      state: string | null;
      hideAddress: boolean;
    }

Use this helper in `saveOnboardingProfile` and in the completion gate to ensure the resolved values and `hideAddress` rules are applied consistently.

## Plan Update Notes

Plan updated on 2026-01-10 to reflect the shared contact-resolution module and the decision to keep `runDiscoveryAgent` as a deprecated wrapper so the canonical streaming runtime remains in sync.
