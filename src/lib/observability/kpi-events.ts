/**
 * KPI Event Tracking for AI SDK Observability.
 *
 * Tracks key performance indicators for the portfolio creation flow:
 * - Time-to-publish: Duration from project creation to publish
 * - Interview completion: When AI interview generates content
 * - Regeneration usage: Content regeneration frequency
 *
 * Events are logged to Langfuse as scores and can be analyzed
 * in the dashboard for product insights.
 *
 * @see /docs/ai-sdk/observability-spec.md
 * @see /todo/ai-sdk-phase-8-agent-architecture.md
 */

import { Langfuse } from 'langfuse';
import { logger } from '@/lib/logging';

// ============================================================================
// Langfuse Client Singleton
// ============================================================================

let _langfuse: Langfuse | null = null;

/**
 * Get the Langfuse client for KPI event tracking.
 *
 * Creates a singleton instance for direct event logging.
 * Returns null if Langfuse is not configured.
 */
function getLangfuseClient(): Langfuse | null {
  if (!process.env.LANGFUSE_PUBLIC_KEY || !process.env.LANGFUSE_SECRET_KEY) {
    return null;
  }

  if (!_langfuse) {
    _langfuse = new Langfuse({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      baseUrl: process.env.LANGFUSE_BASEURL || 'https://cloud.langfuse.com',
    });
  }

  return _langfuse;
}

// ============================================================================
// KPI Event Types
// ============================================================================

/**
 * KPI event names for consistent tracking.
 */
export const KPI_EVENTS = {
  /** Project was published - includes time-to-publish duration */
  PROJECT_PUBLISHED: 'project_published',
  /** Interview completed and content generated */
  INTERVIEW_COMPLETED: 'interview_completed',
  /** User requested content regeneration */
  CONTENT_REGENERATED: 'content_regenerated',
  /** Project created (starting point for time-to-publish) */
  PROJECT_CREATED: 'project_created',
} as const;

export type KpiEventName = (typeof KPI_EVENTS)[keyof typeof KPI_EVENTS];

/**
 * Common metadata for all KPI events.
 */
// ============================================================================
// Time-to-Publish KPI
// ============================================================================

/**
 * Track when a project is published.
 *
 * Calculates the time-to-publish duration (in seconds) from project creation.
 * This metric helps understand how long contractors spend on the portfolio flow.
 *
 * @param metadata - Event metadata
 * @param metadata.contractorId - Contractor who published
 * @param metadata.projectId - Project that was published
 * @param metadata.createdAt - When the project was created
 * @param metadata.publishedAt - When the project was published
 *
 * @example
 * ```typescript
 * await trackProjectPublished({
 *   contractorId: 'abc123',
 *   projectId: 'proj456',
 *   createdAt: project.created_at,
 *   publishedAt: new Date(),
 * });
 * ```
 */
export async function trackProjectPublished(metadata: {
  contractorId: string;
  projectId: string;
  createdAt: Date | string;
  publishedAt?: Date | string;
}): Promise<void> {
  const langfuse = getLangfuseClient();
  if (!langfuse) return;

  const createdAt = new Date(metadata.createdAt);
  const publishedAt = metadata.publishedAt ? new Date(metadata.publishedAt) : new Date();
  const durationSeconds = Math.round((publishedAt.getTime() - createdAt.getTime()) / 1000);
  const durationMinutes = Math.round(durationSeconds / 60);

  try {
    // Create a trace for this publish event
    const trace = langfuse.trace({
      name: KPI_EVENTS.PROJECT_PUBLISHED,
      userId: metadata.contractorId,
      sessionId: metadata.projectId,
      metadata: {
        projectId: metadata.projectId,
        contractorId: metadata.contractorId,
        createdAt: createdAt.toISOString(),
        publishedAt: publishedAt.toISOString(),
        durationSeconds,
        durationMinutes,
      },
    });

    // Add a score for time-to-publish (in minutes for readability)
    trace.score({
      name: 'time_to_publish_minutes',
      value: durationMinutes,
      comment: `Project published after ${durationMinutes} minutes`,
    });

    // Also track raw seconds for precise analysis
    trace.score({
      name: 'time_to_publish_seconds',
      value: durationSeconds,
    });

    await langfuse.flushAsync();

    if (process.env.NODE_ENV === 'development') {
      logger.info('[KPI] Project published', {
        projectId: metadata.projectId,
        durationMinutes,
      });
    }
  } catch (error) {
    logger.error('[KPI] Failed to track project published', { error });
  }
}

// ============================================================================
// Interview Completion KPI
// ============================================================================

/**
 * Track when an AI interview is completed.
 *
 * Fired when the generate-content endpoint successfully creates content.
 * Helps measure interview completion rates and content generation success.
 *
 * @param metadata - Event metadata
 * @param metadata.contractorId - Contractor who completed interview
 * @param metadata.projectId - Project the interview was for
 * @param metadata.questionCount - Number of interview questions answered
 * @param metadata.imageCount - Number of images analyzed
 * @param metadata.contentLength - Length of generated content (chars)
 *
 * @example
 * ```typescript
 * await trackInterviewCompleted({
 *   contractorId: 'abc123',
 *   projectId: 'proj456',
 *   questionCount: 5,
 *   imageCount: 3,
 *   contentLength: 1200,
 * });
 * ```
 */
export async function trackInterviewCompleted(metadata: {
  contractorId: string;
  projectId: string;
  questionCount?: number;
  imageCount?: number;
  contentLength?: number;
}): Promise<void> {
  const langfuse = getLangfuseClient();
  if (!langfuse) return;

  try {
    const trace = langfuse.trace({
      name: KPI_EVENTS.INTERVIEW_COMPLETED,
      userId: metadata.contractorId,
      sessionId: metadata.projectId,
      metadata: {
        projectId: metadata.projectId,
        contractorId: metadata.contractorId,
        questionCount: metadata.questionCount,
        imageCount: metadata.imageCount,
        contentLength: metadata.contentLength,
        completedAt: new Date().toISOString(),
      },
    });

    // Track question count as a score
    if (metadata.questionCount !== undefined) {
      trace.score({
        name: 'interview_question_count',
        value: metadata.questionCount,
      });
    }

    // Track image count
    if (metadata.imageCount !== undefined) {
      trace.score({
        name: 'interview_image_count',
        value: metadata.imageCount,
      });
    }

    // Track content length
    if (metadata.contentLength !== undefined) {
      trace.score({
        name: 'generated_content_length',
        value: metadata.contentLength,
      });
    }

    await langfuse.flushAsync();

    if (process.env.NODE_ENV === 'development') {
      logger.info('[KPI] Interview completed', { projectId: metadata.projectId });
    }
  } catch (error) {
    logger.error('[KPI] Failed to track interview completed', { error });
  }
}

// ============================================================================
// Regeneration Usage KPI
// ============================================================================

/**
 * Track when a user requests content regeneration.
 *
 * Measures how often users regenerate content, which indicates:
 * - Content quality issues (high regeneration = low initial quality)
 * - User engagement (some regeneration is healthy exploration)
 *
 * @param metadata - Event metadata
 * @param metadata.contractorId - Contractor requesting regeneration
 * @param metadata.projectId - Project being regenerated
 * @param metadata.section - Which section is being regenerated
 * @param metadata.feedbackProvided - Whether user provided feedback
 * @param metadata.regenerationCount - How many times regenerated (if tracked)
 *
 * @example
 * ```typescript
 * await trackContentRegenerated({
 *   contractorId: 'abc123',
 *   projectId: 'proj456',
 *   section: 'description',
 *   feedbackProvided: true,
 * });
 * ```
 */
export async function trackContentRegenerated(metadata: {
  contractorId: string;
  projectId: string;
  section?: 'title' | 'description' | 'seo' | 'all';
  feedbackProvided?: boolean;
  regenerationCount?: number;
}): Promise<void> {
  const langfuse = getLangfuseClient();
  if (!langfuse) return;

  try {
    const trace = langfuse.trace({
      name: KPI_EVENTS.CONTENT_REGENERATED,
      userId: metadata.contractorId,
      sessionId: metadata.projectId,
      metadata: {
        projectId: metadata.projectId,
        contractorId: metadata.contractorId,
        section: metadata.section || 'all',
        feedbackProvided: metadata.feedbackProvided ?? false,
        regenerationCount: metadata.regenerationCount,
        regeneratedAt: new Date().toISOString(),
      },
    });

    // Track regeneration as a count event (value = 1 for each regeneration)
    trace.score({
      name: 'regeneration_count',
      value: 1,
      comment: `Regenerated ${metadata.section || 'all'} content`,
    });

    // Track if feedback was provided (1 = yes, 0 = no)
    trace.score({
      name: 'regeneration_with_feedback',
      value: metadata.feedbackProvided ? 1 : 0,
    });

    await langfuse.flushAsync();

    if (process.env.NODE_ENV === 'development') {
      logger.info('[KPI] Content regenerated', {
        projectId: metadata.projectId,
        section: metadata.section || 'all',
      });
    }
  } catch (error) {
    logger.error('[KPI] Failed to track content regenerated', { error });
  }
}

// ============================================================================
// Project Creation KPI (for time-to-publish baseline)
// ============================================================================

/**
 * Track when a project is created.
 *
 * This establishes the baseline timestamp for time-to-publish calculation.
 * Can be correlated with publish events to measure the full journey.
 *
 * @param metadata - Event metadata
 * @param metadata.contractorId - Contractor creating the project
 * @param metadata.projectId - Newly created project ID
 *
 * @example
 * ```typescript
 * await trackProjectCreated({
 *   contractorId: 'abc123',
 *   projectId: 'proj456',
 * });
 * ```
 */
export async function trackProjectCreated(metadata: {
  contractorId: string;
  projectId: string;
}): Promise<void> {
  const langfuse = getLangfuseClient();
  if (!langfuse) return;

  try {
    langfuse.trace({
      name: KPI_EVENTS.PROJECT_CREATED,
      userId: metadata.contractorId,
      sessionId: metadata.projectId,
      metadata: {
        projectId: metadata.projectId,
        contractorId: metadata.contractorId,
        createdAt: new Date().toISOString(),
      },
    });

    await langfuse.flushAsync();

    if (process.env.NODE_ENV === 'development') {
      logger.info('[KPI] Project created', { projectId: metadata.projectId });
    }
  } catch (error) {
    logger.error('[KPI] Failed to track project created', { error });
  }
}

// ============================================================================
// Flush Helper
// ============================================================================

/**
 * Flush all pending KPI events to Langfuse.
 *
 * Call this at the end of API routes to ensure events are sent
 * before the serverless function terminates.
 */
export async function flushKpiEvents(): Promise<void> {
  const langfuse = getLangfuseClient();
  if (langfuse) {
    await langfuse.flushAsync();
  }
}
