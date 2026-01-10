---
name: agent-builder
description: |
  Build AI agents with Vercel AI SDK - autonomous systems that use tools in loops.
  Use when: creating agents, defining tools, implementing multi-step workflows,
  router patterns, parallel execution, or agentic loops. Covers Agent class,
  tool definitions with Zod, loop control, and common workflow patterns.
---

# AI SDK Agent Builder

## Overview

Agents are autonomous AI systems that use tools in a loop to accomplish tasks. The AI SDK provides the `Agent` class (currently `Experimental_Agent`) that handles the agent loop automatically.

**Docs:** https://ai-sdk.dev/docs/agents
**Patterns:** https://www.aisdkagents.com

## Quick Start

```typescript
import { Experimental_Agent as Agent, stepCountIs, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const agent = new Agent({
  model: openai('gpt-4o'),
  system: 'You are a helpful assistant that can search the web.',
  tools: {
    searchWeb: tool({
      description: 'Search the web for information',
      inputSchema: z.object({
        query: z.string().describe('The search query'),
      }),
      execute: async ({ query }) => {
        // Implement search logic
        return { results: [`Result for: ${query}`] };
      },
    }),
  },
  stopWhen: stepCountIs(10),
});

const result = await agent.generate({
  prompt: 'What is the weather in Tokyo?',
});

console.log(result.text);   // Final agent response
console.log(result.steps);  // Tool call trace for observability
```

---

## Agent Class API

```typescript
import { Experimental_Agent as Agent } from 'ai';

const agent = new Agent({
  // Required
  model: openai('gpt-4o'),           // AI provider model

  // Optional
  system: 'You are...',              // System prompt
  tools: { /* tool definitions */ }, // Available tools
  stopWhen: stepCountIs(20),         // Loop termination condition
  prepareStep: async (step) => {},   // Hook before each step
});
```

### Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `model` | Model | AI SDK provider model (required) |
| `system` | string | System prompt defining agent behavior |
| `tools` | Record<string, Tool> | Named tools the agent can invoke |
| `stopWhen` | StopCondition | When to terminate the agent loop |
| `prepareStep` | Function | Hook called before each generation step |

### Agent Methods

```typescript
// Generate (blocking)
const result = await agent.generate({
  prompt: 'User input here',
  context: { /* optional context */ },
});

// Stream (real-time)
const stream = await agent.stream({
  prompt: 'User input here',
});

for await (const chunk of stream.textStream) {
  process.stdout.write(chunk);
}
```

### Result Object

```typescript
interface AgentResult {
  text: string;           // Final generated text
  steps: Step[];          // All steps taken (tool calls + generations)
  usage: TokenUsage;      // Token usage statistics
  finishReason: string;   // Why the agent stopped
}
```

---

## Tool Definition

Tools extend agent capabilities. Define with `tool()` function and Zod schemas.

```typescript
import { tool } from 'ai';
import { z } from 'zod';

const myTool = tool({
  // Required
  description: 'Clear description of what this tool does',
  inputSchema: z.object({
    param1: z.string().describe('What this parameter is for'),
    param2: z.number().optional().describe('Optional numeric param'),
  }),

  // Required - the execution function
  execute: async ({ param1, param2 }) => {
    // Implement tool logic
    return { result: 'value', data: { /* structured output */ } };
  },
});
```

### Tool Best Practices

1. **Clear descriptions** - The LLM uses these to decide when to call the tool
2. **Typed inputs** - Use Zod for validation and type safety
3. **Structured outputs** - Return objects, not strings
4. **Error handling** - Throw errors for invalid states; the agent will see them
5. **Idempotency** - Tools may be called multiple times

### Multiple Tools

```typescript
const agent = new Agent({
  model: openai('gpt-4o'),
  tools: {
    getWeather: tool({
      description: 'Get weather for a location',
      inputSchema: z.object({ location: z.string() }),
      execute: async ({ location }) => ({ temp: 72, condition: 'sunny' }),
    }),

    convertTemperature: tool({
      description: 'Convert Fahrenheit to Celsius',
      inputSchema: z.object({ fahrenheit: z.number() }),
      execute: async ({ fahrenheit }) => ({
        celsius: Math.round((fahrenheit - 32) * 5/9),
      }),
    }),

    searchPlaces: tool({
      description: 'Search for places by type',
      inputSchema: z.object({
        type: z.enum(['restaurant', 'hotel', 'attraction']),
        near: z.string(),
      }),
      execute: async ({ type, near }) => ({
        places: [{ name: `${type} near ${near}`, rating: 4.5 }],
      }),
    }),
  },
  stopWhen: stepCountIs(15),
});
```

---

## Loop Control

### stepCountIs (Default)

Limits the number of generation steps to prevent infinite loops.

```typescript
import { stepCountIs } from 'ai';

const agent = new Agent({
  model: openai('gpt-4o'),
  tools: { /* ... */ },
  stopWhen: stepCountIs(10), // Stop after 10 steps max
});
```

### Custom Stop Conditions

```typescript
// Stop when a specific tool is called
const stopWhenDone = (step) => {
  return step.toolCalls?.some(tc => tc.toolName === 'finalize');
};

// Stop on specific output
const stopOnKeyword = (step) => {
  return step.text?.includes('TASK_COMPLETE');
};

const agent = new Agent({
  model: openai('gpt-4o'),
  stopWhen: stopWhenDone,
});
```

### prepareStep Hook

Modify behavior before each step.

```typescript
const agent = new Agent({
  model: openai('gpt-4o'),
  tools: { /* ... */ },
  prepareStep: async (step) => {
    console.log(`Step ${step.stepNumber}: Starting...`);

    // Can modify tools available for this step
    if (step.stepNumber > 5) {
      return { tools: { /* reduced tool set */ } };
    }
  },
});
```

---

## Common Patterns

For complete pattern implementations, see `references/agent-patterns.md`.

### Router Agent

Classify user intent and delegate to specialized agents.

```typescript
// Quick example - see references for full implementation
const routerAgent = new Agent({
  model: openai('gpt-4o'),
  system: 'Classify messages as: refund, support, or general',
  tools: {
    classifyIntent: tool({
      description: 'Classify the user intent',
      inputSchema: z.object({ message: z.string() }),
      execute: async ({ message }) => {
        if (message.includes('refund')) return { intent: 'refund' };
        if (message.includes('error')) return { intent: 'support' };
        return { intent: 'general' };
      },
    }),
  },
});

// Route to specialized agent based on classification
const result = await routerAgent.generate({ prompt: userMessage });
const intent = extractIntent(result);
const response = await specializedAgents[intent].generate({ prompt: userMessage });
```

### Parallel Agent

Split complex tasks and execute concurrently.

```typescript
const parallelAgent = new Agent({
  model: openai('gpt-4o'),
  system: 'Break down complex research into parallel subtasks.',
  tools: {
    splitTask: tool({ /* ... */ }),
    researchTopic: tool({ /* ... */ }),
    synthesizeResults: tool({ /* ... */ }),
  },
  stopWhen: stepCountIs(15),
});
```

### Evaluator-Optimizer

Generate content, evaluate quality, iterate until threshold met.

```typescript
const optimizerAgent = new Agent({
  model: openai('gpt-4o'),
  system: 'Generate content, evaluate it, and improve until quality >= 8/10.',
  tools: {
    generateDraft: tool({ /* ... */ }),
    evaluateQuality: tool({ /* returns score 1-10 */ }),
    improveDraft: tool({ /* ... */ }),
  },
});
```

---

## Manual Agent Loop

For maximum control, use `generateText` directly.

```typescript
import { generateText, ModelMessage } from 'ai';
import { openai } from '@ai-sdk/openai';

const messages: ModelMessage[] = [
  { role: 'user', content: 'Research AI agents and summarize findings' },
];

let step = 0;
const maxSteps = 10;

while (step < maxSteps) {
  const result = await generateText({
    model: openai('gpt-4o'),
    messages,
    tools: {
      search: tool({ /* ... */ }),
      summarize: tool({ /* ... */ }),
    },
  });

  // Add response to history
  messages.push(...result.response.messages);

  // Stop when model generates final text (no more tool calls)
  if (result.text && !result.toolCalls?.length) {
    console.log('Final answer:', result.text);
    break;
  }

  step++;
}
```

---

## Streaming

Stream agent responses in real-time.

```typescript
const stream = await agent.stream({
  prompt: 'Explain quantum computing',
});

// Stream text chunks
for await (const chunk of stream.textStream) {
  process.stdout.write(chunk);
}

// Or get full result after streaming
const result = await stream.result;
console.log(result.steps);
```

### Streaming with Tool Calls

```typescript
const stream = await agent.stream({ prompt: '...' });

for await (const event of stream) {
  if (event.type === 'tool-call') {
    console.log(`Calling: ${event.toolName}(${JSON.stringify(event.args)})`);
  } else if (event.type === 'tool-result') {
    console.log(`Result: ${JSON.stringify(event.result)}`);
  } else if (event.type === 'text-delta') {
    process.stdout.write(event.textDelta);
  }
}
```

---

## Provider Models

```typescript
// OpenAI
import { openai } from '@ai-sdk/openai';
const model = openai('gpt-4o');
const model = openai('gpt-4o-mini');

// Anthropic
import { anthropic } from '@ai-sdk/anthropic';
const model = anthropic('claude-sonnet-4-20250514');

// Google
import { google } from '@ai-sdk/google';
const model = google('gemini-2.0-flash');

// Use in agent
const agent = new Agent({ model, tools: { /* ... */ } });
```

---

## Error Handling

```typescript
try {
  const result = await agent.generate({ prompt: '...' });
} catch (error) {
  if (error.name === 'AI_APICallError') {
    console.error('API error:', error.message);
  } else if (error.name === 'AI_InvalidToolArgumentsError') {
    console.error('Tool arguments invalid:', error.message);
  } else {
    throw error;
  }
}
```

### Tool-Level Error Handling

```typescript
const safeTool = tool({
  description: 'Fetch data with error handling',
  inputSchema: z.object({ id: z.string() }),
  execute: async ({ id }) => {
    try {
      const data = await fetchData(id);
      return { success: true, data };
    } catch (error) {
      // Return error as result - agent can reason about it
      return { success: false, error: error.message };
    }
  },
});
```

---

## References

For detailed pattern implementations:
- `references/agent-patterns.md` - Router, parallel, evaluator-optimizer patterns
- `references/tool-examples.md` - Real-world tool definitions

External resources:
- AI SDK Docs: https://ai-sdk.dev/docs/agents
- Agent Patterns: https://www.aisdkagents.com
