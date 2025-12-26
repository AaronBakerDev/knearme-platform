# ADR-003: AI Provider Strategy - Gemini + Whisper via Vercel AI SDK

> **Status:** Accepted (Updated)
> **Date:** December 8, 2025 (Updated December 26, 2025)
> **Deciders:** Technical Architect
> **Related:** ADR-001 (Next.js), ADR-002 (Supabase)

---

## Context

We need AI capabilities for three core functions:

1. **Image Analysis** - Detect project type, materials from photos
2. **Voice Transcription** - Convert contractor voice recordings to text
3. **Content Generation** - Generate professional project descriptions
4. **Chat Interface** - Conversational project creation wizard

The AI pipeline is the core differentiator of KnearMe. It must be:
- **Accurate** - Correct project type detection, high-quality content
- **Fast** - Response times under 10 seconds for generation
- **Cost-effective** - Sustainable at scale ($0.05-0.20 per project)
- **Reliable** - High uptime, consistent quality
- **Type-safe** - Structured outputs with validation
- **Provider-flexible** - Easy to switch providers as market evolves

---

## Decision

**We will use the Vercel AI SDK with Google Gemini 3.0 Flash as primary provider.**

Specifically:
- **Gemini 3.0 Flash** for image analysis (vision)
- **Gemini 3.0 Flash** for content generation
- **Gemini 3.0 Flash** for chat/streaming
- **OpenAI Whisper** for voice transcription (AI SDK doesn't yet support Gemini audio)
- **Vercel AI SDK** (`ai`, `@ai-sdk/google`, `@ai-sdk/openai`) for provider abstraction
- **Zod schemas** with `generateObject()` for type-safe structured outputs

---

## Rationale: Why Gemini over OpenAI?

| Factor | OpenAI GPT-4o | Gemini 3.0 Flash | Winner |
|--------|--------------|------------------|--------|
| **Cost (input/1M)** | $2.50 | $0.50 | Gemini (80% cheaper) |
| **Cost (output/1M)** | $10.00 | $3.00 | Gemini (70% cheaper) |
| **Speed** | Fast | Very fast | Gemini |
| **Vision quality** | Excellent | Excellent | Tie |
| **Context window** | 128K | 1M+ | Gemini |
| **Rate limits (free)** | 500 RPM | 1500 RPM | Gemini |

**Estimated cost savings: 70-80% on AI operations.**

---

## Consequences

### Positive

| Benefit | Details |
|---------|---------|
| **70-80% cost reduction** | Gemini pricing significantly lower than GPT-4o |
| **Provider abstraction** | AI SDK enables easy provider switching |
| **Type-safe outputs** | `generateObject()` + Zod = validated typed responses |
| **Unified SDK** | Single API pattern for all AI operations |
| **Streaming support** | `streamText()` for chat with tool calling |
| **Future-proof** | Can swap to Claude, Llama, etc. with minimal changes |

### Negative

| Trade-off | Mitigation |
|-----------|------------|
| **Whisper still on OpenAI** | AI SDK transcription via OpenAI; Gemini audio coming |
| **Model availability** | Gemini 3.0 Flash in preview; monitor for GA |
| **Learning curve** | AI SDK patterns differ from direct OpenAI SDK |

### Neutral

- Requires both Google AI and OpenAI API keys
- Usage-based pricing for both providers
- Must comply with Google and OpenAI usage policies

---

## Implementation Details

### Provider Configuration

```typescript
// src/lib/ai/providers.ts
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';

export const AI_MODELS = {
  vision: 'gemini-3-flash-preview',
  generation: 'gemini-3-flash-preview',
  chat: 'gemini-3-flash-preview',
  transcription: 'whisper-1',
} as const;

export const OUTPUT_LIMITS = {
  imageAnalysis: 1000,
  questionGeneration: 800,
  contentGeneration: 2000,
} as const;

export function isGoogleAIEnabled(): boolean {
  return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
}

export function getVisionModel() {
  return google(AI_MODELS.vision);
}

export function getGenerationModel() {
  return google(AI_MODELS.generation);
}

export function getChatModel() {
  return google(AI_MODELS.chat);
}

export function getTranscriptionModel() {
  return openai.transcription(AI_MODELS.transcription);
}
```

### Image Analysis (Gemini Vision)

```typescript
// src/lib/ai/image-analysis.ts
import { generateObject } from 'ai';
import { getVisionModel, OUTPUT_LIMITS } from './providers';
import { ImageAnalysisSchema } from './schemas';

export async function analyzeProjectImages(imageUrls: string[]) {
  const content = [
    { type: 'text', text: 'Analyze these masonry project images...' },
    ...imageUrls.map(url => ({ type: 'image', image: new URL(url) })),
  ];

  const { object } = await generateObject({
    model: getVisionModel(),
    schema: ImageAnalysisSchema,
    system: IMAGE_ANALYSIS_PROMPT,
    messages: [{ role: 'user', content }],
    maxOutputTokens: OUTPUT_LIMITS.imageAnalysis,
  });

  return object; // Type-safe ImageAnalysisResult
}
```

### Voice Transcription (Whisper via AI SDK)

```typescript
// src/lib/ai/transcription.ts
import { experimental_transcribe as transcribe } from 'ai';
import { getTranscriptionModel } from './providers';

export async function transcribeAudio(audioData: ArrayBuffer): Promise<string> {
  const result = await transcribe({
    model: getTranscriptionModel(),
    audio: audioData,
    providerOptions: {
      openai: {
        language: 'en',
        prompt: 'Masonry contractor describing their work...',
      },
    },
  });

  return result.text;
}
```

### Content Generation (Gemini)

```typescript
// src/lib/ai/content-generation.ts
import { generateObject } from 'ai';
import { getGenerationModel, OUTPUT_LIMITS } from './providers';
import { GeneratedContentSchema } from './schemas';

export async function generatePortfolioContent(
  imageAnalysis: ImageAnalysisResult,
  interviewResponses: Array<{ question: string; answer: string }>,
  businessContext: BusinessContext
) {
  const { object } = await generateObject({
    model: getGenerationModel(),
    schema: GeneratedContentSchema,
    system: CONTENT_GENERATION_PROMPT,
    prompt: buildContentGenerationMessage(imageAnalysis, interviewResponses, businessContext),
    maxOutputTokens: OUTPUT_LIMITS.contentGeneration,
    temperature: 0.7,
  });

  return object; // Type-safe GeneratedContent
}
```

### Chat with Tool Calling (Gemini)

```typescript
// src/app/api/chat/route.ts
import { streamText, tool } from 'ai';
import { getChatModel } from '@/lib/ai/providers';

const result = streamText({
  model: getChatModel(),
  system: CONVERSATION_SYSTEM_PROMPT,
  messages: await convertToModelMessages(messages),
  tools: {
    extractProjectData: tool({
      description: 'Extract project information from conversation',
      inputSchema: extractProjectDataSchema,
      execute: async (args) => args,
    }),
  },
  temperature: 0.7,
});

return result.toUIMessageStreamResponse();
```

---

## Cost Estimation (Updated)

| Model | Use Case | Cost per Project |
|-------|----------|------------------|
| Gemini 3.0 Flash | Image analysis (4 images) | ~$0.02 |
| Whisper | Transcription (2 min audio) | ~$0.02 |
| Gemini 3.0 Flash | Content generation | ~$0.01 |
| **Total** | | **~$0.05 per project** |

**vs Previous (OpenAI only): ~$0.15 per project**

**Monthly projection:**
- 100 projects/month = ~$5 (was $15)
- 500 projects/month = ~$25 (was $75)
- 1000 projects/month = ~$50 (was $150)

**66% cost reduction achieved.**

---

## Environment Variables

```bash
# Primary AI (Gemini 3.0 Flash)
GOOGLE_GENERATIVE_AI_API_KEY=your-google-key

# Secondary AI (Whisper transcription)
OPENAI_API_KEY=your-openai-key
```

---

## Testing

Run the integration test to verify all AI operations:

```bash
npx tsx scripts/test-gemini.ts
```

---

## Validation

This decision will be validated by:

1. **Accuracy** - >80% correct project type detection on test set
2. **Quality** - User approval rate >80% on first generation
3. **Speed** - <10 seconds total AI processing time
4. **Cost** - Stay under $0.10 per project
5. **Type Safety** - Zero runtime parsing errors with Zod validation

---

## Migration History

| Date | Change |
|------|--------|
| Dec 8, 2025 | Initial: OpenAI Chat Completions API |
| Dec 10, 2025 | Updated: OpenAI Responses API with `responses.parse()` |
| Dec 26, 2025 | **Migrated: Gemini 3.0 Flash via Vercel AI SDK** |

---

## References

- [Vercel AI SDK Documentation](https://ai-sdk.dev/docs/introduction)
- [AI SDK Google Provider](https://ai-sdk.dev/providers/ai-sdk-providers/google)
- [Gemini API Pricing](https://ai.google.dev/pricing)
- [Whisper API Reference](https://platform.openai.com/docs/guides/speech-to-text)
- [Zod Documentation](https://zod.dev)

---

*This ADR was updated December 26, 2025 to reflect migration from OpenAI to Gemini 3.0 Flash via Vercel AI SDK.*
