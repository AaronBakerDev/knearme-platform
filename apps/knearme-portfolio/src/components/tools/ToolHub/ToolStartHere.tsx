/**
 * ToolStartHere Component
 *
 * Prominent recommendation card for first-time visitors.
 * Highlights the best entry tool with clear CTA.
 */

import {
  Button, Badge,
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@/components/ui'
import { ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import type { ToolDefinition } from '@/lib/tools/catalog'

interface ToolStartHereProps {
  tool: ToolDefinition
}

export function ToolStartHere({ tool }: ToolStartHereProps) {
  const Icon = tool.icon

  return (
    <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10 relative overflow-hidden">
      {/* Decorative background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />

      <CardHeader className="relative">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="bg-primary text-primary-foreground rounded-lg p-3">
              <Icon className="size-6" />
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="default" className="gap-1.5">
                <Sparkles className="size-3" />
                Start Here
              </Badge>
              {tool.badge && (
                <Badge variant="outline" className="text-xs">
                  {tool.badge}
                </Badge>
              )}
            </div>
            <CardTitle className="text-2xl">{tool.title}</CardTitle>
            <CardDescription className="text-base">
              {tool.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        <p className="text-sm text-muted-foreground">
          New to masonry projects? This tool helps you understand typical costs in your area
          before talking to contractors. Perfect for budgeting and setting realistic expectations.
        </p>

        <Button asChild size="lg" className="w-full sm:w-auto group">
          <Link href={`/tools/${tool.slug}`}>
            Get Started
            <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
