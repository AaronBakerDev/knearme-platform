/**
 * Central catalog for homeowner tools.
 *
 * Single source of truth for:
 * - /tools hub cards
 * - footer tools links
 * - SEO structured data
 * - Tool categorization and relationships
 *
 * @see /src/app/(public)/tools/page.tsx - Hub page using this catalog
 * @see /src/lib/seo/structured-data.ts - Schema generation
 */

import type { LucideIcon } from 'lucide-react'
import { AlertTriangle, Calculator, Droplets, Layers, Wrench, CalendarCheck, Home, Brush, Truck } from 'lucide-react'
import type { ServiceId } from '@/lib/constants/services'

export type ToolStatus = 'live' | 'comingSoon'

/**
 * Tool categories for hub page grouping.
 * Order determines display order on the hub page.
 */
export type ToolCategory = 'cost-planning' | 'urgency-assessment' | 'material-estimator' | 'treatment-guide'

export type ToolComplexity = 'simple' | 'moderate' | 'detailed'

/**
 * Category metadata for hub page display.
 * Icons and descriptions help users understand what each category offers.
 */
export const TOOL_CATEGORIES: Record<ToolCategory, {
  label: string
  description: string
  icon: LucideIcon
  order: number
}> = {
  'cost-planning': {
    label: 'Cost Planning',
    description: 'Estimate repair costs before getting quotes',
    icon: Calculator,
    order: 1,
  },
  'urgency-assessment': {
    label: 'Urgency Assessment',
    description: 'Understand how serious your issue is',
    icon: AlertTriangle,
    order: 2,
  },
  'material-estimator': {
    label: 'Material Estimators',
    description: 'Calculate materials needed for your project',
    icon: Wrench,
    order: 3,
  },
  'treatment-guide': {
    label: 'Treatment Guides',
    description: 'Get step-by-step treatment plans',
    icon: Brush,
    order: 4,
  },
}

export interface ToolDefinition {
  slug: string
  title: string
  description: string
  icon: LucideIcon
  status: ToolStatus
  badge?: string
  footerLabel?: string
  prdPath?: string

  // New UX enhancement fields
  /** Tool category for hub page grouping */
  category: ToolCategory
  /** Number of form inputs (helps set user expectations) */
  inputCount: number
  /** Estimated completion time (e.g., "~2 min") */
  estimatedTime: string
  /** Complexity level affects UI hints */
  complexity: ToolComplexity
  /** Slugs of related tools for cross-linking */
  relatedTools: string[]
  /** Service IDs for internal linking to service pages */
  relatedServices: ServiceId[]
}

export const TOOLS_CATALOG: ToolDefinition[] = [
  {
    slug: 'masonry-cost-estimator',
    title: 'Masonry Repair Cost Estimator',
    footerLabel: 'Masonry Cost Estimator',
    description: 'Get a planning-level cost range for common masonry repairs in your city.',
    icon: Calculator,
    status: 'live',
    badge: 'New',
    prdPath: 'docs/12-homeowner-tools/masonry-cost-estimator.md',
    category: 'cost-planning',
    inputCount: 6,
    estimatedTime: '~2 min',
    complexity: 'moderate',
    relatedTools: ['chimney-repair-urgency-checklist', 'tuckpointing-calculator', 'brick-replacement-calculator'],
    relatedServices: ['chimney-repair', 'tuckpointing', 'brick-repair', 'foundation-repair'],
  },
  {
    slug: 'chimney-repair-urgency-checklist',
    title: 'Chimney Repair Urgency Checklist',
    footerLabel: 'Chimney Checklist',
    description: 'Quickly understand how serious your chimney symptoms are and what to do next.',
    icon: AlertTriangle,
    status: 'live',
    badge: 'New',
    prdPath: 'docs/12-homeowner-tools/chimney-repair-urgency-checklist.md',
    category: 'urgency-assessment',
    inputCount: 9,
    estimatedTime: '~1 min',
    complexity: 'simple',
    relatedTools: ['masonry-cost-estimator'],
    relatedServices: ['chimney-repair'],
  },
  {
    slug: 'tuckpointing-calculator',
    title: 'Tuckpointing Material + Labor Calculator',
    footerLabel: 'Tuckpointing Calculator',
    description: 'Estimate mortar volume, bags needed, and labor time for tuckpointing.',
    icon: Wrench,
    status: 'live',
    badge: 'New',
    prdPath: 'docs/12-homeowner-tools/tuckpointing-material-labor-calculator.md',
    category: 'material-estimator',
    inputCount: 5,
    estimatedTime: '~2 min',
    complexity: 'moderate',
    relatedTools: ['masonry-cost-estimator', 'brick-replacement-calculator'],
    relatedServices: ['tuckpointing'],
  },
  {
    slug: 'brick-replacement-calculator',
    title: 'Brick Replacement Calculator',
    footerLabel: 'Brick Replacement',
    description: 'Estimate brick count and a planning budget for spot brick replacement.',
    icon: Calculator,
    status: 'live',
    badge: 'New',
    prdPath: 'docs/12-homeowner-tools/brick-replacement-calculator.md',
    category: 'material-estimator',
    inputCount: 5,
    estimatedTime: '~2 min',
    complexity: 'moderate',
    relatedTools: ['masonry-cost-estimator', 'tuckpointing-calculator'],
    relatedServices: ['brick-repair'],
  },
  {
    slug: 'retaining-wall-planner',
    title: 'Retaining Wall Planner',
    footerLabel: 'Retaining Wall Planner',
    description: 'Estimate blocks, base gravel, drainage needs, and safety limits for a straight retaining wall.',
    icon: Layers,
    status: 'live',
    badge: 'New',
    prdPath: 'docs/12-homeowner-tools/retaining-wall-planner.md',
    category: 'material-estimator',
    inputCount: 6,
    estimatedTime: '~3 min',
    complexity: 'detailed',
    relatedTools: ['masonry-cost-estimator'],
    relatedServices: ['retaining-walls', 'concrete-work'],
  },
  {
    slug: 'foundation-crack-severity-checker',
    title: 'Foundation Crack Severity Checker',
    footerLabel: 'Foundation Crack Checker',
    description: 'Triage vertical, diagonal, horizontal, and stair-step cracks with clear next steps.',
    icon: Home,
    status: 'live',
    badge: 'New',
    prdPath: 'docs/12-homeowner-tools/foundation-crack-severity-checker.md',
    category: 'urgency-assessment',
    inputCount: 6,
    estimatedTime: '~2 min',
    complexity: 'moderate',
    relatedTools: ['masonry-cost-estimator', 'waterproofing-risk-checklist'],
    relatedServices: ['foundation-repair'],
  },
  {
    slug: 'efflorescence-treatment-planner',
    title: 'Efflorescence Cause + Treatment Planner',
    footerLabel: 'Efflorescence Planner',
    description: 'Find out why white powder appears on brick and get a safe DIY cleaning plan.',
    icon: Brush,
    status: 'live',
    badge: 'New',
    prdPath: 'docs/12-homeowner-tools/efflorescence-treatment-planner.md',
    category: 'treatment-guide',
    inputCount: 4,
    estimatedTime: '~2 min',
    complexity: 'simple',
    relatedTools: ['waterproofing-risk-checklist'],
    relatedServices: ['efflorescence-removal', 'waterproofing'],
  },
  {
    slug: 'waterproofing-risk-checklist',
    title: 'Waterproofing Risk + Decision Checklist',
    footerLabel: 'Waterproofing Checklist',
    description: 'Score moisture risk for brick/stone and get a conservative "what to do first" plan.',
    icon: Droplets,
    status: 'live',
    badge: 'New',
    prdPath: 'docs/12-homeowner-tools/waterproofing-risk-checklist.md',
    category: 'urgency-assessment',
    inputCount: 8,
    estimatedTime: '~2 min',
    complexity: 'moderate',
    relatedTools: ['foundation-crack-severity-checker', 'efflorescence-treatment-planner'],
    relatedServices: ['waterproofing'],
  },
  {
    slug: 'paver-base-calculator',
    title: 'Paver Base + Materials Calculator',
    footerLabel: 'Paver Base Calculator',
    description: 'Estimate gravel base, bedding sand, and excavation depth for patios and walkways.',
    icon: Truck,
    status: 'live',
    badge: 'New',
    prdPath: 'docs/12-homeowner-tools/paver-base-calculator.md',
    category: 'material-estimator',
    inputCount: 5,
    estimatedTime: '~2 min',
    complexity: 'simple',
    relatedTools: ['masonry-cost-estimator'],
    relatedServices: ['outdoor-living', 'concrete-work'],
  },
  {
    slug: 'masonry-maintenance-scheduler',
    title: 'Masonry Maintenance Scheduler',
    footerLabel: 'Maintenance Scheduler',
    description: 'Generate a yearly masonry inspection and maintenance calendar for your home.',
    icon: CalendarCheck,
    status: 'live',
    badge: 'New',
    prdPath: 'docs/12-homeowner-tools/masonry-maintenance-scheduler.md',
    category: 'treatment-guide',
    inputCount: 4,
    estimatedTime: '~3 min',
    complexity: 'simple',
    relatedTools: ['masonry-cost-estimator'],
    relatedServices: ['tuckpointing', 'chimney-repair', 'waterproofing'],
  },
  {
    slug: 'basement-leak-triage',
    title: 'Basement Leak Source Triage',
    footerLabel: 'Basement Leak Triage',
    description: 'Identify the most likely basement leak source and get a conservative fix order.',
    icon: Droplets,
    status: 'live',
    badge: 'New',
    prdPath: 'docs/13-homeowner-tools-phase-2/basement-leak-triage.md',
    category: 'urgency-assessment',
    inputCount: 4,
    estimatedTime: '~1 min',
    complexity: 'simple',
    relatedTools: ['outdoor-drainage-quick-planner', 'waterproofing-risk-checklist', 'foundation-crack-severity-checker'],
    relatedServices: ['waterproofing', 'foundation-repair'],
  },
  {
    slug: 'concrete-slab-settling-diagnostic',
    title: 'Concrete Slab Settling Diagnostic',
    footerLabel: 'Concrete Settling Diagnostic',
    description: 'Diagnose why a concrete patio, slab, or sidewalk is sinking and what to do next.',
    icon: Layers,
    status: 'live',
    badge: 'New',
    prdPath: 'docs/13-homeowner-tools-phase-2/concrete-slab-settling-diagnostic.md',
    category: 'urgency-assessment',
    inputCount: 3,
    estimatedTime: '~1 min',
    complexity: 'simple',
    relatedTools: ['outdoor-drainage-quick-planner', 'masonry-cost-estimator'],
    relatedServices: ['concrete-work', 'outdoor-living'],
  },
  {
    slug: 'repoint-vs-replace-decision',
    title: 'Repoint vs Replace Decision Tool',
    footerLabel: 'Repoint vs Replace',
    description: 'Decide whether your wall needs repointing, brick replacement, or a rebuild consult.',
    icon: Wrench,
    status: 'live',
    badge: 'New',
    prdPath: 'docs/13-homeowner-tools-phase-2/repoint-vs-replace-decision.md',
    category: 'urgency-assessment',
    inputCount: 3,
    estimatedTime: '~1 min',
    complexity: 'simple',
    relatedTools: ['tuckpointing-calculator', 'brick-replacement-calculator', 'masonry-cost-estimator', 'waterproofing-risk-checklist'],
    relatedServices: ['tuckpointing', 'brick-repair', 'waterproofing'],
  },
  {
    slug: 'outdoor-drainage-quick-planner',
    title: 'Outdoor Drainage Quick Planner',
    footerLabel: 'Drainage Planner',
    description: 'Plan downspout extensions and grading to keep water away from masonry.',
    icon: Droplets,
    status: 'live',
    badge: 'New',
    prdPath: 'docs/13-homeowner-tools-phase-2/outdoor-drainage-quick-planner.md',
    category: 'treatment-guide',
    inputCount: 3,
    estimatedTime: '~1 min',
    complexity: 'simple',
    relatedTools: ['basement-leak-triage', 'waterproofing-risk-checklist'],
    relatedServices: ['waterproofing', 'foundation-repair'],
  },
  {
    slug: 'chimney-water-intrusion-risk-checklist',
    title: 'Chimney Water Intrusion Risk Checklist',
    footerLabel: 'Chimney Leak Checklist',
    description: 'Score chimney leak risk and get a conservative roofline-first fix order.',
    icon: Droplets,
    status: 'live',
    badge: 'New',
    prdPath: 'docs/13-homeowner-tools-phase-2/chimney-water-intrusion-risk-checklist.md',
    category: 'urgency-assessment',
    inputCount: 3,
    estimatedTime: '~1 min',
    complexity: 'simple',
    relatedTools: ['chimney-repair-urgency-checklist', 'waterproofing-risk-checklist', 'masonry-cost-estimator'],
    relatedServices: ['chimney-repair', 'waterproofing'],
  },
] as const

export const LIVE_TOOLS = TOOLS_CATALOG.filter((t) => t.status === 'live')
export const COMING_SOON_TOOLS = TOOLS_CATALOG.filter((t) => t.status === 'comingSoon')

export function getToolBySlug(slug: string) {
  return TOOLS_CATALOG.find((t) => t.slug === slug)
}

/**
 * Get all tools in a specific category.
 * Returns tools filtered by category, maintaining catalog order.
 */
export function getToolsByCategory(category: ToolCategory): ToolDefinition[] {
  return TOOLS_CATALOG.filter((tool) => tool.category === category)
}

/**
 * Get category order for hub page display.
 * Returns categories sorted by their order property.
 */
export function getCategoryOrder(): ToolCategory[] {
  return Object.entries(TOOL_CATEGORIES)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([key]) => key as ToolCategory)
}

/**
 * Get full tool definitions for a tool's related tools.
 * Returns array of ToolDefinition objects for the given tool's relatedTools slugs.
 * Filters out any slugs that don't match existing tools.
 */
export function getRelatedTools(slug: string): ToolDefinition[] {
  const tool = getToolBySlug(slug)
  if (!tool) return []

  return tool.relatedTools
    .map((relatedSlug) => getToolBySlug(relatedSlug))
    .filter((t): t is ToolDefinition => t !== undefined)
}
