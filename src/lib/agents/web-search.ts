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
  /** Extracted business info for bio synthesis */
  businessInfo?: {
    aboutDescription?: string;
    services?: string[];
    yearsInBusiness?: string;
    specialties?: string[];
    serviceAreas?: string[];
    website?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
  };
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
 * Run a grounded web search and return a summary with extracted business info.
 * Uses a stable Gemini model (preview models do not support Google Search grounding).
 *
 * @see /docs/specs/typeform-onboarding-spec.md - Phase 3 Web Search Enhancement
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
      'You are a web search assistant helping gather information about a business.',
      'Use google_search to find their official website and any relevant listings.',
      '',
      'Search for: ' + input.query,
      '',
      'After searching, provide a response in this EXACT JSON format:',
      '{',
      '  "summary": "2-3 sentence summary of what you found",',
      '  "businessInfo": {',
      '    "aboutDescription": "Company description from their about page or Google listing",',
      '    "website": "Official website URL if found",',
      '    "phone": "Public phone number if found",',
      '    "address": "Street address if listed publicly",',
      '    "city": "City if explicitly listed",',
      '    "state": "State/province if explicitly listed",',
      '    "services": ["service1", "service2"],',
      '    "yearsInBusiness": "e.g., 15 years or since 2008",',
      '    "specialties": ["specialty1", "specialty2"],',
      '    "serviceAreas": ["Denver Metro", "Boulder County"]',
      '  }',
      '}',
      '',
      'Include only fields where you found actual information. Omit empty fields.',
    ].join('\n'),
    stopWhen: stepCountIs(3),
  });

  // Try to parse structured response
  let businessInfo: WebSearchAgentResult['businessInfo'];
  let summary = result.text;

  try {
    // Check if response contains JSON
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.summary) summary = parsed.summary;
      if (parsed.businessInfo) businessInfo = parsed.businessInfo;
    }
  } catch {
    // If parsing fails, just use the raw text as summary
  }

  return {
    summary,
    sources: normalizeSources(result.sources as Array<{ url?: string; title?: string }> | undefined),
    businessInfo,
  };
}
