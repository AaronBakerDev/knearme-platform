'use client';

/**
 * EmptyProjectState - Improved onboarding for new projects.
 *
 * Replaces the generic empty state with an engaging interface that:
 * - Provides animated drag-drop zone for photos
 * - Shows example prompts users can click to start
 * - Creates a welcoming first impression
 *
 * Design: Craft-forward aesthetic for working pros
 * - Subtle texture and depth
 * - Practical, welcoming tone
 * - Warm, inviting color palette
 *
 * @see LivePortfolioCanvas for integration
 */

import { useState, useCallback } from 'react';
import {
  Camera,
  Upload,
  Hammer,
  Building2,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyProjectStateProps {
  /** Called when user clicks an example prompt */
  onInsertPrompt: (text: string) => void;
  /** Called when user clicks to add photos */
  onAddPhotos: () => void;
  /** Additional class names */
  className?: string;
}

/**
 * Example prompts for different project types.
 */
const EXAMPLE_PROMPTS = [
  {
    id: 'remodel',
    icon: Building2,
    label: 'Remodel',
    description: 'Kitchens, baths, or full spaces',
    prompt:
      'I just finished a kitchen remodel. The family wanted more storage and better lighting.',
  },
  {
    id: 'custom',
    icon: Layers,
    label: 'Custom build',
    description: 'One-off pieces or installs',
    prompt:
      'I built a custom dining table for a couple who needed something durable for their kids.',
  },
  {
    id: 'repair',
    icon: Hammer,
    label: 'Repair',
    description: 'Fixes, upgrades, or tune-ups',
    prompt:
      'I repaired a leaking skylight and replaced the damaged trim to stop water issues.',
  },
] as const;

/**
 * Animated drop zone for photos.
 */
function PhotoDropZone({
  onClick,
  isDragOver,
  onDragOver,
  onDragLeave,
}: {
  onClick: () => void;
  isDragOver: boolean;
  onDragOver: () => void;
  onDragLeave: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver();
      }}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault();
        onDragLeave();
        // The actual drop handling is in the parent component
        onClick();
      }}
      className={cn(
        // Layout
        'w-full aspect-[16/10] max-w-sm rounded-2xl',
        'flex flex-col items-center justify-center gap-3',
        // Base styling
        'border-2 border-dashed transition-all duration-300',
        // Normal state
        'border-border/50 bg-muted/30',
        'hover:border-primary/40 hover:bg-primary/5',
        // Drag over state
        isDragOver && [
          'border-primary bg-primary/10',
          'scale-[1.02] shadow-lg shadow-primary/10',
        ],
        // Focus state
        'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2',
        // Cursor
        'cursor-pointer group'
      )}
    >
      {/* Icon container with animation */}
      <div
        className={cn(
          'relative w-16 h-16 rounded-2xl',
          'bg-muted/60 group-hover:bg-primary/10',
          'flex items-center justify-center',
          'transition-all duration-300',
          isDragOver && 'bg-primary/20 scale-110'
        )}
      >
        <Camera
          className={cn(
            'h-7 w-7 text-muted-foreground',
            'group-hover:text-primary transition-colors duration-300',
            isDragOver && 'text-primary'
          )}
        />

        {/* Upload indicator - appears on hover */}
        <div
          className={cn(
            'absolute -bottom-1.5 -right-1.5',
            'w-7 h-7 rounded-full',
            'bg-primary flex items-center justify-center',
            'opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100',
            'transition-all duration-200 ease-out',
            'shadow-md shadow-primary/30'
          )}
        >
          <Upload className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
      </div>

      {/* Text */}
      <div className="text-center">
        <p
          className={cn(
            'font-medium',
            'text-foreground/80 group-hover:text-primary',
            'transition-colors duration-200',
            isDragOver && 'text-primary'
          )}
        >
          {isDragOver ? 'Drop photos here' : 'Add your project photos'}
        </p>
        <p className="text-sm text-muted-foreground mt-0.5">
          or click to browse
        </p>
      </div>
    </button>
  );
}

/**
 * Example prompt card.
 */
function PromptCard({
  prompt,
  onSelect,
}: {
  prompt: (typeof EXAMPLE_PROMPTS)[number];
  onSelect: () => void;
}) {
  const Icon = prompt.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        // Layout
        'w-full flex items-center gap-3 p-3 rounded-xl',
        'text-left group',
        // Styling
        'bg-muted/30 border border-transparent',
        'hover:bg-muted/60 hover:border-border/50',
        // Animation
        'transition-all duration-200 ease-out',
        'active:scale-[0.98]',
        // Focus
        'focus:outline-none focus:ring-2 focus:ring-primary/30'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'w-10 h-10 rounded-xl',
          'bg-muted/60 group-hover:bg-primary/10',
          'flex items-center justify-center flex-shrink-0',
          'transition-colors duration-200'
        )}
      >
        <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-foreground/90 group-hover:text-foreground">
          {prompt.label}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {prompt.description}
        </p>
      </div>

      {/* Arrow */}
      <ArrowRight
        className={cn(
          'h-4 w-4 text-muted-foreground/0',
          'group-hover:text-primary group-hover:translate-x-0.5',
          'transition-all duration-200'
        )}
      />
    </button>
  );
}

/**
 * EmptyProjectState component.
 */
export function EmptyProjectState({
  onInsertPrompt,
  onAddPhotos,
  className,
}: EmptyProjectStateProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback(() => setIsDragOver(true), []);
  const handleDragLeave = useCallback(() => setIsDragOver(false), []);

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center h-full',
        'p-6 text-center',
        className
      )}
    >
      <div className="max-w-sm w-full space-y-8">
        {/* Photo upload zone */}
        <PhotoDropZone
          onClick={onAddPhotos}
          isDragOver={isDragOver}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        />

        {/* Divider */}
        <div className="relative flex items-center gap-3 py-2">
          <div className="flex-1 h-px bg-border/60" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2">
            or describe your work
          </span>
          <div className="flex-1 h-px bg-border/60" />
        </div>

        {/* Example prompts */}
        <div className="space-y-2">
          {EXAMPLE_PROMPTS.map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              onSelect={() => onInsertPrompt(prompt.prompt)}
            />
          ))}
        </div>

        {/* Footer hint */}
        <p className="text-xs text-muted-foreground/70 pt-2 max-w-[280px] mx-auto leading-relaxed">
          Tell me about any project — a remodel, repair, custom build,
          and more. I&apos;ll help create your portfolio.
        </p>
      </div>
    </div>
  );
}

export default EmptyProjectState;
