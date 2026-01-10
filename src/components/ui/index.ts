/**
 * UI Component Barrel Exports
 *
 * Centralizes all shadcn/ui component exports for cleaner imports.
 * Instead of multiple import lines from individual component files,
 * consumers can use a single import from '@/components/ui'.
 *
 * @example
 * // Before (multiple imports):
 * import { Button } from '@/components/ui/button'
 * import { Card, CardContent } from '@/components/ui/card'
 * import { Input } from '@/components/ui/input'
 *
 * // After (single barrel import):
 * import { Button, Card, CardContent, Input } from '@/components/ui'
 *
 * @see https://ui.shadcn.com for component documentation
 */

// Core form components
export * from './button'
export * from './input'
export * from './textarea'
export * from './label'
export * from './checkbox'
export * from './select'
export * from './switch'

// Form utilities
export * from './form'
export * from './form-error'

// Layout components
export * from './card'
export * from './separator'
export * from './scroll-area'
export * from './collapsible'
export * from './accordion'
export * from './tabs'

// Overlay components
export * from './dialog'
export * from './alert-dialog'
export * from './sheet'
export * from './dropdown-menu'
export * from './tooltip'
export * from './command'
export * from './navigation-menu'

// Feedback components
export * from './alert'
export * from './badge'
export * from './progress'
export * from './skeleton'
export * from './sonner'

// Display components
export * from './avatar'

// Custom/extended components
export * from './password-input'
export * from './password-requirements'
export * from './cta-button'
export * from './upload-progress'
export * from './ai-progress'
export * from './save-indicator'
export * from './safe-image'
