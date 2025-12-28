'use client';

/**
 * Create Project Page - Full-screen chat-based AI-powered project creation.
 *
 * Immersive ChatGPT-style interface for gathering project info
 * and generating portfolio content.
 *
 * Design: "Void Interface" - minimal chrome, floating elements,
 * conversation suspended in deep dark space.
 *
 * EAGER CREATION PATTERN:
 * Project is created when user sends their first message. This enables
 * immediate session persistence and context continuity. The conversation
 * is saved to the database from the start.
 *
 * Flow:
 * 1. First message - TRIGGERS PROJECT CREATION + session persistence
 * 2. Chat conversation - Gather project details (persisted to DB)
 * 3. Image upload - Images attached to existing project
 * 4. AI Analysis - Analyze images with conversation context
 * 5. Content Generation - Generate portfolio content
 * 6. Review & Publish - Approve and publish
 *
 * @see /src/components/chat/ChatWizard.tsx for the main component
 * @see /docs/02-requirements/user-journeys.md J2
 */

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChatWizard } from '@/components/chat';
import { toast } from 'sonner';

/**
 * CreateProjectPage - Full-screen chat-based project creation wizard.
 *
 * Uses EAGER CREATION: project is created when user sends first message.
 * This enables immediate session persistence for context continuity.
 */
export default function CreateProjectPage() {
  const router = useRouter();
  // Start with null - project created eagerly on first user message
  const [projectId, setProjectId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Prevent duplicate project creation (e.g., rapid double-upload)
  const isCreatingRef = useRef(false);
  const createdProjectIdRef = useRef<string | null>(null);

  /**
   * Ensure a project exists, creating one if necessary.
   * Called by ChatWizard before operations that require a projectId.
   *
   * Uses refs to prevent duplicate creation on rapid calls.
   * Returns the projectId (existing or newly created).
   */
  const ensureProject = useCallback(async (): Promise<string> => {
    // If we already have a project ID, return it immediately
    if (createdProjectIdRef.current) {
      return createdProjectIdRef.current;
    }

    // If already creating, wait for it to complete
    if (isCreatingRef.current) {
      // Poll until creation completes (simple approach)
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (createdProjectIdRef.current) {
            clearInterval(checkInterval);
            resolve(createdProjectIdRef.current);
          }
        }, 100);
        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error('Project creation timed out'));
        }, 10000);
      });
    }

    isCreatingRef.current = true;

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'draft' }),
      });

      const rawBody = await response.text();
      let data: unknown = null;
      if (rawBody) {
        try {
          data = JSON.parse(rawBody);
        } catch {
          data = rawBody;
        }
      }

      if (!response.ok) {
        let message = 'Failed to create project';
        const errorPayload = (data as { error?: unknown })?.error;
        if (typeof errorPayload === 'string') {
          message = errorPayload;
        } else if (errorPayload && typeof errorPayload === 'object') {
          const errorObject = errorPayload as { message?: string; requestId?: string };
          if (errorObject.message) {
            message = errorObject.message;
          } else {
            try {
              message = JSON.stringify(errorPayload);
            } catch {
              message = 'Failed to create project';
            }
          }
          if (errorObject.requestId) {
            message = `${message} (ref: ${errorObject.requestId})`;
          }
        } else if (typeof data === 'string' && data.trim().length > 0) {
          message = data;
        } else if ((data as { message?: string })?.message) {
          message = (data as { message?: string }).message ?? message;
        }
        throw new Error(message);
      }

      const dataObj = data as { project?: { id?: string } } | null;
      const newProjectId = dataObj?.project?.id;

      if (!newProjectId) {
        throw new Error('Project created but no ID returned');
      }

      // Store in both ref (for sync access) and state (for React updates)
      createdProjectIdRef.current = newProjectId;
      setProjectId(newProjectId);

      return newProjectId;
    } catch (err) {
      console.error('[CreateProjectPage] Failed to create project:', err);
      setError(err instanceof Error ? err.message : 'Failed to create project');
      throw err;
    } finally {
      isCreatingRef.current = false;
    }
  }, []);

  /**
   * Handle wizard completion.
   */
  const handleComplete = (id: string) => {
    toast.success('Project created successfully!');
    router.push(`/projects/${id}/edit`);
  };

  /**
   * Handle wizard cancellation.
   * Only deletes project if one was created (lazy creation means it might not exist).
   */
  const handleCancel = () => {
    // Only delete if we actually created a project
    const idToDelete = createdProjectIdRef.current;
    if (idToDelete) {
      fetch(`/api/projects/${idToDelete}`, { method: 'DELETE' }).catch(() => {
        // Ignore deletion errors
      });
    }
    router.push('/projects');
  };

  // Error state - centered with back button
  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={() => router.push('/projects')}>
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-0 flex flex-col">
      {/* Full-screen chat - projectId may be null initially (lazy creation) */}
      <ChatWizard
        projectId={projectId}
        onEnsureProject={ensureProject}
        onComplete={handleComplete}
        onCancel={handleCancel}
        className="flex-1"
      />
    </div>
  );
}
