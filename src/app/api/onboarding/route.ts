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
import { z } from 'zod';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import {
  runDiscoveryAgent,
  createEmptyDiscoveryState,
  getDiscoveryGreeting,
  type DiscoveryState,
} from '@/lib/agents';
import { createCorrelationContext } from '@/lib/observability/agent-logger';
import type { Contractor } from '@/types/database';

// Allow responses up to 30 seconds
export const maxDuration = 30;

// =============================================================================
// Request Schema
// =============================================================================

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(5000),
});

const requestSchema = z.object({
  message: z.string().max(5000).optional(), // Optional for initial greeting
  messages: z.array(messageSchema).max(50).optional(),
  state: z
    .object({
      businessName: z.string().optional(),
      address: z.string().optional(),
      phone: z.string().optional(),
      website: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      description: z.string().optional(),
      services: z.array(z.string()).optional(),
      serviceAreas: z.array(z.string()).optional(),
      googlePlaceId: z.string().optional(),
      googleCid: z.string().optional(),
      isComplete: z.boolean().optional(),
    })
    .optional(),
});

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingContractor, error: profileError } = await (supabase as any)
    .from('contractors')
    .select('id, business_name, address, phone, city, state')
    .eq('auth_user_id', user.id)
    .single();

  let contractor = existingContractor;

  // If no contractor exists, create one
  if (profileError?.code === 'PGRST116' || !contractor) {
    const adminClient = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newContractor, error: createError } = await (adminClient as any)
      .from('contractors')
      .insert({ auth_user_id: user.id, email: user.email })
      .select('id')
      .single();

    if (createError) {
      console.error('Failed to create contractor:', createError);
      return { error: 'Failed to initialize profile', status: 500 };
    }

    contractor = newContractor;
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
  const adminClient = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingBusinessData } = await (adminClient as any)
    .from('businesses')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  const existingBusiness = existingBusinessData as { id: string } | null;
  let businessId = existingBusiness?.id as string | undefined;

  if (!businessId) {
    // Create business row tied to contractor (legacy mapping)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newBusiness, error: businessError } = await (adminClient as any)
      .from('businesses')
      .insert({
        id: contractorData.id,
        auth_user_id: user.id,
        email: user.email,
        legacy_contractor_id: contractorData.id,
      })
      .select('id')
      .single();

    if (businessError || !newBusiness) {
      console.error('Failed to create business:', businessError);
      return { error: 'Failed to initialize business', status: 500 };
    }

    businessId = newBusiness.id as string;
  }

  return {
    userId: user.id,
    email: user.email ?? '',
    contractorId: contractorData.id,
    businessId,
    hasCompleteProfile: !!(
      contractorData.business_name &&
      contractorData.address &&
      contractorData.phone &&
      contractorData.city &&
      contractorData.state
    ),
  };
}

interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

function buildMessage(role: 'user' | 'assistant', content: string): ConversationMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    created_at: new Date().toISOString(),
  };
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

type ConversationRow = {
  id: string;
  messages: ConversationMessage[] | null;
  extracted: DiscoveryState | null;
  summary: string | null;
};

async function getOrCreateOnboardingConversation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessId: string
): Promise<{ conversation: ConversationRow; isNew: boolean }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing, error } = await (supabase as any)
    .from('conversations')
    .select('id, messages, extracted, summary')
    .eq('business_id', businessId)
    .eq('purpose', 'onboarding')
    .single();

  if (!error && existing) {
    const normalized = normalizeMessages(existing.messages);
    if (normalized.length === 0) {
      const greeting = getDiscoveryGreeting();
      const initialMessages = [buildMessage('assistant', greeting)];
      const initialState = existing.extracted ?? createEmptyDiscoveryState();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updated, error: updateError } = await (supabase as any)
        .from('conversations')
        .update({
          messages: initialMessages,
          extracted: initialState,
        })
        .eq('id', existing.id)
        .select('id, messages, extracted, summary')
        .single();

      if (!updateError && updated) {
        return {
          conversation: updated as ConversationRow,
          isNew: true,
        };
      }
    }

    return {
      conversation: existing as ConversationRow,
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: created, error: createError } = await (supabase as any)
    .from('conversations')
    .insert({
      business_id: businessId,
      purpose: 'onboarding',
      status: 'active',
      messages: initialMessages,
      extracted: initialState,
    })
    .select('id, messages, extracted, summary')
    .single();

  if (createError || !created) {
    console.error('Failed to create onboarding conversation:', createError);
    throw new Error('Failed to initialize onboarding conversation');
  }

  return {
    conversation: created as ConversationRow,
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

    // Parse request body
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { message } = parsed.data;

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

    const correlation = createCorrelationContext(
      conversation.id,
      auth.contractorId
    );

    // Run Discovery Agent
    const result = await runDiscoveryAgent(message, {
      businessId: auth.contractorId,
      correlation,
      currentState,
      messages: history,
    });

    const updatedMessages = [
      ...existingMessages,
      buildMessage('user', message),
      buildMessage('assistant', result.message),
    ];

    // Persist conversation messages + state
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('conversations')
      .update({
        messages: updatedMessages,
        extracted: result.state,
        status: result.isComplete ? 'completed' : 'active',
      })
      .eq('id', conversation.id);

    if (updateError) {
      console.error('Failed to update onboarding conversation:', updateError);
    }

    // If profile is complete, save to database
    if (
      result.isComplete &&
      result.state.businessName &&
      result.state.address &&
      result.state.phone &&
      result.state.city &&
      result.state.state
    ) {
      await saveOnboardingProfile(auth.contractorId, result.state);
    }

    return NextResponse.json({
      conversationId: conversation.id,
      message: result.message,
      state: result.state,
      showSearchResults: result.showSearchResults,
      isComplete: result.isComplete,
    });
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

async function saveOnboardingProfile(contractorId: string, state: DiscoveryState): Promise<void> {
  const adminClient = createAdminClient();

  const discoveredAddress = state.discoveredData?.address || null;
  const discoveredPhone = state.discoveredData?.phone || null;
  const discoveredWebsite = state.discoveredData?.website || null;
  const postalCodeMatch = discoveredAddress?.match(/\b\d{5}(?:-\d{4})?\b/);
  const discoveredPostalCode = postalCodeMatch ? postalCodeMatch[0] : null;

  // Base update data (typed columns)
  const updateData: Partial<Contractor> & {
    google_place_id?: string | null;
    google_cid?: string | null;
    onboarding_method?: string | null;
  } = {
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
    // New columns from migration 031 (not in Contractor type yet)
    google_place_id: state.googlePlaceId || null,
    google_cid: state.googleCid || null,
    onboarding_method: 'conversation',
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (adminClient as any)
    .from('contractors')
    .update(updateData)
    .eq('id', contractorId);

  if (error) {
    console.error('Failed to save onboarding profile:', error);
    throw new Error('Failed to save profile');
  }

  // Also update the businesses table if it exists
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (adminClient as any)
    .from('businesses')
    .update({
      name: state.businessName,
      address: discoveredAddress,
      postal_code: discoveredPostalCode,
      phone: discoveredPhone,
      website: discoveredWebsite,
      location: {
        city: state.city,
        state: state.state,
        service_areas: state.serviceAreas,
        ...(discoveredAddress ? { address: discoveredAddress } : {}),
        ...(discoveredPostalCode ? { postal_code: discoveredPostalCode } : {}),
      },
      understanding: {
        specialties: state.services,
      },
      discovered_data: state.discoveredData || null,
      google_place_id: state.googlePlaceId || null,
      google_cid: state.googleCid || null,
      onboarding_method: 'conversation',
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq('legacy_contractor_id', contractorId);
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
