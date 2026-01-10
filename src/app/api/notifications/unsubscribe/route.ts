import { NextRequest } from 'next/server';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isAuthError } from '@/lib/api/auth';
import { apiError, apiSuccess, handleApiError } from '@/lib/api/errors';
import type { Database } from '@/types/database';

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) {
      return apiError(auth.type === 'UNAUTHORIZED' ? 'UNAUTHORIZED' : 'FORBIDDEN', auth.message);
    }

    const body = await request.json();
    const parsed = unsubscribeSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid unsubscribe payload', {
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { contractor, user } = auth;
    const supabase = (await createClient()) as SupabaseClient<Database>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing, error: fetchError } = await (supabase as any)
      .from('push_subscriptions')
      .select('id')
      .eq('contractor_id', contractor.id)
      .eq('endpoint', parsed.data.endpoint)
      .single();

    // PGRST116 indicates no rows found in Supabase
    if (fetchError && fetchError.code !== 'PGRST116') {
      return handleApiError(fetchError, {
        route: '/api/notifications/unsubscribe',
        method: 'POST',
        userId: user.id,
      });
    }

    if (!existing) {
      return apiError('NOT_FOUND', 'Subscription not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('push_subscriptions')
      .delete()
      .eq('id', existing.id);

    if (error) {
      return handleApiError(error, {
        route: '/api/notifications/unsubscribe',
        method: 'POST',
        userId: user.id,
      });
    }

    return apiSuccess({ success: true });
  } catch (error) {
    return handleApiError(error, {
      route: '/api/notifications/unsubscribe',
      method: 'POST',
    });
  }
}
