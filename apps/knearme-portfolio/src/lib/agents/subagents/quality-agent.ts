/**
 * Quality Agent Subagent
 *
 * Handles contextual quality assessment and advisory suggestions.
 * CRITICAL: This agent is ADVISORY ONLY - it NEVER blocks publishing.
 * The user always has the final say with "publish anyway".
 *
 * Expertise:
 * - Contextual quality assessment (not fixed checklists)
 * - Business-appropriate standards
 * - Advisory suggestions
 * - Publish readiness evaluation
 *
 * Philosophy:
 * - No fixed word count requirements
 * - No mandatory field checklists
 * - Standards adapt to business type
 * - Always allow "publish anyway"
 *
 * @see /todo/ai-sdk-phase-10-persona-agents.md
 * @see /docs/philosophy/agent-philosophy.md
 */

import { z } from 'zod';
import type { SubagentContext, QualityAgentResult } from './types';
import { groupImagesByType } from '../types';

// ============================================================================
// Schema
// ============================================================================

/**
 * Zod schema for Quality Agent structured output.
 */
export const QUALITY_AGENT_SCHEMA = z.object({
  // Assessment
  assessment: z.object({
    ready: z
      .boolean()
      .describe('Whether the portfolio is ready to publish'),
    confidence: z
      .enum(['high', 'medium', 'low'])
      .describe('Confidence in the assessment'),
    checksPerformed: z
      .array(z.string())
      .describe('What was evaluated'),
  }),

  // Suggestions (advisory only)
  suggestions: z
    .array(
      z.object({
        area: z.string().describe('What area to improve'),
        suggestion: z.string().describe('Specific suggestion'),
        priority: z.enum(['high', 'medium', 'low']).describe('Importance'),
        reason: z.string().optional().describe('Why this matters for this business'),
      })
    )
    .describe('Advisory suggestions (never blocking)'),

  // Summary
  summaryMessage: z
    .string()
    .describe('Human-friendly summary of the assessment'),

  // Confidence
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('Overall confidence in assessment (0-1)'),
});

// ============================================================================
// System Prompt
// ============================================================================

/**
 * System prompt for the Quality Agent.
 *
 * Philosophy:
 * - Contextual, not checklist-based
 * - Advisory, never blocking
 * - Adapts to business type
 * - Respects user autonomy
 */
export const QUALITY_AGENT_PROMPT = `You are the Quality Agent, a specialist in contextual portfolio assessment.

## Your Persona

I assess if the portfolio represents the work well.
My standards adapt to this business type. I advise, I don't block.

## Core Principles

1. **ADVISORY ONLY** - Your suggestions are recommendations, not requirements
2. **CONTEXTUAL** - Standards depend on the business type, not fixed rules
3. **USER AUTONOMY** - Always respect "publish anyway" - the user has final say
4. **NO GATEKEEPING** - Never say "you can't publish until..."

## Contextual Assessment

Different businesses have different needs:

| Business Type | Quality Questions |
|---------------|-------------------|
| Masonry contractor | Does the before/after show transformation? Is craftsmanship visible? |
| Kitchen remodeler | Can we see the full scope? Are materials highlighted? |
| Furniture maker | Does the craftsmanship come through? Is the grain visible? |
| Photographer | Is the style clear? Do we show range? |
| Event planner | Can we feel the experience? Are details captured? |
| General contractor | Is the scope clear? Are multiple skills shown? |

## What to Evaluate

Consider (but don't require):
- Does the story make sense for this type of work?
- Do the images support the narrative?
- Would a potential customer understand the value?
- Is there enough context for SEO discoverability?
- Does it feel authentic to the business?

## What NOT to Do

❌ Don't require specific word counts
❌ Don't mandate specific fields
❌ Don't block on missing images
❌ Don't impose your standards over user intent
❌ Don't say "you need to add X before publishing"

## How to Assess

Instead of "missing: title", say:
"A title would help customers find this project, but you can publish without one if you prefer."

Instead of "too short", say:
"Adding more detail about [specific aspect] could help showcase your work, but the current content tells the story."

## Suggestion Priority

- **high**: Would significantly improve discoverability or customer trust
- **medium**: Would enhance the presentation
- **low**: Nice to have, minor improvement

## Output Format

Return structured JSON:
- \`assessment\`: ready (always consider true unless major issues), confidence, checksPerformed
- \`suggestions\`: Array of advisory suggestions with area, suggestion, priority, reason
- \`summaryMessage\`: Friendly summary for the user
- \`confidence\`: Your confidence in the assessment (0-1)

## Example Responses

### Portfolio looks great:
{
  "assessment": {
    "ready": true,
    "confidence": "high",
    "checksPerformed": ["story coherence", "image quality", "discoverability"]
  },
  "suggestions": [],
  "summaryMessage": "This portfolio showcases your work beautifully. The before/after tells a clear story, and the materials detail adds credibility. Ready to publish!",
  "confidence": 0.95
}

### Portfolio could use improvement:
{
  "assessment": {
    "ready": true,
    "confidence": "medium",
    "checksPerformed": ["story coherence", "discoverability", "customer trust"]
  },
  "suggestions": [
    {
      "area": "location",
      "suggestion": "Adding the city would help local customers find you",
      "priority": "medium",
      "reason": "Masonry work is local - customers search by area"
    },
    {
      "area": "before image",
      "suggestion": "A before photo would make the transformation more impactful",
      "priority": "low",
      "reason": "Shows the scope of work you did"
    }
  ],
  "summaryMessage": "Your portfolio is ready to publish! I have a couple suggestions that could boost discoverability, but they're optional. The work looks great.",
  "confidence": 0.8
}`;

// ============================================================================
// Context Builder
// ============================================================================

/**
 * Build the user prompt from SubagentContext for the Quality Agent.
 *
 * Formats the project state, content, and business context
 * for contextual assessment.
 */
export function buildQualityAgentContext(context: SubagentContext): string {
  const sections: string[] = [];
  const state = context.projectState;

  // Business context (important for contextual assessment)
  sections.push('## Business Context\n');
  if (context.businessContext) {
    if (context.businessContext.name) sections.push(`Business: ${context.businessContext.name}`);
    if (context.businessContext.type) sections.push(`Type: ${context.businessContext.type}`);
    if (context.businessContext.voice) sections.push(`Voice: ${context.businessContext.voice}`);
  } else {
    sections.push('(No business context provided - use project type to infer)');
  }

  // Project content for assessment
  sections.push('\n## Project Content\n');

  const contentFields: string[] = [];
  if (state.title) contentFields.push(`Title: "${state.title}"`);
  if (state.projectType) contentFields.push(`Type: ${state.projectType}`);
  if (state.customerProblem) contentFields.push(`Problem: ${state.customerProblem}`);
  if (state.solutionApproach) contentFields.push(`Solution: ${state.solutionApproach}`);
  if (state.description) {
    const wordCount = state.description.split(/\s+/).filter(Boolean).length;
    contentFields.push(`Description: ${wordCount} words`);
    contentFields.push(`Preview: "${state.description.slice(0, 200)}..."`);
  }
  if (state.materials.length > 0) {
    contentFields.push(`Materials: ${state.materials.length} listed (${state.materials.slice(0, 3).join(', ')}${state.materials.length > 3 ? '...' : ''})`);
  }
  if (state.techniques.length > 0) {
    contentFields.push(`Techniques: ${state.techniques.length} listed`);
  }
  if (state.city || state.state) {
    contentFields.push(`Location: ${[state.city, state.state].filter(Boolean).join(', ')}`);
  }
  if (state.duration) contentFields.push(`Duration: ${state.duration}`);
  if (state.proudOf) contentFields.push(`Proud of: "${state.proudOf.slice(0, 100)}..."`);
  if (state.tags.length > 0) contentFields.push(`Tags: ${state.tags.join(', ')}`);

  if (contentFields.length > 0) {
    sections.push(contentFields.join('\n'));
  } else {
    sections.push('(No content yet)');
  }

  // SEO metadata
  sections.push('\n## SEO Metadata\n');
  if (state.seoTitle) sections.push(`SEO Title: "${state.seoTitle}"`);
  if (state.seoDescription) sections.push(`SEO Description: "${state.seoDescription}"`);
  if (!state.seoTitle && !state.seoDescription) {
    sections.push('(No SEO metadata)');
  }

  // Images
  sections.push('\n## Images\n');
  if (state.images.length > 0) {
    const { byType, total } = groupImagesByType(state.images);

    sections.push(`Total: ${total} image(s)`);
    Object.entries(byType).forEach(([type, { count }]) => {
      sections.push(`- ${type}: ${count}`);
    });

    if (state.heroImageId) {
      sections.push(`Hero selected: Yes`);
    } else {
      sections.push(`Hero selected: No`);
    }
  } else {
    sections.push('(No images uploaded)');
  }

  // Current state flags
  sections.push('\n## Current Status\n');
  sections.push(`Ready for images: ${state.readyForImages}`);
  sections.push(`Ready for content: ${state.readyForContent}`);
  sections.push(`Ready to publish: ${state.readyToPublish}`);

  // Instructions
  sections.push('\n## Your Task\n');
  sections.push('Assess this portfolio contextually based on the business type.');
  sections.push('Provide advisory suggestions, not requirements.');
  sections.push('Remember: You advise, you never block. The user decides.');
  sections.push('Set assessment.ready to true unless there are truly major issues.');

  return sections.join('\n');
}

// ============================================================================
// Type Assertion Helper
// ============================================================================

/**
 * Type guard to check if a result is a valid QualityAgentResult.
 * Checks for required schema fields: confidence + Quality-specific fields.
 */
export function isQualityAgentResult(result: unknown): result is QualityAgentResult {
  if (!result || typeof result !== 'object') return false;

  const r = result as Record<string, unknown>;
  return typeof r.confidence === 'number' && 'assessment' in r && 'suggestions' in r && 'summaryMessage' in r;
}
