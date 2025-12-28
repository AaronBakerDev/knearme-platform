'use client';

/**
 * ProjectEditFormArtifact - Full project edit form as canvas artifact.
 *
 * Displays the complete edit form (Content, Images, SEO tabs) inside
 * the canvas panel of the chat-first edit interface.
 *
 * Extracted from /src/app/(contractor)/projects/[id]/edit/page.tsx
 * to be used as a canvas artifact in the three-panel layout.
 *
 * @see /docs/ai-sdk/chat-artifacts-spec.md
 */

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { TagEditor } from '@/components/edit/TagEditor';
import { ChipEditor } from '@/components/edit/ChipEditor';
import { SortableImageGrid } from '@/components/edit/SortableImageGrid';
import { ImageUploader } from '@/components/upload/ImageUploader';
import { UploadProgress } from '@/components/ui/upload-progress';
import { cn } from '@/lib/utils';
import { BlockEditor } from '@/components/edit/BlockEditor';
import {
  blocksToHtml,
  blocksToPlainText,
  descriptionBlocksSchema,
  sanitizeDescriptionBlocks,
} from '@/lib/content/description-blocks';
import { parseDescriptionBlocksFromHtml } from '@/lib/content/description-blocks.client';
import type { ProjectWithImages, ProjectImage } from '@/types/database';

/**
 * Form validation schema.
 */
const projectSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description_blocks: descriptionBlocksSchema,
  project_type: z.string().optional(),
  neighborhood: z.string().max(100).optional(),
  city: z.string().optional(),
  state: z.string().max(50).optional(),
  materials: z.array(z.string()),
  techniques: z.array(z.string()),
  tags: z.array(z.string()),
  seo_title: z.string().max(60).optional(),
  seo_description: z.string().max(160).optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;
type ImageWithUrl = ProjectImage & { url: string };

interface ProjectEditFormArtifactProps {
  /** Project ID */
  projectId: string;
  /** Initial project data */
  project: ProjectWithImages;
  /** Project images with URLs */
  images: ImageWithUrl[];
  /** Contractor ID for uploads */
  contractorId: string;
  /** Callback when form saves */
  onSave?: () => void;
  /** Callback when images change */
  onImagesChange?: () => void;
  /** Initial active tab */
  activeTab?: 'content' | 'images' | 'seo';
  /** Optional additional className */
  className?: string;
}

/**
 * Main ProjectEditFormArtifact component.
 */
export function ProjectEditFormArtifact({
  projectId,
  project,
  images: initialImages,
  contractorId,
  onSave,
  onImagesChange,
  activeTab: initialTab = 'content',
  className,
}: ProjectEditFormArtifactProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [images, setImages] = useState<ImageWithUrl[]>(initialImages);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<{
    name: string;
    progress: number;
    status: 'uploading' | 'processing' | 'complete' | 'error';
  } | null>(null);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    mode: 'onChange',
    defaultValues: {
      title: project.title || '',
      description_blocks: project.description_blocks
        ? sanitizeDescriptionBlocks(project.description_blocks)
        : parseDescriptionBlocksFromHtml(project.description || ''),
      project_type: project.project_type || '',
      neighborhood: project.neighborhood || '',
      city: project.city || '',
      state: project.state || '',
      materials: project.materials || [],
      techniques: project.techniques || [],
      tags: project.tags || [],
      seo_title: project.seo_title || '',
      seo_description: project.seo_description || '',
    },
  });

  /**
   * Refresh images from API.
   */
  const refreshImages = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/images`);
      if (res.ok) {
        const data = await res.json();
        setImages(data.images || []);
        onImagesChange?.();
      }
    } catch (error) {
      console.error('Failed to refresh images:', error);
    }
  }, [projectId, onImagesChange]);

  /**
   * Handle form submission.
   */
  async function onSubmit(data: ProjectFormData) {
    setIsSaving(true);
    try {
      const sanitizedBlocks = sanitizeDescriptionBlocks(data.description_blocks);
      const descriptionText = blocksToPlainText(sanitizedBlocks);

      if (descriptionText.length < 50) {
        form.setError('description_blocks', {
          type: 'manual',
          message: 'Description must be at least 50 characters.',
        });
        return;
      }

      const descriptionHtml = blocksToHtml(sanitizedBlocks);

      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          description: descriptionHtml,
          description_blocks: sanitizedBlocks,
        }),
      });

      if (res.ok) {
        toast.success('Changes saved');
        onSave?.();
      } else {
        const error = await res.json();
        toast.error(error.message || 'Failed to save changes');
      }
    } catch (error) {
      console.error('Failed to save:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  }

  /**
   * Handle image reorder.
   */
  async function handleImageReorder(newImages: ImageWithUrl[]) {
    setImages(newImages);

    try {
      const res = await fetch(`/api/projects/${projectId}/images`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_ids: newImages.map((img) => img.id),
        }),
      });

      if (!res.ok) {
        await refreshImages();
        toast.error('Failed to reorder images');
      }
    } catch (error) {
      console.error('Failed to reorder:', error);
      await refreshImages();
      toast.error('Failed to reorder images');
    }
  }

  /**
   * Handle image delete.
   */
  async function handleDeleteImage(image: ImageWithUrl) {
    try {
      const res = await fetch(`/api/projects/${projectId}/images`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_id: image.id }),
      });

      if (res.ok) {
        setImages((prev) => prev.filter((img) => img.id !== image.id));
        toast.success('Image deleted');
      } else {
        toast.error('Failed to delete image');
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('Failed to delete image');
    }
  }

  return (
    <div className={cn('flex flex-col h-full p-4', className)}>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex flex-col h-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="content" className="text-xs">Content</TabsTrigger>
          <TabsTrigger value="images" className="text-xs">Images ({images.length})</TabsTrigger>
          <TabsTrigger value="seo" className="text-xs">SEO</TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="flex-1 overflow-y-auto mt-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Project title"
                        className="h-9 text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      {field.value.length}/100
                    </FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description_blocks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Description</FormLabel>
                    <FormControl>
                      <BlockEditor
                        value={field.value || []}
                        onChange={field.onChange}
                        minWords={200}
                        maxChars={5000}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Project Type, Neighborhood, City, State/Province */}
              <div className="grid gap-3 grid-cols-1 md:grid-cols-4">
                <FormField
                  control={form.control}
                  name="project_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Type</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Project type"
                          className="h-9 text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="neighborhood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Neighborhood</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Neighborhood"
                          className="h-9 text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">City</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="City"
                          className="h-9 text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">State/Province</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="State/Province"
                          className="h-9 text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Tags */}
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Tags</FormLabel>
                    <FormControl>
                      <TagEditor
                        tags={field.value}
                        onChange={field.onChange}
                        placeholder="Add tags..."
                        maxTags={10}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Materials */}
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
                        label="Materials"
                        maxChips={15}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Techniques */}
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
                        label="Techniques"
                        maxChips={15}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Save button */}
              <div className="pt-2 sticky bottom-0 bg-background">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="w-full"
                  size="sm"
                >
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
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images" className="flex-1 overflow-y-auto mt-0">
          <div className="space-y-4">
            <SortableImageGrid
              images={images}
              onReorder={handleImageReorder}
              onDelete={handleDeleteImage}
            />

            {contractorId && images.length < 10 && (
              <div className="pt-4 border-t">
                <h4 className="text-xs font-medium mb-3">Add Images</h4>
                {uploadingFile && (
                  <UploadProgress
                    progress={uploadingFile.progress}
                    fileName={uploadingFile.name}
                    status={uploadingFile.status}
                  />
                )}
                <ImageUploader
                  projectId={projectId}
                  onImagesChange={() => {
                    refreshImages();
                    setUploadingFile(null);
                  }}
                  maxImages={10 - images.length}
                  onUploadProgress={({ fileName, progress, status }) =>
                    setUploadingFile({ name: fileName, progress, status })
                  }
                />
              </div>
            )}
          </div>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="flex-1 overflow-y-auto mt-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="seo_title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">SEO Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Custom title for search results"
                        className="h-9 text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      {field.value?.length || 0}/60 characters
                    </FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="seo_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">SEO Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Custom description for search results"
                        className="text-sm min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      {field.value?.length || 0}/160 characters
                    </FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Search preview */}
              <div className="rounded-md border bg-muted/30 p-3">
                <div className="text-xs text-muted-foreground mb-1">
                  Search preview
                </div>
                <div className="text-sm font-medium text-primary truncate">
                  {form.watch('seo_title') || form.watch('title') || 'Project title'}
                </div>
                <div className="text-xs text-muted-foreground line-clamp-2">
                  {form.watch('seo_description') || 'Project description will appear here...'}
                </div>
              </div>

              {/* Save button */}
              <div className="pt-2 sticky bottom-0 bg-background">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="w-full"
                  size="sm"
                >
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
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ProjectEditFormArtifact;
