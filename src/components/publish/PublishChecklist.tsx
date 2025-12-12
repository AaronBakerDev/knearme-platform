'use client'

/**
 * Pre-Publish Checklist Component.
 *
 * Shows validation status for all required fields before publishing.
 * Provides visual feedback and links to fix incomplete items.
 *
 * Features:
 * - Real-time validation status
 * - Green checkmark / red X indicators
 * - Click-to-fix navigation
 * - Overall publish readiness status
 * - SEO auto-generation suggestion
 *
 * @see src/app/(contractor)/projects/[id]/edit/page.tsx - Integration point
 */

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react'

interface ProjectData {
  title?: string
  description?: string
  seo_title?: string
  seo_description?: string
  tags?: string[]
  project_type?: string
  city?: string
}

interface PublishChecklistProps {
  /** Project data to validate */
  project: ProjectData
  /** Number of images uploaded */
  imageCount: number
  /** Callback to navigate to specific tab/field */
  onNavigate?: (tab: string, field?: string) => void
  /** Callback when publish button clicked */
  onPublish?: () => void
  /** Whether publish is in progress */
  isPublishing?: boolean
  /** Project status */
  status?: string
  /** Additional CSS classes */
  className?: string
}

interface ChecklistItem {
  id: string
  label: string
  description: string
  status: 'complete' | 'incomplete' | 'warning'
  tab: string
  field?: string
  autoFix?: boolean
}

/**
 * Count words in text (simple implementation).
 */
function countWords(text: string): number {
  const trimmed = text?.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).filter(word => word.length > 0).length
}

/**
 * Generate checklist items based on project state.
 */
function generateChecklist(project: ProjectData, imageCount: number): ChecklistItem[] {
  const items: ChecklistItem[] = []

  // Title check (5-100 chars)
  const titleLength = project.title?.length ?? 0
  items.push({
    id: 'title',
    label: 'Title',
    description: titleLength > 0 ? `${titleLength} characters` : 'Required',
    status: titleLength >= 5 && titleLength <= 100 ? 'complete' : 'incomplete',
    tab: 'content',
    field: 'title',
  })

  // Description check (200+ words)
  const wordCount = countWords(project.description || '')
  items.push({
    id: 'description',
    label: 'Description',
    description: wordCount > 0 ? `${wordCount} words (200 min)` : 'Required (200+ words)',
    status: wordCount >= 200 ? 'complete' : wordCount >= 50 ? 'warning' : 'incomplete',
    tab: 'content',
    field: 'description',
  })

  // Images check (at least 1)
  items.push({
    id: 'images',
    label: 'Project Images',
    description: imageCount > 0 ? `${imageCount} image${imageCount > 1 ? 's' : ''} uploaded` : 'At least 1 required',
    status: imageCount >= 1 ? 'complete' : 'incomplete',
    tab: 'images',
  })

  // Project Type check (Required for URL structure)
  const hasProjectType = !!project.project_type?.trim()
  items.push({
    id: 'project_type',
    label: 'Project Type',
    description: hasProjectType ? project.project_type! : 'Required for URL',
    status: hasProjectType ? 'complete' : 'incomplete',
    tab: 'content',
    field: 'project_type',
  })

  // Tags check (at least 1)
  const tagCount = project.tags?.length ?? 0
  items.push({
    id: 'tags',
    label: 'Tags',
    description: tagCount > 0 ? `${tagCount} tag${tagCount > 1 ? 's' : ''} added` : 'Recommended for SEO',
    status: tagCount >= 1 ? 'complete' : 'warning',
    tab: 'content',
    field: 'tags',
  })

  // SEO Title check
  const seoTitleLength = project.seo_title?.length ?? 0
  items.push({
    id: 'seo_title',
    label: 'SEO Title',
    description: seoTitleLength > 0 ? `${seoTitleLength}/60 characters` : 'Will auto-generate from title',
    status: seoTitleLength > 0 ? 'complete' : 'warning',
    tab: 'seo',
    field: 'seo_title',
    autoFix: !seoTitleLength && titleLength > 0,
  })

  // SEO Description check
  const seoDescLength = project.seo_description?.length ?? 0
  items.push({
    id: 'seo_description',
    label: 'SEO Description',
    description: seoDescLength > 0 ? `${seoDescLength}/160 characters` : 'Will auto-generate from description',
    status: seoDescLength > 0 ? 'complete' : 'warning',
    tab: 'seo',
    field: 'seo_description',
    autoFix: !seoDescLength && wordCount > 0,
  })

  return items
}

/**
 * Status icon component.
 */
function StatusIcon({ status }: { status: ChecklistItem['status'] }) {
  switch (status) {
    case 'complete':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />
    case 'warning':
      return <AlertCircle className="h-5 w-5 text-amber-500" />
    case 'incomplete':
      return <XCircle className="h-5 w-5 text-destructive" />
  }
}

export function PublishChecklist({
  project,
  imageCount,
  onNavigate,
  onPublish,
  isPublishing = false,
  status,
  className,
}: PublishChecklistProps) {
  const checklist = useMemo(
    () => generateChecklist(project, imageCount),
    [project, imageCount]
  )

  // Calculate overall readiness
  const requiredItems = checklist.filter(item => item.status !== 'warning')
  const completedRequired = requiredItems.filter(item => item.status === 'complete')
  const isReady = completedRequired.length === requiredItems.length

  // Separate required and optional items
  const requiredChecks = checklist.filter(
    item => ['title', 'description', 'images', 'project_type'].includes(item.id)
  )
  const optionalChecks = checklist.filter(
    item => !['title', 'description', 'images', 'project_type'].includes(item.id)
  )

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Publish Checklist</CardTitle>
            <CardDescription>
              Complete these items before publishing
            </CardDescription>
          </div>
          <Badge
            variant={isReady ? 'default' : 'secondary'}
            className={cn(isReady && 'bg-green-500 hover:bg-green-600')}
          >
            {isReady ? 'Ready to Publish' : 'Not Ready'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Required items */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Required</h4>
          {requiredChecks.map((item) => (
            <div
              key={item.id}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border',
                item.status === 'complete' && 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900',
                item.status === 'incomplete' && 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900'
              )}
            >
              <div className="flex items-center gap-3">
                <StatusIcon status={item.status} />
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
              {item.status !== 'complete' && onNavigate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate(item.tab, item.field)}
                  // Minimum 44px height for touch targets
                  className="h-11 px-3 text-xs"
                >
                  Fix <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Optional / SEO items */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">SEO Optimization</h4>
          {optionalChecks.map((item) => (
            <div
              key={item.id}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border',
                item.status === 'complete' && 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900',
                item.status === 'warning' && 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900'
              )}
            >
              <div className="flex items-center gap-3">
                <StatusIcon status={item.status} />
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                    {item.autoFix && (
                      <span className="inline-flex items-center ml-1 text-green-600">
                        <Sparkles className="h-3 w-3 mr-0.5" />
                        Auto
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {item.status !== 'complete' && onNavigate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate(item.tab, item.field)}
                  // Minimum 44px height for touch targets
                  className="h-11 px-3 text-xs"
                >
                  Edit <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Publish button */}
        {onPublish && (
          <div className="pt-4 border-t">
            {status === 'published' ? (
              <div className="space-y-2">
                <Button
                  disabled
                  variant="outline"
                  className="w-full bg-green-50 text-green-600 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900 opacity-100"
                  size="lg"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Project is Live
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Changes are saved to the live page. <br />
                  <span className="text-xs opacity-70">To unpublish, go to the projects list.</span>
                </p>
              </div>
            ) : (
              <>
                <Button
                  onClick={onPublish}
                  disabled={!isReady || isPublishing}
                  className="w-full"
                  size="lg"
                >
                  {isPublishing ? (
                    'Publishing...'
                  ) : isReady ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Publish Project
                    </>
                  ) : (
                    'Complete Required Items to Publish'
                  )}
                </Button>
                {!isReady && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    {requiredChecks.filter(i => i.status === 'incomplete').length} required item(s) remaining
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PublishChecklist
