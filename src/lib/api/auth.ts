/**
 * Authentication utilities for API routes.
 * Provides reusable auth guards and contractor lookup.
 *
 * @see /docs/06-security/threat-model.md
 */

import { createClient } from '@/lib/supabase/server';
import type { Contractor } from '@/types/database';

export interface AuthResult {
  user: {
    id: string;
    email: string;
  };
  contractor: Contractor;
}

export interface AuthError {
  type: 'UNAUTHORIZED' | 'PROFILE_INCOMPLETE';
  message: string;
}

/**
 * Verify the user is authenticated and has a complete contractor profile.
 * Returns the user and contractor data, or an error.
 *
 * @example
 * const auth = await requireAuth();
 * if ('type' in auth) {
 *   return apiError(auth.type, auth.message);
 * }
 * const { user, contractor } = auth;
 */
export async function requireAuth(): Promise<AuthResult | AuthError> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      type: 'UNAUTHORIZED',
      message: 'Authentication required. Please log in.',
    };
  }

  // Get contractor profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: contractor, error: profileError } = await (supabase as any)
    .from('contractors')
    .select('*')
    .eq('auth_user_id', user.id)
    .single();

  // Type assertion for contractor
  const contractorData = contractor as Contractor | null;

  if (profileError || !contractorData) {
    return {
      type: 'UNAUTHORIZED',
      message: 'Contractor profile not found.',
    };
  }

  // Check profile completeness
  if (!contractorData.business_name || !contractorData.city) {
    return {
      type: 'PROFILE_INCOMPLETE',
      message: 'Please complete your profile setup.',
    };
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? '',
    },
    contractor: contractorData,
  };
}

/**
 * Check if auth result is an error.
 */
export function isAuthError(result: AuthResult | AuthError): result is AuthError {
  return 'type' in result;
}
