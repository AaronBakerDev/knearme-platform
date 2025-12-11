# ADR-003: OpenAI Responses API for AI Pipeline

> **Status:** Accepted (Updated)
> **Date:** December 8, 2025 (Updated December 10, 2025)
> **Deciders:** Technical Architect
> **Related:** ADR-001 (Next.js), ADR-002 (Supabase)

---

## Context

We need AI capabilities for three core functions:

1. **Image Analysis** - Detect project type, materials from photos
2. **Voice Transcription** - Convert contractor voice recordings to text
3. **Content Generation** - Generate professional project descriptions

The AI pipeline is the core differentiator of KnearMe. It must be:
- **Accurate** - Correct project type detection, high-quality content
- **Fast** - Response times under 10 seconds for generation
- **Cost-effective** - Sustainable at scale ($0.10-0.50 per project)
- **Reliable** - High uptime, consistent quality
- **Type-safe** - Structured outputs with validation

---

## Decision

**We will use OpenAI as our primary AI provider with the Responses API.**

Specifically:
- **GPT-4o** for image analysis (vision)
- **Whisper API** for voice transcription
- **GPT-4o** for content generation
- **Responses API** with `responses.parse()` for structured outputs
- **Zod schemas** for type-safe response validation

All accessed via OpenAI API, orchestrated through Next.js API routes.

---

## Consequences

### Positive

| Benefit | Details |
|---------|---------|
| **Type-safe outputs** | Zod schemas + `responses.parse()` = typed responses |
| **Simpler API** | `instructions` + `input` instead of `messages` array |
| **Best-in-class vision** | GPT-4o excels at construction/trade image understanding |
| **Unified provider** | Single API, single billing, consistent DX |
| **Whisper accuracy** | Industry-leading transcription, handles background noise |
| **GPT-4o speed** | Fast inference (2-5 seconds for generation) |
| **Structured outputs** | Native JSON schema support with validation |

### Negative

| Trade-off | Mitigation |
|-----------|------------|
| **Cost at scale** | Monitor usage; implement caching for repeat analyses |
| **API dependency** | Build abstraction layer for potential future provider swap |
| **Rate limits** | Implement retry logic with exponential backoff |
| **Latency variance** | Show loading states; set user expectations |

### Neutral

- Requires OpenAI account and API key management
- Usage-based pricing (variable monthly cost)
- Must comply with OpenAI usage policies

---

## Implementation Details

### Zod Schemas for Type-Safe Parsing

```typescript
// lib/ai/schemas.ts
import { z } from 'zod';

export const ImageAnalysisSchema = z.object({
  project_type: z.string(),
  project_type_confidence: z.number().min(0).max(1),
  materials: z.array(z.string()),
  techniques: z.array(z.string()),
  image_stage: z.enum(['before', 'during', 'after', 'detail', 'unknown']),
  quality_notes: z.string(),
  suggested_title_keywords: z.array(z.string()),
});

export const GeneratedContentSchema = z.object({
  title: z.string(),
  description: z.string(),
  seo_title: z.string(),
  seo_description: z.string(),
  tags: z.array(z.string()),
  materials: z.array(z.string()),
  techniques: z.array(z.string()),
});
```

### Image Analysis (GPT-4o Vision + Responses API)

```typescript
// lib/ai/image-analysis.ts
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { ImageAnalysisSchema } from './schemas';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function analyzeProjectImages(imageUrls: string[]) {
  const inputContent: OpenAI.Responses.ResponseInputItem[] = [
    {
      type: 'message',
      role: 'user',
      content: [
        { type: 'input_text', text: 'Analyze these masonry project images...' },
        ...imageUrls.map(url => ({
          type: 'input_image' as const,
          image_url: url,
        })),
      ],
    },
  ];

  const response = await openai.responses.parse({
    model: 'gpt-4o',
    instructions: IMAGE_ANALYSIS_PROMPT,
    input: inputContent,
    text: {
      format: zodResponseFormat(ImageAnalysisSchema, 'image_analysis'),
    },
    max_output_tokens: 500,
  });

  return response.output_parsed; // Type-safe ImageAnalysisResult
}
```

### Voice Transcription (Whisper)

```typescript
// lib/ai/transcription.ts
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function transcribeAudio(audioFile: File): Promise<string> {
  const response = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
    language: 'en',
    response_format: 'verbose_json',
    prompt: 'Masonry contractor describing their work...',
  });

  return response.text;
}
```

### Content Generation (GPT-4o + Responses API)

```typescript
// lib/ai/content-generation.ts
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { GeneratedContentSchema } from './schemas';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generatePortfolioContent(
  imageAnalysis: ImageAnalysisResult,
  interviewResponses: Array<{ question: string; answer: string }>,
  businessContext: BusinessContext
) {
  const response = await openai.responses.parse({
    model: 'gpt-4o',
    instructions: CONTENT_GENERATION_PROMPT,
    input: buildContentGenerationMessage(imageAnalysis, interviewResponses, businessContext),
    text: {
      format: zodResponseFormat(GeneratedContentSchema, 'generated_content'),
    },
    max_output_tokens: 1500,
    temperature: 0.7,
  });

  return response.output_parsed; // Type-safe GeneratedContent
}
```

### Error Handling

```typescript
// lib/ai/openai.ts
import OpenAI from 'openai';

export function parseAIError(error: unknown): AIError {
  // Responses API specific error types
  if (error instanceof OpenAI.LengthFinishReasonError) {
    return {
      code: 'CONTEXT_LENGTH_EXCEEDED',
      message: 'Response was truncated. Please try with less input.',
      retryable: true,
    };
  }

  if (error instanceof OpenAI.ContentFilterFinishReasonError) {
    return {
      code: 'CONTENT_FILTERED',
      message: 'Content was flagged by safety filters.',
      retryable: false,
    };
  }

  // Standard API error handling...
  if (error instanceof OpenAI.APIError) {
    if (error.status === 429) {
      return { code: 'RATE_LIMITED', message: '...', retryable: true };
    }
    // ...
  }
}
```

---

## API Transformation Reference

| Aspect | Chat Completions (Legacy) | Responses API (Current) |
|--------|---------------------------|-------------------------|
| Method | `chat.completions.create()` | `responses.parse()` |
| System prompt | `messages[0].role: 'system'` | `instructions` |
| User input | `messages[1].role: 'user'` | `input` |
| JSON output | `response_format: { type: 'json_object' }` | `text: { format: zodResponseFormat(...) }` |
| Get result | `response.choices[0]?.message?.content` | `response.output_parsed` |
| Max tokens | `max_tokens` | `max_output_tokens` |
| Images | `type: 'image_url'` | `type: 'input_image'` |

---

## Cost Estimation

| Model | Use Case | Cost per Project |
|-------|----------|------------------|
| GPT-4o | Image analysis (4 images) | ~$0.08 |
| Whisper | Transcription (2 min audio) | ~$0.02 |
| GPT-4o | Content generation | ~$0.05 |
| **Total** | | **~$0.15 per project** |

**Monthly projection:**
- 100 projects/month = ~$15
- 500 projects/month = ~$75
- 1000 projects/month = ~$150

Well within sustainability for SaaS model ($29/mo Pro tier).

---

## Validation

This decision will be validated by:

1. **Accuracy** - >80% correct project type detection on test set
2. **Quality** - User approval rate >80% on first generation
3. **Speed** - <10 seconds total AI processing time
4. **Cost** - Stay under $0.20 per project
5. **Type Safety** - Zero runtime parsing errors with Zod validation

---

## References

- [OpenAI Responses API Documentation](https://platform.openai.com/docs/guides/structured-outputs)
- [OpenAI Vision Guide](https://platform.openai.com/docs/guides/vision)
- [Whisper API Reference](https://platform.openai.com/docs/guides/speech-to-text)
- [OpenAI Pricing](https://openai.com/pricing)
- [Zod Documentation](https://zod.dev)

---

*This ADR was updated December 10, 2025 to reflect migration from Chat Completions API to Responses API.*
