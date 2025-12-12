'use client'

import { useState, useEffect } from 'react'
import { ChevronUp, ChevronDown, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

export interface StickyResultsBarProps {
  /** Collapsed summary content (e.g., "$2,500 - $4,000") */
  summary: React.ReactNode
  /** Label for the summary (e.g., "Estimated cost") */
  summaryLabel: string
  /** Full results panel content */
  children: React.ReactNode
  /** Called when share button clicked */
  onShare?: () => void
  /** Optional className */
  className?: string
}

/**
 * StickyResultsBar Component
 *
 * Fixed bottom bar on mobile that displays calculation result summary,
 * expanding to full results when tapped.
 *
 * Features:
 * - Fixed position at bottom of screen
 * - Collapsed state shows summary with chevron up indicator
 * - Expanded state shows full results in sheet
 * - Slide-in animation on mount (300ms delay)
 * - Pulse animation when summary changes
 * - Share button integration
 *
 * @see {@link /Users/aaronbaker/knearme-workspace/knearme-portfolio/src/components/ui/sheet.tsx} Sheet component
 * @see {@link https://ui.shadcn.com/docs/components/sheet} shadcn/ui Sheet docs
 */
export function StickyResultsBar({
  summary,
  summaryLabel,
  children,
  onShare,
  className,
}: StickyResultsBarProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [shouldPulse, setShouldPulse] = useState(false)

  // Slide in animation on mount (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  // Pulse animation when summary changes
  useEffect(() => {
    if (!isVisible) return

    setShouldPulse(true)
    const timer = setTimeout(() => {
      setShouldPulse(false)
    }, 600)

    return () => clearTimeout(timer)
  }, [summary, isVisible])

  return (
    <>
      {/* Fixed bottom bar - mobile/tablet only */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-40 lg:hidden',
          'bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800',
          'shadow-lg transition-transform duration-300',
          isVisible ? 'translate-y-0' : 'translate-y-full',
          className
        )}
      >
        <button
          onClick={() => setIsExpanded(true)}
          className={cn(
            'w-full px-4 py-3 flex items-center justify-between',
            'text-left hover:bg-gray-50 dark:hover:bg-gray-900',
            'transition-colors duration-200',
            shouldPulse && 'animate-pulse'
          )}
          aria-label="View full results"
        >
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {summaryLabel}
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
              {summary}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            {onShare && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  onShare()
                }}
                className="shrink-0"
                aria-label="Share results"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            )}
            <ChevronUp className="h-5 w-5 text-gray-400 shrink-0" />
          </div>
        </button>
      </div>

      {/* Expanded sheet with full results */}
      <Sheet open={isExpanded} onOpenChange={setIsExpanded}>
        <SheetContent
          side="bottom"
          className="h-[90vh] overflow-y-auto p-0"
        >
          <SheetHeader className="sticky top-0 z-10 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
            <div className="flex items-center justify-between">
              <SheetTitle>{summaryLabel}</SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(false)}
                aria-label="Collapse results"
              >
                <ChevronDown className="h-5 w-5" />
              </Button>
            </div>
          </SheetHeader>

          <div className="p-4">
            {children}
          </div>
        </SheetContent>
      </Sheet>

      {/* Spacer to prevent content being hidden behind bar */}
      <div className="h-20 lg:hidden" aria-hidden="true" />
    </>
  )
}
