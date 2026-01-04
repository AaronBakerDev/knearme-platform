/**
 * Content Generation API - Generate portfolio content using GPT-4o.
 *
 * POST /api/ai/generate-content
 *
 * Generates SEO-optimized portfolio content from:
 * - Image analysis results
 * - Interview transcripts
 * - Business context
 *
 * @see /docs/03-architecture/c4-container.md for AI pipeline flow
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
  selectInterviewSession,
  selectProjectByIdForContractor,
  updateInterviewSession,
  updateProject,
  upsertInterviewSession,
} from '@/lib/supabase/typed-queries';
import { requireAuth, isAuthError } from '@/lib/api/auth';
import { apiError, apiSuccess, handleApiError } from '@/lib/api/errors';
import {
  generateInterviewQuestions,
  generatePortfolioContent,
  regenerateWithFeedback,
} from '@/lib/ai/content-generation';
import { trackInterviewCompleted, trackContentRegenerated } from '@/lib/observability/kpi-events';
import type { ImageAnalysisResult } from '@/lib/ai/image-analysis';
import type { Json } from '@/types/database';

/**
 * Request schema for generating interview questions.
 */
const generateQuestionsSchema = z.object({
  project_id: z.string().uuid(),
});

/**
 * Request schema for generating content.
 */
const generateContentSchema = z.object({
  project_id: z.string().uuid(),
  /** Optional client-provided responses (used for text-mode interview) */
  responses: z
    .array(
      z.object({
        question_id: z.string(),
        question_text: z.string(),
        answer: z.string(),
      })
    )
    .optional(),
});

/**
 * Request schema for persisting interview responses.
 */
const persistResponsesSchema = z.object({
  project_id: z.string().uuid(),
  responses: z.array(
    z.object({
      question_id: z.string(),
      question_text: z.string(),
      answer: z.string(),
    })
  ).min(1),
});

/**
 * Request schema for regenerating with feedback.
 */
const regenerateSchema = z.object({
  project_id: z.string().uuid(),
  feedback: z.string().min(10).max(500),
  previous_content: z
    .object({
      title: z.string(),
      description: z.string(),
      seo_title: z.string().optional(),
      seo_description: z.string().optional(),
      tags: z.array(z.string()).optional(),
      materials: z.array(z.string()).optional(),
      techniques: z.array(z.string()).optional(),
    })
    .optional(),
});

type StoredQuestion = {
  id: string;
  text?: string;
  purpose?: string;
  answer?: string;
  raw_transcription?: string;
  duration?: number;
};

type ProvidedResponse = {
  question_id: string;
  question_text: string;
  answer: string;
};

function mergeInterviewResponses(
  existing: StoredQuestion[] = [],
  provided: ProvidedResponse[] = []
): StoredQuestion[] {
  const responseMap = new Map(
    provided.map((response) => [response.question_id, response])
  );
  const merged = existing.map((question) => {
    const response = responseMap.get(question.id);
    if (!response) return question;
    return {
      ...question,
      id: question.id,
      text: response.question_text,
      answer: response.answer,
    };
  });
  const missingResponses = provided
    .filter((response) => !existing.some((question) => question.id === response.question_id))
    .map((response) => ({
      id: response.question_id,
      text: response.question_text,
      answer: response.answer,
    }));

  return [...merged, ...missingResponses];
}

/**
 * POST /api/ai/generate-content
 *
 * Generate portfolio content based on interview responses.
 * The action query param determines what to generate:
 * - ?action=questions - Generate interview questions from image analysis
 * - ?action=responses - Persist interview responses without generating content
 * - ?action=content - Generate full portfolio content
 * - ?action=regenerate - Regenerate with feedback
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) {
      return apiError(auth.type === 'UNAUTHORIZED' ? 'UNAUTHORIZED' : 'FORBIDDEN', auth.message);
    }

    const { contractor } = auth;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'content';

    const body = await request.json();
    const supabase = await createClient();
    const ensureProjectOwnership = async (projectId: string) => {
      const { data: project, error } = await selectProjectByIdForContractor(
        supabase,
        projectId,
        contractor.id
      );
      if (error || !project) {
        return null;
      }
      return project;
    };

    // Handle different actions
    switch (action) {
      case 'questions': {
        const parsed = generateQuestionsSchema.safeParse(body);
        if (!parsed.success) {
          return apiError('VALIDATION_ERROR', 'Invalid request', {
            errors: parsed.error.flatten().fieldErrors,
          });
        }

        const { project_id } = parsed.data;

        // Verify project ownership first
        const project = await ensureProjectOwnership(project_id);
        if (!project) {
          return apiError('NOT_FOUND', 'Project not found');
        }

        // Get interview session with image analysis
        const { data: session } = await selectInterviewSession(
          supabase,
          project_id
        );

        // Type assertion for session data
        type SessionData = {
          image_analysis?: ImageAnalysisResult;
          questions?: StoredQuestion[];
          generated_content?: Record<string, unknown>;
        };
        const sessionData = session as SessionData | null;

        const imageAnalysis = (sessionData?.image_analysis || {}) as ImageAnalysisResult;
        const existingQuestions = (sessionData?.questions || []) as StoredQuestion[];

        if (existingQuestions.length > 0) {
          return apiSuccess({ questions: existingQuestions });
        }

        const questions = await generateInterviewQuestions(imageAnalysis, {
          business_name: contractor.business_name || 'Masonry Contractor',
          city: contractor.city || '',
          state: contractor.state || '',
          services: contractor.services || [],
        });

        // Persist questions so the interview steps stay consistent.
        await upsertInterviewSession(supabase, {
          project_id,
          image_analysis: (sessionData?.image_analysis ?? null) as unknown as Json | null,
          questions: questions as unknown as Json,
          status: 'in_progress',
        });

        return apiSuccess({ questions });
      }

      case 'responses': {
        const parsed = persistResponsesSchema.safeParse(body);
        if (!parsed.success) {
          return apiError('VALIDATION_ERROR', 'Invalid request', {
            errors: parsed.error.flatten().fieldErrors,
          });
        }

        const { project_id, responses } = parsed.data;

        // Verify project ownership first
        const project = await ensureProjectOwnership(project_id);
        if (!project) {
          return apiError('NOT_FOUND', 'Project not found');
        }

        // Get existing session to preserve metadata
        const { data: session } = await selectInterviewSession(
          supabase,
          project_id
        );

        type ResponseSessionData = {
          image_analysis?: ImageAnalysisResult;
          questions?: StoredQuestion[];
        };
        const sessionData = session as ResponseSessionData | null;
        const existingQuestions = (sessionData?.questions || []) as StoredQuestion[];
        const mergedQuestions = mergeInterviewResponses(existingQuestions, responses);

        await upsertInterviewSession(supabase, {
          project_id,
          image_analysis: (sessionData?.image_analysis ?? null) as unknown as Json | null,
          questions: mergedQuestions as unknown as Json,
          status: 'in_progress',
        });

        return apiSuccess({ questions: mergedQuestions });
      }

      case 'content': {
        const parsed = generateContentSchema.safeParse(body);
        if (!parsed.success) {
          return apiError('VALIDATION_ERROR', 'Invalid request', {
            errors: parsed.error.flatten().fieldErrors,
          });
        }

        const { project_id } = parsed.data;

        // Verify project ownership first
        const project = await ensureProjectOwnership(project_id);
        if (!project) {
          return apiError('NOT_FOUND', 'Project not found');
        }

        // Get interview session (may be empty if text-mode responses are provided)
        const { data: session, error: sessionError } = await selectInterviewSession(
          supabase,
          project_id
        );

        // Type assertion for session data
        type ContentSessionData = {
          image_analysis?: ImageAnalysisResult;
          questions?: StoredQuestion[];
          generated_content?: Record<string, unknown>;
        };
        const sessionData = session as ContentSessionData | null;

        const imageAnalysis = (sessionData?.image_analysis || {}) as ImageAnalysisResult;

        let interviewResponses: Array<{ question: string; answer: string }> = [];

        const providedResponses = parsed.data.responses;

        if (providedResponses && providedResponses.length > 0) {
          interviewResponses = providedResponses.map((r) => ({
            question: r.question_text,
            answer: r.answer,
          }));

          // Persist text responses into the interview session for consistency.
          const existingQuestions = (sessionData?.questions ?? []) as StoredQuestion[];
          const mergedQuestions = mergeInterviewResponses(existingQuestions, providedResponses);

          await upsertInterviewSession(supabase, {
            project_id,
            image_analysis: (sessionData?.image_analysis ?? null) as unknown as Json | null,
            questions: mergedQuestions as unknown as Json,
            status: 'in_progress',
          });
        } else {
          if (sessionError || !sessionData) {
            return apiError('NOT_FOUND', 'Interview session not found. Please complete the interview first.');
          }

          const questions = sessionData.questions ?? [];
          interviewResponses = questions
            .filter((q): q is typeof q & { text: string; answer: string } =>
              typeof q.text === 'string' && typeof q.answer === 'string'
            )
            .map((q) => ({
              question: q.text,
              answer: q.answer,
            }));
        }

        if (interviewResponses.length === 0) {
          return apiError('VALIDATION_ERROR', 'No interview responses found. Please answer the interview questions first.');
        }

        const result = await generatePortfolioContent(imageAnalysis, interviewResponses, {
          business_name: contractor.business_name || 'Masonry Contractor',
          city: contractor.city || '',
          state: contractor.state || '',
          services: contractor.services || [],
        });

        if ('error' in result) {
          return apiError('AI_SERVICE_ERROR', result.error);
        }

        // Store generated content in session
        await updateInterviewSession(supabase, project_id, {
          generated_content: result as unknown as Json,
          status: 'completed',
        });

        // Track interview completion KPI
        // Fire-and-forget: don't block response on tracking
        trackInterviewCompleted({
          contractorId: contractor.id,
          projectId: project_id,
          questionCount: interviewResponses.length,
          contentLength: (result.description?.length || 0) + (result.title?.length || 0),
        }).catch((err) => console.error('[KPI] trackInterviewCompleted failed:', err));

        // Update project with generated content
        await updateProject(supabase, project_id, {
          title: result.title,
          description: result.description,
          seo_title: result.seo_title,
          seo_description: result.seo_description,
          tags: result.tags,
          materials: result.materials,
          techniques: result.techniques,
        });

        return apiSuccess({ content: result });
      }

      case 'regenerate': {
        const parsed = regenerateSchema.safeParse(body);
        if (!parsed.success) {
          return apiError('VALIDATION_ERROR', 'Invalid request', {
            errors: parsed.error.flatten().fieldErrors,
          });
        }

        const { project_id, feedback, previous_content } = parsed.data;

        // Verify project ownership first
        const project = await ensureProjectOwnership(project_id);
        if (!project) {
          return apiError('NOT_FOUND', 'Project not found');
        }

        // Get existing session with generated content (optional if previous_content provided)
        const { data: session, error: sessionError } = await selectInterviewSession(
          supabase,
          project_id
        );

        // Type assertion for regenerate session data
        type RegenerateSessionData = {
          generated_content?: {
            title: string;
            description: string;
            seo_title: string;
            seo_description: string;
            tags: string[];
            materials: string[];
            techniques: string[];
          };
        };
        const sessionData = session as RegenerateSessionData | null;

        const rawPreviousContent = previous_content ?? sessionData?.generated_content;

        if (!rawPreviousContent) {
          return apiError('NOT_FOUND', 'No previous content to regenerate. Please generate content first.');
        }

        // Normalize to ensure all required fields have values
        const previousContent = {
          title: rawPreviousContent.title,
          description: rawPreviousContent.description,
          seo_title: rawPreviousContent.seo_title ?? rawPreviousContent.title,
          seo_description: rawPreviousContent.seo_description ?? rawPreviousContent.description.slice(0, 160),
          tags: rawPreviousContent.tags ?? [],
          materials: rawPreviousContent.materials ?? [],
          techniques: rawPreviousContent.techniques ?? [],
        };

        const result = await regenerateWithFeedback(previousContent, feedback, {
          business_name: contractor.business_name || 'Masonry Contractor',
          city: contractor.city || '',
          state: contractor.state || '',
          services: contractor.services || [],
        });

        if ('error' in result) {
          return apiError('AI_SERVICE_ERROR', result.error);
        }

        // Track content regeneration KPI
        // Fire-and-forget: don't block response on tracking
        trackContentRegenerated({
          contractorId: contractor.id,
          projectId: project_id,
          section: 'all',
          feedbackProvided: feedback.length > 0,
        }).catch((err) => console.error('[KPI] trackContentRegenerated failed:', err));

        // Update session with new content if it exists
        if (!sessionError && sessionData) {
          await updateInterviewSession(supabase, project_id, {
            generated_content: result as unknown as Json,
          });
        }

        await updateProject(supabase, project_id, {
          title: result.title,
          description: result.description,
          seo_title: result.seo_title,
          seo_description: result.seo_description,
          tags: result.tags,
          materials: result.materials,
          techniques: result.techniques,
        });

        return apiSuccess({ content: result });
      }

      default:
        return apiError('VALIDATION_ERROR', `Unknown action: ${action}`);
    }
  } catch (error) {
    return handleApiError(error);
  }
}
