# UI and UX

This section summarizes UX principles and UI guidelines for ChatGPT apps.

## UX principles

- **Conversational first**: the chat is the primary interface; UI should support, not replace it.
- **Native fit**: keep workflows small, focused, and aligned with the chat context.
- **Clarity over complexity**: avoid multi-step wizards and long-form content.
- **Low friction**: reduce required inputs, prefill when possible, and keep actions obvious.

Avoid:
- Ads or promotional layouts.
- Sensitive or restricted data flows.
- Duplicating the core ChatGPT experience.

## Display modes

- **Inline**: the default. Best for summaries, previews, and small actions.
- **Carousel**: for multiple items in a compact space.
- **Fullscreen**: for complex editing or dense data.
- **Picture-in-picture (PiP)**: for persistent context while chatting.

Only request fullscreen when the UI cannot be effectively used inline.

## UI kit and components

OpenAI provides an Apps SDK UI kit. Use it to match ChatGPT design patterns and reduce custom styling. If you do not use the UI kit, stick to system fonts and colors so the widget blends with the ChatGPT surface.

## Visual design

- Use system colors and system fonts.
- Prefer native controls and simple layouts.
- Avoid custom fonts and heavy visual themes.
- Keep spacing generous and typography readable.
- Let ChatGPT handle app branding; the UI should focus on content.

## Layout and interaction

- Prefer single-column layouts for readability.
- Keep primary actions obvious and limited to one or two per view.
- Show status and errors inline, not in modal alerts.
- Respect `safeArea` and `view` bounds from the runtime context.

## Accessibility

- Provide concise labels and visible focus states.
- Keep contrast high and avoid low-contrast UI.
- Use `openai/widgetAccessible` metadata when needed.
