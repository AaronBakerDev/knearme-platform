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
import { useRef } from 'react'
import { cn } from '@/lib/utils'
import { animations } from '@/lib/puck/design-system'

/**
 * MediaRef type from Payload CMS
 */
interface MediaRef {
  id: string
  url: string
  alt: string
  width?: number
  height?: number
  thumbnailUrl?: string
}

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
}: {
  item: TestimonialItem
  showAvatar: boolean
  isCarousel: boolean
  shouldReduceMotion: boolean
}) {
  return (
    <motion.blockquote
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
  const isInView = useInView(containerRef, { once: true, amount: 0.2 })
  const shouldReduceMotion = useReducedMotion() ?? false

  // Carousel layout with horizontal scroll and snap behavior
  if (layout === 'carousel') {
    return (
      <div className="relative" ref={containerRef}>
        {/* Scrollable container with snap points */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="flex gap-6 overflow-x-auto scroll-smooth pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40"
          style={{
            // Ensure items at edges can be scrolled fully into view
            scrollPaddingInline: '1rem',
          }}
        >
          {items.map((item, i) => (
            <TestimonialCard
              key={i}
              item={item}
              showAvatar={showAvatar}
              isCarousel={true}
              shouldReduceMotion={shouldReduceMotion}
            />
          ))}
        </motion.div>

        {/* Navigation hint for carousel - shows scroll indicators */}
        {items.length > 1 && (
          <div className="mt-4 flex justify-center gap-2">
            {items.map((_, i) => (
              <div
                key={i}
                className="h-2 w-2 rounded-full bg-muted-foreground/30"
                aria-hidden="true"
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
