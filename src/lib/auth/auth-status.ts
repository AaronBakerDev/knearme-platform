import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { selectBusinessById } from '@/lib/supabase/typed-queries';
import { logger } from '@/lib/logging';

export type AuthStatus = {
  isAuthenticated: boolean;
  hasCompleteProfile: boolean;
};

export type AuthCta = {
  href: string;
  label: string;
};

export const getAuthStatus = cache(async (): Promise<AuthStatus> => {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { isAuthenticated: false, hasCompleteProfile: false };
  }

  const { data: business, error: businessError } = await selectBusinessById(supabase, user.id);

  if (businessError) {
    logger.error('[getAuthStatus] Failed to load business profile', { error: businessError });
  }

  const hasCompleteProfile = Boolean(
    business?.name &&
      business?.city &&
      business?.state &&
      business?.services?.length &&
      business?.address &&
      business?.phone
  );

  return { isAuthenticated: true, hasCompleteProfile };
});

export function getAuthCta(authStatus: AuthStatus): AuthCta | null {
  if (!authStatus.isAuthenticated) {
    return null;
  }

  if (!authStatus.hasCompleteProfile) {
    return { href: '/profile/setup', label: 'Finish Profile' };
  }

  return { href: '/dashboard', label: 'Go to Dashboard' };
}
