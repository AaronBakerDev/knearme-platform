'use client';

/**
 * Project Edit Page - Enhanced editing with new components.
 *
 * Features:
 * - Rich text editor for descriptions (TipTap)
 * - Tag editor with autocomplete
 * - Materials/techniques chip editors
 * - Drag-and-drop image reordering
 * - Pre-publish checklist
 * - Publish success modal
 *
 * @see /docs/02-requirements/user-journeys.md J2
 * @see /src/components/edit/ - New editor components
 * @see /src/components/publish/ - Publish workflow components
 */

import { useState, useEffect, use, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Eye } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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

// New enhanced components
import { RichTextEditor } from '@/components/edit/RichTextEditor';
import { TagEditor } from '@/components/edit/TagEditor';
import { ChipEditor } from '@/components/edit/ChipEditor';
import { SortableImageGrid } from '@/components/edit/SortableImageGrid';
import { PublishChecklist } from '@/components/publish/PublishChecklist';
import { PublishSuccessModal } from '@/components/publish/PublishSuccessModal';

import { ImageUploader } from '@/components/upload/ImageUploader';
import type { ProjectWithImages, ProjectImage } from '@/types/database';
import { UploadProgress } from '@/components/ui/upload-progress';

const projectSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().min(50, 'Description must be at least 50 characters').max(5000),
  project_type: z.string().optional(),
  city: z.string().optional(),
  materials: z.array(z.string()),
  techniques: z.array(z.string()),
  tags: z.array(z.string()),
  seo_title: z.string().max(60).optional(),
  seo_description: z.string().max(160).optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

type ImageWithUrl = ProjectImage & { url: string };

type PageParams = {
  params: Promise<{ id: string }>;
};

export default function ProjectEditPage({ params }: PageParams) {
  const { id } = use(params);
  const router = useRouter();
  const tabsRef = useRef<HTMLDivElement>(null);

  // State
  const [project, setProject] = useState<ProjectWithImages | null>(null);
  const [contractorId, setContractorId] = useState<string>('');
  const [images, setImages] = useState<ImageWithUrl[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [deleteImage, setDeleteImage] = useState<ImageWithUrl | null>(null);
  const [activeTab, setActiveTab] = useState('content');
  const [showPublishSuccess, setShowPublishSuccess] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState('');
  const [uploadingFile, setUploadingFile] = useState<{
    name: string;
    progress: number;
    status: 'uploading' | 'processing' | 'complete' | 'error';
  } | null>(null);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    mode: 'onChange',
    shouldFocusError: true,
    defaultValues: {
      title: '',
      description: '',
      project_type: '',
      city: '',
      materials: [],
      techniques: [],
      tags: [],
      seo_title: '',
      seo_description: '',
    },
  });

  // Refresh images from API
  const refreshImages = useCallback(async () => {
    try {
      const imagesRes = await fetch(`/api/projects/${id}/images`);
      if (imagesRes.ok) {
        const imagesData = await imagesRes.json();
        setImages(imagesData.images || []);
      }
    } catch (error) {
      console.error('Failed to fetch images:', error);
    }
  }, [id]);

  // Fetch project data
  useEffect(() => {
    async function fetchProject() {
      try {
        // Fetch contractor info first
        const meRes = await fetch('/api/contractors/me');
        if (meRes.ok) {
          const meData = await meRes.json();
          setContractorId(meData.contractor?.id || '');
        }

        // Fetch project details
        const projectRes = await fetch(`/api/projects/${id}`);
        if (!projectRes.ok) {
          router.push('/projects');
          return;
        }
        const projectData = await projectRes.json();
        const proj = projectData.project as ProjectWithImages;
        setProject(proj);

        // Set form values
        form.reset({
          title: proj.title || '',
          description: proj.description || '',
          project_type: proj.project_type || '',
          city: proj.city || '',
          materials: proj.materials || [],
          techniques: proj.techniques || [],
          tags: proj.tags || [],
          seo_title: proj.seo_title || '',
          seo_description: proj.seo_description || '',
        });

        // Fetch images
        await refreshImages();
      } catch (error) {
        console.error('Failed to fetch project:', error);
        router.push('/projects');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProject();
  }, [form, id, refreshImages, router]);

  // Handle form submission (save)
  async function onSubmit(data: ProjectFormData) {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const updatedData = await res.json();
        setProject(updatedData.project);
        toast.success('Changes saved');
      } else {
        const error = await res.json();
        toast.error(error.message || 'Failed to save changes');
      }
    } catch (error) {
      console.error('Failed to update project:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  }

  // Handle image upload complete
  function handleImagesChange() {
    refreshImages();
    setUploadingFile(null);
  }

  // Handle image reorder
  async function handleImageReorder(newImages: ImageWithUrl[]) {
    // Optimistically update UI
    setImages(newImages);

    // Save to API
    try {
      const res = await fetch(`/api/projects/${id}/images`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_ids: newImages.map((img) => img.id),
        }),
      });

      if (!res.ok) {
        // Revert on error
        await refreshImages();
        toast.error('Failed to reorder images');
      }
    } catch (error) {
      console.error('Failed to reorder images:', error);
      await refreshImages();
      toast.error('Failed to reorder images');
    }
  }

  // Handle image delete
  async function handleDeleteImage() {
    if (!deleteImage) return;

    try {
      const res = await fetch(`/api/projects/${id}/images`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_id: deleteImage.id }),
      });

      if (res.ok) {
        setImages((prev) => prev.filter((img) => img.id !== deleteImage.id));
        toast.success('Image deleted');
      } else {
        toast.error('Failed to delete image');
      }
    } catch (error) {
      console.error('Failed to delete image:', error);
      toast.error('Failed to delete image');
    } finally {
      setDeleteImage(null);
    }
  }

  // Handle publish
  async function handlePublish() {
    // Save current form state first
    const isValid = await form.trigger();
    if (!isValid) {
      toast.error('Please fix form errors before publishing');
      return;
    }

    setIsPublishing(true);
    try {
      // Save latest changes
      await onSubmit(form.getValues());

      // Publish
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
  }

  // Handle navigation from checklist
  function handleChecklistNavigate(tab: string, field?: string) {
    setActiveTab(tab);
    // Scroll tab into view
    setTimeout(() => {
      if (field) {
        const element = document.querySelector(`[name="${field}"]`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (element as HTMLInputElement)?.focus();
      }
    }, 100);
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">Loading project...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  // Get current form values for checklist
  const formValues = form.watch();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        href="/projects"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Projects
      </Link>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Edit Project</h1>
            <p className="text-muted-foreground">
              Update your project details and images
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={project.status === 'published' ? 'default' : 'secondary'}>
              {project.status}
            </Badge>
            {project.status === 'published' && project.slug && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`/${project.city_slug}/masonry/${project.project_type_slug}/${project.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </a>
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr,300px]">
          {/* Main content */}
          <div ref={tabsRef}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="images">Images ({images.length})</TabsTrigger>
                <TabsTrigger value="seo">SEO</TabsTrigger>
              </TabsList>

              {/* Content Tab */}
              <TabsContent value="content">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Details</CardTitle>
                    <CardDescription>
                      Edit the main content of your project
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Title */}
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Historic Brick Chimney Restoration" {...field} />
                              </FormControl>
                              <FormDescription>
                                {field.value.length}/100 characters (60-80 recommended)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Description - Rich Text Editor */}
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <RichTextEditor
                                  content={field.value}
                                  onChange={field.onChange}
                                  placeholder="Describe the project, challenges, solutions, and results..."
                                  minWords={200}
                                  maxChars={5000}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Project Type & City */}
                        <div className="grid gap-4 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="project_type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Project Type</FormLabel>
                                <FormControl>
                                  <Input placeholder="Chimney Rebuild" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>City</FormLabel>
                                <FormControl>
                                  <Input placeholder="Denver" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Tags - Enhanced Tag Editor */}
                        <FormField
                          control={form.control}
                          name="tags"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tags</FormLabel>
                              <FormControl>
                                <TagEditor
                                  tags={field.value}
                                  onChange={field.onChange}
                                  placeholder="Type to search tags..."
                                  maxTags={10}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Materials - Chip Editor */}
                        <FormField
                          control={form.control}
                          name="materials"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <ChipEditor
                                  type="materials"
                                  values={field.value}
                                  onChange={field.onChange}
                                  label="Materials Used"
                                  maxChips={15}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Techniques - Chip Editor */}
                        <FormField
                          control={form.control}
                          name="techniques"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <ChipEditor
                                  type="techniques"
                                  values={field.value}
                                  onChange={field.onChange}
                                  label="Techniques Applied"
                                  maxChips={15}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Save button */}
                        <div className="flex gap-4 pt-4">
                          <Button type="submit" disabled={isSaving}>
                            {isSaving ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Changes
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Images Tab */}
              <TabsContent value="images">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Images</CardTitle>
                    <CardDescription>
                      Add, remove, or reorder your project photos. First image is the cover.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Sortable image grid */}
                    <SortableImageGrid
                      images={images}
                      onReorder={handleImageReorder}
                      onDelete={setDeleteImage}
                    />

                    {/* Upload new images */}
                    {contractorId && images.length < 10 && (
                      <div className="pt-4 border-t">
                        <h4 className="font-medium mb-4">Add More Images</h4>
                        {uploadingFile && (
                          <UploadProgress
                            progress={uploadingFile.progress}
                            fileName={uploadingFile.name}
                            status={uploadingFile.status}
                          />
                        )}
                        <ImageUploader
                          projectId={id}
                          onImagesChange={handleImagesChange}
                          maxImages={10 - images.length}
                          onUploadProgress={({ fileName, progress, status }) =>
                            setUploadingFile({ name: fileName, progress, status })
                          }
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SEO Tab */}
              <TabsContent value="seo">
                <Card>
                  <CardHeader>
                    <CardTitle>SEO Settings</CardTitle>
                    <CardDescription>
                      Optimize how your project appears in search results
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="seo_title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SEO Title</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Custom title for search results (leave blank to auto-generate)"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                {field.value?.length || 0}/60 characters
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="seo_description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SEO Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Custom description for search results (leave blank to auto-generate)"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                {field.value?.length || 0}/160 characters
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex gap-4 pt-4">
                          <Button type="submit" disabled={isSaving}>
                            {isSaving ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                Save SEO Settings
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Publish Checklist */}
          <div className="lg:sticky lg:top-4 h-fit">
            <PublishChecklist
              project={formValues}
              imageCount={images.length}
              onNavigate={handleChecklistNavigate}
              onPublish={handlePublish}
              isPublishing={isPublishing}
              status={project.status}
            />
          </div>
        </div>
      </div>

      {/* Delete image confirmation */}
      <AlertDialog open={!!deleteImage} onOpenChange={() => setDeleteImage(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this image? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteImage}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
