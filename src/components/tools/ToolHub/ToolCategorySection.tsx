/**
 * ToolCategorySection Component
 *
 * Displays a category header with its tools in a responsive grid.
 * Handles both live tools and coming soon placeholders.
 */

import {
  Button, Badge,
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@/components/ui'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { ToolCategory, ToolDefinition } from '@/lib/tools/catalog'
import { TOOL_CATEGORIES } from '@/lib/tools/catalog'
import { ToolMetricsBadge } from './ToolMetricsBadge'

interface ToolCategorySectionProps {
  category: ToolCategory
  tools: ToolDefinition[]
}

export function ToolCategorySection({ category, tools }: ToolCategorySectionProps) {
  const categoryInfo = TOOL_CATEGORIES[category]
  const CategoryIcon = categoryInfo.icon

  if (tools.length === 0) {
    return null
  }

  return (
    <section className="space-y-6">
      {/* Category Header */}
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="bg-muted rounded-lg p-3">
            <CategoryIcon className="size-6 text-foreground" />
          </div>
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">{categoryInfo.label}</h2>
          <p className="text-muted-foreground">{categoryInfo.description}</p>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </div>
    </section>
  )
}

interface ToolCardProps {
  tool: ToolDefinition
}

function ToolCard({ tool }: ToolCardProps) {
  const Icon = tool.icon
  const isComingSoon = tool.status === 'comingSoon'

  return (
    <Card className="group relative flex flex-col hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-shrink-0">
            <div className={`rounded-lg p-2.5 ${
              isComingSoon
                ? 'bg-muted text-muted-foreground'
                : 'bg-primary/10 text-primary'
            }`}>
              <Icon className="size-5" />
            </div>
          </div>
          {tool.badge && (
            <Badge
              variant={isComingSoon ? 'outline' : 'secondary'}
              className="text-xs shrink-0"
            >
              {tool.badge}
            </Badge>
          )}
        </div>

        <CardTitle className="text-lg group-hover:text-primary transition-colors">
          {tool.title}
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {tool.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-end space-y-4">
        {/* Metrics (only for live tools with metadata) */}
        {!isComingSoon && tool.inputCount && tool.estimatedTime && tool.complexity && (
          <ToolMetricsBadge
            inputCount={tool.inputCount}
            estimatedTime={tool.estimatedTime}
            complexity={tool.complexity}
          />
        )}

        {/* CTA Button */}
        {isComingSoon ? (
          <Button variant="outline" disabled className="w-full">
            Coming Soon
          </Button>
        ) : (
          <Button asChild variant="outline" className="w-full group/btn">
            <Link href={`/tools/${tool.slug}`}>
              Use Tool
              <ArrowRight className="size-4 group-hover/btn:translate-x-0.5 transition-transform" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
