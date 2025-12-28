/**
 * Quality Checker Agent
 *
 * Validates that a project meets all publish requirements and provides
 * actionable feedback for missing or incomplete fields.
 *
 * This is a pure logic agent - no AI calls needed. It checks the shared
 * project state against defined requirements and recommendations.
 *
 * @see /docs/09-agent/multi-agent-architecture.md
 * @see /src/lib/agents/types.ts for PUBLISH_REQUIREMENTS and PUBLISH_RECOMMENDATIONS
 */

import type { SharedProjectState, QualityCheckResult } from './types';
import { PUBLISH_REQUIREMENTS, PUBLISH_RECOMMENDATIONS } from './types';

/**
 * Maps field names to user-friendly suggestions for how to fix them.
 */
const FIELD_SUGGESTIONS: Record<string, string> = {
  title: 'Add a compelling project title that describes your work',
  project_type: 'Select the type of masonry project (e.g., chimney rebuild, tuckpointing)',
  project_type_slug: 'Re-save the project type so the slug can be generated',
  city: 'Add the city where this project was completed',
  state: 'Add the state/province where this project was completed',
  hero_image: 'Select a hero image to showcase your best work',
  images: 'Upload at least one photo of your project',
  description_length: 'Consider expanding the description to 200+ words for better SEO',
  materials: 'Add the materials used (helps homeowners find relevant projects)',
  tags: 'Add tags to help categorize this project',
  seo_metadata: 'Add SEO title and description for better search visibility',
};

/**
 * Counts words in a string, handling edge cases.
 */
function countWords(text: string | undefined): number {
  if (!text) return 0;
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

/**
 * Maps SharedProjectState field names to the publish requirement field names.
 * The state uses camelCase but requirements use snake_case to match DB columns.
 */
function getFieldValue(
  state: SharedProjectState,
  field: string
): string | undefined {
  switch (field) {
    case 'title':
      return state.title;
    case 'project_type':
      return state.projectType;
    case 'project_type_slug':
      return state.projectTypeSlug;
    case 'city':
      return state.city;
    case 'state':
      return state.state;
    default:
      return undefined;
  }
}

/**
 * Check if a field has a valid value (non-empty string).
 */
function hasValue(value: string | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validates a project against publish requirements and recommendations.
 *
 * @param state - The shared project state to validate
 * @returns QualityCheckResult with ready status, missing fields, warnings, and suggestions
 *
 * @example
 * ```typescript
 * const result = checkQuality(projectState);
 * if (!result.ready) {
 *   console.log('Missing:', result.missing);
 *   console.log('Suggestions:', result.suggestions);
 * }
 * ```
 */
export function checkQuality(state: SharedProjectState): QualityCheckResult {
  const missing: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // ---------------------------------------------------------------------------
  // Check hard requirements (blocking)
  // ---------------------------------------------------------------------------

  // Check required fields
  for (const field of PUBLISH_REQUIREMENTS.required) {
    const value = getFieldValue(state, field);
    if (!hasValue(value)) {
      missing.push(field);
      const suggestion = FIELD_SUGGESTIONS[field];
      if (suggestion) {
        suggestions.push(suggestion);
      }
    }
  }

  // Check minimum images
  if (state.images.length < PUBLISH_REQUIREMENTS.minImages) {
    missing.push('images');
    const imagesSuggestion = FIELD_SUGGESTIONS['images'];
    if (imagesSuggestion) suggestions.push(imagesSuggestion);
  }

  // Check hero image requirement
  if (PUBLISH_REQUIREMENTS.requireHeroImage) {
    const hasHeroImage =
      state.heroImageId &&
      state.images.some((img) => img.id === state.heroImageId);
    if (!hasHeroImage) {
      missing.push('hero_image');
      const heroSuggestion = FIELD_SUGGESTIONS['hero_image'];
      if (heroSuggestion) suggestions.push(heroSuggestion);
    }
  }

  // ---------------------------------------------------------------------------
  // Check recommendations (non-blocking warnings)
  // ---------------------------------------------------------------------------

  // Check description length
  const wordCount = countWords(state.description);
  if (wordCount < PUBLISH_RECOMMENDATIONS.minDescriptionWords) {
    warnings.push(
      `Description is ${wordCount} words (recommended: ${PUBLISH_RECOMMENDATIONS.minDescriptionWords}+)`
    );
    const descSuggestion = FIELD_SUGGESTIONS['description_length'];
    if (descSuggestion) suggestions.push(descSuggestion);
  }

  // Check materials count
  if (state.materials.length < PUBLISH_RECOMMENDATIONS.minMaterials) {
    warnings.push(
      `Only ${state.materials.length} material(s) listed (recommended: ${PUBLISH_RECOMMENDATIONS.minMaterials}+)`
    );
    const matSuggestion = FIELD_SUGGESTIONS['materials'];
    if (matSuggestion) suggestions.push(matSuggestion);
  }

  // Check tags
  if (PUBLISH_RECOMMENDATIONS.hasTags && state.tags.length === 0) {
    warnings.push('No tags added');
    const tagsSuggestion = FIELD_SUGGESTIONS['tags'];
    if (tagsSuggestion) suggestions.push(tagsSuggestion);
  }

  // Check SEO metadata
  if (PUBLISH_RECOMMENDATIONS.hasSeoMetadata) {
    const hasSeoTitle = hasValue(state.seoTitle);
    const hasSeoDescription = hasValue(state.seoDescription);
    if (!hasSeoTitle || !hasSeoDescription) {
      warnings.push('SEO metadata incomplete');
      const seoSuggestion = FIELD_SUGGESTIONS['seo_metadata'];
      if (seoSuggestion) suggestions.push(seoSuggestion);
    }
  }

  // ---------------------------------------------------------------------------
  // Determine overall readiness
  // ---------------------------------------------------------------------------

  const ready = missing.length === 0;

  return {
    ready,
    missing,
    warnings,
    suggestions,
  };
}

/**
 * Returns a human-readable summary of the quality check result.
 * Useful for displaying to contractors in the UI.
 */
export function formatQualityCheckSummary(result: QualityCheckResult): string {
  if (result.ready && result.warnings.length === 0) {
    return 'Your project is ready to publish!';
  }

  if (result.ready && result.warnings.length > 0) {
    return `Your project can be published, but consider these improvements: ${result.warnings.length} recommendation(s).`;
  }

  return `Your project needs ${result.missing.length} required field(s) before publishing.`;
}

/**
 * Returns the most critical issue to address first.
 * Useful for guiding the conversation flow.
 */
export function getTopPriority(result: QualityCheckResult): string | null {
  // Required items first
  if (result.missing.includes('images')) {
    return 'images';
  }
  if (result.missing.includes('hero_image')) {
    return 'hero_image';
  }
  if (result.missing.includes('title')) {
    return 'title';
  }
  if (result.missing.includes('project_type')) {
    return 'project_type';
  }
  if (result.missing.includes('project_type_slug')) {
    return 'project_type_slug';
  }
  if (result.missing.includes('city')) {
    return 'city';
  }
  if (result.missing.includes('state')) {
    return 'state';
  }

  // Then warnings (in order of SEO impact)
  if (result.warnings.some((w) => w.includes('Description'))) {
    return 'description_length';
  }
  if (result.warnings.some((w) => w.includes('SEO'))) {
    return 'seo_metadata';
  }

  return null;
}
