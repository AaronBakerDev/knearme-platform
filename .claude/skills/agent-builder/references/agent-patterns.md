# Agent Workflow Patterns

Complete implementations of common agent workflow patterns for the Vercel AI SDK.

---

## 1. Router Agent Pattern

Classify user intent and delegate to specialized sub-agents.

### Architecture

```
User Message → Router Agent → Intent Classification
                                    ↓
              ┌─────────────────────┼─────────────────────┐
              ↓                     ↓                     ↓
        Refund Agent         Support Agent         General Agent
```

### Complete Implementation

```typescript
import { Experimental_Agent as Agent, stepCountIs, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

// Specialized Agent: Refunds
const refundAgent = new Agent({
  model: openai('gpt-4o'),
  system: `You are a customer service specialist handling refund requests.

Process:
1. Verify the order details
2. Check refund eligibility
3. Process the refund if eligible
4. Provide clear next steps`,
  tools: {
    verifyOrder: tool({
      description: 'Verify order details and status',
      inputSchema: z.object({
        orderId: z.string().describe('The order ID to verify'),
      }),
      execute: async ({ orderId }) => {
        // Implement order lookup
        return {
          orderId,
          status: 'delivered',
          amount: 99.99,
          eligible: true,
        };
      },
    }),
    processRefund: tool({
      description: 'Process a refund for an eligible order',
      inputSchema: z.object({
        orderId: z.string(),
        amount: z.number(),
        reason: z.string(),
      }),
      execute: async ({ orderId, amount, reason }) => {
        return {
          refundId: `REF-${orderId}-${Date.now()}`,
          amount,
          status: 'processed',
        };
      },
    }),
  },
  stopWhen: stepCountIs(10),
});

// Specialized Agent: Technical Support
const supportAgent = new Agent({
  model: openai('gpt-4o'),
  system: `You are a technical support specialist.

Help customers with technical issues:
1. Diagnose the problem
2. Provide step-by-step solutions
3. Escalate complex issues when needed`,
  tools: {
    diagnoseIssue: tool({
      description: 'Diagnose technical issues based on symptoms',
      inputSchema: z.object({
        description: z.string().describe('Issue description'),
        errorCode: z.string().optional().describe('Error code if available'),
      }),
      execute: async ({ description, errorCode }) => {
        return {
          diagnosis: `Issue identified from: ${description}`,
          severity: 'medium',
          suggestedFix: 'Clear cache and restart',
        };
      },
    }),
    createTicket: tool({
      description: 'Create support ticket for escalation',
      inputSchema: z.object({
        issue: z.string(),
        priority: z.enum(['low', 'medium', 'high']),
      }),
      execute: async ({ issue, priority }) => {
        return {
          ticketId: `TKT-${Date.now()}`,
          priority,
          eta: '24 hours',
        };
      },
    }),
  },
  stopWhen: stepCountIs(10),
});

// Specialized Agent: General Inquiries
const generalAgent = new Agent({
  model: openai('gpt-4o'),
  system: `You are a helpful customer service representative.

Provide friendly, accurate answers to general questions.
If you don't know something, offer to escalate to a specialist.`,
  tools: {
    searchFAQ: tool({
      description: 'Search the FAQ database for answers',
      inputSchema: z.object({
        query: z.string().describe('The search query'),
      }),
      execute: async ({ query }) => {
        return {
          answer: `FAQ answer for: ${query}`,
          confidence: 0.85,
        };
      },
    }),
  },
  stopWhen: stepCountIs(10),
});

// Router Agent
const routerAgent = new Agent({
  model: openai('gpt-4o-mini'), // Fast model for classification
  system: `You are a customer service router.

Analyze incoming messages and classify them into one of these intents:
- refund: Request for refund, return, or money back
- support: Technical issues, bugs, errors, or how-to questions
- general: Everything else (product info, hours, policies, etc.)

Call the classifyIntent tool with your classification.`,
  tools: {
    classifyIntent: tool({
      description: 'Classify customer message intent',
      inputSchema: z.object({
        message: z.string(),
        intent: z.enum(['refund', 'support', 'general']),
        confidence: z.number().min(0).max(1),
      }),
      execute: async ({ intent, confidence }) => {
        return { intent, confidence };
      },
    }),
  },
  stopWhen: stepCountIs(3),
});

// Main routing function
async function handleCustomerMessage(message: string) {
  // Step 1: Classify intent
  const classification = await routerAgent.generate({
    prompt: `Classify this customer message: "${message}"`,
  });

  // Extract intent from tool result
  const intentStep = classification.steps.find(s =>
    s.toolCalls?.some(tc => tc.toolName === 'classifyIntent')
  );
  const intent = intentStep?.toolResults?.[0]?.result?.intent ?? 'general';

  // Step 2: Route to specialized agent
  const agents = {
    refund: refundAgent,
    support: supportAgent,
    general: generalAgent,
  };

  const response = await agents[intent].generate({ prompt: message });

  return {
    intent,
    response: response.text,
    steps: response.steps,
  };
}

// Usage
const result = await handleCustomerMessage('I want a refund for order #12345');
console.log(`Intent: ${result.intent}`);
console.log(`Response: ${result.response}`);
```

---

## 2. Parallel Agent Pattern

Split complex tasks into parallel subtasks, execute concurrently, then synthesize.

### Architecture

```
Complex Task → Split Task Tool
                    ↓
    ┌───────────────┼───────────────┐
    ↓               ↓               ↓
Subtask 1      Subtask 2      Subtask 3
    ↓               ↓               ↓
Research       Research       Research
    ↓               ↓               ↓
    └───────────────┼───────────────┘
                    ↓
            Synthesize Results
```

### Complete Implementation

```typescript
import { Experimental_Agent as Agent, stepCountIs, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const parallelAgent = new Agent({
  model: openai('gpt-4o'),
  system: `You are a research assistant that works on multiple tasks simultaneously.

When given a complex research task:
1. Use splitTask to break it into 2-4 parallel subtasks
2. Use researchTopic for each subtask
3. Use synthesizeResults to combine all findings
4. Provide a comprehensive final answer

Work efficiently by researching all subtasks before synthesizing.`,
  tools: {
    splitTask: tool({
      description: 'Split a complex task into parallel subtasks',
      inputSchema: z.object({
        task: z.string().describe('The complex task to split'),
        numParts: z.number().min(2).max(4).default(3),
      }),
      execute: async ({ task, numParts }) => {
        // In real implementation, this could use an LLM to intelligently split
        const aspects = [
          'historical background',
          'current state',
          'future trends',
          'key players',
        ].slice(0, numParts);

        return {
          subtasks: aspects.map((aspect, i) => ({
            id: i + 1,
            topic: `${task} - ${aspect}`,
            aspect,
          })),
        };
      },
    }),

    researchTopic: tool({
      description: 'Research a specific topic or subtask',
      inputSchema: z.object({
        topic: z.string().describe('The topic to research'),
        depth: z.enum(['shallow', 'medium', 'deep']).default('medium'),
      }),
      execute: async ({ topic, depth }) => {
        // In real implementation, this would call search APIs, databases, etc.
        const depthMultiplier = { shallow: 1, medium: 2, deep: 3 };

        return {
          topic,
          findings: [
            `Key finding 1 about ${topic}`,
            `Key finding 2 about ${topic}`,
            `Key finding 3 about ${topic}`,
          ].slice(0, depthMultiplier[depth]),
          sources: [
            { title: `Source for ${topic}`, url: 'https://example.com/1' },
            { title: `Another source`, url: 'https://example.com/2' },
          ],
          confidence: 0.8,
        };
      },
    }),

    synthesizeResults: tool({
      description: 'Synthesize multiple research results into a coherent summary',
      inputSchema: z.object({
        results: z.array(z.object({
          topic: z.string(),
          findings: z.array(z.string()),
        })).describe('Array of research results to synthesize'),
      }),
      execute: async ({ results }) => {
        return {
          synthesis: `Comprehensive analysis based on ${results.length} research streams`,
          keyInsights: results.flatMap(r =>
            r.findings.map(f => ({ topic: r.topic, insight: f }))
          ),
          totalSources: results.length * 2,
        };
      },
    }),
  },
  stopWhen: stepCountIs(20), // Allow multiple steps for parallel work
});

// Usage
const result = await parallelAgent.generate({
  prompt: 'Research the impact of AI on software development, covering productivity, job market, and tooling',
});

console.log(result.text);
console.log(`Steps taken: ${result.steps.length}`);
```

---

## 3. Evaluator-Optimizer Pattern

Generate content, evaluate quality, iterate until threshold is met.

### Architecture

```
Initial Prompt → Generate Draft
                      ↓
                  Evaluate ────→ Score >= Threshold? ─→ Done
                      ↓                    ↑
                  Score < Threshold        │
                      ↓                    │
                  Improve Draft ───────────┘
```

### Complete Implementation

```typescript
import { Experimental_Agent as Agent, stepCountIs, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const evaluatorOptimizerAgent = new Agent({
  model: openai('gpt-4o'),
  system: `You are a content creation assistant with a built-in quality loop.

Process:
1. Generate an initial draft
2. Evaluate its quality (score 1-10)
3. If score < 8, improve the draft based on feedback
4. Repeat evaluation until score >= 8 or max iterations reached
5. Return the final polished content

Be critical in evaluation but constructive in improvement suggestions.`,
  tools: {
    generateDraft: tool({
      description: 'Generate initial content draft',
      inputSchema: z.object({
        topic: z.string().describe('The topic to write about'),
        type: z.enum(['blog', 'email', 'documentation', 'marketing']),
        wordCount: z.number().default(500),
      }),
      execute: async ({ topic, type, wordCount }) => {
        // In real implementation, could use another LLM call
        return {
          draft: `[Draft ${type} content about ${topic}, ~${wordCount} words]

This is a placeholder for generated content. The actual implementation
would generate real content based on the topic and type.`,
          version: 1,
        };
      },
    }),

    evaluateQuality: tool({
      description: 'Evaluate content quality on multiple dimensions',
      inputSchema: z.object({
        content: z.string().describe('The content to evaluate'),
        criteria: z.array(z.enum([
          'clarity',
          'engagement',
          'accuracy',
          'structure',
          'grammar',
        ])).default(['clarity', 'engagement', 'structure']),
      }),
      execute: async ({ content, criteria }) => {
        // In real implementation, use an LLM to evaluate
        const scores = criteria.reduce((acc, c) => {
          acc[c] = Math.floor(Math.random() * 3) + 6; // 6-8 range
          return acc;
        }, {} as Record<string, number>);

        const avgScore = Object.values(scores).reduce((a, b) => a + b, 0) / criteria.length;

        return {
          scores,
          overallScore: Math.round(avgScore * 10) / 10,
          feedback: avgScore < 8
            ? 'Needs improvement in clarity and engagement'
            : 'Content meets quality standards',
          passesThreshold: avgScore >= 8,
        };
      },
    }),

    improveDraft: tool({
      description: 'Improve content based on evaluation feedback',
      inputSchema: z.object({
        currentDraft: z.string(),
        feedback: z.string(),
        focusAreas: z.array(z.string()),
      }),
      execute: async ({ currentDraft, feedback, focusAreas }) => {
        return {
          improvedDraft: `[Improved version addressing: ${focusAreas.join(', ')}]

${currentDraft}

[Enhanced based on feedback: ${feedback}]`,
          changesApplied: focusAreas,
        };
      },
    }),

    finalize: tool({
      description: 'Finalize content when quality threshold is met',
      inputSchema: z.object({
        content: z.string(),
        score: z.number(),
        iterations: z.number(),
      }),
      execute: async ({ content, score, iterations }) => {
        return {
          finalContent: content,
          qualityScore: score,
          iterationsRequired: iterations,
          status: 'approved',
        };
      },
    }),
  },
  stopWhen: stepCountIs(15), // Limit iterations
});

// Usage with custom stop condition
const result = await evaluatorOptimizerAgent.generate({
  prompt: 'Write a compelling blog post about the future of remote work',
});

console.log(result.text);
```

---

## 4. Prompt Chaining Pattern

Multi-stage content creation with sequential processing.

### Architecture

```
Input → Stage 1: Outline → Stage 2: Draft → Stage 3: Polish → Output
```

### Complete Implementation

```typescript
import { Experimental_Agent as Agent, stepCountIs, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const chainingAgent = new Agent({
  model: openai('gpt-4o'),
  system: `You are a content creation assistant that works in stages.

Process:
1. Create a detailed outline first (createOutline)
2. Write a full draft based on the outline (writeDraft)
3. Polish and refine the content (polishContent)

Always complete each stage before moving to the next.
Pass the output of each stage as input to the next.`,
  tools: {
    createOutline: tool({
      description: 'Create a detailed outline for the content',
      inputSchema: z.object({
        topic: z.string(),
        targetAudience: z.string().default('general'),
        sections: z.number().min(3).max(7).default(5),
      }),
      execute: async ({ topic, targetAudience, sections }) => {
        return {
          outline: {
            title: `Guide to ${topic}`,
            audience: targetAudience,
            sections: Array.from({ length: sections }, (_, i) => ({
              heading: `Section ${i + 1}: ${topic} aspect ${i + 1}`,
              keyPoints: [`Point A`, `Point B`, `Point C`],
            })),
          },
          stage: 'outline',
        };
      },
    }),

    writeDraft: tool({
      description: 'Write a full draft based on the outline',
      inputSchema: z.object({
        outline: z.object({
          title: z.string(),
          sections: z.array(z.object({
            heading: z.string(),
            keyPoints: z.array(z.string()),
          })),
        }),
        tone: z.enum(['formal', 'casual', 'technical']).default('casual'),
      }),
      execute: async ({ outline, tone }) => {
        const draft = outline.sections
          .map(s => `## ${s.heading}\n\n${s.keyPoints.join('\n\n')}`)
          .join('\n\n');

        return {
          draft: `# ${outline.title}\n\n${draft}`,
          wordCount: draft.split(' ').length,
          tone,
          stage: 'draft',
        };
      },
    }),

    polishContent: tool({
      description: 'Polish and finalize the content',
      inputSchema: z.object({
        draft: z.string(),
        improvements: z.array(z.enum([
          'add_examples',
          'improve_transitions',
          'strengthen_conclusion',
          'add_callouts',
        ])).default(['improve_transitions']),
      }),
      execute: async ({ draft, improvements }) => {
        return {
          finalContent: `${draft}\n\n---\n[Polished with: ${improvements.join(', ')}]`,
          improvements,
          stage: 'final',
        };
      },
    }),
  },
  stopWhen: stepCountIs(10),
});

// Usage
const result = await chainingAgent.generate({
  prompt: 'Create a comprehensive guide about machine learning for beginners',
});

console.log(result.text);
```

---

## 5. Manual Loop Pattern

Maximum control with custom loop logic using `generateText`.

### When to Use

- Need fine-grained control over each step
- Custom stopping conditions beyond tool calls
- Need to modify tools dynamically between steps
- Implementing complex branching logic

### Complete Implementation

```typescript
import { generateText, tool, CoreMessage } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

// Define tools
const tools = {
  searchWeb: tool({
    description: 'Search the web for information',
    inputSchema: z.object({
      query: z.string(),
      maxResults: z.number().default(5),
    }),
    execute: async ({ query, maxResults }) => {
      return {
        results: Array.from({ length: maxResults }, (_, i) => ({
          title: `Result ${i + 1} for: ${query}`,
          snippet: `Information about ${query}...`,
          url: `https://example.com/${i + 1}`,
        })),
      };
    },
  }),

  analyzeData: tool({
    description: 'Analyze data and extract insights',
    inputSchema: z.object({
      data: z.array(z.any()),
      analysisType: z.enum(['summary', 'trends', 'comparison']),
    }),
    execute: async ({ data, analysisType }) => {
      return {
        insights: [`Insight from ${analysisType} analysis`],
        dataPoints: data.length,
      };
    },
  }),

  summarize: tool({
    description: 'Create a final summary of findings',
    inputSchema: z.object({
      findings: z.array(z.string()),
      format: z.enum(['bullet', 'paragraph', 'executive']),
    }),
    execute: async ({ findings, format }) => {
      return {
        summary: `${format.toUpperCase()} SUMMARY:\n${findings.join('\n')}`,
        complete: true,
      };
    },
  }),
};

async function runManualAgentLoop(userPrompt: string) {
  const messages: CoreMessage[] = [
    {
      role: 'system',
      content: `You are a research assistant. Use the available tools to:
1. Search for relevant information
2. Analyze the data you find
3. Create a comprehensive summary

When you have enough information, call summarize to complete the task.`,
    },
    { role: 'user', content: userPrompt },
  ];

  let step = 0;
  const maxSteps = 15;
  const allToolCalls: any[] = [];

  while (step < maxSteps) {
    console.log(`\n--- Step ${step + 1} ---`);

    const result = await generateText({
      model: openai('gpt-4o'),
      messages,
      tools,
    });

    // Track tool calls for observability
    if (result.toolCalls?.length) {
      allToolCalls.push(...result.toolCalls);
      console.log('Tool calls:', result.toolCalls.map(tc => tc.toolName));
    }

    // Add assistant response to history
    messages.push(...result.response.messages);

    // Check for completion conditions
    const summarizeCalled = result.toolCalls?.some(
      tc => tc.toolName === 'summarize'
    );
    const hasTextResponse = result.text && !result.toolCalls?.length;

    if (summarizeCalled || hasTextResponse) {
      console.log('\n--- Agent Complete ---');
      return {
        response: result.text,
        steps: step + 1,
        toolCalls: allToolCalls,
      };
    }

    // Custom logic: Modify available tools based on progress
    if (step > 5) {
      // After 5 steps, only allow summarize
      console.log('Limiting tools to summarize only');
    }

    step++;
  }

  return {
    response: 'Max steps reached without completion',
    steps: maxSteps,
    toolCalls: allToolCalls,
  };
}

// Usage
const result = await runManualAgentLoop(
  'Research the latest trends in AI-powered code editors'
);

console.log(`\nFinal Response: ${result.response}`);
console.log(`Total steps: ${result.steps}`);
console.log(`Total tool calls: ${result.toolCalls.length}`);
```

---

## Pattern Selection Guide

| Pattern | Best For | Complexity | Typical Steps |
|---------|----------|------------|---------------|
| **Router** | Multi-domain support, task delegation | Medium | 3-5 + sub-agent |
| **Parallel** | Research, data gathering, multi-source | Medium | 10-20 |
| **Evaluator-Optimizer** | Quality-sensitive content | High | 5-15 |
| **Prompt Chaining** | Sequential workflows | Low | 3-10 |
| **Manual Loop** | Custom logic, fine control | High | Variable |

## Best Practices

1. **Start Simple** - Begin with single-agent, add patterns as needed
2. **Set Step Limits** - Always use `stopWhen` to prevent infinite loops
3. **Observe Everything** - Log `result.steps` for debugging
4. **Type Your Tools** - Zod schemas prevent runtime errors
5. **Handle Failures** - Return error objects, don't throw in tools
6. **Test Incrementally** - Verify each tool before combining
