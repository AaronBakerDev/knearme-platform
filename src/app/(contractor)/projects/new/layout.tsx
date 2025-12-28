/**
 * Full-screen layout for chat-based project creation.
 *
 * Overrides the default contractor layout to provide an immersive,
 * ChatGPT-style experience without navigation chrome or container constraints.
 *
 * Uses CSS breakout pattern to escape parent's `container mx-auto`:
 * - `w-screen` sets width to 100vw (full viewport width)
 * - `margin-left: calc(50% - 50vw)` shifts element to align with viewport edge
 *
 * @see /src/app/(contractor)/layout.tsx for parent layout
 * @see /src/app/(contractor)/projects/[id]/edit/layout.tsx for similar pattern
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth check - redirect unauthenticated users
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div
      className="fixed inset-0 top-14 overflow-hidden bg-background z-10"
    >
      {children}
    </div>
  );
}
