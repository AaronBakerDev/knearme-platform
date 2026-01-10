/**
 * Projects API - List and Create operations.
 *
 * GET  /api/projects - List contractor's projects (with pagination)
 * POST /api/projects - Create a new draft project
 *
 * @see /docs/04-apis/api-design.md
 * @see /supabase/migrations/001_initial_schema.sql for RLS policies
 */

import { randomUUID } from 'crypto';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuthUnified, isAuthError, getAuthClient } from '@/lib/api/auth';
import { apiError, apiSuccess, apiCreated, handleApiError } from '@/lib/api/errors';
import { slugify } from '@/lib/utils/slugify';
import { composeProjectDescription } from '@/lib/projects/compose-description';
import { trackProjectCreated } from '@/lib/observability/kpi-events';
import { logger } from '@/lib/logging';
import type { Project, ProjectInsert, ProjectWithImages } from '@/types/database';

/**
 * Validation schema for creating a project.
 * Most fields are optional as they're populated during the AI interview.
 */
const createProjectSchema = z.object({
  /** Optional title (AI will generate if not provided) */
  title: z.string().max(200).optional(),
  /** Optional description (AI will generate) */
  description: z.string().max(5000).optional(),
  /** Project type detected from images or selected */
  project_type: z.string().max(100).optional(),
  /** City for this project (defaults to contractor's city) */
  city: z.string().max(100).optional(),
  /** State for this project (defaults to contractor's state) */
  state: z.string().max(50).optional(),
  /** Case-study narrative fields */
  summary: z.string().max(500).optional(),
  challenge: z.string().max(2000).optional(),
  solution: z.string().max(2000).optional(),
  results: z.string().max(2000).optional(),
  outcome_highlights: z.array(z.string()).optional(),
});

/**
 * GET /api/projects
 *
 * List the authenticated contractor's projects.
 * Supports pagination and status filtering.
 *
 * Query params:
 * - status: 'draft' | 'published' | 'archived' (optional)
 * - limit: number (default: 20, max: 100)
 * - offset: number (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthUnified();
    if (isAuthError(auth)) {
      logger.warn('[GET /api/projects] Auth failed', {
        type: auth.type,
        message: auth.message,
      });
      return apiError(auth.type === 'UNAUTHORIZED' ? 'UNAUTHORIZED' : 'FORBIDDEN', auth.message);
    }

    logger.info('[GET /api/projects] Auth success', {
      contractorId: auth.contractor.id,
      businessName: auth.contractor.business_name,
      authMethod: auth.authMethod,
    });

    const { contractor } = auth;
    const { searchParams } = new URL(request.url);

    // Parse query params
    const status = searchParams.get('status') as Project['status'] | null;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    const supabase = await getAuthClient(auth);

    // Build query - RLS automatically filters to this contractor
    // Use explicit relationship hint due to hero_image_id FK ambiguity
    let query = supabase
      .from('projects')
      .select('*, project_images!project_images_project_id_fkey(*)', { count: 'exact' })
      .eq('contractor_id', contractor.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply status filter if provided
    if (status && ['draft', 'published', 'archived'].includes(status)) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error('[GET /api/projects] Query error', { error });
      return handleApiError(error);
    }

    return apiSuccess({
      projects: data as ProjectWithImages[],
      total: count ?? 0,
      limit,
      offset,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/projects
 *
 * Create a new draft project for the authenticated contractor.
 * Returns the created project with an empty images array.
 *
 * The typical flow:
 * 1. Create project (this endpoint)
 * 2. Upload images to /api/projects/[id]/images
 * 3. Start AI interview at /api/projects/[id]/interview
 * 4. Update with AI-generated content
 * 5. Publish at /api/projects/[id]/publish
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthUnified();
    if (isAuthError(auth)) {
      return apiError(auth.type === 'UNAUTHORIZED' ? 'UNAUTHORIZED' : 'FORBIDDEN', auth.message);
    }

    const { contractor } = auth;

    // Parse and validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      body = {}; // Allow empty body for draft creation
    }

    const parsed = createProjectSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid project data', {
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const {
      title,
      description,
      project_type,
      city,
      state,
      summary,
      challenge,
      solution,
      results,
      outcome_highlights,
    } = parsed.data;

    // Generate slugs for SEO routing
    const projectCity = city ?? contractor.city ?? 'unknown';
    const projectState = state ?? contractor.state ?? null;
    const citySlug = slugify(`${projectCity}-${projectState ?? ''}`);
    const projectTypeSlug = project_type ? slugify(project_type) : null;

    // Generate unique slug for the project URL
    const slugSeed = randomUUID().split('-')[0];
    const baseSlug = title ? slugify(title) : 'project';
    const safeBaseSlug = baseSlug || 'project';
    const uniqueSlug = `${safeBaseSlug}-${slugSeed}`;

    const descriptionManual = typeof description !== 'undefined' && description !== null;
    const composedDescription = composeProjectDescription({
      summary,
      challenge,
      solution,
      results,
      outcome_highlights,
    });
    const descriptionValue = description ?? composedDescription ?? null;

    const supabase = await getAuthClient(auth);

    // Create the project - RLS ensures contractor_id matches auth
    const insertPayload: ProjectInsert = {
      contractor_id: contractor.id,
      // During migration, business_id matches contractor.id (see related route ownership check).
      business_id: contractor.id,
      title: title ?? null,
      description: descriptionValue,
      description_manual: descriptionManual,
      project_type: project_type ?? null,
      project_type_slug: projectTypeSlug,
      city: projectCity,
      state: projectState,
      city_slug: citySlug,
      slug: uniqueSlug,
      status: 'draft',
      summary: summary ?? null,
      challenge: challenge ?? null,
      solution: solution ?? null,
      results: results ?? null,
      outcome_highlights: outcome_highlights ?? null,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: project, error } = await (supabase as any)
      .from('projects')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error) {
      logger.error('[POST /api/projects] Insert error', { error });
      return handleApiError(error);
    }

    // Track project creation for time-to-publish KPI
    // Fire-and-forget: don't block response on tracking
    trackProjectCreated({
      contractorId: contractor.id,
      projectId: project.id,
    }).catch((err) => logger.error('[KPI] trackProjectCreated failed', { error: err }));

    // Return with empty images array to match ProjectWithImages type
    const projectWithImages: ProjectWithImages = {
      ...project,
      project_images: [],
    };

    return apiCreated({ project: projectWithImages });
  } catch (error) {
    return handleApiError(error);
  }
}
