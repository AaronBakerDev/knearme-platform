/**
 * Single Project API - Get, Update, Delete operations.
 *
 * GET    /api/projects/[id] - Get project with images
 * PATCH  /api/projects/[id] - Update project fields
 * DELETE /api/projects/[id] - Delete project (cascades to images)
 *
 * @see /docs/04-apis/api-design.md
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';
import { requireAuthUnified, isAuthError, getAuthClient } from '@/lib/api/auth';
import { apiError, apiSuccess, handleApiError } from '@/lib/api/errors';
import { slugify } from '@/lib/utils/slugify';
import { composeProjectDescription } from '@/lib/projects/compose-description';
import { blocksToHtml, descriptionBlocksSchema, sanitizeDescriptionBlocks } from '@/lib/content/description-blocks';
import { logger } from '@/lib/logging';
import type { Project, ProjectImage, ProjectUpdate, ProjectWithImages } from '@/types/database';

/**
 * Allowed HTML tags for sanitized description content.
 * Defense-in-depth: Even if client-side sanitization is bypassed, server blocks XSS.
 * @see src/components/chat/artifacts/ContentEditor.tsx - client-side sanitization
 */
const ALLOWED_HTML_TAGS = ['p', 'strong', 'em', 'ul', 'ol', 'li', 'br'];

/**
 * Sanitize HTML content to prevent XSS attacks.
 * Used as a Zod transform for the description field.
 */
function sanitizeDescription(html: string | undefined): string | undefined {
  if (!html) return html;
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_HTML_TAGS,
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  });
}

type RouteParams = { params: Promise<{ id: string }> };

/**
 * Validation schema for updating a project.
 * All fields are optional - only provided fields are updated.
 */
const updateProjectSchema = z.object({
  title: z.string().max(200).optional(),
  // Task A1: Sanitize HTML content server-side to prevent XSS
  description: z.string().max(5000).optional().transform(sanitizeDescription),
  description_blocks: descriptionBlocksSchema.optional(),
  project_type: z.string().max(100).optional(),
  materials: z.array(z.string()).optional(),
  techniques: z.array(z.string()).optional(),
  neighborhood: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  duration: z.string().max(50).optional(),
  tags: z.array(z.string()).optional(),
  seo_title: z.string().max(70).optional(),
  seo_description: z.string().max(160).optional(),
  status: z.enum(['draft', 'archived']).optional(),
  // Case-study narrative fields (for MCP/ChatGPT integration)
  summary: z.string().max(500).optional(),
  challenge: z.string().max(2000).optional(),
  solution: z.string().max(2000).optional(),
  results: z.string().max(2000).optional(),
  outcome_highlights: z.array(z.string()).optional(),
  hero_image_id: z.string().uuid().nullable().optional(),
  client_type: z.enum(['residential', 'commercial', 'municipal', 'other']).nullable().optional(),
  budget_range: z.enum(['<5k', '5k-10k', '10k-25k', '25k-50k', '50k+']).nullable().optional(),
  description_manual: z.boolean().optional(),
});

/**
 * GET /api/projects/[id]
 *
 * Get a single project with its images.
 * RLS ensures users can only access their own projects.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthUnified();
    if (isAuthError(auth)) {
      return apiError(auth.type === 'UNAUTHORIZED' ? 'UNAUTHORIZED' : 'FORBIDDEN', auth.message);
    }

    const { id } = await params;
    const { contractor } = auth;
    const supabase = await getAuthClient(auth);

    // Use explicit relationship hint due to hero_image_id FK ambiguity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: project, error } = await (supabase as any)
      .from('projects')
      .select('*, project_images!project_images_project_id_fkey(*)')
      .eq('id', id)
      .eq('contractor_id', contractor.id)
      .single();

    if (error || !project) {
      return apiError('NOT_FOUND', 'Project not found');
    }

    return apiSuccess({ project: project as ProjectWithImages });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/projects/[id]
 *
 * Update project fields. Only provided fields are updated.
 * Automatically regenerates slugs when relevant fields change.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthUnified();
    if (isAuthError(auth)) {
      return apiError(auth.type === 'UNAUTHORIZED' ? 'UNAUTHORIZED' : 'FORBIDDEN', auth.message);
    }

    const { id } = await params;
    const { contractor } = auth;

    // Parse and validate body
    const body = await request.json();
    const parsed = updateProjectSchema.safeParse(body);

    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid update data', {
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const updates = parsed.data;
    if (typeof updates.description_blocks !== 'undefined') {
      updates.description_blocks = sanitizeDescriptionBlocks(updates.description_blocks);
    }

    if (
      typeof updates.description === 'undefined' &&
      typeof updates.description_blocks !== 'undefined'
    ) {
      updates.description = blocksToHtml(updates.description_blocks);
    }
    const supabase = await getAuthClient(auth);

    // Verify project ownership first
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing, error: fetchError } = await (supabase as any)
      .from('projects')
      .select('id, contractor_id, title, city, state, project_type, description_manual, summary, challenge, solution, results, outcome_highlights, status')
      .eq('id', id)
      .eq('contractor_id', contractor.id)
      .single();

    // Type assertion for existing project
    type ExistingProject = Pick<
      Project,
      | 'id'
      | 'contractor_id'
      | 'title'
      | 'city'
      | 'state'
      | 'project_type'
      | 'description_manual'
      | 'summary'
      | 'challenge'
      | 'solution'
      | 'results'
      | 'outcome_highlights'
      | 'status'
    >;
    const existingProject = existing as ExistingProject | null;

    if (fetchError || !existingProject) {
      return apiError('NOT_FOUND', 'Project not found');
    }

    // Build update payload with generated slugs
    const updatePayload: ProjectUpdate = { ...updates } as ProjectUpdate;

    // Regenerate city_slug if city or state changed
    const cityChanged = typeof updates.city !== 'undefined' && updates.city !== existingProject.city;
    const stateChanged = typeof updates.state !== 'undefined' && updates.state !== existingProject.state;
    if (cityChanged || stateChanged) {
      const nextCity = updates.city ?? existingProject.city ?? contractor.city ?? 'unknown';
      const nextState = updates.state ?? existingProject.state ?? contractor.state ?? '';
      updatePayload.city_slug = slugify(`${nextCity}-${nextState}`);
    }

    // Regenerate project_type_slug if project_type changed
    if (updates.project_type && updates.project_type !== existingProject.project_type) {
      updatePayload.project_type_slug = slugify(updates.project_type);
    }

    const hasDescriptionUpdate = Object.prototype.hasOwnProperty.call(updates, 'description');
    if (hasDescriptionUpdate && typeof updates.description_manual === 'undefined') {
      updatePayload.description_manual = true;
    }

    if (typeof updates.status !== 'undefined') {
      if (updates.status === 'draft' && existingProject.status !== 'archived') {
        return apiError('VALIDATION_ERROR', 'Only archived projects can be restored to draft.');
      }
      if (updates.status === 'archived') {
        updatePayload.published_at = null;
      }
    }

    const effectiveDescriptionManual =
      typeof updates.description_manual !== 'undefined'
        ? updates.description_manual
        : existingProject.description_manual ?? false;

    const narrativeUpdated = ['summary', 'challenge', 'solution', 'results', 'outcome_highlights']
      .some((field) => Object.prototype.hasOwnProperty.call(updates, field));

    if (narrativeUpdated && !effectiveDescriptionManual && !hasDescriptionUpdate) {
      const composed = composeProjectDescription({
        summary: updates.summary ?? existingProject.summary,
        challenge: updates.challenge ?? existingProject.challenge,
        solution: updates.solution ?? existingProject.solution,
        results: updates.results ?? existingProject.results,
        outcome_highlights: updates.outcome_highlights ?? existingProject.outcome_highlights,
      });
      updatePayload.description = composed;
    }

    // Update project - use explicit relationship hint due to hero_image_id FK ambiguity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: project, error: updateError } = await (supabase as any)
      .from('projects')
      .update(updatePayload)
      .eq('id', id)
      .eq('contractor_id', contractor.id)
      .select('*, project_images!project_images_project_id_fkey(*)')
      .single();

    if (updateError) {
      logger.error('[PATCH /api/projects/[id]] Update error', { error: updateError, projectId: id });
      return handleApiError(updateError);
    }

    return apiSuccess({ project: project as ProjectWithImages });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/projects/[id]
 *
 * Delete a project and all associated data.
 * CASCADE in DB handles images and interview sessions.
 * NOTE: Does NOT delete files from Supabase Storage - that's handled separately.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthUnified();
    if (isAuthError(auth)) {
      return apiError(auth.type === 'UNAUTHORIZED' ? 'UNAUTHORIZED' : 'FORBIDDEN', auth.message);
    }

    const { id } = await params;
    const { contractor } = auth;
    const supabase = await getAuthClient(auth);

    // Get image paths before deletion (for storage cleanup)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: images } = await (supabase as any)
      .from('project_images')
      .select('storage_path')
      .eq('project_id', id);

    const imagesList = (images ?? []) as Array<Pick<ProjectImage, 'storage_path'>>;

    // Delete project (cascades to images and interviews)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('contractor_id', contractor.id);

    if (error) {
      logger.error('[DELETE /api/projects/[id]] Delete error', { error, projectId: id });
      return handleApiError(error);
    }

    // Clean up storage files in background (don't block response)
    if (imagesList.length > 0) {
      const paths = imagesList.map((img) => img.storage_path);
      supabase.storage
        .from('project-images-draft')
        .remove(paths)
        .catch((err: Error) => logger.error('[Draft storage cleanup failed]', { error: err }));
      supabase.storage
        .from('project-images')
        .remove(paths)
        .catch((err: Error) => logger.error('[Public storage cleanup failed]', { error: err }));
    }

    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
