'use client';

/**
 * Project Edit Page - Chat-First Layout.
 *
 * Chat-first workspace for editing projects via AI chat.
 *
 * NOTE: Session history sidebar was removed as part of the
 * single-conversation-per-project refactoring. Each project
 * reuses the latest edit session.
 *
 * Design: Modern workspace studio (Linear/Notion inspired)
 *
 * @see /docs/ai-sdk/chat-artifacts-spec.md
 * @see /src/components/chat/ChatWizard.tsx
 */

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Eye, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ChatWizard } from '@/components/chat';
import { ProjectEditFormArtifact } from '@/components/chat/artifacts/ProjectEditFormArtifact';
import { PublishSuccessModal } from '@/components/publish/PublishSuccessModal';
import { useCompleteness } from '@/components/chat/hooks';
import { formatProjectLocation } from '@/lib/utils/location';
import type { Contractor, ProjectWithImages, ProjectImage } from '@/types/database';
import type { RelatedProject } from '@/lib/data/projects';
import type { ExtractedProjectData } from '@/lib/chat/chat-types';

type ImageWithUrl = ProjectImage & { url: string };

type PageParams = {
  params: Promise<{ id: string }>;
};

const DESCRIPTION_PREVIEW_LIMIT = 280;

function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 3))}...`;
}

export default function ProjectEditPage({ params }: PageParams) {
  const { id } = use(params);
  const router = useRouter();

  // Project state
  const [project, setProject] = useState<ProjectWithImages | null>(null);
  const [contractorId, setContractorId] = useState<string>('');
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [images, setImages] = useState<ImageWithUrl[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [relatedProjects, setRelatedProjects] = useState<RelatedProject[]>([]);

  // Publish success state
  const [showPublishSuccess, setShowPublishSuccess] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState('');

  /**
   * Fetch project data.
   */
  const fetchProject = useCallback(async () => {
    try {
      // Fetch contractor info
      const meRes = await fetch('/api/contractors/me');
      if (meRes.ok) {
        const meData = await meRes.json();
        setContractorId(meData.contractor?.id || '');
        setContractor(meData.contractor || null);
      }

      // Fetch project
      const projectRes = await fetch(`/api/projects/${id}`);
      if (!projectRes.ok) {
        router.push('/projects');
        return;
      }
      const projectData = await projectRes.json();
      setProject(projectData.project);

      // Fetch images
      const imagesRes = await fetch(`/api/projects/${id}/images`);
      if (imagesRes.ok) {
        const imagesData = await imagesRes.json();
        setImages(imagesData.images || []);
      }
    } catch (error) {
      console.error('Failed to fetch project:', error);
      router.push('/projects');
    } finally {
      setIsLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const fetchRelatedProjects = useCallback(async () => {
    if (!project) return;
    try {
      const res = await fetch(`/api/projects/${id}/related`);
      if (res.ok) {
        const data = await res.json();
        setRelatedProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Failed to fetch related projects:', error);
    }
  }, [id, project]);

  useEffect(() => {
    fetchRelatedProjects();
  }, [fetchRelatedProjects]);

  /**
   * Refresh images from API.
   */
  const refreshImages = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${id}/images`);
      if (res.ok) {
        const data = await res.json();
        setImages(data.images || []);
      }
    } catch (error) {
      console.error('Failed to refresh images:', error);
    }
  }, [id]);

  /**
   * Handle project update from chat.
   */
  const handleProjectUpdate = useCallback(async () => {
    await fetchProject();
  }, [fetchProject]);

  /**
   * Handle publish.
   */
  const handlePublish = useCallback(async () => {
    if (!project) return;

    setIsPublishing(true);
    try {
      const res = await fetch(`/api/projects/${id}/publish`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        setProject(data.project);

        // Build public URL
        const proj = data.project;
        const url = `${window.location.origin}/${proj.city_slug}/masonry/${proj.project_type_slug}/${proj.slug}`;
        setPublishedUrl(url);
        setShowPublishSuccess(true);
      } else {
        const error = await res.json();
        toast.error(error.message || 'Failed to publish');
      }
    } catch (error) {
      console.error('Failed to publish:', error);
      toast.error('Failed to publish project');
    } finally {
      setIsPublishing(false);
    }
  }, [id, project]);

  // Build extracted data for preview hooks
  const descriptionText = stripHtml(project?.description);
  const descriptionPreview =
    descriptionText.length > 0
      ? truncateText(descriptionText, DESCRIPTION_PREVIEW_LIMIT)
      : undefined;

  const locationLabel = formatProjectLocation({
    neighborhood: project?.neighborhood,
    city: project?.city,
    state: project?.state ?? contractor?.state,
  });

  const extractedData: ExtractedProjectData = {
    project_type: project?.project_type || undefined,
    materials_mentioned: project?.materials || [],
    techniques_mentioned: project?.techniques || [],
    location: locationLabel || undefined,
    // City and state are required for SEO URL and publishing
    city: project?.city || undefined,
    state: project?.state || undefined,
    duration: project?.duration || undefined,
    customer_problem: project?.challenge || project?.summary || undefined,
    solution_approach: project?.solution || descriptionPreview,
    proud_of: project?.outcome_highlights?.[0] || undefined,
  };

  // Convert images to UploadedImage format for hooks
  // Derive filename from storage_path since project_images doesn't have a filename field
  const uploadedImages = images.map((img) => ({
    id: img.id,
    url: img.url,
    filename: img.storage_path?.split('/').pop() || `image-${img.id}`,
    storage_path: img.storage_path,
  }));

  const completeness = useCompleteness(extractedData, uploadedImages);

  const publicPreview = project && contractor
    ? {
        project,
        contractor,
        images,
        relatedProjects,
      }
    : undefined;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  // Form content for canvas panel
  const formContent = (
    <ProjectEditFormArtifact
      projectId={id}
      project={project}
      images={images}
      contractorId={contractorId}
      onSave={fetchProject}
      onImagesChange={refreshImages}
    />
  );

  return (
    <div className="h-full min-h-0 flex flex-col">
      {/* Header bar */}
      <div className="hidden md:flex items-center justify-between px-4 py-2 border-b border-border/50 bg-background shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/projects"
            className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Projects</span>
          </Link>

          <div className="h-4 w-px bg-border hidden sm:block" />

          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold truncate max-w-[200px] sm:max-w-none">
              {project.title || 'Untitled Project'}
            </h1>
            <Badge
              variant={project.status === 'published' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {project.status}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {project.status === 'published' && project.slug && (
            <Button variant="outline" size="sm" asChild className="h-8">
              <a
                href={`/${project.city_slug}/masonry/${project.project_type_slug}/${project.slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                <span className="hidden sm:inline">View Live</span>
              </a>
            </Button>
          )}

          {project.status !== 'published' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {/* Wrap in span to allow tooltip on disabled button */}
                  <span tabIndex={!completeness.canGenerate ? 0 : undefined}>
                    <Button
                      size="sm"
                      onClick={handlePublish}
                      disabled={isPublishing || !completeness.canGenerate}
                      className="h-8"
                    >
                      {isPublishing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      Publish
                    </Button>
                  </span>
                </TooltipTrigger>
                {!completeness.canGenerate && (
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="font-medium mb-1">Complete these to publish:</p>
                    <ul className="text-xs space-y-0.5">
                      {completeness.missingFields.slice(0, 4).map((field) => (
                        <li key={field} className="flex items-center gap-1">
                          <span className="text-muted-foreground">•</span>
                          {field.replace(/_/g, ' ')}
                        </li>
                      ))}
                      {completeness.qualityIssues.length > 0 && (
                        <li className="flex items-center gap-1 text-amber-500">
                          <span>•</span>
                          {completeness.qualityIssues[0]}
                        </li>
                      )}
                    </ul>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* Main content - Chat-first layout */}
      <div className="flex-1 min-h-0">
        <ChatWizard
          projectId={id}
          mode="edit"
          formContent={formContent}
          publicPreview={publicPreview}
          onProjectUpdate={handleProjectUpdate}
          className="h-full"
        />
      </div>

      {/* Publish success modal */}
      <PublishSuccessModal
        isOpen={showPublishSuccess}
        onClose={() => setShowPublishSuccess(false)}
        publicUrl={publishedUrl}
        projectTitle={project.title || 'Untitled Project'}
      />
    </div>
  );
}
