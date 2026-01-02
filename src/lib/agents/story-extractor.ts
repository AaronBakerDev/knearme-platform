/**
 * Story Extractor Agent (STORY AGENT SUBAGENT)
 *
 * ARCHITECTURE: Subagent of Account Manager Orchestrator
 *
 * The Story Agent handles conversation, content extraction, and multimodal
 * image understanding. It writes to the `businessContext` and `project`
 * sections of the shared ProjectState.
 *
 * Persona: "I'm having a conversation with someone who has work to show.
 * I listen, I see their images, I extract what matters, and I write in
 * their voice—not mine."
 *
 * Trade-agnostic design: Uses TradeConfig to determine valid project types,
 * materials, and techniques for the business's trade.
 *
 * Key extraction targets:
 * - projectType: Derived from trade config (e.g., kitchen-remodel, deck-build)
 * - customerProblem: What issue brought the customer
 * - solutionApproach: How it was solved
 * - materials: Array of materials used (from trade vocabulary)
 * - techniques: Array of techniques (from trade vocabulary)
 * - city/state: Project location
 * - duration: How long it took
 * - proudOf: What they're most proud of
 *
 * Tools: extractNarrative, analyzeImages, generateContent, signalCheckpoint
 *
 * @see /.claude/skills/agent-atlas/references/AGENT-PERSONAS.md
 * @see /todo/ai-sdk-phase-10-persona-agents.md
 * @see /src/lib/trades/config.ts for trade configuration
 */

import { generateText, Output } from 'ai';
import { z } from 'zod';
import { google } from '@ai-sdk/google';
import { isGoogleAIEnabled, AI_MODELS } from '@/lib/ai/providers';
import { formatProjectLocation } from '@/lib/utils/location';
import { getTradeConfig, buildTradeContext, type TradeConfig } from '@/lib/trades/config';
import type { SharedProjectState, StoryExtractionResult } from './types';

// ============================================================================
// Philosophy: Let the Model Be Agentic
// ============================================================================
//
// REMOVED artificial gates that second-guess the model:
// - MIN_PROBLEM_WORDS, MIN_SOLUTION_WORDS (model knows when content is sufficient)
// - MIN_MATERIALS_FOR_IMAGES (users can upload images whenever they want)
// - CLARIFICATION_THRESHOLD (model expresses uncertainty naturally, not via scores)
//
// The extraction agent extracts what it finds. It does NOT gate or block.
// The chat agent decides when to ask for clarification based on context.
//
// @see /docs/philosophy/agent-philosophy.md
// ============================================================================

/**
 * Get valid project types from trade config.
 * Converts display names to URL-friendly slugs (e.g., "kitchen remodel" → "kitchen-remodel").
 */
function getValidProjectTypes(config: TradeConfig): string[] {
  const slugs = config.terminology.projectTypes.map((type) =>
    type.toLowerCase().replace(/\s+/g, '-')
  );
  // Always include 'other' as fallback
  if (!slugs.includes('other')) {
    slugs.push('other');
  }
  return slugs;
}

/**
 * Project type - dynamically derived from trade config.
 * Examples: kitchen-remodel, bathroom-remodel, deck-build, etc.
 */
export type ProjectType = string;

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
    .describe('Project type slug derived from trade config (e.g., kitchen-remodel, deck-build)'),

  /** What problem the customer had */
  customerProblem: z
    .string()
    .optional()
    .describe('The customer problem or need that led to this project'),

  /** How the business owner solved it */
  solutionApproach: z
    .string()
    .optional()
    .describe('How the business owner addressed the problem'),

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
    .describe('What the business owner is most proud of about this project'),

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

/**
 * Build the extraction system prompt with trade-specific vocabulary.
 * Trade-agnostic: Uses TradeConfig to inject project types, materials, and techniques.
 *
 * @param config - Trade configuration
 * @returns System prompt string
 */
function buildExtractionSystemPrompt(config: TradeConfig): string {
  // Build project types list with slugs
  const projectTypesSection = config.terminology.projectTypes
    .map((type) => `- ${type.toLowerCase().replace(/\s+/g, '-')}: ${type}`)
    .join('\n');

  // Build materials and techniques lists
  const materialsExamples = config.terminology.materials.slice(0, 8).join(', ');
  const techniquesExamples = config.terminology.techniques.slice(0, 8).join(', ');

  return `You are a data extraction agent for a business portfolio system.

Your job is to extract structured project information from natural conversation with business owners.

TRADE CONTEXT:
${buildTradeContext(config)}

EXTRACTION RULES:
1. Extract ONLY information that is explicitly stated - never infer or guess
2. Preserve the business owner's voice and specific details
3. Return confidence scores based on how clearly the information was stated
4. If something is vague or unclear, give it low confidence

CONFIDENCE SCORING:
- 1.0: Explicitly and clearly stated
- 0.8: Clearly implied or stated with minor ambiguity
- 0.6: Somewhat vague but likely accurate
- 0.4: Very vague, needs clarification
- 0.2: Barely mentioned, high uncertainty

PROJECT TYPES (use exact slugs):
${projectTypesSection}
- other: Anything that doesn't fit above

CLARITY GUIDELINES:
- Prefer specific terms over generic ones when available
- Avoid duplicates across lists
- Keep materials and techniques distinct when it's clear

MATERIALS are physical substances used in construction:
  Examples: ${materialsExamples}
  Include specific variants when mentioned

TECHNIQUES are methods/processes/actions:
  Examples: ${techniquesExamples}
  Use the full process name when possible

IMPORTANT:
- customerProblem: Should capture WHY the customer called (the issue/need)
- solutionApproach: Should capture HOW the business owner solved it
- materials: Be specific, NO overlap with techniques
- techniques: Use proper terminology, NO overlap with materials
- location: Always extract city and state when possible`;
}

// ============================================================================
// Main Extraction Function
// ============================================================================

/**
 * Extract structured project data from a user message.
 *
 * @param message - The user's message to extract from
 * @param existingState - Optional existing state to merge with
 * @returns StoryExtractionResult with extracted data, confidence scores, and readiness flags
 *
 * @example
 * const result = await extractStory(
 *   "We remodeled a kitchen in Denver. The homeowner wanted more counter space. Used quartz countertops and custom cabinetry.",
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
 *
 * Uses generateText with Output.object for structured extraction.
 * Trade-agnostic: Builds system prompt from TradeConfig.
 *
 * @see https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data
 */
async function performAIExtraction(
  message: string,
  existingState?: Partial<SharedProjectState>
): Promise<ExtractionOutput> {
  // Get trade config for dynamic prompt building
  const tradeConfig = getTradeConfig();
  const systemPrompt = buildExtractionSystemPrompt(tradeConfig);

  const contextPrompt = existingState
    ? `EXISTING DATA (merge with new information, don't overwrite with empty values):
${JSON.stringify(existingState, null, 2)}

NEW MESSAGE TO EXTRACT FROM:
${message}`
    : `MESSAGE TO EXTRACT FROM:
${message}`;

  const { output: object } = await generateText({
    model: google(AI_MODELS.generation),
    output: Output.object({ schema: ExtractionSchema }),
    system: systemPrompt,
    prompt: contextPrompt,
    maxOutputTokens: 2048, // Increased from 1000 - structured response needs room for all fields
    temperature: 0.2, // Low temperature for consistent extraction
  });

  // Handle null output (schema validation failure)
  if (!object) {
    return {
      confidence: {},
    };
  }

  return object;
}

// ============================================================================
// Deduplication Helpers
// ============================================================================

/**
 * Generic action words that indicate a technique (trade-agnostic).
 * These are combined with trade-specific techniques from config.
 */
const GENERIC_ACTION_TERMS = new Set([
  'installation',
  'replacement',
  'repair',
  'restoration',
  'rebuild',
  'cleaning',
  'washing',
  'sealing',
  'matching',
]);

/**
 * Build technique terms set from trade config.
 * Combines trade-specific techniques with generic action words.
 *
 * @param config - Trade configuration
 * @returns Set of lowercase technique terms
 */
function buildTechniqueTerms(config: TradeConfig): Set<string> {
  const terms = new Set<string>(GENERIC_ACTION_TERMS);

  // Add trade-specific techniques (lowercase, extract key words)
  for (const technique of config.terminology.techniques) {
    const lower = technique.toLowerCase();
    terms.add(lower);
    // Also add individual words for partial matching
    for (const word of lower.split(/\s+/)) {
      if (word.length > 3) { // Skip short words like "of", "the"
        terms.add(word);
      }
    }
  }

  return terms;
}

/**
 * Check if term A is a generic/substring version of term B.
 *
 * Returns true if B is more specific than A, meaning A should be removed.
 *
 * Examples:
 * - isGenericOf("brick", "reclaimed Denver common brick") → true
 * - isGenericOf("flashing", "flashing installation") → true
 * - isGenericOf("chimney", "chimney rebuild") → true
 */
function isGenericOf(generic: string, specific: string): boolean {
  const g = generic.toLowerCase().trim();
  const s = specific.toLowerCase().trim();

  // Can't be generic of itself
  if (g === s) return false;

  // If specific contains generic as a word boundary match
  // "brick" is generic of "reclaimed brick" but not "brickwork"
  const wordBoundaryPattern = new RegExp(`\\b${escapeRegex(g)}\\b`, 'i');
  return wordBoundaryPattern.test(s) && s.length > g.length;
}

/**
 * Escape special regex characters in a string.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Deduplicate a list of terms by removing generic versions when specific exists.
 *
 * Examples:
 * - ["brick", "reclaimed Denver common brick"] → ["reclaimed Denver common brick"]
 * - ["flashing", "flashing installation"] → ["flashing installation"]
 * - ["mortar", "Type S mortar", "lime mortar"] → ["Type S mortar", "lime mortar"]
 */
function deduplicateTerms(terms: string[]): string[] {
  if (terms.length <= 1) return terms;

  const result: string[] = [];

  for (const term of terms) {
    // Check if this term is a generic version of any other term in the list
    const isGenericOfAnother = terms.some(
      (other) => other !== term && isGenericOf(term, other)
    );

    if (!isGenericOfAnother) {
      result.push(term);
    }
  }

  return result;
}

/**
 * Remove overlapping terms between materials and techniques.
 *
 * When a term appears in both lists, it's moved to the appropriate list
 * based on whether it's a process/action (technique) or substance (material).
 *
 * @param materials - Raw materials list
 * @param techniques - Raw techniques list
 * @param techniqueTerms - Set of known technique terms from trade config
 * @returns Cleaned materials and techniques arrays
 */
function separateMaterialsAndTechniques(
  materials: string[],
  techniques: string[],
  techniqueTerms: Set<string>
): { materials: string[]; techniques: string[] } {
  const cleanMaterials: string[] = [];
  const cleanTechniques = [...techniques];

  for (const material of materials) {
    const lowerMaterial = material.toLowerCase();

    // Check if this is actually a technique term
    const isTechniqueTerm = techniqueTerms.has(lowerMaterial) ||
      Array.from(techniqueTerms).some((t) => lowerMaterial.includes(t));

    if (isTechniqueTerm) {
      // Move to techniques if not already there
      const alreadyInTechniques = cleanTechniques.some(
        (t) => t.toLowerCase() === lowerMaterial
      );
      if (!alreadyInTechniques) {
        cleanTechniques.push(material);
      }
    } else {
      cleanMaterials.push(material);
    }
  }

  // Also deduplicate within each list
  return {
    materials: deduplicateTerms(cleanMaterials),
    techniques: deduplicateTerms(cleanTechniques),
  };
}

// ============================================================================
// Extraction Processing
// ============================================================================

/**
 * Process extraction output into StoryExtractionResult.
 * Handles merging, confidence scoring, and readiness checks.
 */
function processExtraction(
  extraction: ExtractionOutput,
  existingState?: Partial<SharedProjectState>
): StoryExtractionResult {
  // Get trade config for vocabulary
  const tradeConfig = getTradeConfig();
  const techniqueTerms = buildTechniqueTerms(tradeConfig);

  // Build merged state
  const state: Partial<SharedProjectState> = {
    ...existingState,
  };

  // Build confidence map
  const confidence: Record<string, number> = {};
  const needsClarification: string[] = [];

  // Process each field - no gating, just extract what's there
  // The model will naturally ask for clarification in conversation if needed
  if (extraction.projectType) {
    state.projectType = normalizeProjectType(extraction.projectType);
    confidence.projectType = extraction.confidence?.projectType ?? 0.8;
  }

  if (extraction.customerProblem) {
    state.customerProblem = extraction.customerProblem;
    confidence.customerProblem = extraction.confidence?.customerProblem ?? 0.8;
  }

  if (extraction.solutionApproach) {
    state.solutionApproach = extraction.solutionApproach;
    confidence.solutionApproach = extraction.confidence?.solutionApproach ?? 0.8;
  }

  // Merge arrays (don't overwrite, add new items)
  let rawMaterials: string[] = existingState?.materials || [];
  let rawTechniques: string[] = existingState?.techniques || [];

  if (extraction.materials && extraction.materials.length > 0) {
    const newMaterials = extraction.materials.filter(
      (m) => !rawMaterials.some((existing) => existing.toLowerCase() === m.toLowerCase())
    );
    rawMaterials = [...rawMaterials, ...newMaterials];
    confidence.materials = extraction.confidence?.materials ?? 0.8;
  }

  if (extraction.techniques && extraction.techniques.length > 0) {
    const newTechniques = extraction.techniques.filter(
      (t) => !rawTechniques.some((existing) => existing.toLowerCase() === t.toLowerCase())
    );
    rawTechniques = [...rawTechniques, ...newTechniques];
    confidence.techniques = extraction.confidence?.techniques ?? 0.8;
  }

  // Apply intelligent deduplication:
  // 1. Remove generic terms when specific exists (e.g., "brick" when "reclaimed Denver brick" exists)
  // 2. Move technique terms from materials to techniques (e.g., "flashing")
  // 3. Remove substring duplicates (e.g., "flashing" when "flashing installation" exists)
  const { materials: cleanMaterials, techniques: cleanTechniques } =
    separateMaterialsAndTechniques(rawMaterials, rawTechniques, techniqueTerms);

  state.materials = cleanMaterials;
  state.techniques = cleanTechniques;

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
  }

  if (extraction.state) {
    state.state = extraction.state.trim();
    confidence.state = extraction.confidence?.state ?? extraction.confidence?.location ?? 0.8;
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
 * Trade-agnostic: Uses TradeConfig for vocabulary.
 */
function extractWithoutAI(
  message: string,
  existingState?: Partial<SharedProjectState>
): StoryExtractionResult {
  // Get trade config for vocabulary
  const tradeConfig = getTradeConfig();
  const validProjectTypes = getValidProjectTypes(tradeConfig);
  const techniqueTerms = buildTechniqueTerms(tradeConfig);

  const state: Partial<SharedProjectState> = { ...existingState };
  const confidence: Record<string, number> = {};
  const needsClarification: string[] = [];
  const lowerMessage = message.toLowerCase();

  // Project type detection from trade config
  for (const projectType of validProjectTypes) {
    const searchTerm = projectType.replace(/-/g, ' ');
    if (lowerMessage.includes(searchTerm)) {
      state.projectType = projectType;
      confidence.projectType = 0.7;
      break;
    }
  }

  // Fallback: Try to detect common patterns
  if (!state.projectType) {
    // Check for trade-specific keywords that might indicate a project type
    for (const projectType of tradeConfig.terminology.projectTypes) {
      const words = projectType.toLowerCase().split(/\s+/);
      // If any significant word matches, use that type (model asks for clarification naturally)
      if (words.some((word) => word.length > 4 && lowerMessage.includes(word))) {
        state.projectType = projectType.toLowerCase().replace(/\s+/g, '-');
        confidence.projectType = 0.5;
        break;
      }
    }
  }

  // Material detection from trade config
  const materialKeywords = tradeConfig.terminology.materials.map((m) => m.toLowerCase());
  const foundMaterials = materialKeywords.filter((m) =>
    lowerMessage.includes(m)
  );
  let rawMaterials: string[] = existingState?.materials || [];
  if (foundMaterials.length > 0) {
    rawMaterials = Array.from(new Set([...rawMaterials, ...foundMaterials]));
    confidence.materials = 0.6;
  }

  // Technique detection from trade config
  const techniqueKeywords = tradeConfig.terminology.techniques.map((t) => t.toLowerCase());
  const foundTechniques = techniqueKeywords.filter((t) =>
    lowerMessage.includes(t)
  );
  let rawTechniques: string[] = existingState?.techniques || [];
  if (foundTechniques.length > 0) {
    rawTechniques = Array.from(new Set([...rawTechniques, ...foundTechniques]));
    confidence.techniques = 0.6;
  }

  // Apply intelligent deduplication (same as AI extraction path)
  const { materials: cleanMaterials, techniques: cleanTechniques } =
    separateMaterialsAndTechniques(rawMaterials, rawTechniques, techniqueTerms);

  state.materials = cleanMaterials;
  state.techniques = cleanTechniques;

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
      confidence.state = 0.5;
    }
    // Model asks for state naturally in conversation if needed
    state.location = formatProjectLocation({ city, state: stateCode }) || city;
    confidence.city = 0.5;
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
 * @deprecated This function now always returns true.
 * Users can upload images anytime - no gating required.
 * The model decides flow naturally through conversation.
 *
 * Kept for backwards compatibility but will be removed.
 * @see /docs/philosophy/agent-philosophy.md
 */
export function checkReadyForImages(
  _state: Partial<SharedProjectState>
): boolean {
  // PHILOSOPHY: Users can upload images whenever they want.
  // The old word-count and material-count gates were artificial friction.
  // The model handles conversation flow naturally.
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
 * Trade-agnostic: Uses TradeConfig for valid project types.
 */
export function normalizeProjectType(type: string): ProjectType {
  const tradeConfig = getTradeConfig();
  const validTypes = getValidProjectTypes(tradeConfig);
  const normalized = type.toLowerCase().replace(/\s+/g, '-');

  // Check if it's already a valid type
  if (validTypes.includes(normalized)) {
    return normalized;
  }

  // Try to find best match from trade config project types
  // Look for significant word matches (words > 4 chars)
  for (const projectType of tradeConfig.terminology.projectTypes) {
    const slug = projectType.toLowerCase().replace(/\s+/g, '-');
    const words = projectType.toLowerCase().split(/\s+/);

    // Check if any significant word matches
    for (const word of words) {
      if (word.length > 4 && normalized.includes(word)) {
        return slug;
      }
    }
  }

  // If still no match, try partial slug matching
  for (const validType of validTypes) {
    // If the normalized input contains a key part of a valid type
    const typeParts = validType.split('-');
    if (typeParts.some((part) => part.length > 3 && normalized.includes(part))) {
      return validType;
    }
  }

  return 'other';
}

/**
 * Get list of fields that are still empty.
 *
 * NOTE: This is informational only, not for gating.
 * The model decides what information is needed via conversation.
 *
 * @see /docs/philosophy/agent-philosophy.md
 */
export function getMissingFields(
  state: Partial<SharedProjectState>
): string[] {
  const missing: string[] = [];

  // Simple presence checks - no word count requirements
  if (!state.projectType) {
    missing.push('projectType');
  }

  if (!state.customerProblem) {
    missing.push('customerProblem');
  }

  if (!state.solutionApproach) {
    missing.push('solutionApproach');
  }

  if (!state.materials?.length) {
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
