/**
 * Full-screen layout for chat-based project creation.
 *
 * Overrides the default contractor layout to provide an immersive,
 * ChatGPT-style experience without navigation chrome or container constraints.
 *
 * Key differences from parent layout:
 * - No header navigation
 * - Full viewport height/width
 * - No container constraints
 *
 * @see /src/app/(contractor)/layout.tsx for parent layout
 * @see /docs/03-architecture/ui-patterns.md for design decisions
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
    <div className="h-screen w-screen overflow-hidden bg-background">
      {children}
    </div>
  );
}
