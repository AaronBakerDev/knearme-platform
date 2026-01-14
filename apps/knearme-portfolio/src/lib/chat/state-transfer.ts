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
// Mapping Helpers
// =============================================================================

type FieldMapping = {
  from: string;
  to: string;
};

const PROFILE_STRING_FIELDS: FieldMapping[] = [
  { from: 'business_name', to: 'businessName' },
  { from: 'city', to: 'city' },
  { from: 'state', to: 'state' },
  { from: 'description', to: 'description' },
];

const PROFILE_FORM_FIELDS: FieldMapping[] = [
  { from: 'businessName', to: 'business_name' },
  { from: 'city', to: 'city' },
  { from: 'state', to: 'state' },
  { from: 'description', to: 'description' },
  { from: 'services', to: 'services' },
  { from: 'serviceAreas', to: 'service_areas' },
  { from: 'phone', to: 'phone' },
  { from: 'website', to: 'website' },
];

const PROJECT_EXTRACTED_FIELDS: FieldMapping[] = [
  { from: 'project_type', to: 'projectType' },
  { from: 'customer_problem', to: 'customerProblem' },
  { from: 'solution_approach', to: 'solutionApproach' },
  { from: 'materials_mentioned', to: 'materials' },
  { from: 'techniques_mentioned', to: 'techniques' },
  { from: 'duration', to: 'duration' },
  { from: 'location', to: 'location' },
  { from: 'city', to: 'city' },
  { from: 'state', to: 'state' },
  { from: 'challenges', to: 'challenges' },
  { from: 'proud_of', to: 'proudOf' },
];

const PROJECT_STATE_FIELDS: FieldMapping[] = [
  { from: 'title', to: 'title' },
  { from: 'description', to: 'description' },
  { from: 'seoTitle', to: 'seoTitle' },
  { from: 'seoDescription', to: 'seoDescription' },
  { from: 'tags', to: 'tags' },
];

const PROJECT_FORM_EXTRACTED_FIELDS: FieldMapping[] = [
  { from: 'projectType', to: 'project_type' },
  { from: 'customerProblem', to: 'customer_problem' },
  { from: 'solutionApproach', to: 'solution_approach' },
  { from: 'materials', to: 'materials_mentioned' },
  { from: 'techniques', to: 'techniques_mentioned' },
  { from: 'duration', to: 'duration' },
  { from: 'location', to: 'location' },
  { from: 'city', to: 'city' },
  { from: 'state', to: 'state' },
  { from: 'challenges', to: 'challenges' },
  { from: 'proudOf', to: 'proud_of' },
];

const PROJECT_FORM_STATE_FIELDS: FieldMapping[] = [
  { from: 'title', to: 'title' },
  { from: 'description', to: 'description' },
  { from: 'seoTitle', to: 'seoTitle' },
  { from: 'seoDescription', to: 'seoDescription' },
  { from: 'tags', to: 'tags' },
];

function mapTruthyValues(
  source: Record<string, unknown>,
  mappings: FieldMapping[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const { from, to } of mappings) {
    const value = source[from];
    if (value) {
      result[to] = value;
    }
  }

  return result;
}

function mapProfileStringValues(
  source: Record<string, unknown>,
  mappings: FieldMapping[]
): Partial<ProfileWizardFormData> {
  const result: Partial<ProfileWizardFormData> = {};

  for (const { from, to } of mappings) {
    const value = source[from];
    if (value) {
      (result as Record<string, unknown>)[to] = String(value);
    }
  }

  return result;
}

export function mapDiscoveredProfileFields(
  discoveredData?: {
    business_name?: string;
    address?: string;
    phone?: string;
    website?: string;
    google_place_id?: string;
    google_cid?: string;
  }
): Partial<ProfileWizardFormData> {
  if (!discoveredData) return {};

  const formData: Partial<ProfileWizardFormData> = {
    businessName: discoveredData.business_name,
    phone: discoveredData.phone || undefined,
    website: discoveredData.website || undefined,
    googlePlaceId: discoveredData.google_place_id || undefined,
    googleCid: discoveredData.google_cid || undefined,
  };

  const location = parseLocationFromAddress(discoveredData.address);
  if (location) {
    formData.city = location.city;
    formData.state = location.state || undefined;
  }

  return formData;
}

export function mapExtractedProfileFields(
  extracted: Record<string, unknown>
): Partial<ProfileWizardFormData> {
  const formData = mapProfileStringValues(extracted, PROFILE_STRING_FIELDS);
  const services = extracted['services'];
  const serviceAreas = extracted['service_areas'];

  if (Array.isArray(services)) {
    formData.services = services as string[];
  }

  if (Array.isArray(serviceAreas)) {
    formData.serviceAreas = serviceAreas as string[];
  }

  return formData;
}

export function mapProfileFormToExtracted(
  formData: ProfileWizardFormData
): Record<string, unknown> {
  return mapTruthyValues(formData as Record<string, unknown>, PROFILE_FORM_FIELDS);
}

export function mapExtractedProjectFields(
  extracted: ExtractedProjectData
): Partial<ProjectWizardFormData> {
  return mapTruthyValues(
    extracted as Record<string, unknown>,
    PROJECT_EXTRACTED_FIELDS
  ) as Partial<ProjectWizardFormData>;
}

export function mapProjectImagesToForm(
  images: SharedProjectState['images']
): ProjectWizardFormData['images'] {
  return images.map((img) => ({
    id: img.id,
    url: img.url,
    filename: img.filename,
    imageType: img.imageType,
    altText: img.altText,
    displayOrder: img.displayOrder,
  }));
}

export function mapProjectStateToForm(
  state?: Partial<SharedProjectState>
): Partial<ProjectWizardFormData> {
  if (!state) return {};

  const formData = mapTruthyValues(
    state as Record<string, unknown>,
    PROJECT_STATE_FIELDS
  ) as Partial<ProjectWizardFormData>;

  if (state.images) {
    formData.images = mapProjectImagesToForm(state.images);
  }

  return formData;
}

export function mapProjectFormToExtracted(
  formData: ProjectWizardFormData
): ExtractedProjectData {
  return mapTruthyValues(
    formData as Record<string, unknown>,
    PROJECT_FORM_EXTRACTED_FIELDS
  ) as ExtractedProjectData;
}

export function mapProjectImagesToState(
  images: NonNullable<ProjectWizardFormData['images']>
): SharedProjectState['images'] {
  return images.map((img) => ({
    id: img.id,
    url: img.url,
    filename: img.filename,
    imageType: img.imageType,
    altText: img.altText,
    displayOrder: img.displayOrder,
  }));
}

export function mapProjectFormToState(
  formData: ProjectWizardFormData
): Partial<SharedProjectState> {
  const state = mapTruthyValues(
    formData as Record<string, unknown>,
    PROJECT_FORM_STATE_FIELDS
  ) as Partial<SharedProjectState>;

  if (formData.images) {
    state.images = mapProjectImagesToState(formData.images);
  }

  return state;
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
  return {
    ...mapDiscoveredProfileFields(discoveredData),
    ...mapExtractedProfileFields(extracted),
  };
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
  return {
    ...mapExtractedProjectFields(extracted),
    ...mapProjectStateToForm(state),
  };
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
  return mapProfileFormToExtracted(formData);
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
  return {
    extracted: mapProjectFormToExtracted(formData),
    state: mapProjectFormToState(formData),
  };
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
