import { formatProjectLocation } from '@/lib/utils/location';
import { getTradeConfig } from '@/lib/trades/config';
import type { SharedProjectState, StoryExtractionResult } from '../types';
import { buildTechniqueTerms, separateMaterialsAndTechniques } from './dedupe';
import { resolveLocationParts } from './location';
import { getValidProjectTypes } from './prompt';
import type { ProjectType } from './shared-types';

export function extractWithoutAI(
  message: string,
  existingState?: Partial<SharedProjectState>
): StoryExtractionResult {
  const tradeConfig = getTradeConfig();
  const validProjectTypes = getValidProjectTypes(tradeConfig);
  const techniqueTerms = buildTechniqueTerms(tradeConfig);

  const state: Partial<SharedProjectState> = { ...existingState };
  const confidence: Record<string, number> = {};
  const needsClarification: string[] = [];
  const lowerMessage = message.toLowerCase();

  for (const projectType of validProjectTypes) {
    const searchTerm = projectType.replace(/-/g, ' ');
    if (lowerMessage.includes(searchTerm)) {
      state.projectType = projectType;
      confidence.projectType = 0.7;
      break;
    }
  }

  if (!state.projectType) {
    for (const projectType of tradeConfig.terminology.projectTypes) {
      const words = projectType.toLowerCase().split(/\s+/);
      if (words.some((word) => word.length > 4 && lowerMessage.includes(word))) {
        state.projectType = projectType.toLowerCase().replace(/\s+/g, '-');
        confidence.projectType = 0.5;
        break;
      }
    }
  }

  const materialKeywords = tradeConfig.terminology.materials.map((m) => m.toLowerCase());
  const foundMaterials = materialKeywords.filter((m) =>
    lowerMessage.includes(m)
  );
  let rawMaterials: string[] = existingState?.materials || [];
  if (foundMaterials.length > 0) {
    rawMaterials = Array.from(new Set([...rawMaterials, ...foundMaterials]));
    confidence.materials = 0.6;
  }

  const techniqueKeywords = tradeConfig.terminology.techniques.map((t) => t.toLowerCase());
  const foundTechniques = techniqueKeywords.filter((t) =>
    lowerMessage.includes(t)
  );
  let rawTechniques: string[] = existingState?.techniques || [];
  if (foundTechniques.length > 0) {
    rawTechniques = Array.from(new Set([...rawTechniques, ...foundTechniques]));
    confidence.techniques = 0.6;
  }

  const { materials: cleanMaterials, techniques: cleanTechniques } =
    separateMaterialsAndTechniques(rawMaterials, rawTechniques, techniqueTerms);

  state.materials = cleanMaterials;
  state.techniques = cleanTechniques;

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
    state.location = formatProjectLocation({ city, state: stateCode }) || city;
    confidence.city = 0.5;
  }

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
  return true;
}

export function countWords(text?: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function normalizeProjectType(type: string): ProjectType {
  const tradeConfig = getTradeConfig();
  const validTypes = getValidProjectTypes(tradeConfig);
  const normalized = type.toLowerCase().replace(/\s+/g, '-');

  if (validTypes.includes(normalized)) {
    return normalized;
  }

  for (const projectType of tradeConfig.terminology.projectTypes) {
    const slug = projectType.toLowerCase().replace(/\s+/g, '-');
    const words = projectType.toLowerCase().split(/\s+/);

    for (const word of words) {
      if (word.length > 4 && normalized.includes(word)) {
        return slug;
      }
    }
  }

  for (const validType of validTypes) {
    const typeParts = validType.split('-');
    if (typeParts.some((part) => part.length > 3 && normalized.includes(part))) {
      return validType;
    }
  }

  return 'other';
}

export function getMissingFields(
  state: Partial<SharedProjectState>
): string[] {
  const missing: string[] = [];

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
