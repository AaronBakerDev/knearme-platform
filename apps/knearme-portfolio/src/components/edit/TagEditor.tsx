'use client'

/**
 * Tag Editor with autocomplete for masonry project tagging.
 *
 * Features:
 * - Autocomplete dropdown with common masonry tags
 * - Keyboard navigation (Enter to add, Backspace to remove last)
 * - Tag chips with remove buttons
 * - Maximum tag limit (10 by default)
 * - Duplicate prevention (case-insensitive)
 * - Touch-friendly with 44x44px targets
 *
 * @see src/app/(dashboard)/projects/[id]/edit/page.tsx - Integration point
 */

import { useState, useRef, useCallback, useMemo, KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { X, Plus } from 'lucide-react'

/**
 * Common masonry tags organized by category.
 * These provide autocomplete suggestions based on project context.
 */
export const MASONRY_TAG_SUGGESTIONS = {
  materials: [
    'brick',
    'stone',
    'concrete',
    'mortar',
    'limestone',
    'granite',
    'slate',
    'sandstone',
    'marble',
    'flagstone',
    'cobblestone',
    'pavers',
    'block',
    'cinder-block',
    'cultured-stone',
    'natural-stone',
    'recycled-brick',
    'thin-brick',
    'veneer',
  ],
  projectTypes: [
    'chimney',
    'fireplace',
    'patio',
    'retaining-wall',
    'walkway',
    'steps',
    'driveway',
    'outdoor-kitchen',
    'fire-pit',
    'mailbox',
    'column',
    'pillar',
    'foundation',
    'basement',
    'brick-wall',
    'stone-wall',
    'fence',
    'planter',
    'water-feature',
  ],
  techniques: [
    'tuckpointing',
    'repointing',
    'restoration',
    'repair',
    'rebuild',
    'new-construction',
    'demolition',
    'cleaning',
    'sealing',
    'waterproofing',
    'drainage',
    'flashing',
    'coping',
    'lintel-repair',
    'crown-repair',
    'parging',
    'stucco',
  ],
  qualities: [
    'historic',
    'modern',
    'rustic',
    'contemporary',
    'custom',
    'decorative',
    'structural',
    'residential',
    'commercial',
    'industrial',
    'outdoor',
    'indoor',
    'landscape',
    'hardscape',
  ],
} as const

// Flatten all suggestions into a single array for autocomplete
const ALL_SUGGESTIONS = [
  ...MASONRY_TAG_SUGGESTIONS.materials,
  ...MASONRY_TAG_SUGGESTIONS.projectTypes,
  ...MASONRY_TAG_SUGGESTIONS.techniques,
  ...MASONRY_TAG_SUGGESTIONS.qualities,
]

interface TagEditorProps {
  /** Current tags */
  tags: string[]
  /** Callback when tags change */
  onChange: (tags: string[]) => void
  /** Maximum number of tags allowed */
  maxTags?: number
  /** Placeholder text */
  placeholder?: string
  /** Disable editing */
  disabled?: boolean
  /** Additional CSS classes */
  className?: string
}

export function TagEditor({
  tags,
  onChange,
  maxTags = 10,
  placeholder = 'Add tags...',
  disabled = false,
  className,
}: TagEditorProps) {
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLUListElement>(null)

  // Filter suggestions based on input and exclude already-added tags
  const filteredSuggestions = useMemo(() => {
    if (!input.trim()) return []

    const normalizedInput = input.toLowerCase().trim()
    const normalizedTags = tags.map(t => t.toLowerCase())

    return ALL_SUGGESTIONS.filter(
      suggestion =>
        suggestion.toLowerCase().includes(normalizedInput) &&
        !normalizedTags.includes(suggestion.toLowerCase())
    ).slice(0, 8) // Limit to 8 suggestions for performance
  }, [input, tags])

  // Add a tag (normalized to lowercase, trimmed)
  const addTag = useCallback(
    (tagToAdd: string) => {
      const normalized = tagToAdd.toLowerCase().trim()

      // Validation
      if (!normalized) return
      if (normalized.length < 2 || normalized.length > 30) return
      if (tags.length >= maxTags) return
      if (tags.some(t => t.toLowerCase() === normalized)) return

      onChange([...tags, normalized])
      setInput('')
      setShowSuggestions(false)
      setHighlightedIndex(-1)
      inputRef.current?.focus()
    },
    [tags, maxTags, onChange]
  )

  // Remove a tag by index
  const removeTag = useCallback(
    (index: number) => {
      onChange(tags.filter((_, i) => i !== index))
    },
    [tags, onChange]
  )

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        if (highlightedIndex >= 0 && filteredSuggestions[highlightedIndex]) {
          addTag(filteredSuggestions[highlightedIndex])
        } else if (input.trim()) {
          addTag(input)
        }
      } else if (e.key === 'Backspace' && !input && tags.length > 0) {
        // Remove last tag on backspace when input is empty
        removeTag(tags.length - 1)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1))
      } else if (e.key === 'Escape') {
        setShowSuggestions(false)
        setHighlightedIndex(-1)
      }
    },
    [input, tags, highlightedIndex, filteredSuggestions, addTag, removeTag]
  )

  // Handle input changes
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setInput(value)
      setShowSuggestions(value.length > 0)
      setHighlightedIndex(-1)
    },
    []
  )

  // Handle clicking a suggestion
  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      addTag(suggestion)
    },
    [addTag]
  )

  const canAddMore = tags.length < maxTags && !disabled

  return (
    <div className={cn('space-y-2', className)}>
      {/* Tag chips */}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <Badge
            key={`${tag}-${index}`}
            variant="secondary"
            className={cn(
              'px-2 py-1 text-sm gap-1',
              // Touch-friendly remove button
              'pr-1'
            )}
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(index)}
                className={cn(
                  // Minimum 44px touch target - visually smaller but larger hit area
                  'ml-1 h-6 w-6 -mr-1 rounded-full',
                  'inline-flex items-center justify-center',
                  'hover:bg-destructive/20 hover:text-destructive',
                  'focus:outline-none focus:ring-2 focus:ring-ring',
                  // Expand touch target beyond visual bounds
                  'relative before:absolute before:inset-[-8px] before:content-[""]'
                )}
                aria-label={`Remove tag: ${tag}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </Badge>
        ))}
      </div>

      {/* Input with autocomplete */}
      {canAddMore && (
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => input && setShowSuggestions(true)}
                onBlur={() => {
                  // Delay hiding to allow click on suggestion
                  setTimeout(() => setShowSuggestions(false), 200)
                }}
                placeholder={placeholder}
                disabled={disabled}
                className="pr-10"
                aria-label="Add tag"
                aria-autocomplete="list"
                aria-expanded={showSuggestions && filteredSuggestions.length > 0}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {tags.length}/{maxTags}
              </span>
            </div>
            <button
              type="button"
              onClick={() => input.trim() && addTag(input)}
              disabled={!input.trim() || disabled}
              className={cn(
                // 44x44px touch target
                'h-10 w-10 rounded-md border border-input',
                'inline-flex items-center justify-center',
                'hover:bg-accent hover:text-accent-foreground',
                'focus:outline-none focus:ring-2 focus:ring-ring',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              aria-label="Add tag"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Autocomplete dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <ul
              ref={suggestionsRef}
              className={cn(
                'absolute z-50 w-full mt-1',
                'bg-popover border border-border rounded-md shadow-md',
                'max-h-[200px] overflow-y-auto'
              )}
              role="listbox"
            >
              {filteredSuggestions.map((suggestion, index) => (
                <li
                  key={suggestion}
                  role="option"
                  aria-selected={index === highlightedIndex}
                  className={cn(
                    'px-3 py-2 cursor-pointer text-sm',
                    'hover:bg-accent hover:text-accent-foreground',
                    index === highlightedIndex && 'bg-accent text-accent-foreground'
                  )}
                  onClick={() => handleSuggestionClick(suggestion)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* At max tags message */}
      {tags.length >= maxTags && (
        <p className="text-xs text-muted-foreground">
          Maximum of {maxTags} tags reached
        </p>
      )}
    </div>
  )
}

export default TagEditor
