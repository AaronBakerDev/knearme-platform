# Google Interactions API Decision Document

> **Date:** January 12, 2026
> **Branch:** `feature/google-interactions-api`
> **Decision Status:** PENDING APPROVAL

---

## Debate Summary

Four research teams analyzed the migration proposal:

| Team | Position | Key Argument |
|------|----------|--------------|
| **PRO-INTERACTIONS** | Migrate fully | Server-side state + Deep Research = agentic philosophy alignment |
| **PRO-VERCEL** | Stay with current | Beta risk, just migrated, over-engineering |
| **ALTERNATIVES** | Hybrid approach | Use both selectively, minimize risk |
| **SDK RESEARCH** | Data-driven | Interactions API is beta; GenAI SDK is GA |

---

## Critical Finding: Interactions API is BETA

> **Google's own guidance:** "For production workloads, developers should continue to use the standard `generateContent` API"

**However:** The `@google/genai` SDK (v1.35.0) is **GA as of May 2025** and includes:
- `generateContent` (stable, production-ready)
- `interactions.create` (beta, use selectively)

---

## Recommended Path: Hybrid Google-Native Approach

### Strategy: Migrate to `@google/genai` SDK, Use Interactions API Selectively

```
┌─────────────────────────────────────────────────────────────────┐
│                    KnearMe AI Architecture                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │     @google/genai SDK (Primary - GA, Production-Ready)     │ │
│  │                                                             │ │
│  │  generateContent() / generateContentStream()               │ │
│  │  ├─ Discovery Agent (chat, tools)                          │ │
│  │  ├─ Story Agent (interview, extraction)                    │ │
│  │  ├─ Content Generation (portfolio text)                    │ │
│  │  ├─ Image Analysis (vision)                                │ │
│  │  └─ Chat UI (streaming responses)                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │     interactions.create() (Selective - Beta, Behind Flag)  │ │
│  │                                                             │ │
│  │  ├─ Deep Research Agent (business intelligence)            │ │
│  │  ├─ Server-side conversation state (optional)              │ │
│  │  └─ Background execution (long-running tasks)              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Why This Approach?

| Benefit | Explanation |
|---------|-------------|
| **Single SDK** | Remove Vercel AI SDK, use only `@google/genai` |
| **Production Stability** | `generateContent` is GA and stable |
| **Future Features** | Interactions API available when needed |
| **Deep Research** | Unlock unique capability behind feature flag |
| **Native Google** | Direct access to all Gemini features |
| **Simplified Stack** | One provider, one SDK, clear patterns |

---

## Implementation Plan (Revised)

### Phase 1: Migrate to @google/genai SDK (Week 1-2)

**Goal:** Replace Vercel AI SDK with Google's native SDK using stable `generateContent` API

#### Tasks

1. **Update dependencies**
   ```bash
   # Remove Vercel AI SDK
   npm uninstall ai @ai-sdk/google @ai-sdk/openai

   # Ensure Google GenAI SDK is current
   npm install @google/genai@^1.35.0
   ```

2. **Create SDK wrapper** (`src/lib/google/client.ts`)
   ```typescript
   import { GoogleGenAI } from '@google/genai';

   export const ai = new GoogleGenAI({
     apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!
   });

   // Model shortcuts
   export const models = {
     flash: 'gemini-2.5-flash',           // Chat, caching
     flashPreview: 'gemini-3-flash-preview', // Vision, generation
     pro: 'gemini-2.5-pro',               // Complex reasoning
   } as const;
   ```

3. **Migrate core functions**

   **Image Analysis (before):**
   ```typescript
   // Old: Vercel AI SDK
   import { generateObject } from 'ai';
   import { google } from '@ai-sdk/google';

   const result = await generateObject({
     model: google('gemini-3-flash-preview'),
     schema: imageAnalysisSchema,
     messages: [{ role: 'user', content: [...] }]
   });
   ```

   **Image Analysis (after):**
   ```typescript
   // New: Google GenAI SDK
   import { ai, models } from '@/lib/google/client';

   const response = await ai.models.generateContent({
     model: models.flashPreview,
     contents: [{ role: 'user', parts: [...] }],
     config: {
       responseMimeType: 'application/json',
       responseSchema: imageAnalysisSchema
     }
   });
   ```

4. **Migrate streaming**
   ```typescript
   // Streaming with Google GenAI SDK
   const stream = await ai.models.generateContentStream({
     model: models.flash,
     contents: messages,
   });

   for await (const chunk of stream) {
     const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
     if (text) yield text;
   }
   ```

#### Files to Migrate
| File | Changes |
|------|---------|
| `src/lib/ai/providers.ts` | Replace with `@google/genai` wrapper |
| `src/lib/ai/image-analysis.ts` | Use `generateContent` with vision |
| `src/lib/ai/content-generation.ts` | Use `generateContent` |
| `src/lib/ai/transcription.ts` | Keep Whisper OR use Gemini audio |
| `src/hooks/useChatStream.ts` | Use `generateContentStream` |

---

### Phase 2: Add Interactions API Support (Week 3)

**Goal:** Add Interactions API as an optional feature, behind feature flags

#### Tasks

1. **Create Interactions wrapper** (`src/lib/google/interactions.ts`)
   ```typescript
   import { ai } from './client';

   export interface InteractionOptions {
     model?: string;
     agent?: string;
     input: string | Content[];
     previousInteractionId?: string;
     tools?: Tool[];
     background?: boolean;
     stream?: boolean;
   }

   export async function createInteraction(options: InteractionOptions) {
     return ai.interactions.create({
       model: options.model,
       agent: options.agent,
       input: options.input,
       previous_interaction_id: options.previousInteractionId,
       tools: options.tools,
       background: options.background,
       stream: options.stream,
     });
   }

   export async function getInteraction(id: string, options?: { stream?: boolean; lastEventId?: string }) {
     return ai.interactions.get(id, {
       stream: options?.stream,
       last_event_id: options?.lastEventId,
     });
   }
   ```

2. **Feature flags** (`src/lib/config/features.ts`)
   ```typescript
   export const FEATURES = {
     // Interactions API features (beta)
     useInteractionsApi: process.env.USE_INTERACTIONS_API === 'true',
     deepResearch: process.env.FEATURE_DEEP_RESEARCH === 'true',
     serverSideState: process.env.FEATURE_SERVER_STATE === 'true',
   } as const;
   ```

3. **Conditional usage pattern**
   ```typescript
   import { FEATURES } from '@/lib/config/features';
   import { ai } from '@/lib/google/client';
   import { createInteraction } from '@/lib/google/interactions';

   async function chat(message: string, history?: Message[]) {
     if (FEATURES.serverSideState && previousInteractionId) {
       // Use Interactions API for server-side state
       return createInteraction({
         model: 'gemini-2.5-flash',
         input: message,
         previousInteractionId,
       });
     }

     // Default: Use stable generateContent
     return ai.models.generateContent({
       model: 'gemini-2.5-flash',
       contents: [...history, { role: 'user', parts: [{ text: message }] }],
     });
   }
   ```

---

### Phase 3: Deep Research Integration (Week 4)

**Goal:** Add Deep Research agent for business intelligence

#### Implementation

```typescript
// src/lib/google/deep-research.ts
import { ai } from './client';
import { FEATURES } from '@/lib/config/features';

export interface ResearchRequest {
  query: string;
  context?: string;
  onProgress?: (status: string) => void;
}

export interface ResearchResult {
  id: string;
  summary: string;
  findings: Finding[];
  citations: Citation[];
  status: 'completed' | 'failed';
}

export async function runDeepResearch(request: ResearchRequest): Promise<ResearchResult> {
  if (!FEATURES.deepResearch) {
    throw new Error('Deep Research feature is not enabled');
  }

  // Start background research
  const interaction = await ai.interactions.create({
    agent: 'deep-research-pro-preview-12-2025',
    input: request.query,
    background: true,
    agent_config: {
      type: 'deep-research',
      thinking_summaries: 'auto',
    },
  });

  // Poll for completion
  let result = interaction;
  while (result.status === 'in_progress') {
    await new Promise(r => setTimeout(r, 5000));
    result = await ai.interactions.get(interaction.id);
    request.onProgress?.(result.status);
  }

  // Parse results
  return parseResearchResults(result);
}
```

#### Use Case: Discovery Agent Enhancement

```typescript
// In Discovery Agent flow
import { runDeepResearch } from '@/lib/google/deep-research';
import { FEATURES } from '@/lib/config/features';

async function discoverBusiness(businessName: string, location: string) {
  // 1. Quick lookup via DataForSEO (existing)
  const basicInfo = await lookupBusiness(businessName, location);

  // 2. If Deep Research enabled, run in background
  if (FEATURES.deepResearch) {
    const researchPromise = runDeepResearch({
      query: `Research the ${basicInfo.category} market in ${location}:
              - Find 3-5 similar businesses
              - Identify common services and pricing
              - Suggest differentiation opportunities`,
      onProgress: (status) => console.log('Research:', status),
    });

    // Don't await - let it run while user continues onboarding
    researchPromise.then(results => {
      // Store for later use in recommendations
      storeResearchResults(businessName, results);
    });
  }

  return basicInfo;
}
```

---

### Phase 4: Cleanup & Documentation (Week 5)

1. **Remove Vercel AI SDK remnants**
2. **Update CLAUDE.md** with new patterns
3. **Update ADR-003** (AI Provider Strategy)
4. **Add monitoring for Interactions API usage**
5. **Document feature flag requirements**

---

## File Structure (Target)

```
src/lib/google/
├── index.ts              # Re-exports
├── client.ts             # GoogleGenAI singleton
├── models.ts             # Model configuration
├── types.ts              # TypeScript types
│
├── content/              # generateContent patterns
│   ├── generate.ts       # Text generation
│   ├── vision.ts         # Image analysis
│   └── stream.ts         # Streaming responses
│
├── interactions/         # Interactions API (behind flags)
│   ├── client.ts         # Interactions wrapper
│   ├── state.ts          # Server-side state helpers
│   └── streaming.ts      # SSE with reconnection
│
└── agents/               # Specialized agents
    └── deep-research.ts  # Deep Research agent

src/lib/ai/               # Refactored (uses google/)
├── providers.ts          # → imports from google/
├── image-analysis.ts     # → uses google/content/vision
├── content-generation.ts # → uses google/content/generate
└── transcription.ts      # Keep Whisper or migrate
```

---

## Environment Variables

```bash
# Required
GOOGLE_GENERATIVE_AI_API_KEY=...

# Optional: Interactions API features (default: false)
USE_INTERACTIONS_API=false
FEATURE_DEEP_RESEARCH=false
FEATURE_SERVER_STATE=false

# Optional: Model overrides
GOOGLE_CHAT_MODEL=gemini-2.5-flash
GOOGLE_VISION_MODEL=gemini-3-flash-preview

# Keep for transcription (unless migrating to Gemini audio)
OPENAI_API_KEY=sk-...
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Interactions API breaking changes | Feature flags, isolated code, easy disable |
| generateContent behavior changes | Pin SDK version, test suite |
| Deep Research costs | Usage limits, monitoring, gradual rollout |
| Migration bugs | Parallel testing, phased rollout |

---

## Success Criteria

### Phase 1 Complete When:
- [ ] All AI features work with `@google/genai` SDK
- [ ] Vercel AI SDK fully removed
- [ ] No regression in functionality
- [ ] Tests passing

### Phase 2 Complete When:
- [ ] Interactions API wrapper created
- [ ] Feature flags working
- [ ] Can enable/disable without code changes

### Phase 3 Complete When:
- [ ] Deep Research runs successfully
- [ ] Results stored and accessible
- [ ] Discovery Agent enhanced (behind flag)

### Phase 4 Complete When:
- [ ] Documentation updated
- [ ] Monitoring in place
- [ ] Team trained on new patterns

---

## Decision Matrix

| Approach | Risk | Effort | Value | Recommendation |
|----------|------|--------|-------|----------------|
| Full Interactions API migration | HIGH | 6 weeks | HIGH | ❌ Too risky (beta) |
| Stay with Vercel AI SDK | LOW | 0 | LOW | ❌ Misses Google features |
| **Hybrid: GenAI SDK + selective Interactions** | **LOW** | **5 weeks** | **HIGH** | **✅ RECOMMENDED** |

---

## Approval

**Recommended Action:** Proceed with Hybrid approach

- [ ] Migrate to `@google/genai` SDK (stable `generateContent`)
- [ ] Add Interactions API behind feature flags
- [ ] Enable Deep Research for business discovery
- [ ] Monitor Interactions API for GA announcement

**Estimated Timeline:** 5 weeks
**Risk Level:** Low (feature-flagged, incremental)
**Value:** Access to all Google AI features with production stability

---

## References

- [Google GenAI JS SDK](https://github.com/googleapis/js-genai) - v1.35.0 (GA)
- [Interactions API Docs](https://ai.google.dev/gemini-api/docs/interactions) - Beta
- [Deep Research Agent](https://ai.google.dev/gemini-api/docs/deep-research)
- [generateContent Reference](https://ai.google.dev/api/generate-content)
