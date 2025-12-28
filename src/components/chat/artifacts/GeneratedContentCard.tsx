'use client';

/**
 * GeneratedContentCard artifact.
 *
 * Displays the result of the ContentGenerator agent's portfolio content generation.
 * Shows generated title, description, SEO metadata, and tags with actions to
 * accept, edit, or regenerate the content.
 *
 * @see /src/lib/agents/content-generator.ts
 * @see /src/lib/chat/tool-schemas.ts GeneratePortfolioContentOutput
 */

import { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  Tags,
  ChevronDown,
  ChevronUp,
  Pencil,
  RefreshCw,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { GeneratedContentData } from '@/types/artifacts';

interface GeneratedContentCardProps {
  /** Generated content data from tool output */
  data: GeneratedContentData;
  /** Callback when user wants to take action */
  onAction?: (action: { type: string; payload?: unknown }) => void;
  /** Optional additional className */
  className?: string;
}

/**
 * Truncate text to a maximum length with ellipsis.
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Count words in a string.
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Tag chip component with staggered animation.
 */
function TagChip({ tag, index }: { tag: string; index: number }) {
  return (
    <span
      className={cn(
        'inline-block px-2 py-0.5 text-xs rounded-full',
        'bg-primary/10 text-primary',
        'animate-chip-slide-in',
        `chip-stagger-${Math.min(index + 1, 6)}`
      )}
    >
      {tag}
    </span>
  );
}

/**
 * Section header component.
 */
function SectionHeader({
  icon,
  label,
  sublabel,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-xs font-semibold uppercase text-muted-foreground">
        {label}
      </span>
      {sublabel && (
        <span className="text-xs text-muted-foreground/70">{sublabel}</span>
      )}
    </div>
  );
}

/**
 * GeneratedContentCard artifact component.
 *
 * Renders generated portfolio content with:
 * - Success/error status
 * - Generated title
 * - Description with expand/collapse
 * - SEO metadata
 * - Tags
 * - Action buttons (Accept, Edit, Regenerate)
 */
export function GeneratedContentCard({
  data,
  onAction,
  className,
}: GeneratedContentCardProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const { success, title, description, seoTitle, seoDescription, tags, error } =
    data;

  // If generation failed, show error state
  if (!success) {
    return (
      <div
        className={cn(
          'rounded-xl border border-destructive/30 bg-destructive/5 p-4',
          'animate-canvas-item-in',
          className
        )}
        data-testid="generated-content-card-error"
      >
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/20 flex-shrink-0">
            <XCircle className="h-6 w-6 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base text-destructive">
              Content Generation Failed
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {error || 'An unexpected error occurred while generating content.'}
            </p>
          </div>
        </div>

        {/* Retry button */}
        <div className="flex items-center gap-2 pt-3 mt-3 border-t border-border/50">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => onAction?.({ type: 'regenerate' })}
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const wordCount = countWords(description);
  const descriptionPreview = truncateText(description, 200);
  const needsExpansion = description.length > 200;

  return (
    <div
      className={cn(
        'rounded-xl border border-green-500/30 bg-green-500/5 p-4',
        'animate-canvas-item-in',
        className
      )}
      data-testid="generated-content-card"
    >
      {/* Header with success status */}
      <div className="flex items-start gap-3 mb-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500/20 flex-shrink-0">
          <CheckCircle2 className="h-6 w-6 text-green-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base text-green-600 dark:text-green-400">
            Content Generated!
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your portfolio content is ready for review
          </p>
        </div>
      </div>

      {/* Generated Title */}
      <div className="mb-4">
        <SectionHeader
          icon={<FileText className="h-4 w-4" />}
          label="Title"
          sublabel={`${title.length}/60 chars`}
        />
        <p className="text-base font-medium text-foreground pl-6">{title}</p>
      </div>

      {/* Generated Description */}
      <div className="mb-4">
        <SectionHeader
          icon={<FileText className="h-4 w-4" />}
          label="Description"
          sublabel={`${wordCount} words`}
        />
        <div className="pl-6">
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {isDescriptionExpanded ? description : descriptionPreview}
          </p>
          {needsExpansion && (
            <button
              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              className="flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
            >
              {isDescriptionExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  Show full description
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* SEO Metadata */}
      <div className="mb-4">
        <SectionHeader icon={<Search className="h-4 w-4" />} label="SEO" />
        <div className="pl-6 space-y-2">
          <div>
            <span className="text-xs text-muted-foreground">Title: </span>
            <span className="text-sm text-foreground">{seoTitle}</span>
            <span className="text-xs text-muted-foreground ml-1">
              ({seoTitle.length}/60)
            </span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Description: </span>
            <span className="text-sm text-foreground">{seoDescription}</span>
            <span className="text-xs text-muted-foreground ml-1">
              ({seoDescription.length}/160)
            </span>
          </div>
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="mb-4">
          <SectionHeader
            icon={<Tags className="h-4 w-4" />}
            label="Tags"
            sublabel={`${tags.length} tags`}
          />
          <div className="pl-6 flex flex-wrap gap-1.5">
            {tags.map((tag, index) => (
              <TagChip key={tag} tag={tag} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-3 border-t border-border/50">
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => onAction?.({ type: 'accept', payload: data })}
        >
          <Check className="h-4 w-4" />
          Accept
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => onAction?.({ type: 'edit', payload: data })}
        >
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="gap-1.5"
          onClick={() => onAction?.({ type: 'regenerate' })}
        >
          <RefreshCw className="h-4 w-4" />
          Regenerate
        </Button>
      </div>

      {/* ARIA live region for screen readers */}
      <div aria-live="polite" className="sr-only">
        Portfolio content generated successfully. Title: {title}. Description
        has {wordCount} words. {tags.length} tags assigned.
      </div>
    </div>
  );
}

export default GeneratedContentCard;
