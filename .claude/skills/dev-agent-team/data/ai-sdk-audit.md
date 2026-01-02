# AI SDK Audit

## Current versions
- `ai`: ^6.0.3 (AI SDK 6)
- `@ai-sdk/openai`: ^3.0.1
- `@ai-sdk/google`: ^3.0.1
- `@ai-sdk/react`: ^3.0.3

## Deprecated APIs in use
- `generateObject` from `ai` is deprecated in AI SDK 6 and marked legacy.
  - Used in `src/lib/ai/content-generation.ts`
  - Used in `src/lib/ai/image-analysis.ts`

## Recommended updates
- Replace `generateObject` with `generateText` + `Output.object(...)` per the AI SDK 6 migration guide.
  - For streaming structured data, use `streamText` + `Output.object(...)` instead of `streamObject`.
- `experimental_transcribe` is still documented as experimental (not deprecated); keep but monitor for stabilization.

## Sources
- Migration Guide 6.0: https://ai-sdk.dev/docs/migration-guides/migration-guide-6-0
- Generating structured data (deprecation notice): https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data
- Transcription docs (experimental): https://ai-sdk.dev/docs/ai-sdk-core/transcription
- AI SDK changelog: https://github.com/vercel/ai/blob/main/packages/ai/CHANGELOG.md
