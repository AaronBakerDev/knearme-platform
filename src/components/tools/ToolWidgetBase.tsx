'use client'

/**
 * Shared building blocks for homeowner diagnostic tool widgets.
 *
 * These components eliminate duplicated UI patterns across 15+ widget files
 * without forcing a rigid base component structure. Each widget composes
 * what it needs.
 *
 * @see tier-meta.ts - Shared tier metadata utilities (colors, icons, labels)
 * @see ToolSharing.tsx - URL state and shareable link utilities
 * @see ToolResults.tsx - Mobile sticky results bar
 * @see ToolPDF.tsx - PDF export functionality
 */

import { type ReactNode } from 'react'
import { ShieldAlert, type LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { type TierLevel, getTierMeta, getSeverityMeta, getRiskMeta, type TierMeta } from '@/lib/tools/tier-meta'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/** Standard option for select dropdowns */
export interface SelectOption<T extends string> {
  value: T
  label: string
}

/** Option with helper text for more complex selections */
export interface SelectOptionWithHelper<T extends string> extends SelectOption<T> {
  helper: string
}

/** Symptom/checkbox option definition */
export interface SymptomOption<K extends string> {
  key: K
  label: string
  helper?: string
}

// -----------------------------------------------------------------------------
// Select Field Components
// -----------------------------------------------------------------------------

interface ToolSelectProps<T extends string> {
  /** Label for the field */
  label: string
  /** Current selected value (undefined shows placeholder) */
  value: T | undefined
  /** Handler for value changes */
  onChange: (value: T) => void
  /** Available options */
  options: SelectOption<T>[]
  /** Optional icon to show before label */
  icon?: LucideIcon
  /** Placeholder text when no value selected */
  placeholder?: string
}

/**
 * Standard select field used across tool widgets.
 * Eliminates 100+ lines of duplicated Label + Select patterns.
 */
export function ToolSelect<T extends string>({
  label,
  value,
  onChange,
  options,
  icon: Icon,
  placeholder = 'Select...',
}: ToolSelectProps<T>) {
  return (
    <div className='space-y-2'>
      <Label className={Icon ? 'flex items-center gap-2' : undefined}>
        {Icon && <Icon className='h-4 w-4 text-muted-foreground' />}
        {label}
      </Label>
      <Select value={value ?? ''} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Checkbox/Symptom Components
// -----------------------------------------------------------------------------

interface SymptomCheckboxProps {
  /** Checkbox label */
  label: string
  /** Optional helper text */
  helper?: string
  /** Current checked state */
  checked: boolean
  /** Handler for check changes */
  onChange: (checked: boolean) => void
  /** Use compact styling (no border, smaller) */
  compact?: boolean
}

/**
 * Standard symptom checkbox used in tool widgets.
 * Two variants: full (with border, larger) and compact (inline).
 */
export function SymptomCheckbox({
  label,
  helper,
  checked,
  onChange,
  compact = false,
}: SymptomCheckboxProps) {
  if (compact) {
    return (
      <label className='flex items-center gap-2 cursor-pointer'>
        <input
          type='checkbox'
          className='h-4 w-4 accent-primary'
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        {label}
      </label>
    )
  }

  return (
    <label className='flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/40 cursor-pointer'>
      <input
        type='checkbox'
        className='mt-1 h-5 w-5 accent-primary'
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div>
        <div className='font-medium'>{label}</div>
        {helper && <div className='text-xs text-muted-foreground mt-1'>{helper}</div>}
      </div>
    </label>
  )
}

interface SymptomChecklistProps<K extends string> {
  /** Label for the section */
  label?: string
  /** Available symptoms */
  symptoms: SymptomOption<K>[]
  /** Current checked states (allows undefined for uninitialized state) */
  values: Partial<Record<K, boolean>>
  /** Handler for check changes */
  onChange: (key: K, checked: boolean) => void
  /** Use compact styling */
  compact?: boolean
  /** Additional class name */
  className?: string
}

/**
 * Renders a list of symptom checkboxes.
 * Eliminates duplicated symptom list patterns across widgets.
 */
export function SymptomChecklist<K extends string>({
  label,
  symptoms,
  values,
  onChange,
  compact = false,
  className,
}: SymptomChecklistProps<K>) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && <Label>{label}</Label>}
      <div className={cn('space-y-2', compact && 'text-sm')}>
        {symptoms.map((s) => (
          <SymptomCheckbox
            key={s.key}
            label={s.label}
            helper={s.helper}
            checked={values[s.key] ?? false}
            onChange={(checked) => onChange(s.key, checked)}
            compact={compact}
          />
        ))}
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Results Display Components
// -----------------------------------------------------------------------------

interface TierResultBadgeProps {
  /** The tier level */
  tier: TierLevel
  /** Type of tier display: 'default' | 'severity' | 'risk' */
  variant?: 'default' | 'severity' | 'risk'
  /** Custom body text (uses default if not provided) */
  body?: string
  /** Score value to display */
  score?: number
  /** Score label (default: 'Score') */
  scoreLabel?: string
  /** Custom title override */
  title?: string
}

/**
 * Tier result badge with icon, label, body text, and optional score.
 * The most commonly duplicated UI pattern across widgets.
 */
export function TierResultBadge({
  tier,
  variant = 'default',
  body,
  score,
  scoreLabel = 'Score',
  title,
}: TierResultBadgeProps) {
  const meta: TierMeta = variant === 'severity'
    ? getSeverityMeta(tier)
    : variant === 'risk'
      ? getRiskMeta(tier)
      : getTierMeta(tier)

  const TierIcon = meta.icon
  const displayTitle = title ?? meta.label

  return (
    <div className={cn('rounded-xl p-4', meta.colorClass)}>
      <div className='flex items-center gap-2 mb-2 font-semibold'>
        <TierIcon className='h-5 w-5' />
        {displayTitle}
      </div>
      {body && <p className='text-sm leading-relaxed'>{body}</p>}
      {score !== undefined && (
        <div className='text-xs mt-3'>{scoreLabel}: {score}</div>
      )}
    </div>
  )
}

interface ResultListCardProps {
  /** Card title */
  title: string
  /** List items to display */
  items: string[]
  /** Optional icon for the title */
  icon?: LucideIcon
  /** Use smaller title styling */
  smallTitle?: boolean
  /** Title color class override */
  titleClassName?: string
  /** Use numbered list instead of bullets */
  numbered?: boolean
}

/**
 * Card with a bulleted or numbered list of results.
 * Used for next steps, reasons, assumptions, etc.
 */
export function ResultListCard({
  title,
  items,
  icon: Icon,
  smallTitle = false,
  titleClassName,
  numbered = false,
}: ResultListCardProps) {
  if (items.length === 0) return null

  return (
    <Card className='border-0 shadow-sm'>
      <CardHeader>
        <CardTitle className={cn(
          smallTitle && 'text-base',
          Icon && 'flex items-center gap-2',
          titleClassName,
        )}>
          {Icon && <Icon className='h-4 w-4' />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-2 text-sm'>
        {items.map((item, i) => (
          <p key={item}>
            {numbered ? `${i + 1}. ` : '• '}
            {item}
          </p>
        ))}
      </CardContent>
    </Card>
  )
}

interface ProTriggersCardProps {
  /** List of pro trigger conditions */
  triggers: string[]
  /** Custom title (default: 'When to call a pro') */
  title?: string
}

/**
 * Destructive-styled card for "when to call a professional" triggers.
 * Common pattern across almost all diagnostic widgets.
 */
export function ProTriggersCard({ triggers, title = 'When to call a pro' }: ProTriggersCardProps) {
  if (triggers.length === 0) return null

  return (
    <Card className='border-0 shadow-sm'>
      <CardHeader>
        <CardTitle className='text-base flex items-center gap-2 text-destructive'>
          <ShieldAlert className='h-4 w-4' />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className='text-sm space-y-2'>
        {triggers.map((t) => (
          <p key={t}>• {t}</p>
        ))}
      </CardContent>
    </Card>
  )
}

interface ProTriggersInlineProps {
  /** List of pro trigger conditions */
  triggers: string[]
  /** Custom title (default: 'Consider a professional inspection') */
  title?: string
}

/**
 * Compact inline variant for pro triggers within a card.
 * Used when pro triggers appear inside another results card.
 */
export function ProTriggersInline({ triggers, title = 'Consider a professional inspection' }: ProTriggersInlineProps) {
  if (triggers.length === 0) return null

  return (
    <div className='rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs space-y-1'>
      <div className='flex items-center gap-2 font-medium text-destructive'>
        <ShieldAlert className='h-4 w-4' />
        {title}
      </div>
      {triggers.map((t) => (
        <p key={t}>• {t}</p>
      ))}
    </div>
  )
}

interface CauseDisplayProps {
  /** Cause label */
  label: string
  /** Cause description */
  description?: string
  /** Confidence level (if applicable) */
  confidence?: string
  /** Section label (default: 'Most likely cause') */
  sectionLabel?: string
}

/**
 * Displays a "most likely cause" result block.
 * Common pattern in diagnostic widgets.
 */
export function CauseDisplay({
  label,
  description,
  confidence,
  sectionLabel = 'Most likely cause',
}: CauseDisplayProps) {
  return (
    <div className='rounded-lg border bg-muted/30 p-3 text-sm space-y-1'>
      <div className='text-xs font-medium uppercase text-muted-foreground'>{sectionLabel}</div>
      <div className='font-medium'>{label}</div>
      {confidence && <div className='text-xs text-muted-foreground'>Confidence: {confidence}</div>}
      {description && <p className='text-xs text-muted-foreground leading-relaxed'>{description}</p>}
    </div>
  )
}

interface AssumptionsListProps {
  /** List of assumptions */
  assumptions: string[]
  /** Additional class name */
  className?: string
}

/**
 * Renders a list of tool assumptions in muted styling.
 */
export function AssumptionsList({ assumptions, className }: AssumptionsListProps) {
  if (assumptions.length === 0) return null

  return (
    <div className={cn('text-xs text-muted-foreground leading-relaxed space-y-1', className)}>
      {assumptions.map((a) => (
        <p key={a}>• {a}</p>
      ))}
    </div>
  )
}

// -----------------------------------------------------------------------------
// Layout Components
// -----------------------------------------------------------------------------

interface ToolWidgetLayoutProps {
  /** Left/main content (inputs) */
  children: ReactNode
  /** Right sidebar content (results) - hidden on mobile */
  results?: ReactNode
}

/**
 * Standard two-column layout for tool widgets.
 * Inputs on the left, results sidebar on the right (desktop only).
 */
export function ToolWidgetLayout({ children, results }: ToolWidgetLayoutProps) {
  return (
    <div className='grid gap-6 lg:grid-cols-[1fr,360px]'>
      {children}
      {results && (
        <div className='hidden lg:block space-y-6'>
          {results}
        </div>
      )}
    </div>
  )
}

interface InputsCardProps {
  /** Card title */
  title: string
  /** Optional icon for title */
  icon?: LucideIcon
  /** Card content */
  children: ReactNode
}

/**
 * Standard card wrapper for tool inputs section.
 */
export function InputsCard({ title, icon: Icon, children }: InputsCardProps) {
  return (
    <Card className='border-0 shadow-sm'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          {Icon && <Icon className='h-5 w-5 text-primary' />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        {children}
      </CardContent>
    </Card>
  )
}

interface ResultsCardProps {
  /** Card title */
  title: string
  /** Card content */
  children: ReactNode
  /** Use smaller title styling */
  smallTitle?: boolean
}

/**
 * Standard card wrapper for results section.
 */
export function ResultsCard({ title, children, smallTitle = false }: ResultsCardProps) {
  return (
    <Card className='border-0 shadow-sm'>
      <CardHeader>
        <CardTitle className={cn(smallTitle && 'text-base')}>{title}</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {children}
      </CardContent>
    </Card>
  )
}

// -----------------------------------------------------------------------------
// Disclaimer
// -----------------------------------------------------------------------------

interface ToolDisclaimerProps {
  /** Custom disclaimer text */
  text?: string
}

/**
 * Standard informational disclaimer for tool widgets.
 */
export function ToolDisclaimer({
  text = 'This tool is informational only and not a substitute for a licensed inspection.',
}: ToolDisclaimerProps) {
  return (
    <p className='text-xs text-muted-foreground pt-2'>
      {text}
    </p>
  )
}
