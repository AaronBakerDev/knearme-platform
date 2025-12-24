/**
 * Image Analysis API - Analyze project photos using GPT-4V.
 *
 * POST /api/ai/analyze-images
 *
 * Analyzes uploaded project images to detect:
 * - Project type (chimney, tuckpointing, etc.)
 * - Materials used
 * - Techniques demonstrated
 * - Before/after/progress stage
 *
 * @see /docs/03-architecture/c4-container.md for AI pipeline flow
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth, isAuthError, getAuthClient } from '@/lib/api/auth';
import { apiError, apiSuccess, handleApiError } from '@/lib/api/errors';
import { analyzeProjectImages, projectTypeToSlug } from '@/lib/ai/image-analysis';
import { getPublicUrl } from '@/lib/storage/upload';

/**
 * Request schema for image analysis.
 */
const analyzeImagesSchema = z.object({
  /** Project ID to analyze images for */
  project_id: z.string().uuid(),
});

/**
 * POST /api/ai/analyze-images
 *
 * Analyze images for a project and return detection results.
 * Also generates contextual interview questions.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) {
      return apiError(auth.type === 'UNAUTHORIZED' ? 'UNAUTHORIZED' : 'FORBIDDEN', auth.message);
    }

    const { contractor } = auth;

    // Parse request
    const body = await request.json();
    const parsed = analyzeImagesSchema.safeParse(body);

    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid request', {
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { project_id } = parsed.data;

    // Use auth-appropriate client (admin for bearer, regular for session)
    const supabase = await getAuthClient(auth);

    // Step 1: Verify project ownership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: projectData, error: projectError } = await (supabase as any)
      .from('projects')
      .select('id, contractor_id')
      .eq('id', project_id)
      .eq('contractor_id', contractor.id)
      .single();

    if (projectError || !projectData) {
      console.error('[analyze-images] Project query failed:', {
        project_id,
        contractor_id: contractor.id,
        error: projectError,
      });
      return apiError('NOT_FOUND', 'Project not found');
    }

    // Step 2: Get images separately (avoids nested RLS issues)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: imagesData, error: imagesError } = await (supabase as any)
      .from('project_images')
      .select('id, storage_path, display_order')
      .eq('project_id', project_id)
      .order('display_order', { ascending: true });

    if (imagesError) {
      console.error('[analyze-images] Images query failed:', {
        project_id,
        error: imagesError,
      });
    }

    type ProjectImage = { id: string; storage_path: string; display_order: number | null };
    const images = (imagesData || []) as ProjectImage[];

    if (!images || images.length === 0) {
      return apiError('VALIDATION_ERROR', 'No images to analyze. Please upload photos first.');
    }

    // Get public URLs for images (already sorted by display_order from query)
    const imageUrls = images.map((img) => getPublicUrl('project-images', img.storage_path));

    // Analyze images with GPT-4V
    const analysisResult = await analyzeProjectImages(imageUrls);

    if ('error' in analysisResult) {
      return apiError('AI_SERVICE_ERROR', analysisResult.error);
    }

    // Store analysis in interview session
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: session, error: sessionError } = await (supabase as any)
      .from('interview_sessions')
      .upsert(
        {
          project_id,
          image_analysis: analysisResult,
          status: 'in_progress',
        },
        {
          onConflict: 'project_id',
        }
      )
      .select('*')
      .single();

    if (sessionError) {
      console.error('[POST /api/ai/analyze-images] Session error:', sessionError);
      // Don't fail - analysis still succeeded
    }

    // Update project with detected type if high confidence
    if (analysisResult.project_type_confidence > 0.7) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('projects')
        .update({
          project_type: analysisResult.project_type,
          project_type_slug: projectTypeToSlug(analysisResult.project_type),
          materials: analysisResult.materials,
          techniques: analysisResult.techniques,
        })
        .eq('id', project_id);
    }

    // Store generated alt texts in project_images table
    // Images are keyed by index ("0", "1", etc.) matching the order they were analyzed
    if (analysisResult.image_alt_texts && Object.keys(analysisResult.image_alt_texts).length > 0) {
      const altTextUpdates = images.map((img, index) => {
        const altText = analysisResult.image_alt_texts[String(index)];
        if (altText) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (supabase as any)
            .from('project_images')
            .update({ alt_text: altText })
            .eq('id', img.id);
        }
        return null;
      }).filter(Boolean);

      // Execute all alt text updates in parallel
      await Promise.all(altTextUpdates);
    }

    return apiSuccess({
      analysis: analysisResult,
      session_id: session?.id,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
