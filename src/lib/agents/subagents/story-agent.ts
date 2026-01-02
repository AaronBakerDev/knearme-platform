/**
 * Story Agent Subagent
 *
 * Handles conversation, image analysis, and narrative extraction.
 * This is the primary agent for understanding the business owner's work
 * and extracting the story behind their projects.
 *
 * Expertise:
 * - Natural conversation (not scripted questions)
 * - Multimodal image understanding
 * - Narrative extraction
 * - Content writing in business voice
 * - Business context discovery
 *
 * Outputs:
 * - businessContext: Discovered business type, voice, vocabulary
 * - projectContent: Title, description, story
 * - imageAnalysis: What the images show, suggested organization
 *
 * @see /todo/ai-sdk-phase-10-persona-agents.md
 */

import { z } from 'zod';
import type { SubagentContext, StoryAgentResult } from './types';

// ============================================================================
// Schema
// ============================================================================

/**
 * Zod schema for Story Agent structured output.
 */
export const STORY_AGENT_SCHEMA = z.object({
  // State updates
  stateUpdates: z
    .object({
      projectType: z.string().optional(),
      customerProblem: z.string().optional(),
      solutionApproach: z.string().optional(),
      materials: z.array(z.string()).optional(),
      techniques: z.array(z.string()).optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      location: z.string().optional(),
      duration: z.string().optional(),
      proudOf: z.string().optional(),
    })
    .describe('Project state fields to update based on extracted information'),

  // Narrative output
  narrative: z
    .object({
      title: z.string().optional().describe('Compelling project title (60 chars max)'),
      description: z.string().optional().describe('Project description paragraph'),
      story: z.string().optional().describe('The full story of the project'),
    })
    .optional()
    .describe('Generated narrative content'),

  // Image analysis
  imageAnalysis: z
    .object({
      observations: z
        .array(z.string())
        .describe('What each image shows'),
      suggestedOrder: z
        .array(z.string())
        .optional()
        .describe('Suggested image display order (IDs)'),
      beforeAfterPairs: z
        .array(
          z.object({
            before: z.string(),
            after: z.string(),
          })
        )
        .optional()
        .describe('Detected before/after image pairs'),
      heroImageId: z
        .string()
        .optional()
        .describe('Recommended hero image ID'),
    })
    .optional()
    .describe('Analysis of uploaded images'),

  // Workflow signals
  checkpoint: z
    .enum(['images_uploaded', 'basic_info', 'story_complete'])
    .optional()
    .describe('Current progress checkpoint'),

  followUpQuestion: z
    .string()
    .optional()
    .describe('Question to ask user for more information'),

  // Confidence
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('Overall confidence in extraction (0-1)'),
});

// ============================================================================
// System Prompt
// ============================================================================

/**
 * System prompt for the Story Agent.
 *
 * Philosophy:
 * - Have a natural conversation, not a scripted interview
 * - Extract what's meaningful, not everything possible
 * - Preserve the business owner's voice and terminology
 * - See images directly (multimodal), categorize naturally
 */
export const STORY_AGENT_PROMPT = `You are the Story Agent, a specialist in understanding and extracting narratives from business conversations and project images.

## Your Persona

I'm having a conversation with someone who has work to show.
I listen, I see their images, I extract what matters, and I write in their voice.

## Your Expertise

1. **Natural Conversation** - Not scripted questions. Flow with what they tell you.
2. **Multimodal Understanding** - See images directly. Notice craftsmanship, before/after transformations, materials used.
3. **Narrative Extraction** - Find the story: the problem, the solution, what makes it special.
4. **Voice Preservation** - Write content that sounds like them, not generic marketing.
5. **Business Context** - Understand what kind of business this is without forcing categories.

## Extraction Guidelines

### What to Extract

| Field | What to Look For |
|-------|------------------|
| projectType | What kind of work was done (kitchen remodel, deck build, etc.) |
| customerProblem | Why did the customer need this work? What was wrong or desired? |
| solutionApproach | How was the problem solved? What approach was taken? |
| materials | Specific materials used (not generic - "Type S mortar" not just "mortar") |
| techniques | Methods applied (specific trade skills, not generic verbs) |
| city/state | Where the project was done |
| duration | How long it took |
| proudOf | What the business owner is most proud of |

### Extraction Rules

1. **Only extract what's explicitly stated** - Never infer or guess
2. **Preserve specificity** - "reclaimed Denver common brick" not "brick"
3. **Separate materials from techniques** - Materials are substances, techniques are methods
4. **Use their vocabulary** - Don't translate to marketing-speak

### Image Analysis

When images are provided:
1. Describe what you see objectively
2. Identify before/after pairs if present
3. Suggest which image would make the best hero
4. Note details that inform the story (materials visible, scale of work, etc.)

### Checkpoint Signals

Signal checkpoints to the orchestrator:
- \`images_uploaded\`: User has provided images
- \`basic_info\`: Core story elements extracted (type, problem, solution)
- \`story_complete\`: Enough information to generate polished content

### Follow-up Questions

Ask follow-ups when:
- Something important is vague or missing
- You see something interesting in images but don't know the context
- The story would benefit from one more detail

Keep questions conversational, not form-like:
- ✅ "I see some beautiful stonework in these photos - is this a repair or a new installation?"
- ❌ "Please specify the project type from the following options..."

## Output Format

Return structured JSON matching the schema. Include:
- \`stateUpdates\`: Fields extracted from the conversation
- \`narrative\`: If enough info, draft title/description
- \`imageAnalysis\`: If images provided, your observations
- \`checkpoint\`: Current progress indicator
- \`followUpQuestion\`: If you need more info
- \`confidence\`: Overall confidence (0-1)`;

// ============================================================================
// Context Builder
// ============================================================================

/**
 * Build the user prompt from SubagentContext for the Story Agent.
 *
 * Formats the project state, user message, and images into a prompt
 * the Story Agent can process.
 */
export function buildStoryAgentContext(context: SubagentContext): string {
  const sections: string[] = [];

  // Current project state
  sections.push('## Current Project State\n');
  const state = context.projectState;

  if (state.projectType) sections.push(`Project Type: ${state.projectType}`);
  if (state.customerProblem) sections.push(`Customer Problem: ${state.customerProblem}`);
  if (state.solutionApproach) sections.push(`Solution: ${state.solutionApproach}`);
  if (state.materials.length > 0) sections.push(`Materials: ${state.materials.join(', ')}`);
  if (state.techniques.length > 0) sections.push(`Techniques: ${state.techniques.join(', ')}`);
  if (state.city) sections.push(`City: ${state.city}`);
  if (state.state) sections.push(`State: ${state.state}`);
  if (state.duration) sections.push(`Duration: ${state.duration}`);
  if (state.proudOf) sections.push(`Proud of: ${state.proudOf}`);

  const hasAnyState =
    state.projectType ||
    state.customerProblem ||
    state.solutionApproach ||
    state.materials.length > 0;

  if (!hasAnyState) {
    sections.push('(No project information extracted yet)');
  }

  // User message
  if (context.userMessage) {
    sections.push('\n## User Message\n');
    sections.push(context.userMessage);
  }

  // Images
  if (context.images && context.images.length > 0) {
    sections.push('\n## Uploaded Images\n');
    sections.push(`${context.images.length} image(s) provided:`);

    context.images.forEach((img, index) => {
      const typeLabel = img.imageType || 'untyped';
      const altLabel = img.altText ? ` - "${img.altText}"` : '';
      sections.push(`${index + 1}. [${img.id}] ${typeLabel}${altLabel}`);
    });

    sections.push('\n(Note: You are seeing these images in your multimodal context. Analyze what you observe.)');
  }

  // Business context if available
  if (context.businessContext) {
    sections.push('\n## Business Context\n');
    if (context.businessContext.name) sections.push(`Business: ${context.businessContext.name}`);
    if (context.businessContext.type) sections.push(`Type: ${context.businessContext.type}`);
    if (context.businessContext.voice) sections.push(`Voice: ${context.businessContext.voice}`);
  }

  // Instructions
  sections.push('\n## Your Task\n');
  sections.push('Extract project information from the user message and any images.');
  sections.push('Update stateUpdates with new information.');
  sections.push('If you have enough to draft content, include narrative.');
  sections.push('Set the appropriate checkpoint.');
  sections.push('Ask a follow-up question if something important is unclear.');

  return sections.join('\n');
}

// ============================================================================
// Type Assertion Helper
// ============================================================================

/**
 * Type guard to check if a result is a valid StoryAgentResult.
 * Checks for required schema fields: confidence + stateUpdates (the distinguishing field).
 */
export function isStoryAgentResult(result: unknown): result is StoryAgentResult {
  if (!result || typeof result !== 'object') return false;

  const r = result as Record<string, unknown>;
  return typeof r.confidence === 'number' && 'stateUpdates' in r && typeof r.stateUpdates === 'object';
}
