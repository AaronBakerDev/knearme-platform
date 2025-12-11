import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isAuthError } from '@/lib/api/auth';
import { apiError, apiSuccess, handleApiError } from '@/lib/api/errors';

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  p256dh_key: z.string().min(1),
  auth_key: z.string().min(1),
  user_agent: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) {
      return apiError(auth.type === 'UNAUTHORIZED' ? 'UNAUTHORIZED' : 'FORBIDDEN', auth.message);
    }

    const body = await request.json();
    const parsed = subscriptionSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid subscription payload', {
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { contractor, user } = auth;
    const { endpoint, p256dh_key, auth_key, user_agent } = parsed.data;
    const supabase = await createClient();

    // Type assertion needed due to RLS type inference issues with new tables
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('push_subscriptions')
      .upsert(
        {
          contractor_id: contractor.id,
          endpoint,
          p256dh_key,
          auth_key,
          user_agent: user_agent ?? null,
        },
        { onConflict: 'endpoint' }
      )
      .select('id')
      .single();

    if (error) {
      return handleApiError(error, {
        route: '/api/notifications/subscribe',
        method: 'POST',
        userId: user.id,
      });
    }

    return apiSuccess(
      { subscriptionId: data?.id ?? null },
      201
    );
  } catch (error) {
    return handleApiError(error, {
      route: '/api/notifications/subscribe',
      method: 'POST',
    });
  }
}
