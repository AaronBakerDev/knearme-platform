# Metadata and tool hints

Tool metadata is how the model decides which tool to call and how to interpret results. Treat metadata as part of the product surface.

## Tool naming and descriptions

- Use verb-first names (e.g., `find_locations`).
- Make descriptions task-specific and action-oriented.
- Add explicit hints like "Use this when..." or "Do not use this for...".

## Invocation messaging

Use `openai/toolInvocation/invoking` and `openai/toolInvocation/invoked` to give users clarity while tools run and when they finish.

## OpenAI metadata fields we use

- `openai/outputTemplate`: bind a tool response to a UI bundle (template URI).
- `openai/widgetAccessible`: allow the widget to call tools via `window.openai.callTool`.
- `openai/visibility`: set to `private` for legacy or internal-only tools.
- `openai/widgetDescription`: short accessibility label on the widget resource.

## Tool hints

Use OpenAI tool hints to guide the model:

- `readOnlyHint`: tool reads data only.
- `destructiveHint`: tool performs irreversible changes.
- `openWorldHint`: tool makes external network requests.

## Parameter docs

- Provide short, human-friendly descriptions for each parameter.
- Mark required fields explicitly.
- Avoid ambiguous field names.

## Prompt sets

Build and maintain a golden prompt set:

- Direct prompts (clear requests).
- Indirect prompts (vague requests that should map to tools).
- Negative prompts (what the tool should not do).

Use these prompts to test tool selection and iterate on metadata.
