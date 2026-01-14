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
import { withCircuitBreaker } from '@/lib/agents/circuit-breaker';
import { formatProjectLocation } from '@/lib/utils/location';
import { getTradeConfig } from '@/lib/trades/config';
import { logger } from '@/lib/logging';
import type { SharedProjectState, StoryExtractionResult } from './types';
import { buildTechniqueTerms, separateMaterialsAndTechniques } from './story-extractor/dedupe';
import { extractWithoutAI, checkReadyForImages, normalizeProjectType } from './story-extractor/fallback';
import { parseLocationString } from './story-extractor/location';
import { buildExtractionSystemPrompt } from './story-extractor/prompt';

// ============================================================================
// Philosophy: Let the Model Be Agentic
// ============================================================================
//
// REMOVED artificial gates that second-guess the model:
// - MIN_PROBLEM_WORDS, MIN_SOLUTION_WORDS (model knows when content is sufficient)
// - MIN_MATERIALS_FOR_IMAGES (users can upload images whenever they want)
// - Per-field confidence scores (model expresses uncertainty naturally in conversation)
//
// The extraction agent extracts what it finds. It does NOT gate or block.
// The chat agent decides when to ask for clarification based on context.
// A single overall confidence score indicates extraction quality.
//
// @see /docs/philosophy/agent-philosophy.md
// ============================================================================

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

  /** Overall confidence in the extraction quality (0-1) */
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('Overall confidence in extraction quality: 1.0 = clear and explicit, 0.5 = some ambiguity, 0.2 = very vague'),
});

type ExtractionOutput = z.infer<typeof ExtractionSchema>;

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
    logger.error('[StoryExtractor] AI extraction failed', { error });
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

  // Wrap AI call with circuit breaker for resilience
  // @see /docs/philosophy/operational-excellence.md - Resilience Strategy
  const { output: object } = await withCircuitBreaker('story-extractor', async () => {
    return generateText({
      model: google(AI_MODELS.generation),
      output: Output.object({ schema: ExtractionSchema }),
      system: systemPrompt,
      prompt: contextPrompt,
      maxOutputTokens: 2048, // Increased from 1000 - structured response needs room for all fields
      temperature: 0.2, // Low temperature for consistent extraction
    });
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
// Extraction Processing
// ============================================================================

/**
 * Process extraction output into StoryExtractionResult.
 * Handles merging and readiness checks.
 *
 * Simplified: Uses a single overall confidence score instead of per-field scores.
 * The model expresses uncertainty naturally in conversation, not via scores.
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

  const needsClarification: string[] = [];

  // Process each field - no gating, just extract what's there
  // The model will naturally ask for clarification in conversation if needed
  if (extraction.projectType) {
    state.projectType = normalizeProjectType(extraction.projectType);
  }

  if (extraction.customerProblem) {
    state.customerProblem = extraction.customerProblem;
  }

  if (extraction.solutionApproach) {
    state.solutionApproach = extraction.solutionApproach;
  }

  // Merge arrays (don't overwrite, add new items)
  let rawMaterials: string[] = existingState?.materials || [];
  let rawTechniques: string[] = existingState?.techniques || [];

  if (extraction.materials && extraction.materials.length > 0) {
    const newMaterials = extraction.materials.filter(
      (m) => !rawMaterials.some((existing) => existing.toLowerCase() === m.toLowerCase())
    );
    rawMaterials = [...rawMaterials, ...newMaterials];
  }

  if (extraction.techniques && extraction.techniques.length > 0) {
    const newTechniques = extraction.techniques.filter(
      (t) => !rawTechniques.some((existing) => existing.toLowerCase() === t.toLowerCase())
    );
    rawTechniques = [...rawTechniques, ...newTechniques];
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
  }

  if (extraction.city) {
    state.city = extraction.city.trim();
  }

  if (extraction.state) {
    state.state = extraction.state.trim();
  }

  if (!state.location && (state.city || state.state)) {
    state.location = formatProjectLocation({ city: state.city, state: state.state }) || state.location;
  }

  if (extraction.duration) {
    state.duration = extraction.duration;
  }

  if (extraction.proudOf) {
    state.proudOf = extraction.proudOf;
  }

  // Calculate readiness
  const readyForImages = checkReadyForImages(state);

  // Use overall confidence (simplified from per-field scoring)
  const overallConfidence = extraction.confidence ?? 0.8;

  return {
    state,
    needsClarification,
    confidence: { overall: overallConfidence },
    readyForImages,
  };
}

export {
  checkReadyForImages,
  countWords,
  getExtractionProgress,
  getMissingFields,
  normalizeProjectType,
} from './story-extractor/fallback';

export type { ProjectType } from './story-extractor/shared-types';
