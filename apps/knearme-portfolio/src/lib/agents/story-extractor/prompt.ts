import { buildTradeContext, type TradeConfig } from '@/lib/trades/config';

/**
 * Get valid project types from trade config.
 * Converts display names to URL-friendly slugs (e.g., "kitchen remodel" → "kitchen-remodel").
 */
export function getValidProjectTypes(config: TradeConfig): string[] {
  const slugs = config.terminology.projectTypes.map((type) =>
    type.toLowerCase().replace(/\s+/g, '-')
  );
  if (!slugs.includes('other')) {
    slugs.push('other');
  }
  return slugs;
}

/**
 * Build the extraction system prompt with trade-specific vocabulary.
 * Trade-agnostic: Uses TradeConfig to inject project types, materials, and techniques.
 *
 * @param config - Trade configuration
 * @returns System prompt string
 */
export function buildExtractionSystemPrompt(config: TradeConfig): string {
  const projectTypesSection = config.terminology.projectTypes
    .map((type) => `- ${type.toLowerCase().replace(/\s+/g, '-')}: ${type}`)
    .join('\n');

  const materialsExamples = config.terminology.materials.slice(0, 8).join(', ');
  const techniquesExamples = config.terminology.techniques.slice(0, 8).join(', ');

  return `You are a data extraction agent for a business portfolio system.

Your job is to extract structured project information from natural conversation with business owners.

## Trade Context
${buildTradeContext(config)}

## Extraction Rules
1. Extract ONLY information that is explicitly stated—never infer or guess
2. Preserve the business owner's voice and specific details
3. Return a single overall confidence score reflecting extraction quality

## Overall Confidence Score
Rate the overall quality of what you extracted:
- **1.0**: All information clearly and explicitly stated
- **0.8**: Most information clear with minor ambiguity
- **0.6**: Some useful information but parts are vague
- **0.4**: Limited information, significant uncertainty
- **0.2**: Very little extractable, mostly unclear

## Project Types (use exact slugs)
${projectTypesSection}
- other: Anything that doesn't fit above

## Field Definitions

**customerProblem**: WHY the customer called (the issue/need)
**solutionApproach**: HOW the business owner solved it
**materials**: Physical substances (${materialsExamples})
**techniques**: Methods/processes (${techniquesExamples})
**location**: City and state when mentioned

## Clarity Guidelines
- Prefer specific terms over generic ones
- Keep materials and techniques distinct
- Avoid duplicates across lists`;
}
