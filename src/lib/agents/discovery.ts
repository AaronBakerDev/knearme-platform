/**
 * Discovery Agent
 *
 * Handles conversation-first onboarding by discovering business information
 * through natural dialogue and DataForSEO business lookup.
 *
 * Persona:
 * > "I'm curious about businesses. I want to understand what you do,
 * > who you serve, and what makes your work special. I don't assume
 * > anything—I discover."
 *
 * Core Flow:
 * 1. Greet and ask for business name
 * 2. Search DataForSEO for matching businesses
 * 3. Present matches for user confirmation
 * 4. Auto-populate profile from confirmed data
 * 5. Gather any missing required info through conversation
 *
 * @see /docs/philosophy/universal-portfolio-agents.md - Discovery Agent persona
 * @see /docs/philosophy/implementation-roadmap.md - Phase 1 requirements
 */

import { generateText, stepCountIs, tool } from 'ai';
import { z } from 'zod';
import { getChatModel, isGoogleAIEnabled } from '@/lib/ai/providers';
import { searchBusinesses } from '@/lib/tools/business-discovery';
import { logger as baseLogger } from '@/lib/logging';
import { withCircuitBreaker } from './circuit-breaker';
import { createAgentLogger, createCorrelationContext } from '@/lib/observability/agent-logger';
import { runWebSearchAgent } from './web-search';
import { buildDiscoverySystemPrompt } from './discovery/prompts';
import {
  confirmBusinessSchema,
  saveProfileSchema,
  showBusinessSearchResultsSchema,
  showProfileRevealSchema,
  webSearchBusinessSchema,
} from './discovery/schemas';
import { createEmptyDiscoveryState, getMissingDiscoveryFields, isDiscoveryComplete } from './discovery/state';
import { extractWebSearchSources, processDiscoveryToolCalls } from './discovery/tool-processing';
import type {
  ConfirmBusinessResult,
  ProfileRevealResult,
  SaveProfileResult,
  SearchBusinessResult,
} from './discovery/tool-types';
import type { DiscoveryContext, DiscoveryResult, DiscoveryState } from './discovery/types';

// =============================================================================
// Discovery Agent Persona & System Prompt
// =============================================================================

// =============================================================================
// Tool Schemas
// =============================================================================

// =============================================================================
// Tool Definitions
// =============================================================================

/**
 * Execute search business
 */
async function executeShowBusinessSearchResults(
  params: z.infer<typeof showBusinessSearchResultsSchema>
): Promise<SearchBusinessResult> {
  try {
    const results = await searchBusinesses(params.businessName, params.location, 5);

    if (results.length === 0) {
      return {
        found: false,
        message: 'No businesses found matching that name and location.',
        results: [],
      };
    }

    return {
      found: true,
      message: `Found ${results.length} potential match${results.length > 1 ? 'es' : ''}.`,
      results: results.map((r) => ({
        name: r.name,
        address: r.address,
        phone: r.phone,
        website: r.website,
        rating: r.rating,
        reviewCount: r.reviewCount,
        category: r.category,
        googlePlaceId: r.googlePlaceId,
        googleCid: r.googleCid,
        coordinates: r.coordinates ?? null,
      })),
    };
  } catch (error) {
    baseLogger.error('[DiscoveryAgent] Business search failed', { error });
    return {
      found: false,
      message: 'Unable to search right now. Can you tell me more about your business?',
      results: [],
      error: true,
    };
  }
}

/**
 * Execute confirm business
 */
async function executeConfirmBusiness(
  params: z.infer<typeof confirmBusinessSchema>
): Promise<ConfirmBusinessResult> {
  return {
    confirmed: true,
    data: {
      googlePlaceId: params.googlePlaceId,
      businessName: params.businessName,
      address: params.address,
      city: params.city,
      state: params.state,
      phone: params.phone,
      website: params.website,
      category: params.category,
    },
  };
}

/**
 * Execute save profile
 */
async function executeSaveProfile(
  params: z.infer<typeof saveProfileSchema>
): Promise<SaveProfileResult> {
  return {
    saved: true,
    profile: {
      businessName: params.businessName,
      address: params.address,
      phone: params.phone,
      website: params.website,
      city: params.city,
      state: params.state,
      description: params.description,
      services: params.services,
      serviceAreas: params.serviceAreas || [],
    },
  };
}

const showBusinessSearchResultsTool = tool({
  description: 'Search for a business by name and location to find their Google listing',
  inputSchema: showBusinessSearchResultsSchema,
  execute: executeShowBusinessSearchResults,
});

const confirmBusinessTool = tool({
  description: 'Confirm which business from search results belongs to the user',
  inputSchema: confirmBusinessSchema,
  execute: executeConfirmBusiness,
});

const saveProfileTool = tool({
  description: 'Save the discovered profile information when onboarding is complete',
  inputSchema: saveProfileSchema,
  execute: executeSaveProfile,
});

const webSearchBusinessTool = tool({
  description: 'Use web search to find a business online when listing lookup fails',
  inputSchema: webSearchBusinessSchema,
  execute: async (params) => {
    const query = params.location
      ? `${params.businessName} ${params.location}`
      : params.businessName;
    return runWebSearchAgent({ query });
  },
});

/**
 * Execute profile reveal - shows a celebratory summary after profile is saved
 */
async function executeShowProfileReveal(
  params: z.infer<typeof showProfileRevealSchema>
): Promise<ProfileRevealResult> {
  return {
    revealed: true,
    profile: {
      businessName: params.businessName,
      address: params.address,
      city: params.city,
      state: params.state,
      phone: params.phone,
      website: params.website,
      services: params.services,
      rating: params.rating,
      reviewCount: params.reviewCount,
      celebrationMessage: params.celebrationMessage,
    },
  };
}

const showProfileRevealTool = tool({
  description: 'Show a celebratory profile summary after saving. Call this AFTER saveProfile to reveal what was gathered and celebrate the business.',
  inputSchema: showProfileRevealSchema,
  execute: executeShowProfileReveal,
});

export const discoveryTools = {
  showBusinessSearchResults: showBusinessSearchResultsTool,
  confirmBusiness: confirmBusinessTool,
  saveProfile: saveProfileTool,
  webSearchBusiness: webSearchBusinessTool,
  showProfileReveal: showProfileRevealTool,
};

// =============================================================================
// Discovery Agent
// =============================================================================

/**
 * Run the Discovery Agent for one turn
 *
 * @param userMessage - The user's message
 * @param context - Discovery context with state and history
 * @returns Discovery result with response and updated state
 *
 * @example
 * ```typescript
 * const result = await runDiscoveryAgent(
 *   "I run ABC Masonry in Denver",
 *   {
 *     businessId: 'uuid',
 *     messages: [],
 *     currentState: createEmptyDiscoveryState(),
 *   }
 * );
 * ```
 */
export async function runDiscoveryAgent(
  userMessage: string,
  context: DiscoveryContext
): Promise<DiscoveryResult> {
  // Check AI availability
  if (!isGoogleAIEnabled()) {
    return {
      message: "I'm having trouble connecting right now. Please try again in a moment.",
      state: context.currentState
        ? { ...createEmptyDiscoveryState(), ...context.currentState }
        : createEmptyDiscoveryState(),
    };
  }

  // Set up correlation context for logging
  const correlation =
    context.correlation ||
    createCorrelationContext(context.businessId, context.businessId);

  const logger = createAgentLogger('discovery', correlation);
  logger.start({ messageCount: context.messages.length });

  // Build conversation history
  const messages = [
    ...context.messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: userMessage },
  ];

  // Include current state in system prompt
  const currentState = context.currentState || createEmptyDiscoveryState();
  const baseSystemPrompt = buildDiscoverySystemPrompt(currentState);

  try {
    const result = await withCircuitBreaker('discovery', async () => {
      return generateText({
        model: getChatModel(),
        system: baseSystemPrompt,
        messages,
        tools: discoveryTools,
        // Allow multiple steps so the agent can handle tool calls and respond.
        stopWhen: stepCountIs(3),
      });
    });

    // Process tool calls and build updated state
    const updatedState = processDiscoveryToolCalls(currentState, result.toolResults);

    // Check for profile save (completion)
    const profileSaved = result.toolResults?.some(
      (tr) => tr.toolName === 'saveProfile' && (tr as { output?: SaveProfileResult }).output?.saved
    );

    // Update completeness
    updatedState.isComplete = isDiscoveryComplete(updatedState);
    updatedState.missingFields = getMissingDiscoveryFields(updatedState);

    let responseText = result.text;
    const toolNames = new Set(result.toolResults?.map((tr) => tr.toolName) || []);
    let responseSources = extractWebSearchSources(result.toolResults);
    const dataForSeoFailed = result.toolResults?.some((tr) => {
      if (tr.toolName !== 'showBusinessSearchResults') return false;
      const searchResult = tr.output as SearchBusinessResult | undefined;
      return Boolean(searchResult?.error);
    });
    const usedWebSearch = toolNames.has('webSearchBusiness');

    if (dataForSeoFailed && !usedWebSearch) {
      const searchNote = [
        'The DataForSEO business lookup failed.',
        'Use webSearchBusiness to find the business online instead.',
        'Summarize what you found and ask the next best question.',
      ].join(' ');

      const searchResult = await withCircuitBreaker('discovery', async () => {
        return generateText({
          model: getChatModel(),
          system: `${baseSystemPrompt}\n\n**Search Note:** ${searchNote}`,
          messages,
          tools: {
            webSearchBusiness: webSearchBusinessTool,
          },
          toolChoice: { type: 'tool', toolName: 'webSearchBusiness' },
          stopWhen: stepCountIs(3),
        });
      });

      if (searchResult.text && searchResult.text.trim().length > 0) {
        responseText = searchResult.text;
      }

      searchResult.toolResults?.forEach((tr) => toolNames.add(tr.toolName));
      const fallbackSources = extractWebSearchSources(searchResult.toolResults);
      if (fallbackSources.length > 0) {
        responseSources = fallbackSources;
      }
    }

    const shouldRetry = !responseText || responseText.trim().length === 0;

    if (shouldRetry) {
      const retryNote = [
        'The previous step returned no user-facing response.',
        'Continue the conversation without calling tools.',
        'Ask the next most useful question in one short sentence.',
      ].join(' ');

      const retryResult = await withCircuitBreaker('discovery', async () => {
        return generateText({
          model: getChatModel(),
          system: `${baseSystemPrompt}\n\n**Retry Note:** ${retryNote}`,
          messages,
          toolChoice: 'none',
          stopWhen: stepCountIs(1),
        });
      });

      responseText = retryResult.text;
    }

    logger.complete({
      responseLength: responseText.length,
      toolsUsed: Array.from(toolNames),
      isComplete: updatedState.isComplete,
    });

    return {
      message: responseText,
      state: updatedState,
      showSearchResults: updatedState.searchResults && updatedState.searchResults.length > 0,
      sources: responseSources,
      isComplete: profileSaved || updatedState.isComplete,
    };
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));

    return {
      message:
        "I'm having a bit of trouble right now. Let's try that again—what were you saying?",
      state: currentState as DiscoveryState,
    };
  }
}

export {
  createEmptyDiscoveryState,
  getMissingDiscoveryFields,
  isDiscoveryComplete,
} from './discovery/state';
export { buildDiscoverySystemPrompt, getDiscoveryGreeting } from './discovery/prompts';
export { processDiscoveryToolCalls } from './discovery/tool-processing';
export type { DiscoveryContext, DiscoveryResult, DiscoveryState } from './discovery/types';
