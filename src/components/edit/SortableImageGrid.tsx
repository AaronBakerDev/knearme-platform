'use client'

/**
 * Sortable Image Grid with drag-and-drop reordering.
 *
 * Features:
 * - Drag handles for reordering images
 * - Touch-friendly on mobile
 * - Cover photo indicator (first image)
 * - Image type badges
 * - Delete action on hover
 * - Saves order to API on change
 *
 * @see https://docs.dndkit.com/presets/sortable
 * @see src/app/(contractor)/projects/[id]/edit/page.tsx - Integration point
 */

import { useCallback, useState } from 'react'
import { SafeImage } from '@/components/ui/safe-image'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GripVertical, Trash2, Star, AlertTriangle } from 'lucide-react'
import type { ProjectImage } from '@/types/database'

interface ImageWithUrl extends ProjectImage {
  url: string
}

interface SortableImageGridProps {
  /** Array of images with URLs */
  images: ImageWithUrl[]
  /** Callback when images are reordered */
  onReorder: (images: ImageWithUrl[]) => void
  /** Callback when delete is clicked */
  onDelete: (image: ImageWithUrl) => void
  /** Disable interactions */
  disabled?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Individual sortable image item.
 */
function SortableImage({
  image,
  isFirst,
  onDelete,
  disabled,
}: {
  image: ImageWithUrl
  isFirst: boolean
  onDelete: () => void
  disabled?: boolean
}) {
  const [hasError, setHasError] = useState(false)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id, disabled })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group rounded-lg overflow-hidden border bg-background',
        isDragging && 'shadow-xl ring-2 ring-primary opacity-90',
        hasError && 'border-destructive/50'
      )}
    >
      {/* Image */}
      <div className="relative aspect-square">
        <SafeImage
          src={image.url}
          alt={image.alt_text || 'Project image'}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 33vw"
          onImageError={() => setHasError(true)}
          fallback={
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted gap-2">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <span className="text-xs text-muted-foreground text-center px-2">
                Image not found
              </span>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
                className="mt-1"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Remove
              </Button>
            </div>
          }
        />
      </div>

      {/* Drag handle - visible on hover and always on touch devices */}
      {!disabled && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          className={cn(
            // Minimum 44x44px touch target
            'absolute top-2 left-2 h-11 w-11 rounded-md',
            'inline-flex items-center justify-center',
            'bg-background/80 backdrop-blur-sm',
            'cursor-grab active:cursor-grabbing',
            // Always visible on mobile, hover on desktop
            'opacity-100 md:opacity-0 md:group-hover:opacity-100',
            'transition-opacity',
            // Touch-friendly
            'touch-manipulation'
          )}
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-5 w-5" />
        </button>
      )}

      {/* Delete button - visible on hover */}
      {!disabled && (
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center',
            'bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity',
            // On touch devices, show delete button without hover
            'md:pointer-events-none md:group-hover:pointer-events-auto'
          )}
        >
          <Button
            type="button"
            size="icon"
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            // Minimum 44x44px touch target
            className="h-11 w-11"
            aria-label="Delete image"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Cover photo badge (first image) */}
      {isFirst && (
        <Badge
          className="absolute top-2 right-2 gap-1 bg-yellow-500 hover:bg-yellow-600"
          variant="default"
        >
          <Star className="h-3 w-3" />
          Cover
        </Badge>
      )}

      {/* Image type badge */}
      {image.image_type && (
        <Badge className="absolute bottom-2 left-2" variant="secondary">
          {image.image_type}
        </Badge>
      )}
    </div>
  )
}

export function SortableImageGrid({
  images,
  onReorder,
  onDelete,
  disabled = false,
  className,
}: SortableImageGridProps) {
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
  )

  // Handle drag end
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event

      if (over && active.id !== over.id) {
        const oldIndex = images.findIndex((img) => img.id === active.id)
        const newIndex = images.findIndex((img) => img.id === over.id)

        const newImages = arrayMove(images, oldIndex, newIndex)
        onReorder(newImages)
      }
    },
    [images, onReorder]
  )

  if (images.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No images uploaded yet
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={images.map((img) => img.id)}
        strategy={rectSortingStrategy}
      >
        <div
          className={cn(
            'grid gap-4 sm:grid-cols-2 md:grid-cols-3',
            className
          )}
        >
          {images.map((image, index) => (
            <SortableImage
              key={image.id}
              image={image}
              isFirst={index === 0}
              onDelete={() => onDelete(image)}
              disabled={disabled}
            />
          ))}
        </div>
      </SortableContext>

      {/* Helper text */}
      {!disabled && images.length > 1 && (
        <p className="text-xs text-muted-foreground mt-3">
          Drag images to reorder. The first image will be used as the cover photo.
        </p>
      )}
    </DndContext>
  )
}

export default SortableImageGrid
