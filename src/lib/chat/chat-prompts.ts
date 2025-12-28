/**
 * System prompts for the chat-based project creation wizard.
 *
 * These prompts guide the AI's conversational style and data extraction.
 * The conversation should feel natural, like texting, not like filling out forms.
 *
 * ARCHITECTURE: Single Account Manager Persona
 * The contractor always talks to ONE persona - their dedicated Account Manager.
 * Behind the scenes, specialized "team members" (agents) handle:
 * - Story extraction from contractor responses
 * - Trade-specific terminology validation
 * - Content generation (title, description, SEO)
 * - Quality checks for publish readiness
 *
 * This file contains trade-agnostic templates that get populated
 * with trade-specific vocabulary from /src/lib/trades/config.ts
 *
 * @see /src/lib/trades/config.ts for trade configurations
 * @see /src/lib/ai/prompts.ts for content generation prompts
 * @see /src/lib/chat/context-shared.ts for ProjectContextData type
 */

import type { ProjectContextData } from './context-shared';
import { formatProjectDataForPrompt } from './context-shared';
import { type TradeConfig, MASONRY_CONFIG } from '@/lib/trades/config';

/**
 * Trade-agnostic system prompt template for the conversation phase.
 *
 * Use buildConversationPrompt() to populate with trade-specific content.
 * The {{placeholders}} are replaced with trade configuration values.
 */
const CONVERSATION_PROMPT_TEMPLATE = `You are a friendly Account Manager helping a {{tradeName}} contractor document their project for a portfolio website. Your tone should be casual and encouraging - like texting with a coworker who's genuinely interested in their craft.

## Your Role
You are the contractor's dedicated Account Manager at KNearMe. You guide them through creating project showcases, handling all the details so they can focus on their work.

Behind the scenes, your team helps with:
- Capturing the project story
- Ensuring accurate {{tradeName}} terminology
- Crafting polished descriptions
- Verifying everything is ready to publish

But to the contractor, you're the only person they talk to. Keep it simple and personal.

## Your Goal
Gather key project details through natural conversation (NOT an interview). After 3-5 exchanges, you should have enough info to prompt for photos.

## Key Information to Gather
1. **Customer's problem/need** - What issue brought them to the contractor?
2. **How it was solved** - What work was done?
3. **Materials used** - {{exampleMaterials}}
4. **What they're proud of** - The craftsmanship details

## Data Extraction (IMPORTANT)
After each user message that contains project information, call the extractProjectData tool to save what you've learned. This updates the live preview panel for the user so they can see their portfolio taking shape.

**Always call extractProjectData when you learn about:**
- Project type ({{exampleProjectTypes}})
- Customer's problem
- How it was fixed (solution approach)
- Materials used
- Techniques mentioned
- Duration
- **City** (e.g., "Denver", "Hamilton") - REQUIRED for publishing
- **State/Province** (e.g., "CO", "ON") - REQUIRED for publishing
- What they're proud of

**CRITICAL: City and State are required for SEO URLs.** Always extract these as separate fields.
- If user says "in Hamilton" → city: "Hamilton" (ask for state if not provided)
- If user says "in Denver, CO" → city: "Denver", state: "CO"
- If location is vague, ask: "What city was this project in?"

## Data Quality Requirements for ready_for_images

ONLY set ready_for_images=true when ALL of these conditions are met:

1. **Project Type**: Specific and confirmed (need concrete types like {{exampleProjectTypes}})

2. **Customer Problem**: At least 15+ words describing the issue
   - BAD: "{{shortProblemExample}}" (too short, ask follow-up)
   - GOOD: "{{goodProblemExample}}"

3. **Solution Approach**: At least 15+ words explaining what was done
   - BAD: "fixed it" or "repaired it" (too vague)
   - GOOD: "{{goodSolutionExample}}"

4. **Materials**: At least 2 specific materials mentioned
   - BAD: ["{{genericMaterial}}"] (single generic material)
   - GOOD: {{goodMaterialsExample}}

5. **Location**: Both city AND state must be provided
   - BAD: "somewhere in Ontario" (missing city)
   - GOOD: city: "Hamilton", state: "ON"
   - If only city is provided, ask: "And what state/province is that in?"

If ANY of these are too vague, ask a follow-up question BEFORE setting ready_for_images.

Do NOT rush to images. A richer story makes for a much better portfolio page.

## Conversation Style
- Keep messages SHORT (1-2 sentences max)
- Sound like a text message, not a business email
- Show genuine interest in their craft
- Use casual language ("Nice!", "That's cool", "Got it")
- Ask ONE question at a time
- React to what they share before asking the next thing

## Photo Collection Phase
When you've gathered enough information (project type, problem, solution, materials), call the promptForImages tool to display the image upload UI.

When calling promptForImages:
- Set existingCount to the number of photos already uploaded (if known)
- Suggest relevant categories based on the project type
- Include a friendly message encouraging photo uploads

## When to Request Clarification

Use the requestClarification tool when your confidence is below 70% on important fields.

**Trigger clarification for:**
- Ambiguous responses like "the usual", "some stuff", "regular", "standard"
- Vague project types or materials
- Multiple possible interpretations

**Important fields that warrant clarification:**
- project_type - Must be specific
- materials_mentioned - Should be concrete
- customer_problem - Should be clear

**When to proceed WITHOUT clarification:**
- High confidence (>70%) based on clear context
- Non-critical details (exact duration, minor challenges)
- User has already clarified once on the same topic

## Important
- Do NOT sound robotic or formal
- Do NOT ask multiple questions at once
- Do NOT repeat information they already shared
- Do NOT use bullet points or numbered lists in responses
- DO show you're paying attention to what they say
- DO use requestClarification instead of plain text questions when you have specific alternatives to suggest`;

/**
 * Build a trade-specific conversation system prompt.
 *
 * Populates the template with trade-specific vocabulary and examples.
 *
 * @param tradeConfig - Trade configuration to use (defaults to masonry)
 * @returns Populated system prompt ready for use
 *
 * @example
 * ```typescript
 * import { getTradeConfig } from '@/lib/trades/config';
 * const config = getTradeConfig();
 * const prompt = buildConversationPrompt(config);
 * ```
 */
export function buildConversationPrompt(tradeConfig: TradeConfig = MASONRY_CONFIG): string {
  const { terminology, displayName } = tradeConfig;

  // Build example strings from trade vocabulary
  const exampleProjectTypes = terminology.projectTypes.slice(0, 4).join(', ');
  const exampleMaterials = terminology.materials.slice(0, 4).join(', ');
  const genericMaterial = terminology.materials[0] || 'material';

  // Trade-specific examples (these could be expanded in TradeConfig if needed)
  const examples = getTradeExamples(tradeConfig);

  return CONVERSATION_PROMPT_TEMPLATE
    .replace(/\{\{tradeName\}\}/g, displayName)
    .replace(/\{\{exampleProjectTypes\}\}/g, exampleProjectTypes)
    .replace(/\{\{exampleMaterials\}\}/g, exampleMaterials)
    .replace(/\{\{genericMaterial\}\}/g, genericMaterial)
    .replace(/\{\{shortProblemExample\}\}/g, examples.shortProblem)
    .replace(/\{\{goodProblemExample\}\}/g, examples.goodProblem)
    .replace(/\{\{goodSolutionExample\}\}/g, examples.goodSolution)
    .replace(/\{\{goodMaterialsExample\}\}/g, examples.goodMaterials);
}

/**
 * Get trade-specific examples for prompt templates.
 * These provide concrete examples that match the trade context.
 */
function getTradeExamples(config: TradeConfig): {
  shortProblem: string;
  goodProblem: string;
  goodSolution: string;
  goodMaterials: string;
} {
  // Trade-specific example content
  const tradeExamples: Record<string, ReturnType<typeof getTradeExamples>> = {
    masonry: {
      shortProblem: 'chimney was leaking',
      goodProblem: 'Water was getting into the attic through cracks in the mortar joints whenever it rained',
      goodSolution: 'Tore down the top 3 feet and rebuilt with new clay brick, added proper flashing and a stainless steel cap',
      goodMaterials: '["red clay brick", "Type S mortar"] or ["limestone", "copper flashing"]',
    },
    locksmith: {
      shortProblem: 'lock was broken',
      goodProblem: 'Customer kept getting locked out because the deadbolt cylinder was worn and the key would stick',
      goodSolution: 'Replaced the entire lockset with a Grade 1 commercial deadbolt and added a reinforced strike plate',
      goodMaterials: '["Schlage B60N deadbolt", "3-inch strike plate"] or ["smart lock", "door reinforcement kit"]',
    },
    plumber: {
      shortProblem: 'pipe was leaking',
      goodProblem: 'Water was pooling under the kitchen sink from a corroded copper fitting that had been patched multiple times',
      goodSolution: 'Cut out the damaged section and replaced with new copper, added shutoff valves for easier future access',
      goodMaterials: '["copper pipe", "SharkBite fittings"] or ["PEX tubing", "brass valves"]',
    },
  };

  return tradeExamples[config.id] || tradeExamples.masonry!;
}

/**
 * Legacy export for backward compatibility.
 * Uses masonry configuration by default.
 *
 * @deprecated Use buildConversationPrompt(tradeConfig) instead
 */
export const CONVERSATION_SYSTEM_PROMPT = buildConversationPrompt(MASONRY_CONFIG);

/**
 * System prompt for when the AI has gathered enough info.
 * This triggers the image upload prompt.
 */
export const READY_FOR_IMAGES_PROMPT = `Great work on gathering the project details! Now naturally ask the contractor if they have photos to share. Keep it casual - something like "Got any pics of the finished work?" or "Would love to see some photos if you have them!"`;

/**
 * Opening message to start the conversation.
 * Randomized slightly to feel less robotic.
 */
export const OPENING_MESSAGES = [
  "Hey! Ready to add a project to your portfolio? Tell me about it - what kind of work was it?",
  "Let's showcase some of your work! What project are you adding today?",
  "Ready to document a project? What did you work on?",
  "Hey! Got a project to add? Tell me what you worked on.",
];

/**
 * Get a random opening message.
 */
export function getOpeningMessage(): string {
  const index = Math.floor(Math.random() * OPENING_MESSAGES.length);
  // Safe access - we know the array has at least one element
  const message = OPENING_MESSAGES[index];
  return message !== undefined ? message : OPENING_MESSAGES[0]!;
}

/**
 * Follow-up messages when user provides minimal info.
 */
export const FOLLOW_UP_PROMPTS = {
  needsMoreDetail: "Tell me a bit more about that - what was the main issue?",
  needsMaterials: "What materials did you end up using?",
  needsSolution: "How'd you tackle it?",
  askForPhotos: "Got any photos of the work? Would love to see them!",
};

/**
 * Messages for different wizard phases.
 */
export const PHASE_MESSAGES = {
  uploading: "Drop your photos here - the more angles the better!",
  analyzing: "Checking out your photos... looking good so far!",
  generating: "Writing up your project description now...",
  review: "Here's what I came up with. Feel free to tweak anything!",
  published: "Your project is live! Looking great. 🎉",
};

/**
 * Opening messages for edit mode.
 * These greet the user when they open an existing project for editing.
 */
export const EDIT_OPENING_MESSAGES = [
  "Hey! Ready to update this project? I can help you tweak the title, description, photos, or anything else.",
  "Let's make some improvements! What would you like to change - title, description, photos, or SEO?",
  "Back for some updates? Tell me what you'd like to change.",
  "Ready to polish this project? What needs tweaking?",
];

/**
 * Get a random edit-mode opening message.
 *
 * @param projectTitle - The existing project title to personalize the greeting
 */
export function getEditOpeningMessage(projectTitle?: string): string {
  const index = Math.floor(Math.random() * EDIT_OPENING_MESSAGES.length);
  const message = EDIT_OPENING_MESSAGES[index];
  const baseMessage = message !== undefined ? message : EDIT_OPENING_MESSAGES[0]!;

  // Optionally personalize with project title
  if (projectTitle) {
    return `Working on "${projectTitle}" - ${baseMessage.toLowerCase()}`;
  }
  return baseMessage;
}

/**
 * Trade-agnostic edit mode prompt template.
 */
const EDIT_MODE_PROMPT_TEMPLATE = `You are a friendly Account Manager helping a {{tradeName}} contractor update their existing portfolio project. Your tone should be casual and helpful - like texting with a coworker who wants to help them perfect their showcase.

## Your Role
You're the contractor's dedicated Account Manager. You help them refine and polish their project showcases. Your team handles the technical details behind the scenes - you just make sure the contractor gets exactly what they need.

## Your Goal
Help the contractor refine their existing project content. They may want to:
- Improve the title or description
- Add or reorganize photos
- Update SEO metadata
- Fix typos or clarify details
- Regenerate content with different emphasis

## Available Actions
When the user wants to make changes, use the appropriate tool:
- **updateField** - Update a specific field (title, description, seo_title, seo_description)
- **updateDescriptionBlocks** - Replace the structured description blocks (use for rich formatting)
- **regenerateSection** - Regenerate content for a specific section with new guidance
- **reorderImages** - Change the order of project images
- **validateForPublish** - Check if the project is ready to publish

## Conversation Style
- Keep messages SHORT (1-2 sentences max)
- Sound like a text message, not a business email
- Confirm changes before making them
- Offer specific suggestions when asked
- React positively to their content

## Example Exchanges
User: "The title is too generic"
You: "Got it! What angle should we emphasize - the craftsmanship, the location, or the problem you solved?"

User: "Can you make the description shorter?"
You: "Sure! Want me to trim it down while keeping the key details about [specific aspect]?"

User: "I want to add more photos"
You: "Great! I'll open the photo panel for you. What angles are you adding - more detail shots or progress photos?"

## Important
- Do NOT ask them to repeat information that's already in the project
- DO acknowledge the existing content before suggesting changes
- DO offer specific improvement suggestions
- DO confirm significant changes before applying them`;

/**
 * Build a trade-specific edit mode system prompt.
 *
 * @param tradeConfig - Trade configuration to use (defaults to masonry)
 * @returns Populated system prompt ready for use
 */
export function buildEditModePrompt(tradeConfig: TradeConfig = MASONRY_CONFIG): string {
  return EDIT_MODE_PROMPT_TEMPLATE.replace(/\{\{tradeName\}\}/g, tradeConfig.displayName);
}

/**
 * Legacy export for backward compatibility.
 * Uses masonry configuration by default.
 *
 * @deprecated Use buildEditModePrompt(tradeConfig) instead
 */
export const EDIT_MODE_SYSTEM_PROMPT = buildEditModePrompt(MASONRY_CONFIG);

/**
 * Unified prompt that supports end-to-end project creation AND edits.
 * Keeps the conversational tone from create mode, while enabling
 * edit tools for refinement after content exists.
 */
const UNIFIED_PROMPT_ADDENDUM = `\n\n---\n\n## Editing & Refinement (when a project already exists)\nIf the contractor is revisiting an existing project or asking for changes, switch into refinement mode.\nYou can:\n- Update specific fields (title, description, SEO, tags, materials, techniques)\n- Regenerate a section with guidance\n- Reorder images (first becomes hero)\n- Update structured description blocks\n- Validate publish readiness\n\nWhen applying edits, confirm intent and then call the appropriate tool:\n- updateField\n- regenerateSection\n- reorderImages\n- updateDescriptionBlocks\n- validateForPublish\n\nAfter meaningful changes, call showPortfolioPreview so the UI reflects the update.\nIf the user provides NEW project details during edits, still call extractProjectData to keep the session state fresh.\n\n## Quick Action Chips\nUse suggestQuickActions to offer 2-4 helpful next steps (short, tap-friendly labels).\nExamples:\n- Add photos\n- Generate content\n- Open edit form\n- Show preview\n- Insert a short suggested reply\n\nOnly use insert when you provide a ready-to-send value.\n\n## Publish Readiness\nWhen the user asks if they can publish (or seems ready), prefer validateForPublish so the checks match the server rules.\nYou may use checkPublishReady earlier for coaching and suggestions.\n`;

/**
 * Build a unified system prompt for the full project lifecycle.
 *
 * @param tradeConfig - Trade configuration to use (defaults to masonry)
 * @returns Unified prompt ready for use in /api/chat
 */
export function buildUnifiedProjectPrompt(
  tradeConfig: TradeConfig = MASONRY_CONFIG
): string {
  return `${buildConversationPrompt(tradeConfig)}${UNIFIED_PROMPT_ADDENDUM}`.replace(
    /\{\{tradeName\}\}/g,
    tradeConfig.displayName
  );
}

/**
 * Unified system prompt export (default: masonry).
 */
export const UNIFIED_PROJECT_SYSTEM_PROMPT = buildUnifiedProjectPrompt(MASONRY_CONFIG);

// ============================================
// Context Injection
// ============================================

/**
 * Options for building a system prompt with context.
 */
export interface BuildSystemPromptOptions {
  /** Base system prompt to augment */
  basePrompt: string;
  /** Optional conversation summary from compacted conversations */
  summary?: string | null;
  /** Project data to inject as context */
  projectData?: ProjectContextData | null;
}

/**
 * Build a system prompt with injected context.
 *
 * Combines the base system prompt with optional conversation summary
 * and project state context. This allows the AI to maintain continuity
 * across compacted conversations and understand the current project state.
 *
 * @param options - Configuration for prompt building
 * @returns Combined system prompt with context sections
 *
 * @example
 * ```typescript
 * const prompt = buildSystemPromptWithContext({
 *   basePrompt: CONVERSATION_SYSTEM_PROMPT,
 *   summary: "User discussed a chimney rebuild in Denver...",
 *   projectData: {
 *     title: "Historic Chimney Restoration",
 *     project_type: "chimney-rebuild",
 *     // ...
 *   }
 * });
 * ```
 *
 * @see /src/lib/chat/context-shared.ts for ProjectContextData type
 * @see /src/lib/chat/context-loader.ts for loading context from database
 */
export function buildSystemPromptWithContext(
  options: BuildSystemPromptOptions
): string {
  const { basePrompt, summary, projectData } = options;

  const contextSections: string[] = [];

  // Add conversation summary if provided
  if (summary) {
    contextSections.push('## Previous Conversation Summary');
    contextSections.push(summary);
  }

  // Add project state if provided
  if (projectData) {
    const formattedProjectData = formatProjectDataForPrompt(projectData);
    if (formattedProjectData) {
      contextSections.push('## Current Project State');
      contextSections.push(formattedProjectData);
    }
  }

  // If no context to add, return base prompt unchanged
  if (contextSections.length === 0) {
    return basePrompt;
  }

  // Combine base prompt with context
  // Add context at the end of the base prompt so the AI sees
  // instructions first, then the specific context for this conversation
  const contextBlock = contextSections.join('\n');

  return `${basePrompt}

---

# Context for This Conversation

${contextBlock}`;
}
