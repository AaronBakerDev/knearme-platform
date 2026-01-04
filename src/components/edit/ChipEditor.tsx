'use client'

/**
 * Chip Editor for materials and techniques arrays.
 *
 * Features:
 * - Grouped suggestions by category
 * - Quick-add from predefined options
 * - Custom chip input
 * - Remove chips with X button
 * - Reusable for both materials and techniques
 *
 * @see src/app/(dashboard)/projects/[id]/edit/page.tsx - Integration point
 */

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  Badge, Button, Input,
  Collapsible, CollapsibleContent, CollapsibleTrigger
} from '@/components/ui'
import { X, Plus, ChevronDown, ChevronUp } from 'lucide-react'

/**
 * Predefined materials organized by category for masonry projects.
 */
export const MATERIALS_SUGGESTIONS = {
  'Natural Stone': [
    'limestone',
    'granite',
    'sandstone',
    'slate',
    'marble',
    'flagstone',
    'fieldstone',
    'bluestone',
    'travertine',
    'quartzite',
  ],
  'Brick': [
    'clay brick',
    'fire brick',
    'engineering brick',
    'facing brick',
    'reclaimed brick',
    'thin brick',
    'handmade brick',
  ],
  'Concrete & Block': [
    'concrete',
    'concrete block',
    'cinder block',
    'poured concrete',
    'precast concrete',
    'concrete pavers',
    'stamped concrete',
  ],
  'Mortar & Grout': [
    'type N mortar',
    'type S mortar',
    'type M mortar',
    'lime mortar',
    'portland cement',
    'grout',
    'thinset',
  ],
  'Other': [
    'cultured stone',
    'veneer',
    'stucco',
    'tile',
    'glass block',
    'rebar',
    'flashing',
  ],
} as const

/**
 * Predefined techniques organized by category for masonry projects.
 */
export const TECHNIQUES_SUGGESTIONS = {
  'Repair & Restoration': [
    'tuckpointing',
    'repointing',
    'brick repair',
    'stone repair',
    'crack repair',
    'spalling repair',
    'efflorescence removal',
    'lintel replacement',
    'parging',
  ],
  'Construction': [
    'new construction',
    'laying brick',
    'stone setting',
    'block laying',
    'foundation work',
    'structural reinforcement',
    'arch construction',
    'keystone installation',
  ],
  'Surface Treatment': [
    'cleaning',
    'pressure washing',
    'chemical cleaning',
    'sealing',
    'waterproofing',
    'coating',
    'staining',
    'painting',
  ],
  'Specialty': [
    'chimney rebuild',
    'crown repair',
    'flue lining',
    'fireplace restoration',
    'historic preservation',
    'color matching',
    'custom fabrication',
    'demolition',
  ],
} as const

type ChipType = 'materials' | 'techniques'

interface ChipEditorProps {
  /** Type of chips (determines suggestions) */
  type: ChipType
  /** Current chip values */
  values: string[]
  /** Callback when values change */
  onChange: (values: string[]) => void
  /** Maximum number of chips allowed */
  maxChips?: number
  /** Label for the field */
  label?: string
  /** Disable editing */
  disabled?: boolean
  /** Additional CSS classes */
  className?: string
}

export function ChipEditor({
  type,
  values,
  onChange,
  maxChips = 15,
  label,
  disabled = false,
  className,
}: ChipEditorProps) {
  const [customInput, setCustomInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Get appropriate suggestions based on type
  const suggestions = type === 'materials' ? MATERIALS_SUGGESTIONS : TECHNIQUES_SUGGESTIONS

  // Add a chip
  const addChip = useCallback(
    (chipToAdd: string) => {
      const normalized = chipToAdd.toLowerCase().trim()
      if (!normalized) return
      if (values.length >= maxChips) return
      if (values.some(v => v.toLowerCase() === normalized)) return

      onChange([...values, normalized])
      setCustomInput('')
    },
    [values, maxChips, onChange]
  )

  // Remove a chip
  const removeChip = useCallback(
    (index: number) => {
      onChange(values.filter((_, i) => i !== index))
    },
    [values, onChange]
  )

  // Check if a suggestion is already added
  const isAdded = useCallback(
    (suggestion: string) => values.some(v => v.toLowerCase() === suggestion.toLowerCase()),
    [values]
  )

  const canAddMore = values.length < maxChips && !disabled

  return (
    <div className={cn('space-y-3', className)}>
      {/* Label */}
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">{label}</label>
          <span className="text-xs text-muted-foreground">
            {values.length}/{maxChips}
          </span>
        </div>
      )}

      {/* Current chips */}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((chip, index) => (
            <Badge
              key={`${chip}-${index}`}
              variant="secondary"
              className="px-2 py-1 text-sm gap-1 pr-1"
            >
              {chip}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeChip(index)}
                  className={cn(
                    // Minimum 44px touch target - visually smaller but larger hit area
                    'ml-1 h-6 w-6 -mr-1 rounded-full',
                    'inline-flex items-center justify-center',
                    'hover:bg-destructive/20 hover:text-destructive',
                    'focus:outline-none focus:ring-2 focus:ring-ring',
                    // Expand touch target beyond visual bounds
                    'relative before:absolute before:inset-[-8px] before:content-[""]'
                  )}
                  aria-label={`Remove: ${chip}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Custom input */}
      {canAddMore && (
        <div className="flex gap-2">
          <Input
            type="text"
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addChip(customInput)
              }
            }}
            placeholder={`Add custom ${type === 'materials' ? 'material' : 'technique'}...`}
            disabled={disabled}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => addChip(customInput)}
            disabled={!customInput.trim() || disabled}
            className="h-10 w-10"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Suggestions collapsible */}
      {canAddMore && (
        <Collapsible open={showSuggestions} onOpenChange={setShowSuggestions}>
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-between text-muted-foreground hover:text-foreground"
            >
              <span>
                {showSuggestions ? 'Hide' : 'Show'} common {type}
              </span>
              {showSuggestions ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            {Object.entries(suggestions).map(([category, items]) => (
              <div key={category} className="space-y-1">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {category}
                </h4>
                <div className="flex flex-wrap gap-1">
                  {(items as readonly string[]).map((item: string) => {
                    const added = isAdded(item)
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => !added && addChip(item)}
                        disabled={added || disabled}
                        className={cn(
                          'px-2 py-1 text-xs rounded-md border transition-colors',
                          added
                            ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                            : 'bg-background hover:bg-accent hover:text-accent-foreground border-input'
                        )}
                      >
                        {item}
                        {added && <span className="ml-1">✓</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* At max message */}
      {values.length >= maxChips && (
        <p className="text-xs text-muted-foreground">
          Maximum of {maxChips} {type} reached
        </p>
      )}
    </div>
  )
}

export default ChipEditor
