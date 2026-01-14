'use client'

/**
 * Animated FAQ Accordion Component for Puck Visual Editor
 *
 * Features:
 * - Framer Motion AnimatePresence for smooth height animations
 * - Chevron rotation animation on open/close
 * - Full keyboard accessibility via Radix UI primitives
 * - Supports single or multiple items open simultaneously
 * - Respects prefers-reduced-motion accessibility setting
 *
 * @see PUCK-045 for acceptance criteria
 * @see src/components/ui/accordion.tsx for base shadcn component
 * @see src/lib/puck/design-system.ts for animation configurations
 */

import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { animations } from '@/lib/puck/design-system'

// ============================================================================
// TYPES
// ============================================================================

export interface FAQItem {
  question: string
  answer: string
}

export interface PuckFAQAccordionProps {
  items: FAQItem[]
  allowMultiple: boolean
  defaultOpen: number | null
}

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

/**
 * Cubic bezier easing function - typed as tuple for Framer Motion
 */
const easeInOut: [number, number, number, number] = [0.4, 0, 0.2, 1]

/**
 * Content height animation variants
 * Uses spring transition for natural, organic motion
 */
const contentVariants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.3, ease: easeInOut },
      opacity: { duration: 0.2, ease: easeInOut },
    },
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { duration: 0.3, ease: easeInOut },
      opacity: { duration: 0.2, delay: 0.1, ease: easeInOut },
    },
  },
}

/**
 * Container stagger animation for entrance effect
 */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: animations.stagger.fast,
    },
  },
}

/**
 * Item entrance animation
 */
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: animations.duration.base,
      ease: animations.easing.easeOut,
    },
  },
}

// ============================================================================
// FAQ ITEM COMPONENT
// ============================================================================

interface FAQItemComponentProps {
  item: FAQItem
  value: string
  isOpen: boolean
  shouldReduceMotion: boolean | null
}

/**
 * Individual FAQ item with animated content
 */
function FAQItemComponent({ item, value, isOpen, shouldReduceMotion }: FAQItemComponentProps) {
  return (
    <AccordionPrimitive.Item
      value={value}
      className="border-b last:border-b-0"
    >
      <AccordionPrimitive.Header className="flex">
        <AccordionPrimitive.Trigger
          className={cn(
            'flex flex-1 items-center justify-between gap-4 py-4 px-4 text-left text-base font-semibold transition-colors',
            'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:pointer-events-none disabled:opacity-50'
          )}
        >
          <span>{item.question}</span>
          {/* Animated chevron icon */}
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.2,
              ease: [0.4, 0, 0.2, 1],
            }}
            className="shrink-0"
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.span>
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>

      {/* Animated content wrapper */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <AccordionPrimitive.Content forceMount asChild>
            <motion.div
              initial={shouldReduceMotion ? 'expanded' : 'collapsed'}
              animate="expanded"
              exit={shouldReduceMotion ? undefined : 'collapsed'}
              variants={contentVariants}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 text-muted-foreground leading-relaxed">
                {item.answer}
              </div>
            </motion.div>
          </AccordionPrimitive.Content>
        )}
      </AnimatePresence>
    </AccordionPrimitive.Item>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Puck FAQ Accordion with Framer Motion animations
 *
 * Combines Radix UI Accordion for accessibility with Framer Motion for
 * smooth height animations and micro-interactions.
 */
export function PuckFAQAccordion({ items, allowMultiple, defaultOpen }: PuckFAQAccordionProps) {
  const shouldReduceMotion = useReducedMotion()

  // Track open state for animation control
  // Note: We need to track this ourselves since Radix doesn't expose it directly
  const [openItems, setOpenItems] = useState<string[]>(() => {
    const hasValidDefault = defaultOpen !== null && defaultOpen !== undefined && defaultOpen >= 0 && defaultOpen < items.length
    return hasValidDefault ? [`faq-${defaultOpen}`] : []
  })

  // Compute default value for Radix Accordion
  const hasValidDefault = defaultOpen !== null && defaultOpen !== undefined && defaultOpen >= 0 && defaultOpen < items.length
  const defaultValue = hasValidDefault ? `faq-${defaultOpen}` : undefined

  // Handle value change to track open state
  const handleValueChange = (value: string | string[]) => {
    if (Array.isArray(value)) {
      setOpenItems(value)
    } else {
      setOpenItems(value ? [value] : [])
    }
  }

  // Check if an item is open
  const isItemOpen = (index: number) => openItems.includes(`faq-${index}`)

  // Render accordion items with motion wrapper
  const renderItems = () => (
    items.map((item, i) => (
      <motion.div key={i} variants={shouldReduceMotion ? undefined : itemVariants}>
        <FAQItemComponent
          item={item}
          value={`faq-${i}`}
          isOpen={isItemOpen(i)}
          shouldReduceMotion={shouldReduceMotion}
        />
      </motion.div>
    ))
  )

  // Render based on allowMultiple mode
  // Note: TypeScript requires separate JSX for different accordion types
  if (allowMultiple) {
    return (
      <motion.div
        initial={shouldReduceMotion ? 'visible' : 'hidden'}
        animate="visible"
        variants={shouldReduceMotion ? undefined : containerVariants}
        className="w-full rounded-lg border"
      >
        <AccordionPrimitive.Root
          type="multiple"
          defaultValue={hasValidDefault ? [defaultValue!] : []}
          onValueChange={(value) => handleValueChange(value)}
          className="w-full"
        >
          {renderItems()}
        </AccordionPrimitive.Root>
      </motion.div>
    )
  }

  // Single mode with collapsible enabled
  return (
    <motion.div
      initial={shouldReduceMotion ? 'visible' : 'hidden'}
      animate="visible"
      variants={shouldReduceMotion ? undefined : containerVariants}
      className="w-full rounded-lg border"
    >
      <AccordionPrimitive.Root
        type="single"
        defaultValue={defaultValue}
        onValueChange={(value) => handleValueChange(value)}
        collapsible
        className="w-full"
      >
        {renderItems()}
      </AccordionPrimitive.Root>
    </motion.div>
  )
}
