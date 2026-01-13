/**
 * Onboarding Chat API Route
 *
 * Handles conversation-first onboarding using the Discovery Agent.
 * This is the only onboarding path - no form wizard fallback.
 *
 * POST /api/onboarding - Send a message to the Discovery Agent
 * GET /api/onboarding - Get onboarding status and conversation history
 *
 * @see /src/lib/agents/discovery.ts - Discovery Agent implementation
 * @see /docs/philosophy/agentic-first-experience.md - Design philosophy
 */

import { NextResponse } from 'next/server';
import { streamText, stepCountIs, type UIMessage } from 'ai';
import { z } from 'zod';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import {
  insertBusiness,
  insertContractor,
  selectBusinessByContractorId,
  selectBusinessById,
  selectBusinessByPrimaryId,
  updateBusiness,
  selectOnboardingConversation,
  insertOnboardingConversation,
  updateOnboardingConversation,
  updateConversationMessages,
  updateBusinessOnboarding,
  updateContractorOnboarding,
  type ConversationMessage,
  type ConversationRow,
} from '@/lib/supabase/typed-queries';
import {
  buildDiscoverySystemPrompt,
  createEmptyDiscoveryState,
  discoveryTools,
  getDiscoveryGreeting,
  getMissingDiscoveryFields,
  processDiscoveryToolCalls,
  type DiscoveryState,
} from '@/lib/agents';
import { resolveOnboardingContact } from '@/lib/agents/discovery/contact-resolution';
import { parseLocationFromAddress, type DiscoveredBusiness } from '@/lib/tools/business-discovery';
import { getChatModel, isGoogleAIEnabled } from '@/lib/ai/providers';
import { canExecute, recordSuccess, recordFailure } from '@/lib/agents/circuit-breaker';
import { logger } from '@/lib/logging';
import { chatTelemetry } from '@/lib/observability/traced-ai';
import type { Database, Json } from '@/types/database';

// Allow responses up to 30 seconds
export const maxDuration = 30;

// =============================================================================
// Dynamic Tool Selection
// =============================================================================

/**
 * Get active discovery tools based on current state.
 * This prevents the model from making invalid tool calls.
 *
 * Rules:
 * - If business info exists (businessName, googlePlaceId, etc.): remove showBusinessSearchResults
 *   This prevents duplicate search results after business is identified
 * - If profile is complete (isComplete): only keep showProfileReveal
 *
 * @see /docs/specs/typeform-onboarding-spec.md - Tool availability rules
 */
function getActiveDiscoveryTools(state: Partial<DiscoveryState>): typeof discoveryTools {
  // Remove showBusinessSearchResults if ANY of these are true:
  // 1. Business already confirmed (googlePlaceId exists)
  // 2. Business name is known (confirmBusiness was called at some point)
  // 3. Search results are in current state (waiting for user to select)
  // This is the definitive fix for the "duplicate search results" bug
  const hasBusinessInfo = Boolean(
    state.googlePlaceId ||
    state.businessName ||
    (state.searchResults && state.searchResults.length > 0)
  );

  if (hasBusinessInfo) {
    const { showBusinessSearchResults: _removed, ...remainingTools } = discoveryTools;
    return remainingTools as unknown as typeof discoveryTools;
  }

  // Default: all tools available
  return discoveryTools;
}

// =============================================================================
// Request Schema
// =============================================================================

const uiMessagePartSchema = z
  .object({
    type: z.string(),
    text: z.string().max(10_000).optional(),
    toolCallId: z.string().optional(),
    toolName: z.string().optional(),
    args: z.unknown().optional(),
    result: z.unknown().optional(),
    state: z.string().optional(),
    input: z.unknown().optional(),
    output: z.unknown().optional(),
    errorText: z.string().optional(),
  })
  .passthrough();

const uiMessageSchema = z
  .object({
    id: z.string().optional(),
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().max(10_000).optional(),
    parts: z.array(uiMessagePartSchema).max(50).optional(),
  })
  .passthrough();

const selectedBusinessSchema = z
  .object({
    name: z.string().min(1),
    address: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    website: z.string().nullable().optional(),
    rating: z.number().nullable().optional(),
    reviewCount: z.number().nullable().optional(),
    category: z.string().nullable().optional(),
    googlePlaceId: z.string().nullable().optional(),
    googleCid: z.string().nullable().optional(),
    coordinates: z
      .object({
        lat: z.number(),
        lng: z.number(),
      })
      .nullable()
      .optional(),
  })
  .passthrough();

const requestSchema = z
  .object({
    message: z.string().max(5000).optional(),
    messages: z.array(uiMessageSchema).max(200).optional(),
    selectedBusiness: selectedBusinessSchema.optional(),
  })
  .refine(
    (data) => Boolean(data.message || (data.messages && data.messages.length > 0)),
    {
      message: 'Message required',
      path: ['message'],
    }
  );

function getLatestUserMessage(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (!message || message.role !== 'user') continue;
    if (Array.isArray(message.parts)) {
      const text = message.parts
        .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
        .map((part) => part.text)
        .join('');
      if (text.trim()) return text;
    }
    const fallback = (message as { content?: string }).content;
    if (fallback && fallback.trim()) return fallback;
  }
  return '';
}

// =============================================================================
// Auth for Onboarding (allows incomplete profiles)
// =============================================================================

interface OnboardingAuth {
  userId: string;
  email: string;
  contractorId: string;
  businessId: string;
  hasCompleteProfile: boolean;
}

const CONTRACTOR_SELECT_WITH_NAP = 'id, business_name, address, phone, city, state' as const;
const CONTRACTOR_SELECT_BASE = 'id, business_name, city, state' as const;

async function selectContractorByAuthUserId(
  client: Awaited<ReturnType<typeof createClient>> | ReturnType<typeof createAdminClient>,
  authUserId: string
): Promise<{ data: Record<string, unknown> | null; error: { code?: string } | null; hasNapColumns: boolean }> {
  const withNap = await client
    .from('contractors')
    .select(CONTRACTOR_SELECT_WITH_NAP)
    .eq('auth_user_id', authUserId)
    .single();

  if (withNap.error?.code === '42703') {
    // Column missing in older schemas; retry without NAP fields.
    const fallback = await client
      .from('contractors')
      .select(CONTRACTOR_SELECT_BASE)
      .eq('auth_user_id', authUserId)
      .single();

    return {
      data: fallback.data ?? null,
      error: fallback.error ?? null,
      hasNapColumns: false,
    };
  }

  return {
    data: withNap.data ?? null,
    error: withNap.error ?? null,
    hasNapColumns: true,
  };
}

async function requireOnboardingAuth(): Promise<OnboardingAuth | { error: string; status: number }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Authentication required', status: 401 };
  }

  // Get or create contractor profile (may be incomplete)
  const contractorResult = await selectContractorByAuthUserId(supabase, user.id);
  let contractor = contractorResult.data;
  let hasNapColumns = contractorResult.hasNapColumns;
  const adminClient = createAdminClient();

  // If no contractor is visible via RLS, confirm via admin and then create if needed.
  if (!contractor) {
    const adminResult = await selectContractorByAuthUserId(adminClient, user.id);

    if (adminResult.data) {
      contractor = adminResult.data;
      hasNapColumns = adminResult.hasNapColumns;
    } else {
      // If we got an unexpected error from the user-scoped client, surface it.
      if (contractorResult.error && contractorResult.error.code && contractorResult.error.code !== 'PGRST116') {
        logger.error('Failed to load contractor', { error: contractorResult.error });
        return { error: 'Failed to load profile', status: 500 };
      }

      const { error: createError } = await insertContractor(adminClient, {
        auth_user_id: user.id,
        email: user.email ?? '',
      });

      if (createError) {
        // Handle race/duplicate: re-fetch instead of hard-failing
        if (createError.code === '23505') {
          const fallbackResult = await selectContractorByAuthUserId(adminClient, user.id);

          if (!fallbackResult.data) {
            logger.error('Failed to create contractor', { error: createError });
            return { error: 'Failed to initialize profile', status: 500 };
          }

          contractor = fallbackResult.data;
          hasNapColumns = fallbackResult.hasNapColumns;
        } else {
          logger.error('Failed to create contractor', { error: createError });
          return { error: 'Failed to initialize profile', status: 500 };
        }
      } else {
        const createdResult = await selectContractorByAuthUserId(adminClient, user.id);
        if (!createdResult.data) {
          logger.error('Failed to load contractor after creation');
          return { error: 'Failed to initialize profile', status: 500 };
        }
        contractor = createdResult.data;
        hasNapColumns = createdResult.hasNapColumns;
      }
    }
  }

  const contractorData = contractor as {
    id: string;
    business_name?: string;
    address?: string;
    phone?: string;
    city?: string;
    state?: string;
  };

  // Ensure a business record exists for this user (agentic schema)
  const { data: existingBusinessData, error: existingBusinessError } =
    await selectBusinessById(adminClient, user.id);

  if (
    existingBusinessError?.code &&
    existingBusinessError.code !== 'PGRST116'
  ) {
    logger.error('Failed to load business', { error: existingBusinessError });
    return { error: 'Failed to load profile', status: 500 };
  }

  let business = existingBusinessData;

  if (!business) {
    const { data: businessByLegacy, error: legacyError } =
      await selectBusinessByContractorId(adminClient, contractorData.id);

    if (legacyError?.code && legacyError.code !== 'PGRST116') {
      logger.error('Failed to load business by legacy contractor', { error: legacyError });
      return { error: 'Failed to load profile', status: 500 };
    }

    business = businessByLegacy;
  }

  if (!business) {
    const { data: businessByPrimary, error: primaryError } =
      await selectBusinessByPrimaryId(adminClient, contractorData.id);

    if (primaryError?.code && primaryError.code !== 'PGRST116') {
      logger.error('Failed to load business by ID', { error: primaryError });
      return { error: 'Failed to load profile', status: 500 };
    }

    business = businessByPrimary;
  }

  if (business) {
    const updates: Database['public']['Tables']['businesses']['Update'] = {};
    if (!business.auth_user_id) updates.auth_user_id = user.id;
    if (!business.email && user.email) updates.email = user.email ?? '';
    if (!business.legacy_contractor_id) {
      updates.legacy_contractor_id = contractorData.id;
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await updateBusiness(
        adminClient,
        business.id,
        updates
      );

      if (updateError) {
        logger.error('Failed to sync business auth fields', { error: updateError });
      }
    }
  }

  let businessId = business?.id;

  if (!businessId) {
    // Create business row tied to contractor (legacy mapping)
    const { data: newBusiness, error: businessError } = await insertBusiness(
      adminClient,
      {
        id: contractorData.id,
        auth_user_id: user.id,
        email: user.email ?? '',
        legacy_contractor_id: contractorData.id,
      }
    );

    if (businessError || !newBusiness) {
      if (businessError?.code === '23505') {
        const { data: fallbackBusiness } = await selectBusinessById(
          adminClient,
          user.id
        );

        if (!fallbackBusiness) {
          logger.error('Failed to create business', { error: businessError });
          return { error: 'Failed to initialize business', status: 500 };
        }

        business = fallbackBusiness;
        businessId = fallbackBusiness.id;
      } else {
        logger.error('Failed to create business', { error: businessError });
        return { error: 'Failed to initialize business', status: 500 };
      }
    } else {
      businessId = newBusiness.id;
    }
  }

  if (!businessId) {
    logger.error('Failed to resolve business for onboarding.');
    return { error: 'Failed to initialize business', status: 500 };
  }

  const location =
    business &&
    business.location &&
    typeof business.location === 'object' &&
    !Array.isArray(business.location)
      ? (business.location as Record<string, unknown>)
      : null;
  const hideAddress = Boolean(location?.hide_address);

  const hasBusinessProfile = business
    ? Boolean(
        business.name &&
          business.city &&
          business.state &&
          business.services &&
          business.services.length > 0 &&
          business.phone &&
          (hideAddress || business.address)
      )
    : false;

  return {
    userId: user.id,
    email: user.email ?? '',
    contractorId: contractorData.id,
    businessId,
    hasCompleteProfile: business
      ? hasBusinessProfile
      : !!(
          contractorData.business_name &&
          contractorData.city &&
          contractorData.state &&
          (hasNapColumns ? contractorData.address && contractorData.phone : false)
        ),
  };
}

function buildMessage(role: 'user' | 'assistant', content: string): ConversationMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    created_at: new Date().toISOString(),
  };
}

function applySelectedBusinessToState(
  state: DiscoveryState,
  selectedBusiness: DiscoveredBusiness
): DiscoveryState {
  const nextState: DiscoveryState = {
    ...state,
    services: [...state.services],
    serviceAreas: [...state.serviceAreas],
  };

  nextState.discoveredData = selectedBusiness;
  nextState.searchResults = undefined;

  if (!nextState.businessName && selectedBusiness.name) {
    nextState.businessName = selectedBusiness.name;
  }
  if (!nextState.address && selectedBusiness.address) {
    nextState.address = selectedBusiness.address;
  }
  if (!nextState.phone && selectedBusiness.phone) {
    nextState.phone = selectedBusiness.phone;
  }
  if (!nextState.website && selectedBusiness.website) {
    nextState.website = selectedBusiness.website;
  }
  if (nextState.rating == null && selectedBusiness.rating != null) {
    nextState.rating = selectedBusiness.rating;
  }
  if (nextState.reviewCount == null && selectedBusiness.reviewCount != null) {
    nextState.reviewCount = selectedBusiness.reviewCount;
  }
  if (!nextState.googlePlaceId && selectedBusiness.googlePlaceId) {
    nextState.googlePlaceId = selectedBusiness.googlePlaceId;
  }
  if (!nextState.googleCid && selectedBusiness.googleCid) {
    nextState.googleCid = selectedBusiness.googleCid;
  }

  if (selectedBusiness.address && (!nextState.city || !nextState.state)) {
    const parsedLocation = parseLocationFromAddress(selectedBusiness.address);
    if (parsedLocation) {
      if (!nextState.city) nextState.city = parsedLocation.city;
      if (!nextState.state && parsedLocation.state) nextState.state = parsedLocation.state;
    }
  }

  if (selectedBusiness.category && nextState.services.length === 0) {
    const category = selectedBusiness.category.toLowerCase();
    if (category.includes('masonry') || category.includes('mason')) {
      nextState.services = ['masonry'];
    } else if (category.includes('plumb')) {
      nextState.services = ['plumbing'];
    } else if (category.includes('electr')) {
      nextState.services = ['electrical'];
    }
  }

  return nextState;
}

/**
 * Generate a contextual fallback message when the model produces tool calls
 * but no text response. This ensures conversation history stays coherent.
 *
 * @see /docs/specs/typeform-onboarding-spec.md - "Agent Reset" bug fix
 */
function generateToolResultFallback(
  toolResults: Array<{ toolName: string; result?: unknown }> | undefined,
  updatedState: DiscoveryState
): string | null {
  if (!toolResults || toolResults.length === 0) return null;

  const toolNames = toolResults.map((tr) => tr.toolName);

  // Business search completed - prompt user to select
  if (toolNames.includes('showBusinessSearchResults')) {
    const hasResults = updatedState.searchResults && updatedState.searchResults.length > 0;
    if (hasResults) {
      return "I found some matches! Take a look and let me know which one is your business.";
    }
    return "I couldn't find your business in my search. No worries though — can you tell me your full business address? I'll set things up manually.";
  }

  // Web search completed
  if (toolNames.includes('webSearchBusiness')) {
    return "I did a quick search online. Can you confirm if this is your business?";
  }

  // Business confirmed - acknowledge and continue
  if (toolNames.includes('confirmBusiness')) {
    const missing = updatedState.missingFields;
    if (missing.length === 0) {
      return "Great, I've got your business info saved!";
    }
    if (missing.includes('services')) {
      return "Perfect, I've got your business details. What type of work do you specialize in?";
    }
    return "Got it! Just need a couple more details to finish setting you up.";
  }

  // Profile saved - completion message
  if (toolNames.includes('saveProfile')) {
    return "You're all set! I've saved your profile and you're ready to start building your portfolio.";
  }

  // Profile reveal shown - no additional text needed (artifact speaks for itself)
  if (toolNames.includes('showProfileReveal')) {
    return null; // Let the artifact handle the celebration
  }

  return null;
}

function normalizeMessages(value: unknown): ConversationMessage[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is ConversationMessage => {
    if (!item || typeof item !== 'object') return false;
    const msg = item as Record<string, unknown>;
    return (
      typeof msg.id === 'string' &&
      (msg.role === 'user' || msg.role === 'assistant') &&
      typeof msg.content === 'string'
    );
  });
}

async function getOrCreateOnboardingConversation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessId: string
): Promise<{ conversation: ConversationRow; isNew: boolean }> {
  const { data: existing, error } = await selectOnboardingConversation(
    supabase,
    businessId,
    'onboarding'
  );

  if (!error && existing) {
    const normalized = normalizeMessages(existing.messages);
    if (normalized.length === 0) {
      const greeting = getDiscoveryGreeting();
      const initialMessages = [buildMessage('assistant', greeting)];
      const initialState = (existing.extracted ?? createEmptyDiscoveryState()) as Record<string, unknown>;

      const { data: updated, error: updateError } = await updateOnboardingConversation(
        supabase,
        existing.id,
        {
          messages: initialMessages,
          extracted: initialState,
        }
      );

      if (!updateError && updated) {
        return {
          conversation: updated,
          isNew: true,
        };
      }
    }

    return {
      conversation: existing,
      isNew: false,
    };
  }

  if (error && error.code !== 'PGRST116') {
    logger.error('Failed to load onboarding conversation', { error });
    throw new Error('Failed to load onboarding conversation');
  }

  const greeting = getDiscoveryGreeting();
  const initialMessages = [buildMessage('assistant', greeting)];
  const initialState = createEmptyDiscoveryState();

  const { data: created, error: createError } = await insertOnboardingConversation(
    supabase,
    {
      business_id: businessId,
      purpose: 'onboarding',
      status: 'active',
      messages: initialMessages,
      extracted: initialState as unknown as Record<string, unknown>,
    }
  );

  if (createError || !created) {
    logger.error('Failed to create onboarding conversation', { error: createError });
    throw new Error('Failed to initialize onboarding conversation');
  }

  return {
    conversation: created,
    isNew: true,
  };
}

// =============================================================================
// API Handler
// =============================================================================

export async function POST(request: Request) {
  try {
    // Authenticate (allows incomplete profiles)
    const auth = await requireOnboardingAuth();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    if (!isGoogleAIEnabled()) {
      return NextResponse.json(
        { error: 'AI is unavailable right now. Please try again later.' },
        { status: 503 }
      );
    }

    // Parse request body
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const requestMessages = (parsed.data.messages ?? []) as UIMessage[];
    const selectedBusiness = parsed.data.selectedBusiness as DiscoveredBusiness | undefined;
    const message = parsed.data.message?.trim() || getLatestUserMessage(requestMessages);

    // Message is required for POST
    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { conversation } = await getOrCreateOnboardingConversation(
      supabase,
      auth.businessId
    );

    const existingMessages = normalizeMessages(conversation.messages);
    const history = existingMessages.slice(-20).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const currentState: DiscoveryState = conversation.extracted
      ? { ...createEmptyDiscoveryState(), ...conversation.extracted }
      : createEmptyDiscoveryState();

    const mergedState = selectedBusiness
      ? applySelectedBusinessToState(currentState, selectedBusiness)
      : currentState;

    const systemPrompt = buildDiscoverySystemPrompt(mergedState);

    // Dynamically build tools based on current state to prevent invalid tool calls
    // If business is already confirmed (googlePlaceId exists), remove showBusinessSearchResults
    // to prevent the model from showing duplicate search results after confirmation.
    // @see /docs/specs/typeform-onboarding-spec.md - Preventing duplicate search results
    const activeTools = getActiveDiscoveryTools(mergedState);

    // Circuit breaker pre-flight check for streaming operations
    // Streaming can't be wrapped with withCircuitBreaker(), so we check before and record after
    // @see /docs/philosophy/operational-excellence.md - Resilience Strategy
    if (!canExecute('discovery')) {
      logger.warn('[Onboarding] Circuit breaker open, rejecting request');
      return NextResponse.json(
        {
          error: 'Service temporarily unavailable. Please try again in a moment.',
          circuitOpen: true,
        },
        { status: 503 }
      );
    }

    const result = streamText({
      model: getChatModel(),
      system: systemPrompt,
      messages: [...history, { role: 'user', content: message }],
      tools: activeTools,
      stopWhen: stepCountIs(3),
      experimental_telemetry: chatTelemetry({
        businessId: auth.businessId,
        sessionId: conversation.id,
        operationType: 'onboarding',
      }),
      onFinish: async ({ text, toolResults }) => {
        const updatedState = processDiscoveryToolCalls(mergedState, toolResults);
        // Update missingFields for UI display
        updatedState.missingFields = getMissingDiscoveryFields(updatedState);
        // IMPORTANT: Do NOT overwrite isComplete here!
        // isComplete is set ONLY by processDiscoveryToolCalls when saveProfile is called.
        // This prevents the "hallucination bug" where the agent says "done" without
        // actually calling saveProfile.
        // @see /docs/specs/typeform-onboarding-spec.md - Agent Hallucination Bug

        // Use model's response, or generate contextual fallback if empty
        // This fixes the "agent reset" bug where empty responses break history
        const modelText = text?.trim();
        const assistantMessage = modelText || generateToolResultFallback(toolResults, updatedState);

        const updatedMessages = [
          ...existingMessages,
          buildMessage('user', message),
          ...(assistantMessage ? [buildMessage('assistant', assistantMessage)] : []),
        ];

        // Persist conversation messages + state
        const { error: updateError } = await updateConversationMessages(
          supabase,
          conversation.id,
          {
            messages: updatedMessages,
            extracted: updatedState as unknown as Record<string, unknown>,
            status: updatedState.isComplete ? 'completed' : 'active',
          }
        );

        if (updateError) {
          logger.error('Failed to update onboarding conversation', { error: updateError });
        }

        // If profile is complete, save to database
        const resolvedContact = resolveOnboardingContact(updatedState);
        if (
          updatedState.isComplete &&
          updatedState.businessName &&
          resolvedContact.phone &&
          resolvedContact.city &&
          resolvedContact.state &&
          updatedState.services.length > 0
        ) {
          await saveOnboardingProfile({
            businessId: auth.businessId,
            contractorId: auth.contractorId,
            state: updatedState,
          });
        }

        // Record success for circuit breaker - stream completed without error
        recordSuccess('discovery');
      },
    });

    return result.toUIMessageStreamResponse({ sendSources: true });
  } catch (error) {
    // Record failure for circuit breaker tracking
    recordFailure('discovery', error instanceof Error ? error : new Error(String(error)));
    logger.error('Onboarding error', { error });
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

// =============================================================================
// Database Operations
// =============================================================================
async function saveOnboardingProfile(params: {
  businessId: string;
  contractorId?: string | null;
  state: DiscoveryState;
}): Promise<void> {
  const { businessId, contractorId, state } = params;
  const adminClient = createAdminClient();

  const resolved = resolveOnboardingContact(state);
  const postalCodeMatch = resolved.address?.match(/\b\d{5}(?:-\d{4})?\b/);
  const resolvedPostalCode = postalCodeMatch ? postalCodeMatch[0] : null;
  const sanitizedDiscoveredData = state.discoveredData
    ? {
        ...state.discoveredData,
        address: resolved.hideAddress ? null : state.discoveredData.address,
      }
    : null;

  const locationJson = {
    city: resolved.city,
    state: resolved.state,
    service_areas: state.serviceAreas,
    ...(resolved.address ? { address: resolved.address } : {}),
    ...(resolvedPostalCode ? { postal_code: resolvedPostalCode } : {}),
    ...(resolved.hideAddress ? { hide_address: true } : {}),
  };

  const understandingJson = {
    specialties: state.services,
  };

  const businessUpdate = {
    name: state.businessName,
    address: resolved.address,
    postal_code: resolvedPostalCode,
    phone: resolved.phone,
    website: resolved.website,
    city: resolved.city,
    state: resolved.state,
    services: state.services.length > 0 ? state.services : null,
    service_areas: state.serviceAreas.length > 0 ? state.serviceAreas : null,
    description: state.description || null,
    location: locationJson as unknown as Json,
    understanding: understandingJson as unknown as Json,
    discovered_data: (sanitizedDiscoveredData || null) as unknown as Json | null,
    google_place_id: state.googlePlaceId || null,
    google_cid: state.googleCid || null,
    onboarding_method: 'conversation',
    onboarding_completed_at: new Date().toISOString(),
  };

  const { error: businessError } = await updateBusinessOnboarding(
    adminClient,
    businessId,
    businessUpdate
  );

  if (businessError) {
    if (businessError.code === '42703') {
      // Legacy schema without NAP columns; retry without top-level address/phone fields.
      const { error: fallbackBusinessError } = await updateBusinessOnboarding(
        adminClient,
        businessId,
        {
          name: state.businessName,
          city: resolved.city,
          state: resolved.state,
          services: state.services.length > 0 ? state.services : null,
          service_areas: state.serviceAreas.length > 0 ? state.serviceAreas : null,
          description: state.description || null,
          location: locationJson as unknown as Json,
          understanding: understandingJson as unknown as Json,
          discovered_data: (sanitizedDiscoveredData || null) as unknown as Json | null,
          google_place_id: state.googlePlaceId || null,
          google_cid: state.googleCid || null,
          onboarding_method: 'conversation',
          onboarding_completed_at: new Date().toISOString(),
        }
      );

      if (fallbackBusinessError) {
        logger.error('Failed to update business profile', { error: fallbackBusinessError });
        throw new Error('Failed to save profile');
      }
    } else {
      logger.error('Failed to update business profile', { error: businessError });
      throw new Error('Failed to save profile');
    }
  }

  if (!contractorId) return;

  // Best-effort contractor sync (legacy)
  // Only sync fields that exist in the contractors table schema:
  // id, auth_user_id, email, business_name, city, state, city_slug, services,
  // service_areas, description, profile_photo_url, created_at, updated_at,
  // profile_slug, google_place_id, google_cid, onboarding_method
  // Note: address, postal_code, phone, website do NOT exist in contractors table
  const { error } = await updateContractorOnboarding(adminClient, contractorId, {
    business_name: state.businessName,
    city: resolved.city ?? state.city,
    state: resolved.state ?? state.state,
    description: state.description || null,
    services: state.services.length > 0 ? state.services : null,
    service_areas: state.serviceAreas.length > 0 ? state.serviceAreas : null,
    google_place_id: state.googlePlaceId || null,
    google_cid: state.googleCid || null,
    onboarding_method: 'conversation',
  });

  if (error) {
    logger.error('Failed to sync contractor profile', { error });
  }
}

// =============================================================================
// GET - Check onboarding status
// =============================================================================

export async function GET() {
  try {
    const auth = await requireOnboardingAuth();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const supabase = await createClient();
    const { conversation, isNew } = await getOrCreateOnboardingConversation(
      supabase,
      auth.businessId
    );

    const messages = normalizeMessages(conversation.messages);
    const state = conversation.extracted
      ? { ...createEmptyDiscoveryState(), ...conversation.extracted }
      : createEmptyDiscoveryState();

    return NextResponse.json({
      hasCompleteProfile: auth.hasCompleteProfile,
      contractorId: auth.contractorId,
      conversationId: conversation.id,
      messages,
      state,
      isNew,
    });
  } catch (error) {
    logger.error('Onboarding status error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
