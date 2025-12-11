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
import { Plus, MoreVertical, Pencil, Eye, Trash2, Globe, FileEdit, CheckCircle2, Clock, FolderOpen, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getPublicUrl } from '@/lib/storage/upload';
import type { ProjectWithImages } from '@/types/database';

type ProjectStatus = 'all' | 'draft' | 'published' | 'archived';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithImages[]>([]);
  const [status, setStatus] = useState<ProjectStatus>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteProject, setDeleteProject] = useState<ProjectWithImages | null>(null);

  // Fetch projects
  useEffect(() => {
    async function fetchProjects() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (status !== 'all') {
          params.set('status', status);
        }
        params.set('limit', '50');

        const res = await fetch(`/api/projects?${params}`);
        const data = await res.json();

        if (res.ok) {
          setProjects(data.projects || []);
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
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

  // Get thumbnail URL
  function getThumbnail(project: ProjectWithImages): string | null {
    const firstImage = project.project_images?.[0];
    if (!firstImage) return null;
    return getPublicUrl('project-images', firstImage.storage_path);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8 bg-gradient-to-br from-muted/40 to-muted/20 rounded-2xl p-6">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            Manage your portfolio projects
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/projects/new">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Status filter */}
      <Tabs value={status} onValueChange={(v) => setStatus(v as ProjectStatus)} className="mb-6">
        <TabsList className="bg-muted/50 p-1 h-auto">
          <TabsTrigger value="all" className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2">
            <FolderOpen className="h-4 w-4 mr-2" />
            All
          </TabsTrigger>
          <TabsTrigger value="draft" className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2">
            <Clock className="h-4 w-4 mr-2" />
            Drafts
          </TabsTrigger>
          <TabsTrigger value="published" className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Published
          </TabsTrigger>
          <TabsTrigger value="archived" className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2">
            <Archive className="h-4 w-4 mr-2" />
            Archived
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Projects grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse overflow-hidden border-0 shadow-sm">
              <div className="h-48 bg-muted rounded-t-lg" />
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-8 w-8 bg-muted rounded" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-muted rounded w-full mb-2" />
                <div className="h-3 bg-muted rounded w-2/3 mb-4" />
                <div className="flex gap-2">
                  <div className="h-6 bg-muted rounded-full w-20" />
                  <div className="h-6 bg-muted rounded-full w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="text-center py-16 border-0 shadow-sm">
          <CardContent>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <FolderOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {status === 'all' ? 'No projects yet' : `No ${status} projects`}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              {status === 'all'
                ? "Start building your portfolio by creating your first project."
                : `You don't have any ${status} projects at the moment.`}
            </p>
            <Button asChild size="lg">
              <Link href="/projects/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Project
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const thumbnail = getThumbnail(project);
            const isPublished = project.status === 'published';
            const isDraft = project.status === 'draft';

            return (
              <Card key={project.id} className="overflow-hidden group border-0 shadow-sm hover:shadow-lg transition-all duration-200">
                {/* Thumbnail */}
                <div className="relative h-48 bg-muted overflow-hidden">
                  {thumbnail ? (
                    <Image
                      src={thumbnail}
                      alt={project.title || 'Project'}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                      <FolderOpen className="w-8 h-8" />
                      <span className="text-sm">No images</span>
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                  {/* Status badge */}
                  <Badge
                    variant={isPublished ? 'default' : 'secondary'}
                    className={`absolute top-3 right-3 ${
                      isPublished
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/80 dark:text-green-400 border-0'
                        : isDraft
                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/80 dark:text-orange-400 border-0'
                          : ''
                    }`}
                  >
                    {isPublished && <CheckCircle2 className="w-3 h-3 mr-1" />}
                    {isDraft && <Clock className="w-3 h-3 mr-1" />}
                    {project.status}
                  </Badge>
                </div>

                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-colors">
                      {project.title || 'Untitled Project'}
                    </CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-70 hover:opacity-100">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/projects/${project.id}/edit`}>
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
                </CardHeader>

                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {project.description || 'No description'}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {project.project_type && (
                      <Badge variant="outline" className="bg-muted/50">{project.project_type}</Badge>
                    )}
                    {project.city && (
                      <Badge variant="outline" className="bg-muted/50">{project.city}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
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
