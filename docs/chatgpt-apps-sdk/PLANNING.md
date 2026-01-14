# Planning

Planning is the most important step for a ChatGPT app. Start by defining a crisp set of use cases and map them to a small set of reliable tools and UI components.

## Use case discovery

- Write 5 to 10 "golden prompts" that represent ideal user requests.
- Add indirect and negative prompts to clarify boundaries.
- For each prompt, describe the expected tool flow, UI output, and follow-up actions.

Good prompts are specific, end with a decision or action, and are short enough for a tool to satisfy.

## Tool design principles

- One tool = one job.
- Prefer a small set of high-quality tools over many niche tools.
- Keep input schemas minimal; only ask for required fields.
- Use clear, descriptive tool names and human-readable descriptions.
- Add hints in descriptions like "Use this when..." or "Only use this if...".

## Output contract design

Decide up front what goes where:

- `structuredContent`: compact, LLM-friendly fields the model should see.
- `_meta`: UI-only details, large payloads, or sensitive information.
- `content`: the text response shown in the chat.

If the model should reason about a field, put it in `structuredContent`. Otherwise, put it in `_meta`.

## Component planning

- Define the UI surface for each tool: viewer, editor, picker, or confirmation.
- Decide if a tool requires `inline`, `carousel`, `fullscreen`, or `pip` display mode.
- Map user actions in the widget to follow-up tool calls or messages.

## Metadata plan

Write tool metadata early:

- Tool name, title, and description.
- Invocation messages for user clarity.
- Hints like `readOnlyHint`, `destructiveHint`, and `openWorldHint`.

## Pre-build checklist

- Each golden prompt maps to a tool and UI.
- Each tool has a minimal input schema.
- Each tool has a clear output contract.
- Each UI component fits one display mode.
- Each tool has metadata designed for model selection.

