'use client';

/**
 * New Project Page - Eager Creation + Redirect.
 *
 * Creates a draft project immediately and redirects to the unified
 * project workspace at /projects/[id].
 *
 * This is the "project-first" pattern: user picks to create a new project,
 * we create it, then they enter the same workspace as editing an existing project.
 *
 * @see /src/app/(dashboard)/projects/[id]/page.tsx for unified workspace
 * @see /src/lib/chat/project-state.ts for state derivation
 */

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logging';

export default function NewProjectPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(true);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    // Prevent double-creation in React StrictMode
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    async function createAndRedirect() {
      try {
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'draft' }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error?.message || data.message || 'Failed to create project');
        }

        const data = await response.json();
        const projectId = data.project?.id;

        if (!projectId) {
          throw new Error('Project created but no ID returned');
        }

        // Redirect to unified workspace
        router.replace(`/projects/${projectId}`);
      } catch (err) {
        logger.error('[NewProjectPage] Failed to create project', { error: err });
        setError(err instanceof Error ? err.message : 'Failed to create project');
        setIsCreating(false);
      }
    }

    createAndRedirect();
  }, [router]);

  // Error state
  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-destructive text-center">{error}</p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setError(null);
              setIsCreating(true);
              hasStartedRef.current = false;
            }}
          >
            Try Again
          </Button>
          <Button variant="ghost" onClick={() => router.push('/projects')}>
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  return (
    <div className="h-full flex flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        {isCreating ? 'Creating project...' : 'Setting up workspace...'}
      </p>
    </div>
  );
}
