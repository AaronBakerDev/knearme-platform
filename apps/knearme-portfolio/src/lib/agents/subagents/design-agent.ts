/**
 * Design Agent Subagent
 *
 * Handles layout composition, design tokens, and visual presentation.
 * Chooses from curated design options to create portfolio layouts
 * that let the work shine.
 *
 * Expertise:
 * - Design token selection (not arbitrary CSS)
 * - Layout composition (semantic blocks)
 * - Hero image selection
 * - Preview generation
 * - Design refinement from feedback
 *
 * Outputs:
 * - designTokens: Layout, spacing, typography, colors, image display
 * - blocks: Semantic content blocks in display order
 * - rationale: Why these choices
 * - heroImageId: Selected hero image
 *
 * Philosophy: Pick from curated options, preventing "MySpace syndrome".
 * The work is the star, not the design.
 *
 * @see /todo/ai-sdk-phase-10-persona-agents.md
 * @see /src/lib/design/tokens.ts
 */

import { z } from 'zod';
import type { SubagentContext, DesignAgentResult } from './types';
import { groupImagesByType } from '../types';

// ============================================================================
// Schema
// ============================================================================

/**
 * Zod schema for Design Agent structured output.
 */
export const DESIGN_AGENT_SCHEMA = z.object({
  // Design tokens
  designTokens: z
    .object({
      layout: z
        .enum(['hero-gallery', 'split-image', 'masonry-grid', 'full-bleed', 'cards'])
        .describe('Overall layout approach'),
      spacing: z
        .enum(['compact', 'comfortable', 'spacious'])
        .describe('Whitespace and padding'),
      typography: z.object({
        headingStyle: z
          .enum(['bold', 'elegant', 'industrial', 'warm'])
          .describe('Heading character'),
        bodySize: z
          .enum(['sm', 'base', 'lg'])
          .describe('Body text size'),
      }),
      colors: z.object({
        accent: z
          .enum(['primary', 'earth', 'slate', 'copper', 'forest'])
          .describe('Accent color family'),
        background: z
          .enum(['light', 'warm', 'dark'])
          .describe('Background treatment'),
      }),
      imageDisplay: z
        .enum(['rounded', 'sharp', 'shadowed', 'framed'])
        .describe('Image presentation style'),
      heroStyle: z
        .enum(['large-single', 'grid-3', 'side-by-side', 'carousel'])
        .describe('Hero section layout'),
    })
    .describe('Design tokens defining visual treatment'),

  // Semantic blocks
  blocks: z
    .array(
      z.object({
        type: z.string().describe('Block type (hero-section, paragraph, stats, etc.)'),
        // Additional fields vary by type, kept flexible
      }).passthrough()
    )
    .describe('Ordered semantic content blocks'),

  // Rationale
  rationale: z
    .string()
    .describe('Brief explanation of design choices (1-2 sentences)'),

  // Hero selection
  heroImageId: z
    .string()
    .optional()
    .describe('Selected hero image ID'),

  // Confidence
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('Confidence in layout appropriateness (0-1)'),
});

// ============================================================================
// System Prompt
// ============================================================================

/**
 * System prompt for the Design Agent.
 *
 * Philosophy:
 * - The work is the star, not the design
 * - Pick from curated options (guardrails)
 * - Let the project's character guide choices
 * - Support iterative refinement
 */
export const DESIGN_AGENT_PROMPT = `You are the Design Agent, a specialist in composing visual portfolios for business projects.

## Your Persona

I compose visual presentations that let the work shine.
I pick from curated options, not arbitrary CSS. I respond to the project's character.

## Your Expertise

1. **Design Token Selection** - Choose from curated options that work together
2. **Layout Composition** - Arrange semantic blocks to tell the story visually
3. **Hero Selection** - Pick the image that best represents the project
4. **Iterative Refinement** - Adjust based on user feedback while maintaining coherence

## Design Token Options

### Layout
| Token | Best For |
|-------|----------|
| hero-gallery | Visual projects with standout images |
| split-image | Detailed work, before/after focus |
| masonry-grid | Many images of equal importance |
| full-bleed | Dramatic single-image impact |
| cards | Multiple distinct aspects to highlight |

### Spacing
- compact: Dense information, technical projects
- comfortable: Default, balanced presentation
- spacious: Premium feel, fewer elements

### Typography
| Heading Style | Character |
|---------------|-----------|
| bold | Dramatic, confident, modern |
| elegant | Refined, sophisticated, timeless |
| industrial | Technical, no-nonsense, professional |
| warm | Friendly, approachable, personal |

Body Size: sm (dense), base (standard), lg (accessible)

### Colors
| Accent | Association |
|--------|-------------|
| primary | Brand, neutral |
| earth | Traditional masonry, natural materials |
| slate | Professional, modern |
| copper | Metallic warmth, craftsmanship |
| forest | Natural, outdoor work |

Background: light (clean), warm (cozy cream), dark (dramatic)

### Image Display
- rounded: Approachable, friendly
- sharp: Precise, technical
- shadowed: Depth, separation
- framed: Gallery-like, premium

### Hero Style
- large-single: One standout image
- grid-3: Multiple highlights
- side-by-side: Before/after comparison
- carousel: Many images to browse

## Semantic Block Types

| Block Type | Purpose |
|------------|---------|
| hero-section | Lead images with title |
| before-after | Transformation showcase |
| paragraph | Body text (2-4 sentences) |
| heading | Section headers (level 2 or 3) |
| list | Bullet or numbered items |
| callout | Highlighted info (tip, info, warning) |
| stats | Key metrics (label + value pairs) |
| image-gallery | Additional photos |
| testimonial | Customer quote |
| materials-list | Materials showcase |
| process-step | Workflow step with optional image |
| cta-section | Call-to-action |
| divider | Visual separation |

## Layout Principles

1. **Start strong** - Hero section or before-after first
2. **Tell the story** - Problem → solution flow
3. **Provide specifics** - Stats, materials, techniques
4. **End with impact** - Proud moment, gallery, or CTA

## Selection Guidelines

Match tokens to project character:

| Project Character | Token Suggestions |
|-------------------|-------------------|
| Historic restoration | elegant headings, earth accent, framed images |
| Modern construction | bold headings, slate accent, sharp images |
| Outdoor/landscape | warm headings, forest accent, rounded images |
| Technical/industrial | industrial headings, copper accent, shadowed images |

## Block Composition Examples

### Example 1: Before/After Transformation (Masonry Restoration)
\`\`\`json
{
  "blocks": [
    { "type": "before-after", "beforeId": "img-1", "afterId": "img-2", "caption": "100-year-old chimney restored to original glory" },
    { "type": "heading", "level": 2, "text": "The Challenge" },
    { "type": "paragraph", "text": "Years of Colorado winters had..." },
    { "type": "stats", "items": [{ "label": "Bricks replaced", "value": "340" }, { "label": "Project duration", "value": "5 days" }] },
    { "type": "materials-list", "items": ["Reclaimed Denver brick", "Type S mortar"] },
    { "type": "testimonial", "quote": "Looks better than when the house was built", "attribution": "Homeowner" }
  ]
}
\`\`\`

### Example 2: Process Story (Kitchen Remodel)
\`\`\`json
{
  "blocks": [
    { "type": "hero-section", "imageIds": ["img-1", "img-2", "img-3"], "title": "Modern Kitchen Transformation" },
    { "type": "paragraph", "text": "The original 1970s galley kitchen felt cramped..." },
    { "type": "heading", "level": 3, "text": "Design Decisions" },
    { "type": "list", "style": "bullet", "items": ["Opened wall to dining room", "Added island with seating", "Custom pantry storage"] },
    { "type": "image-gallery", "imageIds": ["img-4", "img-5"], "caption": "Custom cabinetry details" },
    { "type": "callout", "variant": "info", "text": "The original oak cabinets were refinished, saving 60% vs. replacement" }
  ]
}
\`\`\`

### Example 3: Minimal Portfolio (Limited Images)
\`\`\`json
{
  "blocks": [
    { "type": "hero-section", "imageIds": ["img-1"], "title": "Deck Restoration" },
    { "type": "paragraph", "text": "This 15-year-old cedar deck needed attention..." },
    { "type": "stats", "items": [{ "label": "Deck size", "value": "400 sq ft" }, { "label": "Completed", "value": "2 days" }] },
    { "type": "cta-section", "text": "Ready to restore your deck?", "buttonText": "Get a Quote" }
  ]
}
\`\`\`

## Handling Feedback

When the user provides feedback:
1. Identify what they want to change
2. Adjust those elements while maintaining coherence
3. Explain your changes in the rationale

## Output Format

Return structured JSON matching the schema:
- \`designTokens\`: Your token selections
- \`blocks\`: Ordered array of semantic blocks
- \`rationale\`: Brief explanation of choices
- \`heroImageId\`: Selected hero image
- \`confidence\`: How well this fits the project (0-1)`;

// ============================================================================
// Context Builder
// ============================================================================

/**
 * Build the user prompt from SubagentContext for the Design Agent.
 *
 * Formats the project state, content, images, and any feedback
 * into a prompt the Design Agent can process.
 */
export function buildDesignAgentContext(context: SubagentContext): string {
  const sections: string[] = [];
  const state = context.projectState;

  // Project content
  sections.push('## Project Content\n');
  if (state.title) sections.push(`Title: ${state.title}`);
  if (state.projectType) sections.push(`Type: ${state.projectType}`);
  if (state.customerProblem) sections.push(`Problem: ${state.customerProblem}`);
  if (state.solutionApproach) sections.push(`Solution: ${state.solutionApproach}`);
  if (state.description) sections.push(`Description: ${state.description.slice(0, 500)}...`);
  if (state.materials.length > 0) sections.push(`Materials: ${state.materials.join(', ')}`);
  if (state.techniques.length > 0) sections.push(`Techniques: ${state.techniques.join(', ')}`);
  if (state.duration) sections.push(`Duration: ${state.duration}`);
  if (state.proudOf) sections.push(`Proud of: ${state.proudOf}`);
  if (state.city && state.state) {
    sections.push(`Location: ${state.city}, ${state.state}`);
  }
  if (state.tags.length > 0) sections.push(`Tags: ${state.tags.join(', ')}`);

  // Images
  if (state.images.length > 0) {
    const { byType, total } = groupImagesByType(state.images);
    sections.push('\n## Available Images\n');
    sections.push(`${total} image(s):`);

    Object.entries(byType).forEach(([type, { count, ids }]) => {
      sections.push(`- ${type}: ${count} image(s) [${ids.join(', ')}]`);
    });

    if (state.heroImageId) {
      sections.push(`\nCurrent hero: ${state.heroImageId}`);
    }
  } else {
    sections.push('\n## Images\n(No images uploaded yet)');
  }

  // Business context
  if (context.businessContext) {
    sections.push('\n## Business Context\n');
    if (context.businessContext.name) sections.push(`Business: ${context.businessContext.name}`);
    if (context.businessContext.type) sections.push(`Type: ${context.businessContext.type}`);
    if (context.businessContext.voice) sections.push(`Voice: ${context.businessContext.voice}`);
  }

  // Feedback for iteration
  if (context.feedback) {
    sections.push('\n## User Feedback\n');
    sections.push(context.feedback);
    sections.push('\nAdjust the layout based on this feedback while maintaining coherence.');
  }

  // Focus areas
  if (context.focusAreas && context.focusAreas.length > 0) {
    sections.push('\n## Focus Areas\n');
    sections.push(`Pay special attention to: ${context.focusAreas.join(', ')}`);
  }

  // Preserve elements
  if (context.preserveElements && context.preserveElements.length > 0) {
    sections.push('\n## Preserve These Elements\n');
    sections.push(`Keep unchanged: ${context.preserveElements.join(', ')}`);
  }

  // Instructions
  sections.push('\n## Your Task\n');
  sections.push('1. Select appropriate design tokens based on project character');
  sections.push('2. Compose semantic blocks to present the content effectively');
  sections.push('3. Select a hero image if images are available');
  sections.push('4. Explain your design choices briefly');

  return sections.join('\n');
}

// ============================================================================
// Type Assertion Helper
// ============================================================================

/**
 * Type guard to check if a result is a valid DesignAgentResult.
 * Checks for required schema fields: confidence + designTokens (the distinguishing field).
 */
export function isDesignAgentResult(result: unknown): result is DesignAgentResult {
  if (!result || typeof result !== 'object') return false;

  const r = result as Record<string, unknown>;
  // Check for confidence (required in all subagent results) AND designTokens (Design-specific)
  return typeof r.confidence === 'number' && 'designTokens' in r;
}
