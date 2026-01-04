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
  isDiscoveryComplete,
  processDiscoveryToolCalls,
  type DiscoveryState,
} from '@/lib/agents';
import { getChatModel, isGoogleAIEnabled } from '@/lib/ai/providers';
import type { Database, Json } from '@/types/database';

// Allow responses up to 30 seconds
export const maxDuration = 30;

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

const requestSchema = z
  .object({
    message: z.string().max(5000).optional(),
    messages: z.array(uiMessageSchema).max(200).optional(),
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
        console.error('Failed to load contractor:', contractorResult.error);
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
            console.error('Failed to create contractor:', createError);
            return { error: 'Failed to initialize profile', status: 500 };
          }

          contractor = fallbackResult.data;
          hasNapColumns = fallbackResult.hasNapColumns;
        } else {
          console.error('Failed to create contractor:', createError);
          return { error: 'Failed to initialize profile', status: 500 };
        }
      } else {
        const createdResult = await selectContractorByAuthUserId(adminClient, user.id);
        if (!createdResult.data) {
          console.error('Failed to load contractor after creation');
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
    console.error('Failed to load business:', existingBusinessError);
    return { error: 'Failed to load profile', status: 500 };
  }

  let business = existingBusinessData;

  if (!business) {
    const { data: businessByLegacy, error: legacyError } =
      await selectBusinessByContractorId(adminClient, contractorData.id);

    if (legacyError?.code && legacyError.code !== 'PGRST116') {
      console.error('Failed to load business by legacy contractor:', legacyError);
      return { error: 'Failed to load profile', status: 500 };
    }

    business = businessByLegacy;
  }

  if (!business) {
    const { data: businessByPrimary, error: primaryError } =
      await selectBusinessByPrimaryId(adminClient, contractorData.id);

    if (primaryError?.code && primaryError.code !== 'PGRST116') {
      console.error('Failed to load business by ID:', primaryError);
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
        console.error('Failed to sync business auth fields:', updateError);
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
          console.error('Failed to create business:', businessError);
          return { error: 'Failed to initialize business', status: 500 };
        }

        business = fallbackBusiness;
        businessId = fallbackBusiness.id;
      } else {
        console.error('Failed to create business:', businessError);
        return { error: 'Failed to initialize business', status: 500 };
      }
    } else {
      businessId = newBusiness.id;
    }
  }

  if (!businessId) {
    console.error('Failed to resolve business for onboarding.');
    return { error: 'Failed to initialize business', status: 500 };
  }

  const hasBusinessProfile = business
    ? Boolean(
        business.name &&
          business.city &&
          business.state &&
          business.services &&
          business.services.length > 0 &&
          business.address &&
          business.phone
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
    console.error('Failed to load onboarding conversation:', error);
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
    console.error('Failed to create onboarding conversation:', createError);
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

    const currentState = conversation.extracted
      ? { ...createEmptyDiscoveryState(), ...conversation.extracted }
      : createEmptyDiscoveryState();

    const systemPrompt = buildDiscoverySystemPrompt(currentState);

    const result = streamText({
      model: getChatModel(),
      system: systemPrompt,
      messages: [...history, { role: 'user', content: message }],
      tools: discoveryTools,
      stopWhen: stepCountIs(3),
      onFinish: async ({ text, toolResults }) => {
        const updatedState = processDiscoveryToolCalls(currentState, toolResults);
        updatedState.isComplete = isDiscoveryComplete(updatedState);
        updatedState.missingFields = getMissingDiscoveryFields(updatedState);

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
          console.error('Failed to update onboarding conversation:', updateError);
        }

        // If profile is complete, save to database
        if (
          updatedState.isComplete &&
          updatedState.businessName &&
          updatedState.address &&
          updatedState.phone &&
          updatedState.city &&
          updatedState.state
        ) {
          await saveOnboardingProfile({
            businessId: auth.businessId,
            contractorId: auth.contractorId,
            state: updatedState,
          });
        }
      },
    });

    return result.toUIMessageStreamResponse({ sendSources: true });
  } catch (error) {
    console.error('Onboarding error:', error);
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

  const discoveredAddress = state.discoveredData?.address || null;
  const discoveredPhone = state.discoveredData?.phone || null;
  const discoveredWebsite = state.discoveredData?.website || null;
  const postalCodeMatch = discoveredAddress?.match(/\b\d{5}(?:-\d{4})?\b/);
  const discoveredPostalCode = postalCodeMatch ? postalCodeMatch[0] : null;

  const locationJson = {
    city: state.city,
    state: state.state,
    service_areas: state.serviceAreas,
    ...(discoveredAddress ? { address: discoveredAddress } : {}),
    ...(discoveredPostalCode ? { postal_code: discoveredPostalCode } : {}),
  };

  const understandingJson = {
    specialties: state.services,
  };

  const businessUpdate = {
    name: state.businessName,
    address: discoveredAddress,
    postal_code: discoveredPostalCode,
    phone: discoveredPhone,
    website: discoveredWebsite,
    city: state.city,
    state: state.state,
    services: state.services.length > 0 ? state.services : null,
    service_areas: state.serviceAreas.length > 0 ? state.serviceAreas : null,
    description: state.description || null,
    location: locationJson as unknown as Json,
    understanding: understandingJson as unknown as Json,
    discovered_data: (state.discoveredData || null) as unknown as Json | null,
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
          city: state.city,
          state: state.state,
          services: state.services.length > 0 ? state.services : null,
          service_areas: state.serviceAreas.length > 0 ? state.serviceAreas : null,
          description: state.description || null,
          location: locationJson as unknown as Json,
          understanding: understandingJson as unknown as Json,
          discovered_data: (state.discoveredData || null) as unknown as Json | null,
          google_place_id: state.googlePlaceId || null,
          google_cid: state.googleCid || null,
          onboarding_method: 'conversation',
          onboarding_completed_at: new Date().toISOString(),
        }
      );

      if (fallbackBusinessError) {
        console.error('Failed to update business profile:', fallbackBusinessError);
        throw new Error('Failed to save profile');
      }
    } else {
      console.error('Failed to update business profile:', businessError);
      throw new Error('Failed to save profile');
    }
  }

  if (!contractorId) return;

  // Best-effort contractor sync (legacy)
  const { error } = await updateContractorOnboarding(adminClient, contractorId, {
    business_name: state.businessName,
    city: state.city,
    state: state.state,
    description: state.description || null,
    services: state.services.length > 0 ? state.services : null,
    service_areas: state.serviceAreas.length > 0 ? state.serviceAreas : null,
    address: discoveredAddress,
    postal_code: discoveredPostalCode,
    phone: discoveredPhone,
    website: discoveredWebsite,
    google_place_id: state.googlePlaceId || null,
    google_cid: state.googleCid || null,
    onboarding_method: 'conversation',
  });

  if (error?.code === '42703') {
    // Legacy schema without NAP columns; retry with base fields only.
    const { error: fallbackError } = await updateContractorOnboarding(
      adminClient,
      contractorId,
      {
        business_name: state.businessName,
        city: state.city,
        state: state.state,
        description: state.description || null,
        services: state.services.length > 0 ? state.services : null,
        service_areas: state.serviceAreas.length > 0 ? state.serviceAreas : null,
      }
    );

    if (fallbackError) {
      console.error('Failed to sync contractor profile:', fallbackError);
    }
    return;
  }

  if (error) {
    console.error('Failed to sync contractor profile:', error);
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
    console.error('Onboarding status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
