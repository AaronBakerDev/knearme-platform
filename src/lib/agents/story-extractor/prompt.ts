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
