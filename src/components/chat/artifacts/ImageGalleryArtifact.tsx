'use client';

/**
 * ImageGalleryArtifact - Displays uploaded images inline in chat.
 *
 * Features:
 * - Drag-drop reordering with @dnd-kit
 * - Hero badge on first image (cover photo)
 * - Responsive grid: 3 columns desktop, 2 columns mobile
 * - Category badges with OKLCH colors
 * - Remove button on each image
 * - "Add more" placeholder slot
 * - Category quick-select via dropdown (right-click or long-press)
 *
 * @see /docs/ai-sdk/chat-artifacts-spec.md for specification
 * @see /src/components/edit/SortableImageGrid.tsx for similar @dnd-kit implementation
 */

import { useRef, useCallback, useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, Plus, Camera, Clock, Sparkles, Eye, GripVertical, Star } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { ImagePromptData } from '@/types/artifacts';

/**
 * Image type categories with their display config.
 */
type ImageCategory = 'before' | 'after' | 'progress' | 'detail';

interface CategoryConfig {
  label: string;
  /** OKLCH color for badge background */
  color: string;
  /** OKLCH color for badge text (darker variant) */
  textColor: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CATEGORY_CONFIG: Record<ImageCategory, CategoryConfig> = {
  before: {
    label: 'Before',
    color: 'oklch(0.7 0.15 50)',
    textColor: 'oklch(0.3 0.1 50)',
    icon: Camera,
  },
  after: {
    label: 'After',
    color: 'oklch(0.7 0.15 145)',
    textColor: 'oklch(0.3 0.1 145)',
    icon: Sparkles,
  },
  progress: {
    label: 'Progress',
    color: 'oklch(0.7 0.15 240)',
    textColor: 'oklch(0.3 0.1 240)',
    icon: Clock,
  },
  detail: {
    label: 'Detail',
    color: 'oklch(0.7 0.15 300)',
    textColor: 'oklch(0.3 0.1 300)',
    icon: Eye,
  },
};

interface ImageItem {
  id: string;
  url: string;
  image_type?: ImageCategory;
}

interface ImageGalleryArtifactProps {
  /** Image prompt data from tool output */
  data: ImagePromptData;
  /** Array of images to display */
  images?: ImageItem[];
  /** Callback for artifact actions */
  onAction?: (action: { type: string; payload?: unknown }) => void;
  /** Optional additional className */
  className?: string;
}

/**
 * Category badge component.
 */
function CategoryBadge({ category }: { category: ImageCategory }) {
  const config = CATEGORY_CONFIG[category];
  const Icon = config.icon;

  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded"
      style={{
        backgroundColor: config.color,
        color: config.textColor,
      }}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

/**
 * Individual sortable image card with drag handle, hero badge, and category selector.
 *
 * Uses @dnd-kit's useSortable hook for drag-drop functionality.
 * First image gets a "Hero" badge indicating it's the cover photo.
 *
 * @see /src/components/edit/SortableImageGrid.tsx for similar pattern
 */
function SortableImageCard({
  image,
  isFirst,
  onRemove,
  onCategorize,
}: {
  image: ImageItem;
  /** Whether this is the first (hero) image */
  isFirst: boolean;
  onRemove: () => void;
  onCategorize: (category: ImageCategory) => void;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  // @dnd-kit sortable hook
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  /**
   * Handle long press start (mobile touch).
   * Opens category menu after 300ms hold.
   */
  const handleTouchStart = useCallback(() => {
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setIsMenuOpen(true);
    }, 300);
  }, []);

  /**
   * Handle touch end - clear timer.
   */
  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  /**
   * Handle right-click context menu (desktop).
   */
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsMenuOpen(true);
    },
    []
  );

  return (
    <div ref={setNodeRef} style={style}>
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <div
            className={cn(
              'relative aspect-square rounded-lg overflow-hidden',
              'bg-muted border border-border',
              'group cursor-pointer',
              'animate-canvas-item-in',
              isDragging && 'shadow-xl ring-2 ring-primary opacity-90'
            )}
            onContextMenu={handleContextMenu}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            {/* Image */}
            <Image
              src={image.url}
              alt={`Project image ${image.id}`}
              fill
              sizes="(min-width: 1024px) 160px, 33vw"
              className="object-cover"
            />

          {/* Drag handle (top-left) - always visible on mobile, hover on desktop */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            className={cn(
              'absolute top-2 left-2 h-8 w-8 rounded-md',
              'inline-flex items-center justify-center',
              'bg-background/80 backdrop-blur-sm border border-border/50',
              'cursor-grab active:cursor-grabbing',
              'opacity-100 md:opacity-0 md:group-hover:opacity-100',
              'transition-opacity duration-200',
              'touch-manipulation'
            )}
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>

          {/* Hero badge (first image) */}
          {isFirst && (
            <span
              className={cn(
                'absolute top-2 right-10 px-1.5 py-0.5',
                'inline-flex items-center gap-1',
                'text-xs font-medium rounded',
                'bg-yellow-500 text-yellow-950'
              )}
            >
              <Star className="h-3 w-3" />
              Hero
            </span>
          )}

          {/* Category badge (if set) */}
          {image.image_type && (
            <div className="absolute bottom-2 left-2">
              <CategoryBadge category={image.image_type} />
            </div>
          )}

          {/* Remove button (top-right) */}
          <Button
            variant="destructive"
            size="icon-sm"
            className={cn(
              'absolute top-2 right-2',
              'opacity-0 group-hover:opacity-100',
              'transition-opacity duration-200',
              'h-6 w-6'
            )}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            aria-label="Remove image"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-40">
          {(Object.keys(CATEGORY_CONFIG) as ImageCategory[]).map((category) => {
            const config = CATEGORY_CONFIG[category];
            const Icon = config.icon;
            return (
              <DropdownMenuItem
                key={category}
                onClick={() => onCategorize(category)}
                className="gap-2"
              >
                <span style={{ color: config.color }}>
                  <Icon className="h-4 w-4" />
                </span>
                {config.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/**
 * "Add more" placeholder card.
 */
function AddMoreCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'aspect-square rounded-lg',
        'border-2 border-dashed border-border',
        'bg-muted/50 hover:bg-muted',
        'flex flex-col items-center justify-center gap-2',
        'text-muted-foreground hover:text-foreground',
        'transition-colors duration-200',
        'animate-canvas-item-in'
      )}
      aria-label="Add more images"
    >
      <Plus className="h-8 w-8" />
      <span className="text-sm font-medium">Add more</span>
    </button>
  );
}

/**
 * ImageGalleryArtifact displays images inline in chat with
 * drag-drop reordering, hero selection, category management, and removal.
 *
 * Key features:
 * - @dnd-kit powered drag-drop reordering
 * - First image is marked as "Hero" (cover photo)
 * - Category assignment via dropdown
 * - Calls onAction with reorder/remove/categorize/add events
 */
export function ImageGalleryArtifact({
  data,
  images = [],
  onAction,
  className,
}: ImageGalleryArtifactProps) {
  // Local state for optimistic reordering
  const [localImages, setLocalImages] = useState(images);

  // Sync local state when props change
  // (e.g., when server confirms reorder or new images added)
  useEffect(() => {
    setLocalImages(images);
  }, [images]);

  // Set up sensors for both mouse and touch
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // Small delay to prevent accidental drags
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /**
   * Handle drag end - reorder images and notify parent.
   */
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = localImages.findIndex((img) => img.id === active.id);
        const newIndex = localImages.findIndex((img) => img.id === over.id);

        const newImages = arrayMove(localImages, oldIndex, newIndex);
        setLocalImages(newImages);

        // Notify parent of reorder with new image IDs in order
        onAction?.({
          type: 'reorderImages',
          payload: { imageIds: newImages.map((img) => img.id) },
        });
      }
    },
    [localImages, onAction]
  );

  /**
   * Handle image removal.
   */
  const handleRemove = useCallback(
    (imageId: string) => {
      onAction?.({ type: 'remove', payload: { imageId } });
    },
    [onAction]
  );

  /**
   * Handle image categorization.
   */
  const handleCategorize = useCallback(
    (imageId: string, category: ImageCategory) => {
      onAction?.({ type: 'categorize', payload: { imageId, category } });
    },
    [onAction]
  );

  /**
   * Handle "Add more" click.
   */
  const handleAddMore = useCallback(() => {
    onAction?.({ type: 'add' });
  }, [onAction]);

  // Show suggested categories message if present
  const showMessage = data.message || (data.suggestedCategories?.length ?? 0) > 0;

  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-4 shadow-sm',
        'animate-canvas-item-in',
        className
      )}
    >
      {/* Header with message */}
      {showMessage && (
        <div className="mb-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Camera className="h-4 w-4 text-primary" />
            {data.message || 'Upload project photos'}
          </div>
          {data.suggestedCategories && data.suggestedCategories.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              <span className="text-xs text-muted-foreground mr-1">Suggested:</span>
              {data.suggestedCategories.map((category) => (
                <CategoryBadge key={category} category={category} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Image grid with drag-drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={localImages.map((img) => img.id)}
          strategy={rectSortingStrategy}
        >
          <div
            className={cn(
              'grid gap-3',
              // Responsive: 2 columns mobile, 3 columns desktop
              'grid-cols-2 sm:grid-cols-3'
            )}
          >
            {localImages.map((image, index) => (
              <SortableImageCard
                key={image.id}
                image={image}
                isFirst={index === 0}
                onRemove={() => handleRemove(image.id)}
                onCategorize={(category) => handleCategorize(image.id, category)}
              />
            ))}

            {/* Add more placeholder (not sortable) */}
            <AddMoreCard onClick={handleAddMore} />
          </div>
        </SortableContext>
      </DndContext>

      {/* Footer with count and helper text */}
      {localImages.length > 0 && (
        <div className="mt-3 text-xs text-muted-foreground text-center space-y-1">
          <p>
            {localImages.length} {localImages.length === 1 ? 'image' : 'images'} uploaded
            {data.existingCount > 0 &&
              data.existingCount !== localImages.length &&
              ` (${data.existingCount} previously uploaded)`}
          </p>
          {localImages.length > 1 && (
            <p className="text-muted-foreground/70">
              Drag images to reorder • First image is the cover photo
            </p>
          )}
        </div>
      )}
    </div>
  );
}
