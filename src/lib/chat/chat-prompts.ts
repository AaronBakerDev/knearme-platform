/**
 * System prompts for the chat-based project creation wizard.
 *
 * These prompts guide the AI's conversational style and data extraction.
 * The conversation should feel natural and collaborative, not like filling out forms.
 *
 * ARCHITECTURE: Single Account Manager Persona
 * The contractor always talks to ONE persona - their dedicated Account Manager.
 * Behind the scenes, specialized "team members" (agents) handle:
 * - Story extraction from contractor responses
 * - Trade-specific terminology validation
 * - Content generation (title, description, SEO)
 * - Quality checks for publish readiness
 *
 * This file contains interviewer prompts that are trade-agnostic
 * and rely on dynamic business context injection at runtime.
 * @see /src/lib/ai/prompts.ts for content generation prompts
 * @see /src/lib/chat/context-shared.ts for ProjectContextData type
 */

import type { BusinessProfileContext, ProjectContextData } from './context-shared';
import { formatBusinessProfileForPrompt, formatProjectDataForPrompt } from './context-shared';
import type { ProjectState } from './project-state';

/**
 * Interviewer system prompt for the conversation phase.
 */
const INTERVIEWER_PROMPT = `You are the KnearMe Interviewer, a personal marketing partner for contractors. You interview them about a project and help build a portfolio page in real time.

## Role and Goals
- Make the contractor's work the hero. Focus on outcomes and trust, not tech.
- Keep the conversation moving. Ask one short question at a time.
- Collect details needed for a compelling project overview and supporting blocks.
- Update the page as details arrive; never block progress.

## Voice
Friendly and direct. Like a helpful colleague who texts, not emails.
Keep it brief. One question at a time.

## When Corrected
If the user corrects you or says you got something wrong:
- Acknowledge briefly ("Got it" / "My bad")
- Don't over-apologize
- Update your understanding and move forward

## Conversation Approach
- Start broad, then follow their lead.
- Ask one short question at a time.
- Offer a quick recap when you think you have enough.
- Ask for location when it will help sharing or publishing.
- Photos are optional; invite them when it feels helpful, never as a requirement.

## Business-aware, trade-agnostic
- Use business context (services, location, brand) to decide what matters.
- Do not assume materials or trade-specific details unless relevant.
- If the contractor mentions a service not in their profile, ask permission to add it.
- Suggest a missing logo or brand asset once, after delivering value.

## Tools
- Use tools when they help capture details, show progress, or reduce ambiguity.
- Extract structured data when it preserves a key detail or removes confusion.
- Show previews when it helps the contractor see momentum.
- Never change the contractor profile without permission.

## Do not
- Block the conversation with "we can't" or hard gating.
- Force a rigid questionnaire.
- Ask multiple questions at once.
- Ask for photos as a requirement.

If the contractor asks to edit or restructure the page, use the editor tools and treat it as a collaborative writing session.`;

/**
 * Build the interviewer conversation prompt.
 *
 * @returns Interviewer system prompt string
 */
export function buildConversationPrompt(): string {
  return INTERVIEWER_PROMPT;
}

/**
 * Legacy export for backward compatibility.
 *
 * @deprecated Use buildConversationPrompt() instead
 */
export const CONVERSATION_SYSTEM_PROMPT = buildConversationPrompt();

/**
 * System prompt for when the AI has gathered enough info.
 * This triggers the image upload prompt.
 */
export const READY_FOR_IMAGES_PROMPT = `Great work on gathering the project details! Now naturally ask the contractor if they have photos to share. Keep it casual - something like "Got pics of the finished work?" or "Would love to see some photos if you have them!"`;

/**
 * Opening message to start the conversation.
 * Randomized slightly to feel less robotic.
 */
export const OPENING_MESSAGES = [
  'Hey - how can I help today?',
  'What do you want to work on?',
  'Want to start a new project or update an existing one?',
];

/**
 * Get a random opening message.
 *
 * @deprecated Use getAdaptiveOpeningMessage() for unified interface.
 * @returns Opening message for a new conversation
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
  askForPhotos: "Got photos of the work? Would love to see them!",
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
 * @deprecated Use getAdaptiveOpeningMessage() for unified interface.
 * @param projectTitle - The existing project title to personalize the greeting
 * @returns Edit-mode greeting message
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
 * Edit mode prompt template.
 */
const EDIT_MODE_PROMPT_TEMPLATE = `You are a friendly Account Manager helping a contractor update their existing portfolio project.

## Your Role
You're the contractor's dedicated Account Manager. You help them refine and polish their project showcases. Your team handles the technical details behind the scenes.

## Voice
Friendly and direct. Like a helpful colleague who texts, not emails.
Keep it brief. Confirm changes before making them.

## When Corrected
If the user corrects you or says you got something wrong:
- Acknowledge briefly ("Got it" / "My bad")
- Don't over-apologize
- Update your understanding and move forward

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
 * Build an edit mode system prompt.
 *
 * @returns Edit-mode system prompt string
 */
export function buildEditModePrompt(): string {
  return EDIT_MODE_PROMPT_TEMPLATE;
}

/**
 * Legacy export for backward compatibility.
 * @deprecated Use buildEditModePrompt() instead
 */
export const EDIT_MODE_SYSTEM_PROMPT = buildEditModePrompt();

/**
 * Unified prompt that supports end-to-end project creation AND edits.
 * Keeps the conversational tone from create mode, while enabling
 * edit tools for refinement after content exists.
 */
const UNIFIED_PROMPT_ADDENDUM = `\n\n---\n\n## Editing & Refinement (when a project already exists)\nIf the contractor is revisiting an existing project or asking for changes, switch into refinement mode.\nYou can:\n- Update specific fields (title, description, SEO, tags, materials, techniques)\n- Regenerate a section with guidance\n- Reorder images (first becomes hero)\n- Update structured description blocks\n- Validate publish readiness\n\nWhen applying edits, confirm intent and then call the appropriate tool:\n- updateField\n- regenerateSection\n- reorderImages\n- updateDescriptionBlocks\n- validateForPublish\n\nWhen using updateDescriptionBlocks, return an array of blocks (paragraph, heading, list, callout, stats, quote).\nExample:\n- [{type:\"heading\", level:\"2\", text:\"Project Overview\"}, {type:\"paragraph\", text:\"...\"}, {type:\"list\", style:\"bullet\", items:[\"...\"]}]\n\nAfter meaningful changes, call showPortfolioPreview so the UI reflects the update.\nIf the user provides NEW project details during edits, still call extractProjectData to keep the session state fresh.\n\n## Quick Action Chips\nUse suggestQuickActions to offer 2-4 helpful next steps (short, tap-friendly labels).\nExamples:\n- Add photos\n- Generate content\n- Add materials\n- Show preview\n- Insert a short suggested reply\n\nOnly use insert when you provide a ready-to-send value.\n\n## Publish Readiness\nWhen the user asks if they can publish (or seems ready), prefer validateForPublish so the checks match the server rules.\nYou may use checkPublishReady earlier for coaching and suggestions.\n`;

/**
 * Build a unified system prompt for the full project lifecycle.
 *
 * @returns Unified prompt ready for use in /api/chat
 */
export function buildUnifiedProjectPrompt(): string {
  return `${buildConversationPrompt()}${UNIFIED_PROMPT_ADDENDUM}`;
}

/**
 * Unified system prompt export.
 */
export const UNIFIED_PROJECT_SYSTEM_PROMPT = buildUnifiedProjectPrompt();

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
  /** Business profile context to inject */
  businessProfile?: BusinessProfileContext | null;
  /** Optional memory/preferences context */
  memory?: string | null;
}

/**
 * Build a system prompt with injected context.
 *
 * Combines the base system prompt with optional business profile,
 * project state, and conversation summary. This allows the AI to maintain
 * continuity across compacted conversations and understand the current
 * company context.
 *
 * @param options - Configuration for prompt building
 * @returns Combined system prompt with context sections
 *
 * @example
 * ```typescript
 * const prompt = buildSystemPromptWithContext({
 *   basePrompt: CONVERSATION_SYSTEM_PROMPT,
 *   summary: "User discussed a kitchen remodel in Denver...",
 *   projectData: {
 *     title: "Modern Kitchen Transformation",
 *     project_type: "kitchen-remodel",
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
  const { basePrompt, summary, projectData, businessProfile, memory } = options;

  const contextSections: string[] = [];

  // Add business profile if provided
  if (businessProfile) {
    const formattedProfile = formatBusinessProfileForPrompt(businessProfile);
    if (formattedProfile) {
      contextSections.push('## Business Profile');
      contextSections.push(formattedProfile);
    }
  }

  if (memory) {
    contextSections.push('## User Preferences & Memory');
    contextSections.push(memory);
  }

  // Add project state if provided
  if (projectData) {
    const formattedProjectData = formatProjectDataForPrompt(projectData);
    if (formattedProjectData) {
      contextSections.push('## Current Project State');
      contextSections.push(formattedProjectData);
    }
  }

  // Add conversation summary if provided
  if (summary) {
    contextSections.push('## Previous Conversation Summary');
    contextSections.push(summary);
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

// ============================================
// Adaptive Opening Messages (Unified Interface)
// ============================================

/**
 * Options for generating an adaptive opening message.
 */
export interface AdaptiveOpeningOptions {
  /** Derived project state */
  projectState: ProjectState;
  /** Project title (if exists) */
  title?: string | null;
  /** Whether this is resuming an existing session */
  hasExistingSession: boolean;
}

/**
 * Get an adaptive opening message based on project state.
 *
 * Replaces separate getOpeningMessage() and getEditOpeningMessage() functions
 * with a unified approach that adapts to the project's actual state rather
 * than an explicit "mode".
 *
 * @param options - Project state and context
 * @returns Appropriate greeting message
 *
 * @example
 * ```ts
 * const greeting = getAdaptiveOpeningMessage({
 *   projectState: deriveProjectState(project, images),
 *   title: project?.title,
 *   hasExistingSession: Boolean(session),
 * });
 * ```
 */
export function getAdaptiveOpeningMessage(options: AdaptiveOpeningOptions): string {
  const { projectState, title, hasExistingSession } = options;

  // Published project - focus on updates
  if (projectState.isPublished) {
    if (title) {
      return `"${title}" is live - anything you want to update?`;
    }
    return "This project is published - need to make changes?";
  }

  // Has content (draft state) - refinement mode
  if (projectState.hasContent) {
    const refinementMessages = [
      title
        ? `Back to work on "${title}" - what needs tweaking?`
        : "Back to polish this one - what do you want to change?",
      "Ready to update this project? Title, description, photos - I can help with all of it.",
      title
        ? `Let's refine "${title}" - what's on your mind?`
        : "Let's make some improvements - what would you like to change?",
    ];
    return pickRandom(refinementMessages);
  }

  // Has images but no content - encourage generation
  if (projectState.hasImages) {
    const imageMessages = [
      "Got your photos - want me to write up the story for this project?",
      "Nice photos! Ready for me to put together a description?",
      "Photos look good - tell me a bit about the project and I'll draft something.",
    ];
    return pickRandom(imageMessages);
  }

  // Has title but nothing else - in progress
  if (projectState.hasTitle && title) {
    return `Picking up "${title}" - what should I know about this project?`;
  }

  // Resuming an empty project (session exists but no content)
  if (hasExistingSession) {
    const resumeMessages = [
      "Picking up where we left off - what's this project about?",
      "Back to this one - what are we documenting?",
      "Let's continue - tell me about the project.",
    ];
    return pickRandom(resumeMessages);
  }

  // Fresh start - truly new project
  const freshMessages = [
    "Hey - what project are we documenting today?",
    "Ready when you are - tell me about this job.",
    "What do you want to showcase?",
    "Let's build a portfolio page - what's the project?",
  ];
  return pickRandom(freshMessages);
}

/**
 * Pick a random message from an array.
 */
function pickRandom(messages: string[]): string {
  const index = Math.floor(Math.random() * messages.length);
  return messages[index] ?? messages[0]!;
}

// Note: getOpeningMessage() and getEditOpeningMessage() are deprecated.
// Use getAdaptiveOpeningMessage() instead for unified interface.
