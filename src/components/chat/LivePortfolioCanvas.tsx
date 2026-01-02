/**
 * Live Portfolio Canvas - Real-time preview of portfolio being built.
 *
 * Shows the portfolio coming together as data is extracted from
 * conversation and images are uploaded. Displays in the right column
 * of the split-pane desktop layout.
 *
 * Visual States:
 * - Empty: Improved onboarding with drop zone + example prompts
 * - Starting: First content appearing (< 25%)
 * - Partial: Building up (25-60%)
 * - Almost: Most content present (60-99%)
 * - Ready: Complete and glowing (100%)
 *
 * @see chat-ux-patterns.md#liveportfoliocanvas
 * @see implementation-roadmap.md#phase-3-live-preview
 * @see EmptyProjectState - New onboarding empty state component
 * @see ExpandableProgressChecklist - Clickable progress with checklist
 */

'use client';

import { useMemo } from 'react';
import { ImageIcon, Clock, MapPin, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ProjectPublicPreview } from '@/components/portfolio/ProjectPublicPreview';
import { DynamicPortfolioRenderer, type PortfolioImage } from '@/components/portfolio/DynamicPortfolioRenderer';
import Image from 'next/image';
import { EmptyProjectState } from './EmptyProjectState';
import { ExpandableProgressChecklist } from './ExpandableProgressChecklist';
import type { ProjectPreviewData } from './hooks/useProjectData';
import type { CompletenessState } from './hooks/useCompleteness';
import type { Project, Business, Contractor, ProjectImage } from '@/types/database';
import type { RelatedProject } from '@/lib/data/projects';
import type { DesignTokens } from '@/lib/design/tokens';
import type { SemanticBlock } from '@/lib/design/semantic-blocks';

interface LivePortfolioCanvasProps {
  /** Aggregated project data from useProjectData */
  data: ProjectPreviewData;
  /** Completeness state from useCompleteness */
  completeness: CompletenessState;
  /** Optional public project preview data for full parity rendering */
  publicPreview?: {
    project: Project;
    /** Business data for the preview */
    business: Business | Contractor;
    images: (ProjectImage & { url?: string })[];
    relatedProjects?: RelatedProject[];
    /** @deprecated Use business instead */
    contractor?: Contractor;
  };
  /** Optional dynamic portfolio layout from AI-generated design tokens and blocks */
  portfolioLayout?: {
    tokens: DesignTokens;
    blocks: SemanticBlock[];
    rationale?: string;
  } | null;
  /** Optional override title (e.g. showPortfolioPreview tool) */
  titleOverride?: string | null;
  /** Fields to visually highlight as recently updated */
  highlightFields?: string[];
  /** Optional preview status message */
  previewMessage?: string | null;
  /** Called when user clicks an example prompt or missing field */
  onInsertPrompt?: (text: string) => void;
  /** Called when user clicks to add photos */
  onAddPhotos?: () => void;
  /** Whether to show the progress checklist (defaults to true unless public preview) */
  showChecklist?: boolean;
  /** Optional additional className */
  className?: string;
}


/**
 * Hero image grid component.
 * Layout: 1 large + 2 small images.
 */
function HeroImageGrid({
  primary,
  secondary,
}: {
  primary: { url: string; filename?: string } | null;
  secondary: { url: string; filename?: string }[];
}) {
  if (!primary) {
    return (
      <div className="aspect-[4/3] rounded-xl border-2 border-dashed border-muted-foreground/20 flex items-center justify-center bg-muted/20">
        <div className="text-center">
          <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">Add photos to see them here</p>
        </div>
      </div>
    );
  }

  // If only 1 image, show it large
  if (secondary.length === 0) {
    return (
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden animate-canvas-item-in">
        <Image
          src={primary.url}
          alt={primary.filename || 'Project photo'}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
    );
  }

  // Grid layout: 1 large (2x2) + up to 2 small (1x1 each)
  return (
    <div className="grid grid-cols-3 gap-2 animate-canvas-item-in">
      {/* Primary image - spans 2 columns and 2 rows */}
      <div className="relative col-span-2 row-span-2 aspect-square rounded-xl overflow-hidden">
        <Image
          src={primary.url}
          alt={primary.filename || 'Project photo'}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      {/* Secondary images */}
      {secondary.slice(0, 2).map((img, i) => (
        <div
          key={img.url}
          className={cn(
            'relative aspect-square rounded-lg overflow-hidden',
            `stagger-${i + 1}`
          )}
        >
          <Image
            src={img.url}
            alt={img.filename || `Project photo ${i + 2}`}
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-cover"
          />
        </div>
      ))}
      {/* Placeholder if only 1 secondary */}
      {secondary.length === 1 && (
        <div className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
          <ImageIcon className="h-4 w-4 text-muted-foreground/30" />
        </div>
      )}
    </div>
  );
}

/**
 * Main LivePortfolioCanvas component.
 */
export function LivePortfolioCanvas({
  data,
  completeness,
  publicPreview,
  portfolioLayout,
  titleOverride,
  highlightFields,
  previewMessage,
  onInsertPrompt,
  onAddPhotos,
  showChecklist,
  className,
}: LivePortfolioCanvasProps) {
  const { visualState, percentage, statusMessage } = completeness;
  const highlightSet = useMemo(
    () =>
      new Set(
        (highlightFields ?? []).map((field) => field.trim().toLowerCase())
      ),
    [highlightFields]
  );
  const hasHighlight = (fields: string[]) =>
    fields.some((field) => highlightSet.has(field));
  const highlightClass = 'rounded-xl ring-1 ring-primary/40 bg-primary/5';
  const displayTitle = titleOverride ?? data.suggestedTitle;
  const shouldShowChecklist = showChecklist ?? !publicPreview;

  /**
   * Handle action from progress checklist.
   * Currently only supports 'addPhotos'.
   */
  const handleAction = (action: 'addPhotos') => {
    if (action === 'addPhotos' && onAddPhotos) {
      onAddPhotos();
    }
  };

  // Render dynamic AI-generated layout when available
  if (portfolioLayout?.tokens && portfolioLayout?.blocks?.length > 0) {
    // Convert uploaded images to PortfolioImage format
    const portfolioImages: PortfolioImage[] = data?.allImages?.map(img => ({
      id: img.id,
      url: img.url,
      alt: img.filename || 'Project image',
      width: img.width || 800,
      height: img.height || 600,
    })) || [];

    return (
      <div className={cn('h-full flex flex-col overflow-y-auto overscroll-contain', className)}>
        <DynamicPortfolioRenderer
          tokens={portfolioLayout.tokens}
          blocks={portfolioLayout.blocks}
          images={portfolioImages}
          className="p-4"
        />
        {portfolioLayout.rationale && (
          <div className="p-4 bg-muted/50 text-sm text-muted-foreground border-t">
            <span className="font-medium">Layout rationale:</span> {portfolioLayout.rationale}
          </div>
        )}
        {shouldShowChecklist && (
          <ExpandableProgressChecklist
            completeness={completeness}
            onInsertPrompt={onInsertPrompt || (() => {})}
            onAction={handleAction}
            className="flex-shrink-0"
          />
        )}
      </div>
    );
  }

  if (publicPreview) {
    return (
      <div className={cn('h-full flex flex-col overflow-y-auto overscroll-contain', className)}>
        <ProjectPublicPreview
          project={publicPreview.project}
          business={publicPreview.business || publicPreview.contractor!}
          images={publicPreview.images}
          relatedProjects={publicPreview.relatedProjects ?? []}
          showBreadcrumbs={false}
          showBackLink={false}
          className="min-h-0"
        />
      </div>
    );
  }

  // Show improved empty state if no content
  if (!data.hasContent && visualState === 'empty') {
    return (
      <div className={cn('h-full flex flex-col', className)}>
        <EmptyProjectState
          onInsertPrompt={onInsertPrompt || (() => {})}
          onAddPhotos={onAddPhotos || (() => {})}
        />
      </div>
    );
  }

  return (
    <div className={cn('h-full flex flex-col overflow-y-auto overscroll-contain p-6', className)}>
      {/* Preview card container */}
      <div
        className={cn(
          'flex-1 rounded-2xl border bg-card p-6 space-y-6',
          visualState === 'ready' && 'animate-glow-pulse border-primary/50'
        )}
      >
        {previewMessage && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 border border-border/60 rounded-md px-2.5 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>{previewMessage}</span>
          </div>
        )}

        {/* Hero image section */}
        <div
          className={cn(
            hasHighlight(['photos', 'images', 'gallery']) && highlightClass,
            hasHighlight(['photos', 'images', 'gallery']) && 'p-1'
          )}
        >
          <HeroImageGrid
            primary={data.heroLayout.primary}
            secondary={data.heroLayout.secondary}
          />
        </div>

        {/* Title */}
        <div
          className={cn(
            'space-y-1',
            hasHighlight(['title']) && highlightClass,
            hasHighlight(['title']) && 'p-2'
          )}
        >
          {displayTitle ? (
            <h2 className="text-xl font-semibold tracking-tight animate-canvas-item-in">
              {displayTitle}
            </h2>
          ) : (
            <div className="h-7 bg-muted/50 rounded w-3/4 animate-pulse" />
          )}

          {/* Location and duration */}
          {(data.location || data.duration) && (
            <div
              className={cn(
                'flex items-center gap-4 text-sm text-muted-foreground animate-canvas-item-in stagger-1',
                hasHighlight(['location', 'duration']) && highlightClass,
                hasHighlight(['location', 'duration']) && 'px-2 py-1'
              )}
            >
              {data.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {data.location}
                </span>
              )}
              {data.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {data.duration}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Materials chips */}
        <div
          className={cn(
            'space-y-2',
            hasHighlight(['materials']) && highlightClass,
            hasHighlight(['materials']) && 'p-2'
          )}
        >
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Materials
          </p>
          <div className="flex flex-wrap gap-2">
            {data.materials.length > 0 ? (
              data.materials.map((material, i) => (
                <Badge
                  key={material}
                  variant="secondary"
                  className={cn(
                    'animate-chip-slide-in',
                    `chip-stagger-${Math.min(i + 1, 6)}`
                  )}
                >
                  {material}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground/50 italic">
                Materials will appear here
              </span>
            )}
          </div>
        </div>

        {/* Techniques chips */}
        {data.techniques.length > 0 && (
          <div
            className={cn(
              'space-y-2',
              hasHighlight(['techniques']) && highlightClass,
              hasHighlight(['techniques']) && 'p-2'
            )}
          >
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Techniques
            </p>
            <div className="flex flex-wrap gap-2">
              {data.techniques.map((technique, i) => (
                <Badge
                  key={technique}
                  variant="outline"
                  className={cn(
                    'animate-chip-slide-in',
                    `chip-stagger-${Math.min(i + 1, 6)}`
                  )}
                >
                  {technique}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Description placeholder */}
        <div
          className={cn(
            'space-y-2',
            hasHighlight(['description', 'problem', 'solution']) && highlightClass,
            hasHighlight(['description', 'problem', 'solution']) && 'p-2'
          )}
        >
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Description
          </p>
          {data.problem || data.solution ? (
            <div className="space-y-3 text-sm text-muted-foreground animate-canvas-item-in">
              {data.problem && (
                <p>
                  <span className="font-medium text-foreground">Challenge: </span>
                  {data.problem}
                </p>
              )}
              {data.solution && (
                <p>
                  <span className="font-medium text-foreground">Solution: </span>
                  {data.solution}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="h-4 bg-muted/30 rounded w-full animate-pulse" />
              <div className="h-4 bg-muted/30 rounded w-5/6 animate-pulse" />
              <div className="h-4 bg-muted/30 rounded w-4/6 animate-pulse" />
            </div>
          )}
        </div>

        {/* Highlight */}
        {data.highlight && (
          <div
            className={cn(
              'p-4 rounded-lg bg-primary/10 border border-primary/20 animate-canvas-item-in',
              hasHighlight(['highlight', 'proud_of']) && 'ring-1 ring-primary/50'
            )}
          >
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm">
                <span className="font-medium">Highlight: </span>
                {data.highlight}
              </p>
            </div>
          </div>
        )}
      </div>

      {shouldShowChecklist && (
        <div className="mt-4 pt-4 border-t">
          <ExpandableProgressChecklist
            completeness={completeness}
            onInsertPrompt={onInsertPrompt || (() => {})}
            onAction={handleAction}
          />
        </div>
      )}

      {/* ARIA live region for screen readers */}
      <div aria-live="polite" className="sr-only">
        {statusMessage}. {percentage}% complete.
      </div>
    </div>
  );
}
