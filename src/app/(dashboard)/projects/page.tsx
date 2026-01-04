'use client';

/**
 * Projects List Page - View and manage all projects.
 *
 * Features:
 * - Filter by status (all, draft, published)
 * - Grid view with thumbnails
 * - Quick actions (edit, publish, delete)
 *
 * @see /docs/02-requirements/user-journeys.md J2
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Plus, MoreVertical, Pencil, Eye, Trash2, Globe, FileEdit, CheckCircle2, Clock, FolderOpen, Archive, RotateCcw, AlertCircle } from 'lucide-react';
import {
  Button, Badge,
  Tabs, TabsList, TabsTrigger,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  Alert, AlertDescription
} from '@/components/ui';
import { resolveProjectImageUrl } from '@/lib/storage/project-images';
import type { ProjectWithImages } from '@/types/database';

type ProjectStatus = 'all' | 'draft' | 'published' | 'archived';

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectWithImages[]>([]);
  const [status, setStatus] = useState<ProjectStatus>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteProject, setDeleteProject] = useState<ProjectWithImages | null>(null);

  function _formatProjectDate(project: ProjectWithImages): string | null {
    const dateValue = project.published_at || project.updated_at || project.created_at;
    if (!dateValue) return null;
    return new Date(dateValue).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  // Fetch projects
  useEffect(() => {
    async function fetchProjects() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (status !== 'all') {
          params.set('status', status);
        }
        params.set('limit', '100'); // Increased to handle more projects

        const res = await fetch(`/api/projects?${params}`);
        const data = await res.json();

        if (res.ok) {
          setProjects(data.projects || []);
          setError(null);
        } else {
          // Display the actual error from the API
          const errorMessage =
            data?.error?.message ||
            data?.message ||
            `Error ${res.status}: Failed to load projects`;
          console.error('[Projects Page] API Error:', res.status, data);
          setError(errorMessage);
          setProjects([]);
        }
      } catch (err) {
        console.error('[Projects Page] Fetch error:', err);
        setError('Network error: Failed to connect to server');
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProjects();
  }, [status]);

  // Handle delete
  async function handleDelete() {
    if (!deleteProject) return;

    try {
      const res = await fetch(`/api/projects/${deleteProject.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== deleteProject.id));
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
    } finally {
      setDeleteProject(null);
    }
  }

  // Handle publish/unpublish
  async function handleTogglePublish(project: ProjectWithImages) {
    const isPublished = project.status === 'published';
    const method = isPublished ? 'DELETE' : 'POST';

    try {
      const res = await fetch(`/api/projects/${project.id}/publish`, { method });

      if (res.ok) {
        const data = await res.json();
        setProjects((prev) =>
          prev.map((p) => (p.id === project.id ? data.project : p))
        );
      }
    } catch (error) {
      console.error('Failed to toggle publish:', error);
    }
  }

  async function handleArchive(project: ProjectWithImages, restore = false) {
    const nextStatus = restore ? 'draft' : 'archived';

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        const data = await res.json();
        setProjects((prev) =>
          prev.map((p) => (p.id === project.id ? data.project : p))
        );
      } else {
        const data = await res.json().catch(() => null);
        const message =
          data?.error?.message || data?.message || 'Failed to update project status';
        console.error('[Projects Page] Archive error:', message);
        setError(message);
      }
    } catch (error) {
      console.error('Failed to update project status:', error);
      setError('Network error: Failed to update project status');
    }
  }

  // Get thumbnail URL
  function getThumbnail(project: ProjectWithImages): string | null {
    const firstImage = project.project_images?.[0];
    if (!firstImage) return null;
    return resolveProjectImageUrl({
      projectId: project.id,
      imageId: firstImage.id,
      storagePath: firstImage.storage_path,
      isPublished: project.status === 'published',
    });
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-8">
      {/* Header - Craftsman styled */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 md:py-6 mb-6 border-b border-border/50">
        <div>
          <h1 className="font-craftsman text-xl md:text-2xl text-foreground">Your Work</h1>
          <p className="text-sm text-muted-foreground">
            Manage and showcase your portfolio
          </p>
        </div>
        <Button asChild className="bg-terracotta hover:bg-terracotta/90 text-white w-full sm:w-auto">
          <Link href="/projects/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Project
          </Link>
        </Button>
      </header>

      {/* Status filter - Horizontal scroll on mobile */}
      <Tabs value={status} onValueChange={(v) => setStatus(v as ProjectStatus)} className="mb-6">
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="bg-muted/30 p-1 h-auto inline-flex w-auto min-w-full md:min-w-0">
            <TabsTrigger value="all" className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-3 md:px-4 py-2 text-xs md:text-sm whitespace-nowrap">
              <FolderOpen className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
              All
            </TabsTrigger>
            <TabsTrigger value="draft" className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-3 md:px-4 py-2 text-xs md:text-sm whitespace-nowrap">
              <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
              Drafts
            </TabsTrigger>
            <TabsTrigger value="published" className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-3 md:px-4 py-2 text-xs md:text-sm whitespace-nowrap">
              <CheckCircle2 className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
              Published
            </TabsTrigger>
            <TabsTrigger value="archived" className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-3 md:px-4 py-2 text-xs md:text-sm whitespace-nowrap">
              <Archive className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
              Archived
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      {/* Error display */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Projects grid */}
      {isLoading ? (
        <div className="grid gap-4 md:gap-6 grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="dashboard-card animate-pulse overflow-hidden">
              <div className="aspect-[4/3] bg-muted/50" />
              <div className="p-3 md:p-4 space-y-2">
                <div className="h-4 bg-muted/50 rounded w-3/4" />
                <div className="h-3 bg-muted/50 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        /* Empty state - Craftsman styled */
        <div className="empty-state-bg rounded-2xl p-8 md:p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted/50 flex items-center justify-center">
              <FolderOpen className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="font-craftsman text-xl md:text-2xl mb-3">
              {status === 'all' ? 'Your work awaits' : `No ${status} projects`}
            </h3>
            <p className="text-muted-foreground mb-6">
              {status === 'all'
                ? "Every job you complete is proof of your skill. Start documenting your craftsmanship."
                : `You don't have any ${status} projects at the moment.`}
            </p>
            <Button asChild size="lg" className="bg-terracotta hover:bg-terracotta/90 text-white">
              <Link href="/projects/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Project
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:gap-6 grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => {
            const thumbnail = getThumbnail(project);
            const isPublished = project.status === 'published';
            const isDraft = project.status === 'draft';
            const isArchived = project.status === 'archived';

            return (
              <div
                key={project.id}
                className="group block animate-fade-up cursor-pointer"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => router.push(`/projects/${project.id}`)}
              >
                {/* Thumbnail - project-thumb style from dashboard */}
                <div className="project-thumb aspect-[4/3] relative mb-2 md:mb-3">
                  {thumbnail ? (
                    <Image
                      src={thumbnail}
                      alt={project.title || 'Project'}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FolderOpen className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}

                  {/* Status indicator - matching dashboard style */}
                  <div className="absolute top-2 left-2 z-10">
                    <Badge
                      variant="secondary"
                      className={`text-[10px] px-1.5 py-0.5 ${
                        isPublished
                          ? 'bg-sage-subtle text-sage border-0'
                          : isDraft
                            ? 'bg-background/80 backdrop-blur-sm'
                            : 'bg-muted/80 backdrop-blur-sm text-muted-foreground'
                      }`}
                    >
                      {isPublished ? 'Live' : isDraft ? <><Clock className="w-2.5 h-2.5 mr-0.5" /> Draft</> : 'Archived'}
                    </Badge>
                  </div>

                  {/* Actions menu */}
                  <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-7 w-7 bg-background/80 backdrop-blur-sm hover:bg-background"
                          aria-label="Project actions"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem asChild>
                          <Link href={`/projects/${project.id}`}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        {isPublished && (
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/${project.city_slug}/masonry/${project.project_type_slug}/${project.slug}`}
                              target="_blank"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Public Page
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {!isArchived ? (
                          <>
                            <DropdownMenuItem onClick={() => handleTogglePublish(project)}>
                              {isPublished ? (
                                <>
                                  <FileEdit className="h-4 w-4 mr-2" />
                                  Unpublish
                                </>
                              ) : (
                                <>
                                  <Globe className="h-4 w-4 mr-2" />
                                  Publish
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleArchive(project)}>
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem onClick={() => handleArchive(project, true)}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restore to Draft
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteProject(project)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Hover overlay with title */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                    <div className="w-full">
                      <p className="text-white text-sm font-medium truncate">
                        {project.title || 'Untitled'}
                      </p>
                      <p className="text-white/70 text-xs truncate">
                        {project.project_type || 'Masonry'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card content - minimal on mobile */}
                <div className="px-1">
                  <p className="text-sm font-medium line-clamp-1 group-hover:text-terracotta transition-colors">
                    {project.title || 'Untitled Project'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {project.city || project.project_type || 'Project'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteProject} onOpenChange={() => setDeleteProject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteProject?.title || 'this project'}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
