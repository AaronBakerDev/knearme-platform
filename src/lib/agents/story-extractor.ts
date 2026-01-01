/**
 * Story Extractor Agent
 *
 * Extracts structured project data from natural conversation with contractors.
 * Runs after each contractor message to pull out key information and track
 * completion status.
 *
 * Key extraction targets:
 * - projectType: chimney-rebuild, tuckpointing, stone-veneer, etc.
 * - customerProblem: What issue brought the customer
 * - solutionApproach: How it was solved
 * - materials: Array of materials used
 * - techniques: Array of techniques
 * - city/state: Project location
 * - duration: How long it took
 * - proudOf: What they're most proud of
 *
 * @see /docs/09-agent/multi-agent-architecture.md
 */

import { generateObject } from 'ai';
import { z } from 'zod';
import { google } from '@ai-sdk/google';
import { isGoogleAIEnabled, AI_MODELS } from '@/lib/ai/providers';
import { formatProjectLocation } from '@/lib/utils/location';
import type { SharedProjectState, StoryExtractionResult } from './types';

// ============================================================================
// Constants
// ============================================================================

/** Minimum word count for customerProblem to be considered complete */
const MIN_PROBLEM_WORDS = 8;

/** Minimum word count for solutionApproach to be considered complete */
const MIN_SOLUTION_WORDS = 8;

/** Minimum materials count before we're ready for images */
const MIN_MATERIALS_FOR_IMAGES = 1;

/** Confidence threshold below which we mark fields for clarification */
const CLARIFICATION_THRESHOLD = 0.7;

/** Valid project types for masonry work */
export const VALID_PROJECT_TYPES = [
  'chimney-rebuild',
  'chimney-repair',
  'tuckpointing',
  'stone-veneer',
  'brick-restoration',
  'fireplace-repair',
  'retaining-wall',
  'patio-paver',
  'foundation-repair',
  'historic-restoration',
  'custom-masonry',
  'other',
] as const;

export type ProjectType = (typeof VALID_PROJECT_TYPES)[number];

// ============================================================================
// Extraction Schema
// ============================================================================

/**
 * Zod schema for AI extraction output.
 * Uses generateObject for type-safe structured extraction.
 */
const ExtractionSchema = z.object({
  /** Detected project type */
  projectType: z
    .string()
    .optional()
    .describe('Project type: chimney-rebuild, tuckpointing, stone-veneer, etc.'),

  /** What problem the customer had */
  customerProblem: z
    .string()
    .optional()
    .describe('The customer problem or need that led to this project'),

  /** How the contractor solved it */
  solutionApproach: z
    .string()
    .optional()
    .describe('How the contractor addressed the problem'),

  /** Materials used */
  materials: z
    .array(z.string())
    .optional()
    .describe('Materials used in the project'),

  /** Techniques applied */
  techniques: z
    .array(z.string())
    .optional()
    .describe('Techniques or methods used'),

  /** Project location */
  location: z
    .string()
    .optional()
    .describe('City, neighborhood, or area where the project was done'),

  /** Project city */
  city: z
    .string()
    .optional()
    .describe('City where the project was done'),

  /** Project state/province */
  state: z
    .string()
    .optional()
    .describe('State/province where the project was done (e.g., "CO")'),

  /** How long it took */
  duration: z
    .string()
    .optional()
    .describe('How long the project took (e.g., "3 days", "2 weeks")'),

  /** What they are proud of */
  proudOf: z
    .string()
    .optional()
    .describe('What the contractor is most proud of about this project'),

  /** Confidence scores for each extracted field (0-1) */
  confidence: z
    .object({
      projectType: z.number().min(0).max(1).optional(),
      customerProblem: z.number().min(0).max(1).optional(),
      solutionApproach: z.number().min(0).max(1).optional(),
      materials: z.number().min(0).max(1).optional(),
      techniques: z.number().min(0).max(1).optional(),
      location: z.number().min(0).max(1).optional(),
      city: z.number().min(0).max(1).optional(),
      state: z.number().min(0).max(1).optional(),
      duration: z.number().min(0).max(1).optional(),
      proudOf: z.number().min(0).max(1).optional(),
    })
    .describe('Confidence scores for each extracted field'),
});

type ExtractionOutput = z.infer<typeof ExtractionSchema>;

// ============================================================================
// System Prompt
// ============================================================================

const EXTRACTION_SYSTEM_PROMPT = `You are a data extraction agent for a masonry contractor portfolio system.

Your job is to extract structured project information from natural conversation with contractors.

EXTRACTION RULES:
1. Extract ONLY information that is explicitly stated - never infer or guess
2. Preserve the contractor's voice and specific details
3. Return confidence scores based on how clearly the information was stated
4. If something is vague or unclear, give it low confidence

CONFIDENCE SCORING:
- 1.0: Explicitly and clearly stated
- 0.8: Clearly implied or stated with minor ambiguity
- 0.6: Somewhat vague but likely accurate
- 0.4: Very vague, needs clarification
- 0.2: Barely mentioned, high uncertainty

PROJECT TYPES (use exact slugs):
- chimney-rebuild: Full chimney reconstruction
- chimney-repair: Fixing existing chimney issues
- tuckpointing: Mortar joint repair/replacement
- stone-veneer: Stone facade installation
- brick-restoration: Restoring damaged brick
- fireplace-repair: Fireplace masonry work
- retaining-wall: Building or repairing walls
- patio-paver: Patio or walkway installation
- foundation-repair: Foundation masonry work
- historic-restoration: Historic building restoration
- custom-masonry: Custom/unique masonry projects
- other: Anything that doesn't fit above

IMPORTANT:
- customerProblem: Should capture WHY the customer called (the issue/need)
- solutionApproach: Should capture HOW the contractor solved it
- materials: Be specific (e.g., "reclaimed red brick" not just "brick")
- techniques: Use proper masonry terminology
- location: Always extract city and state when possible`;

// ============================================================================
// Main Extraction Function
// ============================================================================

/**
 * Extract structured project data from a contractor message.
 *
 * @param message - The contractor's message to extract from
 * @param existingState - Optional existing state to merge with
 * @returns StoryExtractionResult with extracted data, confidence scores, and readiness flags
 *
 * @example
 * const result = await extractStory(
 *   "We rebuilt a chimney in Denver. The homeowner had water damage from bad flashing. Used reclaimed brick and lime mortar.",
 *   existingState
 * );
 */
export async function extractStory(
  message: string,
  existingState?: Partial<SharedProjectState>
): Promise<StoryExtractionResult> {
  // Early return for empty messages
  if (!message.trim()) {
    return {
      state: existingState || {},
      needsClarification: [],
      confidence: {},
      readyForImages: false,
    };
  }

  // If AI is not available, fall back to basic extraction
  if (!isGoogleAIEnabled()) {
    return extractWithoutAI(message, existingState);
  }

  try {
    const extraction = await performAIExtraction(message, existingState);
    return processExtraction(extraction, existingState);
  } catch (error) {
    console.error('[StoryExtractor] AI extraction failed:', error);
    // Fall back to basic extraction on error
    return extractWithoutAI(message, existingState);
  }
}

/**
 * Perform AI-powered extraction using Gemini.
 */
async function performAIExtraction(
  message: string,
  existingState?: Partial<SharedProjectState>
): Promise<ExtractionOutput> {
  const contextPrompt = existingState
    ? `EXISTING DATA (merge with new information, don't overwrite with empty values):
${JSON.stringify(existingState, null, 2)}

NEW MESSAGE TO EXTRACT FROM:
${message}`
    : `MESSAGE TO EXTRACT FROM:
${message}`;

  const { object } = await generateObject({
    model: google(AI_MODELS.generation),
    schema: ExtractionSchema,
    system: EXTRACTION_SYSTEM_PROMPT,
    prompt: contextPrompt,
    maxOutputTokens: 1000,
    temperature: 0.2, // Low temperature for consistent extraction
  });

  return object;
}

/**
 * Process extraction output into StoryExtractionResult.
 * Handles merging, confidence scoring, and readiness checks.
 */
function processExtraction(
  extraction: ExtractionOutput,
  existingState?: Partial<SharedProjectState>
): StoryExtractionResult {
  // Build merged state
  const state: Partial<SharedProjectState> = {
    ...existingState,
  };

  // Build confidence map
  const confidence: Record<string, number> = {};
  const needsClarification: string[] = [];

  // Process each field
  if (extraction.projectType) {
    state.projectType = normalizeProjectType(extraction.projectType);
    confidence.projectType = extraction.confidence?.projectType ?? 0.8;
    if (confidence.projectType < CLARIFICATION_THRESHOLD) {
      needsClarification.push('projectType');
    }
  }

  if (extraction.customerProblem) {
    state.customerProblem = extraction.customerProblem;
    confidence.customerProblem = extraction.confidence?.customerProblem ?? 0.8;
    if (confidence.customerProblem < CLARIFICATION_THRESHOLD) {
      needsClarification.push('customerProblem');
    }
  }

  if (extraction.solutionApproach) {
    state.solutionApproach = extraction.solutionApproach;
    confidence.solutionApproach = extraction.confidence?.solutionApproach ?? 0.8;
    if (confidence.solutionApproach < CLARIFICATION_THRESHOLD) {
      needsClarification.push('solutionApproach');
    }
  }

  // Merge arrays (don't overwrite, add new items)
  if (extraction.materials && extraction.materials.length > 0) {
    const existingMaterials = existingState?.materials || [];
    const newMaterials = extraction.materials.filter(
      (m) => !existingMaterials.includes(m)
    );
    state.materials = [...existingMaterials, ...newMaterials];
    confidence.materials = extraction.confidence?.materials ?? 0.8;
  } else {
    state.materials = existingState?.materials || [];
  }

  if (extraction.techniques && extraction.techniques.length > 0) {
    const existingTechniques = existingState?.techniques || [];
    const newTechniques = extraction.techniques.filter(
      (t) => !existingTechniques.includes(t)
    );
    state.techniques = [...existingTechniques, ...newTechniques];
    confidence.techniques = extraction.confidence?.techniques ?? 0.8;
  } else {
    state.techniques = existingState?.techniques || [];
  }

  if (extraction.location) {
    const parsed = parseLocationString(extraction.location);
    if (!extraction.city && parsed.city) {
      extraction.city = parsed.city;
    }
    if (!extraction.state && parsed.state) {
      extraction.state = parsed.state;
    }
    state.location = extraction.location;
    confidence.location = extraction.confidence?.location ?? 0.8;
  }

  if (extraction.city) {
    state.city = extraction.city.trim();
    confidence.city = extraction.confidence?.city ?? extraction.confidence?.location ?? 0.8;
    if (confidence.city < CLARIFICATION_THRESHOLD) {
      needsClarification.push('city');
    }
  }

  if (extraction.state) {
    state.state = extraction.state.trim();
    confidence.state = extraction.confidence?.state ?? extraction.confidence?.location ?? 0.8;
    if (confidence.state < CLARIFICATION_THRESHOLD) {
      needsClarification.push('state');
    }
  }

  if (!state.location && (state.city || state.state)) {
    state.location = formatProjectLocation({ city: state.city, state: state.state }) || state.location;
  }

  if (extraction.duration) {
    state.duration = extraction.duration;
    confidence.duration = extraction.confidence?.duration ?? 0.8;
  }

  if (extraction.proudOf) {
    state.proudOf = extraction.proudOf;
    confidence.proudOf = extraction.confidence?.proudOf ?? 0.8;
  }

  // Calculate readiness
  const readyForImages = checkReadyForImages(state);

  return {
    state,
    needsClarification,
    confidence,
    readyForImages,
  };
}

/**
 * Basic extraction without AI for fallback scenarios.
 * Uses simple keyword matching and pattern recognition.
 */
function extractWithoutAI(
  message: string,
  existingState?: Partial<SharedProjectState>
): StoryExtractionResult {
  const state: Partial<SharedProjectState> = { ...existingState };
  const confidence: Record<string, number> = {};
  const needsClarification: string[] = [];
  const lowerMessage = message.toLowerCase();

  // Project type detection
  for (const projectType of VALID_PROJECT_TYPES) {
    const searchTerm = projectType.replace('-', ' ');
    if (lowerMessage.includes(searchTerm)) {
      state.projectType = projectType;
      confidence.projectType = 0.7;
      break;
    }
  }

  // Chimney-specific detection
  if (!state.projectType) {
    if (lowerMessage.includes('chimney')) {
      state.projectType = lowerMessage.includes('rebuild')
        ? 'chimney-rebuild'
        : 'chimney-repair';
      confidence.projectType = 0.6;
      needsClarification.push('projectType');
    }
  }

  // Material detection (common masonry materials)
  const materialKeywords = [
    'brick', 'mortar', 'stone', 'concrete', 'limestone',
    'granite', 'marble', 'sandstone', 'portland cement',
    'lime mortar', 'reclaimed brick', 'natural stone',
  ];
  const foundMaterials = materialKeywords.filter((m) =>
    lowerMessage.includes(m)
  );
  if (foundMaterials.length > 0) {
    const existingMaterials = existingState?.materials || [];
    state.materials = Array.from(new Set([...existingMaterials, ...foundMaterials]));
    confidence.materials = 0.6;
  } else {
    state.materials = existingState?.materials || [];
  }

  // Technique detection
  const techniqueKeywords = [
    'repointing', 'tuckpointing', 'flashing', 'waterproofing',
    'sealing', 'restoration', 'rebuild', 'repair',
  ];
  const foundTechniques = techniqueKeywords.filter((t) =>
    lowerMessage.includes(t)
  );
  if (foundTechniques.length > 0) {
    const existingTechniques = existingState?.techniques || [];
    state.techniques = Array.from(new Set([...existingTechniques, ...foundTechniques]));
    confidence.techniques = 0.6;
  } else {
    state.techniques = existingState?.techniques || [];
  }

  // Location detection (basic city/state patterns)
  const locationMatch = message.match(
    /\b(?:in|at|near)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)(?:,\s*([A-Z]{2}))?\b/
  );
  if (locationMatch) {
    const city = locationMatch[1];
    const stateCode = locationMatch[2];
    state.city = city;
    if (stateCode) {
      state.state = stateCode;
    } else {
      needsClarification.push('state');
    }
    state.location = formatProjectLocation({ city, state: stateCode }) || city;
    confidence.city = 0.5;
    if (stateCode) {
      confidence.state = 0.5;
    }
  }

  // Duration detection
  const durationMatch = message.match(
    /(\d+)\s*(day|week|month|hour)s?/i
  );
  if (durationMatch) {
    state.duration = durationMatch[0];
    confidence.duration = 0.7;
  }

  const readyForImages = checkReadyForImages(state);

  return {
    state,
    needsClarification,
    confidence,
    readyForImages,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if we have enough data to proceed to the image upload phase.
 *
 * Requirements:
 * - projectType is set
 * - customerProblem has at least MIN_PROBLEM_WORDS
 * - solutionApproach has at least MIN_SOLUTION_WORDS
 * - At least MIN_MATERIALS_FOR_IMAGES materials
 * - Location is helpful but not required to proceed to images
 */
export function checkReadyForImages(
  state: Partial<SharedProjectState>
): boolean {
  // Must have project type
  if (!state.projectType) {
    return false;
  }

  // Must have sufficient customer problem description
  const problemWordCount = countWords(state.customerProblem);
  if (problemWordCount < MIN_PROBLEM_WORDS) {
    return false;
  }

  // Must have sufficient solution description
  const solutionWordCount = countWords(state.solutionApproach);
  if (solutionWordCount < MIN_SOLUTION_WORDS) {
    return false;
  }

  // Must have minimum materials
  const materialCount = state.materials?.length || 0;
  if (materialCount < MIN_MATERIALS_FOR_IMAGES) {
    return false;
  }

  return true;
}

/**
 * Count words in a string.
 */
export function countWords(text?: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Normalize project type to valid slug.
 */
export function normalizeProjectType(type: string): ProjectType {
  const normalized = type.toLowerCase().replace(/\s+/g, '-');

  // Check if it's a valid type
  if (VALID_PROJECT_TYPES.includes(normalized as ProjectType)) {
    return normalized as ProjectType;
  }

  // Try to map common variations
  const mappings: Record<string, ProjectType> = {
    'chimney': 'chimney-repair',
    'rebuild': 'chimney-rebuild',
    'tuckpoint': 'tuckpointing',
    'repoint': 'tuckpointing',
    'stone': 'stone-veneer',
    'veneer': 'stone-veneer',
    'brick': 'brick-restoration',
    'fireplace': 'fireplace-repair',
    'wall': 'retaining-wall',
    'patio': 'patio-paver',
    'foundation': 'foundation-repair',
    'historic': 'historic-restoration',
  };

  for (const [key, value] of Object.entries(mappings)) {
    if (normalized.includes(key)) {
      return value;
    }
  }

  return 'other';
}

/**
 * Get list of fields that are still needed for completion.
 */
export function getMissingFields(
  state: Partial<SharedProjectState>
): string[] {
  const missing: string[] = [];

  if (!state.projectType) {
    missing.push('projectType');
  }

  if (countWords(state.customerProblem) < MIN_PROBLEM_WORDS) {
    missing.push('customerProblem');
  }

  if (countWords(state.solutionApproach) < MIN_SOLUTION_WORDS) {
    missing.push('solutionApproach');
  }

  if ((state.materials?.length || 0) < MIN_MATERIALS_FOR_IMAGES) {
    missing.push('materials');
  }

  return missing;
}

/**
 * Get a human-readable summary of extraction progress.
 */
export function getExtractionProgress(
  state: Partial<SharedProjectState>
): {
  complete: string[];
  incomplete: string[];
  percentComplete: number;
} {
  const fields = [
    'projectType',
    'customerProblem',
    'solutionApproach',
    'materials',
    'techniques',
    'city',
    'state',
    'duration',
    'proudOf',
  ] as const;

  const locationParts = resolveLocationParts(state);

  const complete: string[] = [];
  const incomplete: string[] = [];

  for (const field of fields) {
    const value =
      field === 'city'
        ? locationParts.city
        : field === 'state'
          ? locationParts.state
          : state[field];
    if (Array.isArray(value)) {
      if (value.length > 0) {
        complete.push(field);
      } else {
        incomplete.push(field);
      }
    } else if (value && typeof value === 'string' && value.trim().length > 0) {
      complete.push(field);
    } else {
      incomplete.push(field);
    }
  }

  const percentComplete = Math.round((complete.length / fields.length) * 100);

  return { complete, incomplete, percentComplete };
}

function resolveLocationParts(
  state: Partial<SharedProjectState>
): { city?: string; state?: string } {
  const city = state.city?.trim();
  const stateCode = state.state?.trim();
  if (city || stateCode) {
    return { city, state: stateCode };
  }
  if (state.location) {
    return parseLocationString(state.location);
  }
  return {};
}

function parseLocationString(location: string): { city?: string; state?: string } {
  const trimmed = location.trim();
  if (!trimmed) return {};

  const commaMatch = trimmed.match(/^([^,]+),\s*([A-Z]{2,})$/);
  if (commaMatch?.[1] && commaMatch?.[2]) {
    return {
      city: commaMatch[1].trim(),
      state: commaMatch[2].trim(),
    };
  }

  const spaceMatch = trimmed.match(/^(.+)\s+([A-Z]{2})$/);
  if (spaceMatch?.[1] && spaceMatch?.[2]) {
    return {
      city: spaceMatch[1].trim(),
      state: spaceMatch[2].trim(),
    };
  }

  return { city: trimmed };
}
