# Google Interactions API Migration Plan

> **Branch:** `feature/google-interactions-api`
> **Created:** January 12, 2026
> **Status:** Planning

## Executive Summary

Migrate from Vercel AI SDK (`@ai-sdk/google`) to Google's native **Interactions API** via `@google/genai` SDK. This provides a unified interface for Gemini models and agents with server-side state management, background execution, and advanced agentic capabilities.

## Why Interactions API?

### Current State (Vercel AI SDK)
- Provider abstraction via `@ai-sdk/google`
- Client-side conversation state management
- No native support for Google's specialized agents
- Manual streaming and error handling
- Separate endpoints for different operations

### Target State (Interactions API)
- **Unified Endpoint:** Single `/interactions` endpoint for models AND agents
- **Server-Side State:** `previous_interaction_id` chains conversations automatically
- **Background Execution:** Long-running tasks (Deep Research) without timeouts
- **Native Streaming:** SSE with reconnection support via `last_event_id`
- **Agent Access:** Direct access to `deep-research-pro-preview-12-2025` agent
- **Explicit Thoughts:** Model reasoning chains separate from responses
- **Built-in Tools:** `google_search`, `code_execution`, `url_context`, `mcp_server`

## Supported Models & Agents

### Models (via `model` parameter)
| Model | Use Case | Notes |
|-------|----------|-------|
| `gemini-3-pro-preview` | Complex reasoning, orchestration | Most capable |
| `gemini-3-flash-preview` | Fast generation, vision | Cost-effective |
| `gemini-2.5-pro` | Stable production | GA |
| `gemini-2.5-flash` | Chat, cached conversations | 90% cache discount |
| `gemini-2.5-flash-lite` | Lightweight tasks | Cheapest |

### Agents (via `agent` parameter)
| Agent | Use Case |
|-------|----------|
| `deep-research-pro-preview-12-2025` | Autonomous web research with citations |

## API Surface

### Core Endpoint
```
POST https://generativelanguage.googleapis.com/v1beta/interactions
GET  https://generativelanguage.googleapis.com/v1beta/interactions/{id}
```

### Request Structure
```typescript
interface InteractionRequest {
  // Model OR Agent (mutually exclusive)
  model?: string;           // e.g., "gemini-3-flash-preview"
  agent?: string;           // e.g., "deep-research-pro-preview-12-2025"

  // Input content
  input: string | Content[];

  // Conversation continuity (server-side state)
  previous_interaction_id?: string;

  // Tools and capabilities
  tools?: Tool[];
  response_format?: JSONSchema;

  // Execution mode
  stream?: boolean;         // Enable SSE streaming
  background?: boolean;     // Async execution (agents only)
  store?: boolean;          // Persist interaction (default: true)

  // Generation settings
  generation_config?: {
    temperature?: number;   // 0.0 - 2.0
    max_output_tokens?: number;
    thinking_level?: 'minimal' | 'low' | 'medium' | 'high';
  };

  system_instruction?: string;
}
```

### Response Structure
```typescript
interface InteractionResponse {
  id: string;
  model: string;
  status: 'completed' | 'in_progress' | 'requires_action' | 'failed';
  inputs: Content[];
  outputs: Content[];  // text, function_call, thought, etc.
  usage: { total_tokens: number };
  tools?: Tool[];
}
```

### Content Types
```typescript
type Content =
  | { type: 'text'; text: string }
  | { type: 'image'; data: string; mime_type: string }
  | { type: 'audio'; data: string; mime_type: string }
  | { type: 'document'; data: string; mime_type: string }
  | { type: 'function_call'; name: string; id: string; arguments: object }
  | { type: 'function_result'; name: string; call_id: string; result: any }
  | { type: 'thought'; text: string }
  | { type: 'thought_summary'; content: { text: string } };
```

## Migration Phases

### Phase 1: SDK Setup & Foundation (Week 1)
**Goal:** Install SDK, create client wrapper, verify connectivity

#### Tasks
1. **Install `@google/genai` SDK**
   ```bash
   npm install @google/genai@^1.33.0
   ```

2. **Create Interactions Client** (`src/lib/google/interactions-client.ts`)
   ```typescript
   import { GoogleGenAI } from '@google/genai';

   export const ai = new GoogleGenAI({
     apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!
   });

   // Export typed wrapper
   export const interactions = ai.interactions;
   ```

3. **Define Types** (`src/lib/google/types.ts`)
   - `InteractionRequest`, `InteractionResponse`, `Content`, `Tool`
   - Export from `@/lib/google`

4. **Create Test Script** (`scripts/test-interactions-api.ts`)
   - Verify API key works
   - Test basic text generation
   - Test streaming
   - Test function calling

#### Success Criteria
- [ ] SDK installed and types working
- [ ] Test script passes all checks
- [ ] No breaking changes to existing code

---

### Phase 2: Migrate Core AI Functions (Week 2)
**Goal:** Replace Vercel AI SDK calls with Interactions API

#### Current Files to Migrate
| File | Current SDK | Migration Notes |
|------|-------------|-----------------|
| `src/lib/ai/providers.ts` | `@ai-sdk/google` | Wrap with Interactions API |
| `src/lib/ai/image-analysis.ts` | `generateObject` | `interactions.create` with vision |
| `src/lib/ai/content-generation.ts` | `generateText` | `interactions.create` |
| `src/lib/ai/transcription.ts` | `@ai-sdk/openai` | Keep as-is (Whisper) OR migrate to Gemini native audio |

#### Migration Pattern
```typescript
// BEFORE (Vercel AI SDK)
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

const result = await generateText({
  model: google('gemini-3-flash-preview'),
  system: systemPrompt,
  prompt: userPrompt,
});

// AFTER (Interactions API)
import { ai } from '@/lib/google/interactions-client';

const interaction = await ai.interactions.create({
  model: 'gemini-3-flash-preview',
  system_instruction: systemPrompt,
  input: userPrompt,
});
const text = interaction.outputs.find(o => o.type === 'text')?.text;
```

#### Tasks
1. Create `src/lib/google/` directory structure
2. Migrate `image-analysis.ts` (multimodal input)
3. Migrate `content-generation.ts` (text generation)
4. Update `providers.ts` to export Interactions API models
5. Evaluate transcription options (keep Whisper vs Gemini audio)

#### Success Criteria
- [ ] All existing API routes work unchanged
- [ ] Image analysis returns same schema
- [ ] Content generation quality maintained
- [ ] No regression in error handling

---

### Phase 3: Implement Streaming & State Management (Week 3)
**Goal:** Leverage server-side state and streaming for chat

#### New Capabilities
1. **Server-Side Conversation State**
   ```typescript
   // Turn 1
   const turn1 = await ai.interactions.create({
     model: 'gemini-2.5-flash',
     input: 'Tell me about masonry'
   });

   // Turn 2 - automatic context
   const turn2 = await ai.interactions.create({
     model: 'gemini-2.5-flash',
     input: 'What materials are best?',
     previous_interaction_id: turn1.id  // Server maintains history
   });
   ```

2. **Streaming with Reconnection**
   ```typescript
   let lastEventId: string | undefined;
   let interactionId: string | undefined;

   const stream = await ai.interactions.create({
     model: 'gemini-2.5-flash',
     input: prompt,
     stream: true
   });

   for await (const chunk of stream) {
     if (chunk.event_type === 'interaction.start') {
       interactionId = chunk.interaction.id;
     }
     if (chunk.event_id) lastEventId = chunk.event_id;

     if (chunk.event_type === 'content.delta') {
       yield chunk.delta;  // Stream to client
     }
   }

   // Reconnect if interrupted
   const resumed = await ai.interactions.get(interactionId!, {
     stream: true,
     last_event_id: lastEventId
   });
   ```

#### Tasks
1. Create `src/lib/google/streaming.ts` - SSE handling utilities
2. Create `src/lib/google/conversation.ts` - State management helpers
3. Update chat API routes to use server-side state
4. Implement reconnection logic for reliability
5. Store `interaction_id` in database for conversation continuity

#### Success Criteria
- [ ] Chat maintains context across turns via `previous_interaction_id`
- [ ] Streaming works with automatic reconnection
- [ ] No client-side conversation history needed
- [ ] Graceful degradation on API errors

---

### Phase 4: Function Calling & Tools (Week 4)
**Goal:** Implement tool use for agentic workflows

#### Tool Definition Pattern
```typescript
const tools: Tool[] = [
  {
    type: 'function',
    name: 'analyze_project_images',
    description: 'Analyzes uploaded project images to identify materials and techniques',
    parameters: {
      type: 'object',
      properties: {
        image_urls: {
          type: 'array',
          items: { type: 'string' },
          description: 'URLs of images to analyze'
        }
      },
      required: ['image_urls']
    }
  },
  // Built-in tools
  { type: 'google_search' },
  { type: 'url_context' }
];
```

#### Function Call Handling
```typescript
const interaction = await ai.interactions.create({
  model: 'gemini-3-flash-preview',
  input: 'Research stone suppliers in Denver',
  tools
});

for (const output of interaction.outputs) {
  if (output.type === 'function_call') {
    const result = await executeFunction(output.name, output.arguments);

    // Send result back
    const continued = await ai.interactions.create({
      model: 'gemini-3-flash-preview',
      previous_interaction_id: interaction.id,
      input: [{
        type: 'function_result',
        name: output.name,
        call_id: output.id,
        result
      }]
    });
  }
}
```

#### Tasks
1. Create `src/lib/google/tools.ts` - Tool definitions
2. Create `src/lib/google/tool-executor.ts` - Function dispatch
3. Define tools for Discovery Agent workflow
4. Implement tool result handling loop
5. Add built-in tools (google_search, url_context) where appropriate

#### Success Criteria
- [ ] Custom functions callable by model
- [ ] Built-in tools (search, URL) working
- [ ] Tool results properly returned
- [ ] Multi-turn tool use chains work

---

### Phase 5: Deep Research Agent Integration (Week 5)
**Goal:** Integrate Gemini Deep Research for advanced workflows

#### Use Cases
- **Business Discovery:** Research competitors, market positioning
- **Content Research:** Find relevant industry information
- **SEO Research:** Analyze search trends and keywords

#### Background Execution Pattern
```typescript
// Start research (returns immediately)
const research = await ai.interactions.create({
  agent: 'deep-research-pro-preview-12-2025',
  input: 'Research the masonry contractor market in Denver, CO',
  background: true,
  agent_config: {
    type: 'deep-research',
    thinking_summaries: 'auto'
  }
});

// Poll for completion
const pollForCompletion = async (id: string) => {
  while (true) {
    const status = await ai.interactions.get(id);
    if (status.status === 'completed') return status;
    if (status.status === 'failed') throw new Error('Research failed');
    await new Promise(r => setTimeout(r, 10000));
  }
};

const result = await pollForCompletion(research.id);
```

#### Tasks
1. Create `src/lib/google/deep-research.ts` - Agent wrapper
2. Implement background task polling
3. Create research results storage (Supabase table)
4. Build UI for research progress/results
5. Integrate with Discovery Agent workflow

#### Success Criteria
- [ ] Deep Research agent callable
- [ ] Background execution works without timeouts
- [ ] Results properly parsed and stored
- [ ] Progress visible to user

---

### Phase 6: Cleanup & Optimization (Week 6)
**Goal:** Remove old SDK, optimize, document

#### Tasks
1. **Remove Vercel AI SDK dependencies**
   ```bash
   npm uninstall ai @ai-sdk/google @ai-sdk/openai
   ```

2. **Update Environment Variables**
   ```bash
   # Keep
   GOOGLE_GENERATIVE_AI_API_KEY=...

   # Remove (if Whisper migrated)
   # OPENAI_API_KEY=...
   ```

3. **Performance Optimization**
   - Enable context caching for repeated prompts
   - Optimize streaming chunk handling
   - Add request deduplication

4. **Documentation**
   - Update CLAUDE.md
   - Update ADR for AI provider strategy
   - Create API documentation

5. **Testing**
   - Unit tests for all new modules
   - Integration tests for API routes
   - E2E tests for chat flows

#### Success Criteria
- [ ] No Vercel AI SDK in codebase
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Performance benchmarks met

---

## File Structure (Target)

```
src/lib/google/
├── index.ts                    # Re-exports
├── interactions-client.ts      # SDK client singleton
├── types.ts                    # TypeScript types
├── models.ts                   # Model configuration
├── streaming.ts                # SSE handling
├── conversation.ts             # State management
├── tools.ts                    # Tool definitions
├── tool-executor.ts            # Function dispatch
├── deep-research.ts            # Agent wrapper
└── errors.ts                   # Error handling

src/lib/ai/                     # Refactor to use google/
├── providers.ts                # → Wraps google/models.ts
├── image-analysis.ts           # → Uses google/interactions
├── content-generation.ts       # → Uses google/interactions
├── transcription.ts            # → Keep Whisper OR migrate
└── ...
```

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| API is Beta (breaking changes) | Pin SDK version, monitor changelog |
| Rate limits | Implement exponential backoff, queue requests |
| Streaming failures | Reconnection with `last_event_id` |
| Cost overruns | Token limits, usage monitoring |
| State persistence (55 days paid, 1 day free) | Store critical data in Supabase |

## Dependencies

### New
```json
{
  "@google/genai": "^1.33.0"
}
```

### Remove (Phase 6)
```json
{
  "ai": "x.x.x",
  "@ai-sdk/google": "x.x.x",
  "@ai-sdk/openai": "x.x.x"  // If migrating transcription
}
```

## References

- [Interactions API Documentation](https://ai.google.dev/gemini-api/docs/interactions)
- [Google GenAI JS SDK](https://github.com/googleapis/js-genai)
- [Building Agents with ADK](https://developers.googleblog.com/building-agents-with-the-adk-and-the-new-interactions-api/)
- [Deep Research Agent](https://blog.google/technology/developers/deep-research-agent-gemini-api/)
- [Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing)

---

## Approval Checklist

- [ ] Plan reviewed by team
- [ ] SDK compatibility verified
- [ ] Rollback strategy defined
- [ ] Monitoring in place
- [ ] Ready to begin Phase 1
