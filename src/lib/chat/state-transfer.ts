/**
 * State Transfer Utilities: Conversation ↔ Form
 *
 * Enables seamless fallback between agentic conversation and form-based wizard
 * by preserving all collected data during transitions.
 *
 * Use cases:
 * 1. User requests fallback: "Just let me use the form"
 * 2. Circuit breaker triggers: AI temporarily unavailable
 * 3. Resume from form: User edited in form, wants to continue chatting
 *
 * @see /docs/philosophy/operational-excellence.md - State Preservation
 * @see /docs/philosophy/implementation-roadmap.md - Phase 0: Foundation
 */

import type { ExtractedProjectData } from './chat-types';
import type { SharedProjectState } from '@/lib/agents/types';

// =============================================================================
// Form Data Types (matching wizard form fields)
// =============================================================================

/**
 * Profile setup wizard form data
 *
 * Maps to the 3-step profile setup wizard in /profile/setup
 */
export interface ProfileWizardFormData {
  // Step 1: Business basics
  businessName?: string;
  city?: string;
  state?: string;
  description?: string;

  // Step 2: Services
  services?: string[];
  serviceAreas?: string[];

  // Step 3: Contact
  phone?: string;
  email?: string;
  website?: string;

  // Discovery data (from DataForSEO)
  googlePlaceId?: string;
  googleCid?: string;
}

/**
 * Project creation wizard form data
 *
 * Maps to the 6-step project wizard in /projects/new
 */
export interface ProjectWizardFormData {
  // Step 1: Project basics
  projectType?: string;
  location?: string;
  city?: string;
  state?: string;

  // Step 2: Story
  customerProblem?: string;
  solutionApproach?: string;
  challenges?: string;
  proudOf?: string;

  // Step 3: Details
  materials?: string[];
  techniques?: string[];
  duration?: string;

  // Step 4: Generated content (for review step)
  title?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  tags?: string[];

  // Step 5: Images
  images?: Array<{
    id: string;
    url: string;
    filename?: string;
    imageType?: 'before' | 'after' | 'progress' | 'detail';
    altText?: string;
    displayOrder: number;
  }>;
}

// =============================================================================
// Conversation → Form (Fallback)
// =============================================================================

/**
 * Convert extracted conversation data to profile wizard form
 *
 * Used when user falls back from Discovery Agent to profile form.
 *
 * @param extracted - Data extracted from conversation
 * @param discoveredData - Optional data from DataForSEO lookup
 */
export function conversationToProfileForm(
  extracted: Record<string, unknown>,
  discoveredData?: {
    business_name?: string;
    address?: string;
    phone?: string;
    website?: string;
    google_place_id?: string;
    google_cid?: string;
  }
): ProfileWizardFormData {
  const formData: ProfileWizardFormData = {};

  // From discovered data (DataForSEO)
  if (discoveredData) {
    formData.businessName = discoveredData.business_name;
    formData.phone = discoveredData.phone || undefined;
    formData.website = discoveredData.website || undefined;
    formData.googlePlaceId = discoveredData.google_place_id || undefined;
    formData.googleCid = discoveredData.google_cid || undefined;

    // Parse city/state from address if available
    const location = parseLocationFromAddress(discoveredData.address);
    if (location) {
      formData.city = location.city;
      formData.state = location.state || undefined;
    }
  }

  // From conversation extraction (overrides if present)
  if (extracted.business_name) {
    formData.businessName = String(extracted.business_name);
  }
  if (extracted.city) {
    formData.city = String(extracted.city);
  }
  if (extracted.state) {
    formData.state = String(extracted.state);
  }
  if (extracted.description) {
    formData.description = String(extracted.description);
  }
  if (Array.isArray(extracted.services)) {
    formData.services = extracted.services as string[];
  }
  if (Array.isArray(extracted.service_areas)) {
    formData.serviceAreas = extracted.service_areas as string[];
  }

  return formData;
}

/**
 * Convert extracted project data to project wizard form
 *
 * Used when user falls back from Story Agent to project form.
 */
export function conversationToProjectForm(
  extracted: ExtractedProjectData,
  state?: Partial<SharedProjectState>
): ProjectWizardFormData {
  const formData: ProjectWizardFormData = {};

  // From extracted data
  if (extracted.project_type) formData.projectType = extracted.project_type;
  if (extracted.customer_problem)
    formData.customerProblem = extracted.customer_problem;
  if (extracted.solution_approach)
    formData.solutionApproach = extracted.solution_approach;
  if (extracted.materials_mentioned)
    formData.materials = extracted.materials_mentioned;
  if (extracted.techniques_mentioned)
    formData.techniques = extracted.techniques_mentioned;
  if (extracted.duration) formData.duration = extracted.duration;
  if (extracted.location) formData.location = extracted.location;
  if (extracted.city) formData.city = extracted.city;
  if (extracted.state) formData.state = extracted.state;
  if (extracted.challenges) formData.challenges = extracted.challenges;
  if (extracted.proud_of) formData.proudOf = extracted.proud_of;

  // From shared state (generated content)
  if (state) {
    if (state.title) formData.title = state.title;
    if (state.description) formData.description = state.description;
    if (state.seoTitle) formData.seoTitle = state.seoTitle;
    if (state.seoDescription) formData.seoDescription = state.seoDescription;
    if (state.tags) formData.tags = state.tags;
    if (state.images) {
      formData.images = state.images.map((img) => ({
        id: img.id,
        url: img.url,
        filename: img.filename,
        imageType: img.imageType,
        altText: img.altText,
        displayOrder: img.displayOrder,
      }));
    }
  }

  return formData;
}

// =============================================================================
// Form → Conversation (Resume)
// =============================================================================

/**
 * Convert profile form data back to conversation state
 *
 * Used when user wants to resume conversation after editing in form.
 */
export function profileFormToConversation(
  formData: ProfileWizardFormData
): Record<string, unknown> {
  const extracted: Record<string, unknown> = {};

  if (formData.businessName) extracted.business_name = formData.businessName;
  if (formData.city) extracted.city = formData.city;
  if (formData.state) extracted.state = formData.state;
  if (formData.description) extracted.description = formData.description;
  if (formData.services) extracted.services = formData.services;
  if (formData.serviceAreas) extracted.service_areas = formData.serviceAreas;
  if (formData.phone) extracted.phone = formData.phone;
  if (formData.website) extracted.website = formData.website;

  return extracted;
}

/**
 * Convert project form data back to conversation state
 *
 * Used when user wants to resume conversation after editing in form.
 */
export function projectFormToConversation(formData: ProjectWizardFormData): {
  extracted: ExtractedProjectData;
  state: Partial<SharedProjectState>;
} {
  const extracted: ExtractedProjectData = {};
  const state: Partial<SharedProjectState> = {};

  // Populate extracted data
  if (formData.projectType) extracted.project_type = formData.projectType;
  if (formData.customerProblem)
    extracted.customer_problem = formData.customerProblem;
  if (formData.solutionApproach)
    extracted.solution_approach = formData.solutionApproach;
  if (formData.materials) extracted.materials_mentioned = formData.materials;
  if (formData.techniques)
    extracted.techniques_mentioned = formData.techniques;
  if (formData.duration) extracted.duration = formData.duration;
  if (formData.location) extracted.location = formData.location;
  if (formData.city) extracted.city = formData.city;
  if (formData.state) extracted.state = formData.state;
  if (formData.challenges) extracted.challenges = formData.challenges;
  if (formData.proudOf) extracted.proud_of = formData.proudOf;

  // Populate state (generated content)
  if (formData.title) state.title = formData.title;
  if (formData.description) state.description = formData.description;
  if (formData.seoTitle) state.seoTitle = formData.seoTitle;
  if (formData.seoDescription) state.seoDescription = formData.seoDescription;
  if (formData.tags) state.tags = formData.tags;
  if (formData.images) {
    state.images = formData.images.map((img) => ({
      id: img.id,
      url: img.url,
      filename: img.filename,
      imageType: img.imageType,
      altText: img.altText,
      displayOrder: img.displayOrder,
    }));
  }

  return { extracted, state };
}

// =============================================================================
// Session Checkpoint Persistence
// =============================================================================

/**
 * Session checkpoint for recovery during fallback
 */
export interface SessionCheckpoint {
  /** Extracted data from conversation */
  extracted: ExtractedProjectData;
  /** Shared state from agents */
  state: Partial<SharedProjectState>;
  /** Current phase for visual indicator */
  phase: 'gathering' | 'images' | 'generating' | 'review' | 'ready';
  /** When checkpoint was created */
  timestamp: string;
  /** Number of messages in conversation */
  messageCount: number;
}

/**
 * Create a checkpoint from current session state
 */
export function createCheckpoint(
  extracted: ExtractedProjectData,
  state: Partial<SharedProjectState>,
  phase: SessionCheckpoint['phase'],
  messageCount: number
): SessionCheckpoint {
  return {
    extracted,
    state,
    phase,
    timestamp: new Date().toISOString(),
    messageCount,
  };
}

/**
 * Merge a checkpoint with new data (preserving existing, adding new)
 */
export function mergeCheckpoint(
  existing: SessionCheckpoint | null,
  newData: Partial<SessionCheckpoint>
): SessionCheckpoint {
  const base = existing || {
    extracted: {},
    state: {},
    phase: 'gathering' as const,
    timestamp: new Date().toISOString(),
    messageCount: 0,
  };

  return {
    extracted: { ...base.extracted, ...(newData.extracted || {}) },
    state: { ...base.state, ...(newData.state || {}) },
    phase: newData.phase || base.phase,
    timestamp: newData.timestamp || new Date().toISOString(),
    messageCount: newData.messageCount ?? base.messageCount,
  };
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Parse city and state from an address string
 *
 * @example
 * parseLocationFromAddress("1234 Pine St, Denver, CO 80202")
 * // => { city: "Denver", state: "CO" }
 */
export function parseLocationFromAddress(
  address: string | null | undefined
): { city: string; state: string | null } | null {
  if (!address) return null;

  // Try to match "..., City, STATE ZIP" pattern
  const match = address.match(/,\s*([^,]+),\s*([A-Z]{2})\s*\d*/);
  if (match && match[1] && match[2]) {
    return {
      city: match[1].trim(),
      state: match[2],
    };
  }

  // Try to match "City, STATE" pattern
  const simpleMatch = address.match(/([^,]+),\s*([A-Z]{2})$/);
  if (simpleMatch && simpleMatch[1] && simpleMatch[2]) {
    return {
      city: simpleMatch[1].trim(),
      state: simpleMatch[2],
    };
  }

  return null;
}

/**
 * Calculate completeness percentage of form data
 *
 * Useful for showing progress when transitioning between modes.
 */
export function calculateProjectFormCompleteness(
  formData: ProjectWizardFormData
): number {
  const requiredFields = [
    'projectType',
    'city',
    'customerProblem',
    'solutionApproach',
  ];
  const optionalFields = [
    'materials',
    'techniques',
    'duration',
    'challenges',
    'proudOf',
    'title',
    'description',
  ];

  let filled = 0;
  const total = requiredFields.length + optionalFields.length * 0.5;

  for (const field of requiredFields) {
    if (formData[field as keyof ProjectWizardFormData]) filled += 1;
  }

  for (const field of optionalFields) {
    const value = formData[field as keyof ProjectWizardFormData];
    if (value) {
      if (Array.isArray(value) && value.length > 0) {
        filled += 0.5;
      } else if (typeof value === 'string' && value.trim()) {
        filled += 0.5;
      }
    }
  }

  return Math.min(100, Math.round((filled / total) * 100));
}

/**
 * Check if form has enough data to proceed
 *
 * Mirrors the agent's readyForImages check for consistency.
 */
export function hasMinimumProjectData(
  formData: ProjectWizardFormData
): boolean {
  // Must have project type
  if (!formData.projectType) return false;

  // Must have some story (problem or solution)
  if (!formData.customerProblem && !formData.solutionApproach) return false;

  return true;
}
