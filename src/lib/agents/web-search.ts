/**
 * Web Search Agent
 *
 * Runs a grounded Gemini web search and returns a concise summary plus sources.
 * Used as a separate agent/tool for fallback business discovery.
 */

import { generateText, stepCountIs } from 'ai';
import { google } from '@ai-sdk/google';
import { AI_MODELS, isGoogleAIEnabled } from '@/lib/ai/providers';

export interface WebSearchAgentInput {
  query: string;
}

export interface WebSearchSource {
  url: string;
  title?: string;
}

export interface WebSearchAgentResult {
  summary: string;
  sources: WebSearchSource[];
}

function normalizeSources(
  sources: Array<{ url?: string; title?: string }> | undefined
): WebSearchSource[] {
  if (!sources || sources.length === 0) return [];
  return sources
    .map((source) => ({
      url: source.url ?? '',
      title: source.title,
    }))
    .filter((source) => source.url.length > 0);
}

/**
 * Run a grounded web search and return a short summary.
 * Uses a stable Gemini model (preview models do not support Google Search grounding).
 */
export async function runWebSearchAgent(
  input: WebSearchAgentInput
): Promise<WebSearchAgentResult> {
  if (!isGoogleAIEnabled()) {
    return {
      summary: 'Web search is unavailable right now.',
      sources: [],
    };
  }

  const result = await generateText({
    model: google(AI_MODELS.fallback),
    tools: {
      google_search: google.tools.googleSearch({}),
    },
    toolChoice: { type: 'tool', toolName: 'google_search' },
    prompt: [
      'You are a web search assistant helping confirm a business listing.',
      'Use google_search to find the most likely official website or listing.',
      'Summarize what you found in 2-3 short sentences.',
      `Query: ${input.query}`,
    ].join('\n'),
    stopWhen: stepCountIs(3),
  });

  return {
    summary: result.text,
    sources: normalizeSources(result.sources as Array<{ url?: string; title?: string }> | undefined),
  };
}
