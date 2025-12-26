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
 * Flow:
 * 1. Chat conversation - Gather project details naturally
 * 2. Image upload - Via attachment button in input
 * 3. AI Analysis - Analyze images with conversation context
 * 4. Content Generation - Generate portfolio content
 * 5. Review & Publish - Approve and publish
 *
 * @see /src/components/chat/ChatWizard.tsx for the main component
 * @see /docs/02-requirements/user-journeys.md J2
 */

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatWizard } from '@/components/chat';
import { toast } from 'sonner';

/**
 * CreateProjectPage - Full-screen chat-based project creation wizard.
 */
export default function CreateProjectPage() {
  const router = useRouter();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasCreatedRef = useRef(false);

  // Create a draft project on mount
  useEffect(() => {
    if (hasCreatedRef.current) return;
    hasCreatedRef.current = true;

    async function createDraftProject() {
      try {
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'draft' }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create project');
        }

        const data = await response.json();
        setProjectId(data.project.id);
      } catch (err) {
        console.error('[CreateProjectPage] Failed to create project:', err);
        setError(err instanceof Error ? err.message : 'Failed to create project');
      } finally {
        setIsCreating(false);
      }
    }

    createDraftProject();
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
   */
  const handleCancel = () => {
    // Optionally delete the draft project
    if (projectId) {
      fetch(`/api/projects/${projectId}`, { method: 'DELETE' }).catch(() => {
        // Ignore deletion errors
      });
    }
    router.push('/projects');
  };

  // Loading state while creating project - centered in full viewport
  if (isCreating) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Setting up your project...</p>
        </div>
      </div>
    );
  }

  // Error state - centered with back button
  if (error || !projectId) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error || 'Failed to create project'}</p>
        <Button variant="outline" onClick={() => router.push('/projects')}>
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col">
      {/* Minimal floating header */}
      <header className="absolute top-0 inset-x-0 z-10 p-4 pointer-events-none">
        <div className="max-w-[650px] mx-auto flex justify-between items-center pointer-events-auto">
          <span className="text-sm text-muted-foreground font-medium">
            New Project
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="h-8 px-3 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4 mr-1.5" />
            Cancel
          </Button>
        </div>
      </header>

      {/* Full-screen chat */}
      <ChatWizard
        projectId={projectId}
        onComplete={handleComplete}
        onCancel={handleCancel}
        className="flex-1"
      />
    </div>
  );
}
