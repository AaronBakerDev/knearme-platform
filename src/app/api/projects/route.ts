/**
 * Projects API - List and Create operations.
 *
 * GET  /api/projects - List contractor's projects (with pagination)
 * POST /api/projects - Create a new draft project
 *
 * @see /docs/04-apis/api-design.md
 * @see /supabase/migrations/001_initial_schema.sql for RLS policies
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isAuthError } from '@/lib/api/auth';
import { apiError, apiSuccess, apiCreated, handleApiError } from '@/lib/api/errors';
import { slugify } from '@/lib/utils/slugify';
import type { Project, ProjectWithImages } from '@/types/database';

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
    const auth = await requireAuth();
    if (isAuthError(auth)) {
      return apiError(auth.type === 'UNAUTHORIZED' ? 'UNAUTHORIZED' : 'FORBIDDEN', auth.message);
    }

    const { contractor } = auth;
    const { searchParams } = new URL(request.url);

    // Parse query params
    const status = searchParams.get('status') as Project['status'] | null;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    const supabase = await createClient();

    // Build query - RLS automatically filters to this contractor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('projects')
      .select('*, project_images(*)', { count: 'exact' })
      .eq('contractor_id', contractor.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply status filter if provided
    if (status && ['draft', 'published', 'archived'].includes(status)) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[GET /api/projects] Query error:', error);
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
    const auth = await requireAuth();
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

    const { title, description, project_type, city } = parsed.data;

    // Generate slugs for SEO routing
    const projectCity = city ?? contractor.city ?? 'unknown';
    const citySlug = slugify(`${projectCity}-${contractor.state ?? ''}`);
    const projectTypeSlug = project_type ? slugify(project_type) : null;

    // Generate unique slug for the project URL
    const timestamp = Date.now().toString(36);
    const baseSlug = title ? slugify(title) : `project-${timestamp}`;
    const uniqueSlug = `${baseSlug}-${timestamp}`;

    const supabase = await createClient();

    // Create the project - RLS ensures contractor_id matches auth
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: project, error } = await (supabase as any)
      .from('projects')
      .insert({
        contractor_id: contractor.id,
        title: title ?? null,
        description: description ?? null,
        project_type: project_type ?? null,
        project_type_slug: projectTypeSlug,
        city: projectCity,
        city_slug: citySlug,
        slug: uniqueSlug,
        status: 'draft',
      })
      .select('*')
      .single();

    if (error) {
      console.error('[POST /api/projects] Insert error:', error);
      return handleApiError(error);
    }

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
