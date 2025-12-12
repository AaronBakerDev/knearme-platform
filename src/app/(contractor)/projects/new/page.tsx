'use client';

/**
 * Create Project Page - 6-step AI-powered project creation wizard.
 *
 * Steps:
 * 1. Upload Photos - Drag/drop or camera capture
 * 2. AI Analysis - Detect project type, materials (loading)
 * 3. Interview - Voice/text Q&A (3-5 questions)
 * 4. AI Generation - Create content (loading)
 * 5. Review & Edit - Approve or modify content
 * 6. Publish - Make live on portfolio
 *
 * @see /docs/02-requirements/user-journeys.md J2
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Camera,
  Sparkles,
  Mic,
  FileText,
  CheckCircle,
  Rocket,
  Loader2,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ImageUploader, type UploadedImage } from '@/components/upload/ImageUploader';
import { InterviewFlow } from '@/components/interview/InterviewFlow';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AIProgress } from '@/components/ui/ai-progress';
import { UploadProgress } from '@/components/ui/upload-progress';

type Step = 'upload' | 'analyzing' | 'interview' | 'generating' | 'review' | 'published';

interface GeneratedContent {
  title: string;
  description: string;
  seo_title: string;
  seo_description: string;
  tags: string[];
  materials: string[];
  techniques: string[];
}

interface ProjectData {
  id: string;
  contractor_id: string;
}

const STEPS: { key: Step; label: string; icon: typeof Camera }[] = [
  { key: 'upload', label: 'Upload', icon: Camera },
  { key: 'analyzing', label: 'Analyze', icon: Sparkles },
  { key: 'interview', label: 'Interview', icon: Mic },
  { key: 'generating', label: 'Generate', icon: FileText },
  { key: 'review', label: 'Review', icon: CheckCircle },
  { key: 'published', label: 'Published', icon: Rocket },
];

/**
 * CreateProjectPage - Main wizard component.
 */
export default function CreateProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('upload');
  const [project, setProject] = useState<ProjectData | null>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [editedContent, setEditedContent] = useState<GeneratedContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState<{ name: string; progress: number; status: 'uploading' | 'processing' | 'complete' | 'error' } | null>(null);

  const hasCreatedProjectRef = useRef(false);

  // Create project on mount
  useEffect(() => {
    if (hasCreatedProjectRef.current) return;
    hasCreatedProjectRef.current = true;
    createProject();
  }, []);

  /**
   * Create a new draft project.
   */
  const createProject = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get contractor info first
      const meRes = await fetch('/api/contractors/me');
      if (!meRes.ok) {
        throw new Error('Please complete your profile setup first.');
      }
      await meRes.json();

      // Create project
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to create project');
      }

      const data = await res.json();
      setProject(data.project);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
      toast.error('Failed to start project creation');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle images change from uploader.
   */
  const handleImagesChange = useCallback((newImages: UploadedImage[]) => {
    setImages(newImages);
    setUploadingFile(null);
  }, []);

  /**
   * Proceed to image analysis.
   */
  const handleStartAnalysis = async () => {
    if (!project || images.length === 0) return;

    setStep('analyzing');
    setError(null);

    try {
      const res = await fetch('/api/ai/analyze-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: project.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Image analysis failed');
      }

      // Analysis complete - move to interview
      setStep('interview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      toast.error('Image analysis failed. Please try again.');
      setStep('upload');
    }
  };

  /**
   * Handle interview completion.
   */
  const handleInterviewComplete = async (responses?: Array<{ question_id: string; question_text: string; answer: string }>) => {
    if (!project) return;

    setStep('generating');
    setError(null);

    try {
      // Generate content. For text-mode interviews, pass responses explicitly.
      const res = await fetch('/api/ai/generate-content?action=content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: project.id, responses }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Content generation failed');
      }

      const data = await res.json();
      setEditedContent(data.content);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
      toast.error('Content generation failed. Please try again.');
      setStep('interview');
    }
  };

  /**
   * Skip interview and use defaults.
   */
  const handleSkipInterview = async () => {
    setStep('generating');
    // Generate with minimal info
    handleInterviewComplete();
  };

  /**
   * Regenerate content with feedback.
   */
  const handleRegenerate = async (feedback: string) => {
    if (!project) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/generate-content?action=regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.id,
          feedback,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Regeneration failed');
      }

      const data = await res.json();
      setEditedContent(data.content);
      toast.success('Content regenerated!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Regeneration failed');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Publish the project.
   */
  const handlePublish = async () => {
    if (!project || !editedContent) return;

    setIsLoading(true);
    setError(null);

    try {
      // Update project with edited content
      await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editedContent.title,
          description: editedContent.description,
          seo_title: editedContent.seo_title,
          seo_description: editedContent.seo_description,
          tags: editedContent.tags,
          materials: editedContent.materials,
          techniques: editedContent.techniques,
        }),
      });

      // Publish
      const res = await fetch(`/api/projects/${project.id}/publish`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Publishing failed');
      }

      setStep('published');
      toast.success('Project published!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Publishing failed');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Save as draft.
   */
  const handleSaveDraft = async () => {
    if (!project || !editedContent) return;

    setIsLoading(true);

    try {
      await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editedContent.title,
          description: editedContent.description,
        }),
      });

      toast.success('Draft saved!');
      router.push('/dashboard');
    } catch {
      toast.error('Failed to save draft');
    } finally {
      setIsLoading(false);
    }
  };

  // Get current step index
  const currentStepIndex = STEPS.findIndex((s) => s.key === step);

  // Render step indicator
  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8">
      {STEPS.map((s, idx) => {
        const Icon = s.icon;
        const isActive = s.key === step;
        const isComplete = idx < currentStepIndex;

        return (
          <div key={s.key} className="flex items-center">
            <div
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                isActive && 'border-primary bg-primary text-primary-foreground',
                isComplete && 'border-green-500 bg-green-500 text-white',
                !isActive && !isComplete && 'border-muted-foreground/30 text-muted-foreground'
              )}
            >
              {isComplete ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <Icon className="h-5 w-5" />
              )}
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  'w-12 h-0.5 mx-2',
                  idx < currentStepIndex ? 'bg-green-500' : 'bg-muted-foreground/30'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  // Render step content
  const renderStep = () => {
    // Loading project creation
    if (!project && isLoading) {
      return (
        <Card className="text-center py-12">
          <CardContent>
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Setting up your project...</p>
          </CardContent>
        </Card>
      );
    }

    // Error creating project
    if (!project && error) {
      return (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={createProject}>Try Again</Button>
          </CardContent>
        </Card>
      );
    }

    switch (step) {
      case 'upload':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Add Project Photos</CardTitle>
              <CardDescription>
                Upload photos of your completed work. Our AI will analyze them to understand
                the project type and details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {project && (
                <ImageUploader
                  projectId={project.id}
                  images={images}
                  onImagesChange={handleImagesChange}
                  maxImages={10}
                  onUploadProgress={({ fileName, progress, status }) =>
                    setUploadingFile({ name: fileName, progress, status })
                  }
                />
              )}
              {uploadingFile && (
                <UploadProgress
                  progress={uploadingFile.progress}
                  fileName={uploadingFile.name}
                  status={uploadingFile.status}
                />
              )}

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => router.push('/dashboard')}>
                  Cancel
                </Button>
                <Button
                  onClick={handleStartAnalysis}
                  disabled={images.length === 0}
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'analyzing':
        return (
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              <Sparkles className="h-12 w-12 mx-auto text-primary animate-pulse" />
              <AIProgress stage="analyzing" currentStep="Reviewing image details" />
            </CardContent>
          </Card>
        );

      case 'interview':
        return project ? (
          <InterviewFlow
            projectId={project.id}
            onComplete={(responses) => handleInterviewComplete(responses)}
            onSkip={handleSkipInterview}
          />
        ) : null;

      case 'generating':
        return (
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              <FileText className="h-12 w-12 mx-auto text-primary animate-pulse" />
              <AIProgress stage="generating" currentStep="Composing descriptions and SEO" />
            </CardContent>
          </Card>
        );

      case 'review':
        return editedContent ? (
          <Card>
            <CardHeader>
              <CardTitle>Review Your Project</CardTitle>
              <CardDescription>
                Review and edit the AI-generated content before publishing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editedContent.title}
                  onChange={(e) =>
                    setEditedContent({ ...editedContent, title: e.target.value })
                  }
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editedContent.description}
                  onChange={(e) =>
                    setEditedContent({ ...editedContent, description: e.target.value })
                  }
                  rows={10}
                />
                <p className="text-xs text-muted-foreground">
                  {editedContent.description.split(' ').length} words
                </p>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {editedContent.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Materials & Techniques */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Materials</Label>
                  <div className="flex flex-wrap gap-1">
                    {editedContent.materials.map((m) => (
                      <Badge key={m} variant="outline" className="text-xs">
                        {m}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Techniques</Label>
                  <div className="flex flex-wrap gap-1">
                    {editedContent.techniques.map((t) => (
                      <Badge key={t} variant="outline" className="text-xs">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* SEO Preview */}
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <Label className="text-muted-foreground">SEO Preview</Label>
                <p className="text-blue-600 hover:underline cursor-pointer">
                  {editedContent.seo_title}
                </p>
                <p className="text-sm text-green-700">
                  knearme.com/denver-co/masonry/project-type/...
                </p>
                <p className="text-sm text-muted-foreground">
                  {editedContent.seo_description}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button variant="outline" onClick={handleSaveDraft} disabled={isLoading}>
                  Save as Draft
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const feedback = prompt('What would you like to change?');
                    if (feedback) handleRegenerate(feedback);
                  }}
                  disabled={isLoading}
                >
                  Regenerate
                </Button>
                <Button
                  onClick={handlePublish}
                  disabled={isLoading}
                  className="sm:ml-auto"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Rocket className="h-4 w-4 mr-2" />
                      Publish Project
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null;

      case 'published':
        return (
          <Card className="text-center py-12">
            <CardContent className="space-y-6">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Project Published!</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Your project is now live on your portfolio. Search engines will start
                  indexing it shortly.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="outline" onClick={() => router.push('/projects')}>
                  View All Projects
                </Button>
                <Button onClick={() => window.location.reload()}>
                  Create Another Project
                </Button>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <h1 className="text-2xl font-bold mb-6">Create New Project</h1>

      {renderStepIndicator()}
      {renderStep()}
    </div>
  );
}
