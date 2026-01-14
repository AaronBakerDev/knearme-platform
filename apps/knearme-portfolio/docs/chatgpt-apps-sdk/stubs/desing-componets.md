# Design Components

> Source: https://developers.openai.com/apps-sdk/plan/components

## Overview

This guide covers planning and designing UI components for ChatGPT app connectors, focusing on how components serve as the user-facing interface for data interaction and editing.

## Why Components Matter

"UI components are the human-visible half of your connector." They enable users to view/edit data inline, switch to fullscreen modes, and keep context synchronized between typed prompts and UI actions.

## Sample Components Available

The documentation references reusable examples in the openai-apps-sdk-examples repository:

- **List** – Dynamic collections with empty-state handling
- **Map** – Geospatial data with marker clustering and detail panes
- **Album** – Media grids with fullscreen transitions
- **Carousel** – Featured content with swipe gestures
- **Shop** – Product browsing with checkout features

## Design Considerations

### User Interaction Clarity

- Distinguish between read-only viewers (charts, dashboards) and editable components (forms, kanban boards)
- Plan for single-shot versus multi-turn interactions with persistent state
- Sketch inline versus fullscreen/picture-in-picture layouts

### Data Requirements

- Define structured JSON payloads for component parsing
- Use `window.openai.toolOutput` for initial render data
- Leverage `window.openai.setWidgetState` for state caching

### Responsive Design

- Set max widths with graceful mobile collapse
- Respect system dark mode and provide keyboard focus states
- Plan launcher transitions and navigation visibility

### State Management

- **Component state**: Use `setWidgetState` API for UI-level persistence
- **Server state**: Store authoritative data in backend/storage layer
- **Model messages**: Ensure meaningful transcript updates via `sendFollowUpMessage`

### Instrumentation

Plan analytics for component loads, interactions, and errors; link tool-call IDs to telemetry for end-to-end tracing.

---

**Next Step:** Implementation moves to the [Build a ChatGPT UI](/apps-sdk/build/chatgpt-ui) guide.
