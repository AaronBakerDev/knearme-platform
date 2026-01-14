/**
 * Project state derivation for unified chat interface.
 *
 * Instead of explicit 'create' vs 'edit' modes, the chat interface
 * derives its behavior from the project's actual state. This enables
 * a single chat interface that adapts naturally to any project.
 *
 * @see /docs/09-agent/project-chat-unification.md for design rationale
 */

import type { Json } from '@/types/database';
import type { UploadedImage } from '@/components/upload/ImageUploader';

/**
 * Derived project state that drives chat behavior.
 *
 * The ChatWizard uses this to determine:
 * - Initial phase (conversation vs review)
 * - Canvas size (collapsed vs expanded)
 * - Welcome message tone
 * - Available quick actions
 */
export interface ProjectState {
  /** No title, description, or images - truly blank slate */
  isEmpty: boolean;

  /** Has generated content (description or description_blocks) */
  hasContent: boolean;

  /** Has at least one uploaded image */
  hasImages: boolean;

  /** Project status is 'published' */
  isPublished: boolean;

  /** Project status is 'archived' */
  isArchived: boolean;

  /** Has a title (even if no description yet) */
  hasTitle: boolean;

  /** Has SEO metadata set */
  hasSeo: boolean;
}

/**
 * Minimal project data needed for state derivation.
 * Allows passing partial project data without full DB type.
 */
export interface ProjectStateInput {
  title?: string | null;
  description?: string | null;
  description_blocks?: Json | null;
  status?: 'draft' | 'published' | 'archived';
  seo_title?: string | null;
  seo_description?: string | null;
}

/**
 * Derive project state from project data and images.
 *
 * This is the core function that replaces explicit mode checking.
 * The chat interface calls this on load and uses the result to
 * determine initial UI state and agent behavior.
 *
 * @param project - Project data (can be null for truly new projects)
 * @param images - Uploaded images attached to the project
 * @returns Derived state flags
 *
 * @example
 * ```ts
 * const state = deriveProjectState(project, uploadedImages);
 * const initialPhase = state.hasContent ? 'review' : 'conversation';
 * const canvasSize = (state.hasContent || state.hasImages) ? 'medium' : 'collapsed';
 * ```
 */
export function deriveProjectState(
  project: ProjectStateInput | null | undefined,
  images: UploadedImage[] | { id: string }[] = []
): ProjectState {
  const hasImages = images.length > 0;

  if (!project) {
    return {
      isEmpty: !hasImages,
      hasContent: false,
      hasImages,
      isPublished: false,
      isArchived: false,
      hasTitle: false,
      hasSeo: false,
    };
  }

  const hasTitle = Boolean(project.title?.trim());
  const hasDescription = Boolean(project.description?.trim());
  const hasDescriptionBlocks =
    Array.isArray(project.description_blocks) &&
    project.description_blocks.length > 0;

  const hasContent = hasDescription || hasDescriptionBlocks;

  const hasSeo = Boolean(
    project.seo_title?.trim() || project.seo_description?.trim()
  );

  const isEmpty = !hasTitle && !hasContent && !hasImages;

  return {
    isEmpty,
    hasContent,
    hasImages,
    isPublished: project.status === 'published',
    isArchived: project.status === 'archived',
    hasTitle,
    hasSeo,
  };
}

/**
 * Determine initial chat phase based on project state.
 *
 * - Empty projects start in 'conversation' (gathering info)
 * - Projects with content start in 'review' (refinement mode)
 *
 * @param state - Derived project state
 * @returns Initial chat phase
 */
export function getInitialPhase(
  state: ProjectState
): 'conversation' | 'review' {
  return state.hasContent ? 'review' : 'conversation';
}

/**
 * Determine initial canvas size based on project state.
 *
 * - Empty projects: canvas collapsed (focus on chat)
 * - Projects with content/images: canvas open (show preview)
 *
 * @param state - Derived project state
 * @returns Initial canvas size
 */
export function getInitialCanvasSize(
  state: ProjectState
): 'collapsed' | 'medium' {
  return state.hasContent || state.hasImages ? 'medium' : 'collapsed';
}

/**
 * Project maturity level for context injection.
 *
 * Used to inform the agent about the project's state so it can
 * adapt its conversational approach.
 */
export type ProjectMaturity =
  | 'empty'        // No content, no images
  | 'gathering'    // Has some info but no generated content
  | 'drafted'      // Has AI-generated content
  | 'published';   // Live on public site

/**
 * Determine project maturity for agent context.
 *
 * @param state - Derived project state
 * @returns Maturity level string for prompt injection
 */
export function getProjectMaturity(state: ProjectState): ProjectMaturity {
  if (state.isPublished) return 'published';
  if (state.hasContent) return 'drafted';
  if (state.hasImages || state.hasTitle) return 'gathering';
  return 'empty';
}
