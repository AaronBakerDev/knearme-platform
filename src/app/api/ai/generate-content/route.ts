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
import { requireAuth, isAuthError } from '@/lib/api/auth';
import { apiError, apiSuccess, handleApiError } from '@/lib/api/errors';
import {
  generateInterviewQuestions,
  generatePortfolioContent,
  regenerateWithFeedback,
} from '@/lib/ai/content-generation';
import type { ImageAnalysisResult } from '@/lib/ai/image-analysis';

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
 * Request schema for regenerating with feedback.
 */
const regenerateSchema = z.object({
  project_id: z.string().uuid(),
  feedback: z.string().min(10).max(500),
});

/**
 * POST /api/ai/generate-content
 *
 * Generate portfolio content based on interview responses.
 * The action query param determines what to generate:
 * - ?action=questions - Generate interview questions from image analysis
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
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select('id, contractor_id')
          .eq('id', project_id)
          .eq('contractor_id', contractor.id)
          .single();

        if (projectError || !project) {
          return apiError('NOT_FOUND', 'Project not found');
        }

        // Get interview session with image analysis
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: session } = await (supabase as any)
          .from('interview_sessions')
          .select('*')
          .eq('project_id', project_id)
          .single();

        // Type assertion for session data
        type SessionData = {
          image_analysis?: ImageAnalysisResult;
          questions?: Array<{ text: string; answer: string }>;
          generated_content?: Record<string, unknown>;
        };
        const sessionData = session as SessionData | null;

        const imageAnalysis = (sessionData?.image_analysis || {}) as ImageAnalysisResult;

        const questions = await generateInterviewQuestions(imageAnalysis, {
          business_name: contractor.business_name || 'Masonry Contractor',
          city: contractor.city || '',
          state: contractor.state || '',
          services: contractor.services || [],
        });

        return apiSuccess({ questions });
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
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select('id, contractor_id')
          .eq('id', project_id)
          .eq('contractor_id', contractor.id)
          .single();

        if (projectError || !project) {
          return apiError('NOT_FOUND', 'Project not found');
        }

        // Get interview session (may be empty if text-mode responses are provided)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: session, error: sessionError } = await (supabase as any)
          .from('interview_sessions')
          .select('*')
          .eq('project_id', project_id)
          .single();

        // Type assertion for session data
        type ContentSessionData = {
          image_analysis?: ImageAnalysisResult;
          questions?: Array<{ id: string; text: string; answer: string }>;
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
          const existingQuestions = sessionData?.questions ?? [];
          const filteredExisting = existingQuestions.filter(
            (q) => !providedResponses.some((r) => r.question_id === q.id)
          );
          const mergedQuestions = [
            ...filteredExisting,
            ...providedResponses.map((r) => ({
              id: r.question_id,
              text: r.question_text,
              answer: r.answer,
            })),
          ];

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from('interview_sessions')
            .upsert(
              {
                project_id,
                image_analysis: sessionData?.image_analysis ?? null,
                questions: mergedQuestions,
                status: 'in_progress',
              },
              { onConflict: 'project_id' }
            );
        } else {
          if (sessionError || !sessionData) {
            return apiError('NOT_FOUND', 'Interview session not found. Please complete the interview first.');
          }

          const questions = sessionData.questions ?? [];
          interviewResponses = questions.map((q) => ({
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('interview_sessions')
          .update({
            generated_content: result,
            status: 'completed',
          })
          .eq('project_id', project_id);

        // Update project with generated content
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('projects')
          .update({
            title: result.title,
            description: result.description,
            seo_title: result.seo_title,
            seo_description: result.seo_description,
            tags: result.tags,
            materials: result.materials,
            techniques: result.techniques,
          })
          .eq('id', project_id);

        return apiSuccess({ content: result });
      }

      case 'regenerate': {
        const parsed = regenerateSchema.safeParse(body);
        if (!parsed.success) {
          return apiError('VALIDATION_ERROR', 'Invalid request', {
            errors: parsed.error.flatten().fieldErrors,
          });
        }

        const { project_id, feedback } = parsed.data;

        // Verify project ownership first
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select('id, contractor_id')
          .eq('id', project_id)
          .eq('contractor_id', contractor.id)
          .single();

        if (projectError || !project) {
          return apiError('NOT_FOUND', 'Project not found');
        }

        // Get existing session with generated content
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: session, error: sessionError } = await (supabase as any)
          .from('interview_sessions')
          .select('*')
          .eq('project_id', project_id)
          .single();

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

        if (sessionError || !sessionData?.generated_content) {
          return apiError('NOT_FOUND', 'No previous content to regenerate. Please generate content first.');
        }

        const previousContent = sessionData.generated_content;

        const result = await regenerateWithFeedback(previousContent, feedback, {
          business_name: contractor.business_name || 'Masonry Contractor',
          city: contractor.city || '',
          state: contractor.state || '',
          services: contractor.services || [],
        });

        if ('error' in result) {
          return apiError('AI_SERVICE_ERROR', result.error);
        }

        // Update session and project with new content
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('interview_sessions')
          .update({ generated_content: result })
          .eq('project_id', project_id);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('projects')
          .update({
            title: result.title,
            description: result.description,
            seo_title: result.seo_title,
            seo_description: result.seo_description,
            tags: result.tags,
            materials: result.materials,
            techniques: result.techniques,
          })
          .eq('id', project_id);

        return apiSuccess({ content: result });
      }

      default:
        return apiError('VALIDATION_ERROR', `Unknown action: ${action}`);
    }
  } catch (error) {
    return handleApiError(error);
  }
}
