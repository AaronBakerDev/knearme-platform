/**
 * Puck Testimonials Block - Client Component
 *
 * Displays customer quotes in carousel or grid layout with hover effects.
 * Uses Framer Motion for:
 * - Subtle card lift on hover (y: -8)
 * - Staggered entrance animations
 * - Respects prefers-reduced-motion
 *
 * @see PUCK-046 for hover effects acceptance criteria
 * @see PUCK-022 for base implementation criteria
 * @see src/lib/puck/design-system.ts for animation constants
 */
'use client'

import Image from 'next/image'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type Ref } from 'react'
import { cn } from '@/lib/utils'
import { animations } from '@/lib/puck/design-system'
import type { MediaRef } from '@/types/puck'

/**
 * Testimonial item shape from Puck config
 */
interface TestimonialItem {
  quote: string
  author: string
  title: string
  avatar: MediaRef | null
}

/**
 * Props for PuckTestimonials component
 */
interface PuckTestimonialsProps {
  items: TestimonialItem[]
  layout: 'carousel' | 'grid'
  showAvatar: boolean
}

/**
 * Animation variants for container (staggered children)
 */
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

/**
 * Animation variants for individual cards
 */
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: animations.duration.base,
      ease: animations.easing.easeOut as [number, number, number, number],
    },
  },
}

/**
 * Individual testimonial card component with hover effects
 */
function TestimonialCard({
  item,
  showAvatar,
  isCarousel,
  shouldReduceMotion,
  cardRef,
  panelId,
  labelledBy,
}: {
  item: TestimonialItem
  showAvatar: boolean
  isCarousel: boolean
  shouldReduceMotion: boolean
  cardRef?: Ref<HTMLQuoteElement>
  panelId?: string
  labelledBy?: string
}) {
  return (
    <motion.blockquote
      ref={cardRef}
      id={panelId}
      role={isCarousel ? 'tabpanel' : undefined}
      aria-labelledby={isCarousel ? labelledBy : undefined}
      variants={cardVariants}
      whileHover={
        shouldReduceMotion
          ? undefined
          : {
              y: -8,
              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
              transition: { duration: 0.2 },
            }
      }
      className={cn(
        'flex flex-col rounded-xl bg-muted/50 p-6',
        // Base shadow, enhanced on hover via whileHover
        'shadow-sm transition-shadow duration-200',
        isCarousel ? 'min-w-[320px] snap-center sm:min-w-[400px]' : ''
      )}
    >
      {/* Quote icon */}
      <svg
        className="mb-4 h-8 w-8 text-primary/20"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
      </svg>

      {/* Quote text */}
      <p className="flex-1 text-base italic leading-relaxed text-foreground/90">
        &ldquo;{item.quote}&rdquo;
      </p>

      {/* Author section */}
      <footer className="mt-6 flex items-center gap-4">
        {/* Avatar - conditionally rendered based on showAvatar prop */}
        {showAvatar && item.avatar?.url && (
          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full">
            <Image
              src={item.avatar.url}
              alt={item.avatar.alt || item.author}
              fill
              className="object-cover"
              sizes="48px"
            />
          </div>
        )}
        {/* Placeholder avatar when no image */}
        {showAvatar && !item.avatar?.url && (
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="text-lg font-semibold">
              {item.author?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
        )}
        <div>
          <div className="font-semibold text-foreground">{item.author}</div>
          <div className="text-sm text-muted-foreground">{item.title}</div>
        </div>
      </footer>
    </motion.blockquote>
  )
}

/**
 * Main Testimonials component with animations and hover effects
 */
export function PuckTestimonials({ items, layout, showAvatar }: PuckTestimonialsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Array<HTMLQuoteElement | null>>([])
  const indicatorRefs = useRef<Array<HTMLButtonElement | null>>([])
  const isInView = useInView(containerRef, { once: true, amount: 0.2 })
  const shouldReduceMotion = useReducedMotion() ?? false
  const [currentIndex, setCurrentIndex] = useState(0)

  const scrollToIndex = useCallback(
    (index: number) => {
      const target = itemRefs.current[index]
      if (!target) return

      setCurrentIndex(index)
      target.scrollIntoView({
        behavior: shouldReduceMotion ? 'auto' : 'smooth',
        inline: 'center',
        block: 'nearest',
      })
    },
    [shouldReduceMotion]
  )

  const handleIndicatorKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      if (items.length <= 1) return

      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault()

        const nextIndex =
          event.key === 'ArrowRight'
            ? (index + 1) % items.length
            : (index - 1 + items.length) % items.length

        scrollToIndex(nextIndex)
        indicatorRefs.current[nextIndex]?.focus()
      }
    },
    [items.length, scrollToIndex]
  )

  useEffect(() => {
    if (layout !== 'carousel') return
    const container = scrollContainerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting)
        if (visibleEntries.length === 0) return

        const mostVisible = visibleEntries.reduce((prev, current) =>
          current.intersectionRatio > prev.intersectionRatio ? current : prev
        )
        const index = itemRefs.current.findIndex((item) => item === mostVisible.target)
        if (index !== -1) {
          setCurrentIndex(index)
        }
      },
      { root: container, threshold: [0.5, 0.75] }
    )

    itemRefs.current.forEach((item) => {
      if (item) observer.observe(item)
    })

    return () => observer.disconnect()
  }, [items.length, layout])

  // Carousel layout with horizontal scroll and snap behavior
  if (layout === 'carousel') {
    return (
      <div className="relative" ref={containerRef}>
        {/* Scrollable container with snap points */}
        <motion.div
          ref={scrollContainerRef}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="flex gap-6 overflow-x-auto scroll-smooth pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40"
          style={{
            // Ensure items at edges can be scrolled fully into view
            scrollPaddingInline: '1rem',
          }}
        >
          {items.map((item, i) => {
            const panelId = `testimonial-panel-${i}`
            const tabId = `testimonial-tab-${i}`
            return (
              <TestimonialCard
                key={i}
                item={item}
                showAvatar={showAvatar}
                isCarousel={true}
                shouldReduceMotion={shouldReduceMotion}
                cardRef={(el) => {
                  itemRefs.current[i] = el
                }}
                panelId={panelId}
                labelledBy={tabId}
              />
            )
          })}
        </motion.div>

        {/* Navigation hint for carousel - shows scroll indicators */}
        {items.length > 1 && (
          <div className="mt-4 flex justify-center gap-2" role="tablist" aria-label="Testimonials">
            {items.map((_, i) => (
              <button
                key={i}
                ref={(el) => {
                  indicatorRefs.current[i] = el
                }}
                type="button"
                onClick={() => scrollToIndex(i)}
                onKeyDown={(event) => handleIndicatorKeyDown(event, i)}
                className={cn(
                  'h-2 w-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  currentIndex === i ? 'bg-primary' : 'bg-muted-foreground/30'
                )}
                aria-label={`View testimonial ${i + 1} of ${items.length}`}
                role="tab"
                aria-selected={currentIndex === i}
                aria-controls={`testimonial-panel-${i}`}
                id={`testimonial-tab-${i}`}
                tabIndex={currentIndex === i ? 0 : -1}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  // Grid layout - responsive auto-fit columns with staggered animations
  return (
    <motion.div
      ref={containerRef}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
    >
      {items.map((item, i) => (
        <TestimonialCard
          key={i}
          item={item}
          showAvatar={showAvatar}
          isCarousel={false}
          shouldReduceMotion={shouldReduceMotion}
        />
      ))}
    </motion.div>
  )
}

export default PuckTestimonials
