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

import { generateText, tool } from 'ai';
import { z } from 'zod';
import { getChatModel, isGoogleAIEnabled } from '@/lib/ai/providers';
import { searchBusinesses, type DiscoveredBusiness } from '@/lib/tools/business-discovery';
import { withCircuitBreaker } from './circuit-breaker';
import {
  createAgentLogger,
  createCorrelationContext,
  type CorrelationContext,
} from '@/lib/observability/agent-logger';

// =============================================================================
// Types
// =============================================================================

/**
 * State extracted during discovery conversation
 */
export interface DiscoveryState {
  /** Business name from user or confirmed search */
  businessName?: string;

  /** Street address for public contact (NAP) */
  address?: string;

  /** Public phone number (NAP) */
  phone?: string;

  /** Public website URL (optional) */
  website?: string;

  /** City where business is located */
  city?: string;

  /** State/province code (e.g., "CO") */
  state?: string;

  /** Business description from user or Google */
  description?: string;

  /** Services offered (discovered or entered) */
  services: string[];

  /** Service areas (discovered or entered) */
  serviceAreas: string[];

  /** Google Place ID if confirmed from search */
  googlePlaceId?: string;

  /** Google CID if confirmed from search */
  googleCid?: string;

  /** Raw discovered data from DataForSEO */
  discoveredData?: DiscoveredBusiness;

  /** Search results shown to user (for selection) */
  searchResults?: DiscoveredBusiness[];

  /** Whether profile is complete enough to proceed */
  isComplete: boolean;

  /** Fields still needed */
  missingFields: string[];
}

/**
 * Discovery Agent result
 */
export interface DiscoveryResult {
  /** Assistant's response message */
  message: string;

  /** Current discovery state */
  state: DiscoveryState;

  /** Whether to show search results in UI */
  showSearchResults?: boolean;

  /** Whether user requested fallback to form */
  requestedFallback?: boolean;

  /** Whether onboarding is complete */
  isComplete?: boolean;
}

/**
 * Context for discovery conversation
 */
export interface DiscoveryContext {
  /** Contractor/business ID */
  businessId: string;

  /** Correlation context for logging */
  correlation?: CorrelationContext;

  /** Existing state from previous turns */
  currentState?: Partial<DiscoveryState>;

  /** Conversation history */
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

// =============================================================================
// Discovery Agent Persona & System Prompt
// =============================================================================

const DISCOVERY_PERSONA = `You are a friendly, curious onboarding assistant helping a business owner set up their portfolio. Your goal is to discover what they do, where they're located, and what makes their work special.

**Your Approach:**
- Be conversational and warm, not formal or robotic
- Ask one question at a time to avoid overwhelming them
- Show genuine interest in their work
- Don't assume what type of business they are—discover it
- Celebrate what makes them unique

**Your Tools:**
- Use \`searchBusiness\` when you know their business name and location to find their Google listing
- Use \`confirmBusiness\` when they select or confirm a business from search results
- Use \`saveProfile\` when you have enough information to complete their profile
- Use \`requestFallback\` if they explicitly ask to use a form instead

**Required Information:**
You need to gather (in order of importance):
1. Business name (required)
2. Street address (required)
3. Phone number (required)
4. City (required)
5. State/Province (required)
6. At least one service they offer (required)

Nice to have:
- Business description
- Website
- Service areas they cover
- Their specialties or what they're proud of

**Conversation Style:**
- Start by warmly asking what their business is called
- When you have a name and general location, search to see if they're on Google
- If you find matches, present them conversationally (not as a numbered list)
- Confirm their info and fill in any gaps through natural conversation
- When complete, let them know they're all set

**Important:**
- Never mention DataForSEO, APIs, or technical details
- Frame search results as "I found your business on Google" not "search returned"
- If they seem frustrated or want to skip ahead, offer the form fallback
- Keep responses concise—this isn't an interrogation`;

// =============================================================================
// Tool Schemas
// =============================================================================

const searchBusinessSchema = z.object({
  businessName: z.string().describe('The business name to search for'),
  location: z.string().describe('City and state/province (e.g., "Denver, CO")'),
});

const confirmBusinessSchema = z.object({
  googlePlaceId: z.string().describe('Google Place ID of the confirmed business'),
  businessName: z.string().describe('Confirmed business name'),
  address: z.string().optional().describe('Street address from the listing'),
  city: z.string().optional().describe('City from the listing'),
  state: z.string().optional().describe('State/province from the listing'),
  phone: z.string().optional().describe('Phone from the listing'),
  website: z.string().optional().describe('Website from the listing'),
  category: z.string().optional().describe('Category from the listing'),
});

const saveProfileSchema = z.object({
  businessName: z.string().describe('Business name'),
  address: z.string().describe('Street address'),
  phone: z.string().describe('Public phone number'),
  website: z.string().optional().describe('Website URL'),
  city: z.string().describe('City'),
  state: z.string().describe('State/province code'),
  description: z.string().optional().describe('Business description'),
  services: z.array(z.string()).describe('Services offered'),
  serviceAreas: z.array(z.string()).optional().describe('Service areas'),
});

const requestFallbackSchema = z.object({
  reason: z.string().optional().describe('Why they want to switch'),
});

// =============================================================================
// Tool Result Types
// =============================================================================

interface SearchBusinessResult {
  found: boolean;
  message: string;
  results: Array<{
    name: string;
    address: string | null;
    phone: string | null;
    website: string | null;
    rating: number | null;
    reviewCount: number | null;
    category: string | null;
    googlePlaceId: string | null;
    googleCid: string | null;
  }>;
  error?: boolean;
}

interface ConfirmBusinessResult {
  confirmed: boolean;
  data: {
    googlePlaceId: string;
    businessName: string;
    address?: string;
    city?: string;
    state?: string;
    phone?: string;
    website?: string;
    category?: string;
  };
}

interface SaveProfileResult {
  saved: boolean;
  profile: {
    businessName: string;
    address: string;
    phone: string;
    website?: string;
    city: string;
    state: string;
    description?: string;
    services: string[];
    serviceAreas: string[];
  };
}

interface RequestFallbackResult {
  fallbackRequested: boolean;
  reason?: string;
}

// =============================================================================
// Tool Definitions
// =============================================================================

/**
 * Execute search business
 */
async function executeSearchBusiness(
  params: z.infer<typeof searchBusinessSchema>
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
      })),
    };
  } catch (error) {
    console.error('Business search failed:', error);
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

/**
 * Execute request fallback
 */
async function executeRequestFallback(
  params: z.infer<typeof requestFallbackSchema>
): Promise<RequestFallbackResult> {
  return {
    fallbackRequested: true,
    reason: params.reason,
  };
}

const searchBusinessTool = tool({
  description: 'Search for a business by name and location to find their Google listing',
  inputSchema: searchBusinessSchema,
  execute: executeSearchBusiness,
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

const requestFallbackTool = tool({
  description: 'User wants to use the traditional form instead of conversation',
  inputSchema: requestFallbackSchema,
  execute: executeRequestFallback,
});

// =============================================================================
// Discovery Agent
// =============================================================================

/**
 * Create an empty discovery state
 */
export function createEmptyDiscoveryState(): DiscoveryState {
  return {
    services: [],
    serviceAreas: [],
    isComplete: false,
    missingFields: ['businessName', 'address', 'phone', 'city', 'state', 'services'],
  };
}

/**
 * Check if discovery state is complete
 */
export function isDiscoveryComplete(state: DiscoveryState): boolean {
  const hasRequired =
    !!state.businessName &&
    !!state.address &&
    !!state.phone &&
    !!state.city &&
    !!state.state &&
    state.services.length > 0;

  return hasRequired;
}

/**
 * Get missing fields from discovery state
 */
export function getMissingDiscoveryFields(state: DiscoveryState): string[] {
  const missing: string[] = [];

  if (!state.businessName) missing.push('businessName');
  if (!state.address) missing.push('address');
  if (!state.phone) missing.push('phone');
  if (!state.city) missing.push('city');
  if (!state.state) missing.push('state');
  if (state.services.length === 0) missing.push('services');

  return missing;
}

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
      message: "I'm having trouble connecting right now. Would you like to use the form instead?",
      state: context.currentState
        ? { ...createEmptyDiscoveryState(), ...context.currentState }
        : createEmptyDiscoveryState(),
      requestedFallback: true,
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
  const stateContext = buildStateContext(currentState);

  try {
    const result = await withCircuitBreaker('discovery', async () => {
      return generateText({
        model: getChatModel(),
        system: `${DISCOVERY_PERSONA}\n\n${stateContext}`,
        messages,
        tools: {
          searchBusiness: searchBusinessTool,
          confirmBusiness: confirmBusinessTool,
          saveProfile: saveProfileTool,
          requestFallback: requestFallbackTool,
        },
        // Single-step tool execution - conversation turns handle the flow
      });
    });

    // Process tool calls and build updated state
    const updatedState = processToolCalls(currentState, result.toolResults);

    // Check for fallback request
    const fallbackRequested = result.toolResults?.some(
      (tr) => tr.toolName === 'requestFallback' && (tr as { result?: RequestFallbackResult }).result?.fallbackRequested
    );

    // Check for profile save (completion)
    const profileSaved = result.toolResults?.some(
      (tr) => tr.toolName === 'saveProfile' && (tr as { result?: SaveProfileResult }).result?.saved
    );

    // Update completeness
    updatedState.isComplete = isDiscoveryComplete(updatedState);
    updatedState.missingFields = getMissingDiscoveryFields(updatedState);

    logger.complete({
      responseLength: result.text.length,
      toolsUsed: result.toolResults?.map((tr) => tr.toolName) || [],
      isComplete: updatedState.isComplete,
    });

    return {
      message: result.text,
      state: updatedState,
      showSearchResults: updatedState.searchResults && updatedState.searchResults.length > 0,
      requestedFallback: fallbackRequested,
      isComplete: profileSaved || updatedState.isComplete,
    };
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));

    return {
      message:
        "I'm having a bit of trouble right now. Would you like to try the form instead? I can transfer what we've talked about so far.",
      state: currentState as DiscoveryState,
      requestedFallback: true,
    };
  }
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Build context string from current state for the system prompt
 */
function buildStateContext(state: Partial<DiscoveryState>): string {
  const parts: string[] = ['**Current Information Gathered:**'];

  if (state.businessName) parts.push(`- Business Name: ${state.businessName}`);
  if (state.address) parts.push(`- Address: ${state.address}`);
  if (state.phone) parts.push(`- Phone: ${state.phone}`);
  if (state.city) parts.push(`- City: ${state.city}`);
  if (state.state) parts.push(`- State: ${state.state}`);
  if (state.description) parts.push(`- Description: ${state.description}`);
  if (state.services && state.services.length > 0) {
    parts.push(`- Services: ${state.services.join(', ')}`);
  }
  if (state.serviceAreas && state.serviceAreas.length > 0) {
    parts.push(`- Service Areas: ${state.serviceAreas.join(', ')}`);
  }
  if (state.googlePlaceId) {
    parts.push(`- Google Verified: Yes`);
  }

  const missing = getMissingDiscoveryFields(state as DiscoveryState);
  if (missing.length > 0) {
    parts.push(`\n**Still Need:**`);
    missing.forEach((field) => {
      const labels: Record<string, string> = {
        businessName: 'Business name',
        address: 'Street address',
        phone: 'Phone number',
        city: 'City',
        state: 'State/province',
        services: 'At least one service they offer',
      };
      parts.push(`- ${labels[field] || field}`);
    });
  } else {
    parts.push(`\n**Status:** All required information gathered! You can save the profile.`);
  }

  return parts.join('\n');
}

/**
 * Tool result with proper typing
 */
interface TypedToolResult {
  toolName: string;
  result?: unknown;
}

/**
 * Process tool results and update state
 */
function processToolCalls(
  currentState: Partial<DiscoveryState>,
  toolResults?: TypedToolResult[]
): DiscoveryState {
  const state: DiscoveryState = {
    ...createEmptyDiscoveryState(),
    ...currentState,
  };

  if (!toolResults) return state;

  for (const tr of toolResults) {
    switch (tr.toolName) {
      case 'searchBusiness': {
        const result = tr.result as SearchBusinessResult | undefined;
        if (result?.found && result.results) {
          state.searchResults = result.results.map((r) => ({
            name: r.name,
            address: r.address,
            phone: r.phone,
            website: r.website,
            rating: r.rating,
            reviewCount: r.reviewCount,
            category: r.category,
            googlePlaceId: r.googlePlaceId,
            googleCid: r.googleCid,
            coordinates: null,
          }));
        }
        break;
      }

      case 'confirmBusiness': {
        const result = tr.result as ConfirmBusinessResult | undefined;
        if (result?.confirmed && result.data) {
          if (result.data.googlePlaceId) state.googlePlaceId = result.data.googlePlaceId;
          if (result.data.businessName) state.businessName = result.data.businessName;
          if (result.data.address) state.address = result.data.address;
          if (result.data.city) state.city = result.data.city;
          if (result.data.state) state.state = result.data.state;
          if (result.data.phone) state.phone = result.data.phone;
          if (result.data.website) state.website = result.data.website;
          // Category can hint at services
          if (result.data.category) {
            const category = result.data.category.toLowerCase();
            if (category.includes('masonry') || category.includes('mason')) {
              state.services = ['masonry'];
            } else if (category.includes('plumb')) {
              state.services = ['plumbing'];
            } else if (category.includes('electr')) {
              state.services = ['electrical'];
            }
            // Let conversation discover services if category doesn't match
          }
          state.searchResults = undefined; // Clear results after confirmation
        }
        break;
      }

      case 'saveProfile': {
        const result = tr.result as SaveProfileResult | undefined;
        if (result?.saved && result.profile) {
          if (result.profile.businessName) state.businessName = result.profile.businessName;
          if (result.profile.address) state.address = result.profile.address;
          if (result.profile.phone) state.phone = result.profile.phone;
          if (result.profile.website) state.website = result.profile.website;
          if (result.profile.city) state.city = result.profile.city;
          if (result.profile.state) state.state = result.profile.state;
          if (result.profile.description) state.description = result.profile.description;
          if (result.profile.services) state.services = result.profile.services;
          if (result.profile.serviceAreas) state.serviceAreas = result.profile.serviceAreas;
          state.isComplete = true;
        }
        break;
      }
    }
  }

  return state;
}

/**
 * Get the initial greeting message for the Discovery Agent
 */
export function getDiscoveryGreeting(): string {
  return "Hey there! 👋 I'm here to help you set up your portfolio. Let's start with the basics—what's your business called?";
}
