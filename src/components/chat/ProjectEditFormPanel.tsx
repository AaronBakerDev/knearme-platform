'use client';

import { useCallback, useEffect, useState } from 'react';
import { ProjectEditFormArtifact } from '@/components/chat/artifacts/ProjectEditFormArtifact';
import { getPublicUrl } from '@/lib/storage/upload';
import type { ProjectWithImages, ProjectImage } from '@/types/database';

interface ProjectEditFormPanelProps {
  projectId: string;
  onProjectUpdate?: () => void;
}

type ImageWithUrl = ProjectImage & { url: string };

export function ProjectEditFormPanel({
  projectId,
  onProjectUpdate,
}: ProjectEditFormPanelProps) {
  const [project, setProject] = useState<ProjectWithImages | null>(null);
  const [contractorId, setContractorId] = useState<string>('');
  const [images, setImages] = useState<ImageWithUrl[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [meRes, projectRes] = await Promise.all([
        fetch('/api/contractors/me'),
        fetch(`/api/projects/${projectId}`),
      ]);

      if (!projectRes.ok) {
        throw new Error('Failed to load project');
      }

      const projectData = await projectRes.json();
      const nextProject = projectData.project as ProjectWithImages;
      setProject(nextProject);

      const projectImages = nextProject.project_images || [];
      const imagesWithUrls: ImageWithUrl[] = projectImages
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
        .map((img) => ({
          ...img,
          url: getPublicUrl('project-images', img.storage_path),
        }));
      setImages(imagesWithUrls);

      if (meRes.ok) {
        const meData = await meRes.json();
        setContractorId(meData.contractor?.id || '');
      }
    } catch (err) {
      console.error('[ProjectEditFormPanel] Failed to load project:', err);
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const refreshImages = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/images`);
      if (res.ok) {
        const data = await res.json();
        setImages(data.images || []);
      }
    } catch (err) {
      console.error('[ProjectEditFormPanel] Failed to refresh images:', err);
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    void fetchProject();
  }, [projectId, fetchProject]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        Loading editor...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        No project data available.
      </div>
    );
  }

  return (
    <ProjectEditFormArtifact
      projectId={projectId}
      project={project}
      images={images}
      contractorId={contractorId}
      onSave={async () => {
        await fetchProject();
        onProjectUpdate?.();
      }}
      onImagesChange={refreshImages}
    />
  );
}
