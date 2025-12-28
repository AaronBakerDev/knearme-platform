'use client';

/**
 * PublishReadinessCard artifact.
 *
 * Displays the result of the QualityChecker agent's publish readiness check.
 * Shows whether the project is ready to publish, missing requirements,
 * recommendations, and actionable suggestions.
 *
 * @see /src/lib/agents/quality-checker.ts
 * @see /src/lib/chat/tool-schemas.ts CheckPublishReadyOutput
 */

import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Image,
  Type,
  MapPin,
  FileText,
  Tags,
  Wrench,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { PublishReadinessData } from '@/types/artifacts';

interface PublishReadinessCardProps {
  /** Publish readiness data from tool output */
  data: PublishReadinessData;
  /** Callback when user wants to take action */
  onAction?: (action: { type: string; payload?: unknown }) => void;
  /** Optional additional className */
  className?: string;
}

/**
 * Icons for different field types.
 */
const FIELD_ICONS: Record<string, typeof CheckCircle2> = {
  title: Type,
  project_type: FileText,
  city: MapPin,
  images: Image,
  hero_image: Image,
  description_length: FileText,
  materials: Wrench,
  tags: Tags,
  seo_metadata: Search,
  project: FileText,
};

/**
 * Human-readable labels for field names.
 */
const FIELD_LABELS: Record<string, string> = {
  title: 'Project Title',
  project_type: 'Project Type',
  city: 'Location',
  images: 'Photos',
  hero_image: 'Hero Image',
  description_length: 'Description',
  materials: 'Materials',
  tags: 'Tags',
  seo_metadata: 'SEO Metadata',
  project: 'Project',
};

/**
 * Missing field item component.
 */
function MissingFieldItem({ field, index }: { field: string; index: number }) {
  const Icon = FIELD_ICONS[field] || XCircle;
  const label = FIELD_LABELS[field] || field.replace(/_/g, ' ');

  return (
    <li
      className={cn(
        'flex items-center gap-2 text-sm text-destructive',
        'animate-chip-slide-in',
        `chip-stagger-${Math.min(index + 1, 6)}`
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span>{label}</span>
    </li>
  );
}

/**
 * Warning item component.
 */
function WarningItem({ warning, index }: { warning: string; index: number }) {
  return (
    <li
      className={cn(
        'flex items-start gap-2 text-sm text-amber-600 dark:text-amber-500',
        'animate-chip-slide-in',
        `chip-stagger-${Math.min(index + 1, 6)}`
      )}
    >
      <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
      <span>{warning}</span>
    </li>
  );
}

/**
 * Suggestion item component.
 */
function SuggestionItem({ suggestion, index }: { suggestion: string; index: number }) {
  return (
    <li
      className={cn(
        'flex items-start gap-2 text-sm text-muted-foreground',
        'animate-chip-slide-in',
        `chip-stagger-${Math.min(index + 1, 6)}`
      )}
    >
      <Lightbulb className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-500" />
      <span>{suggestion}</span>
    </li>
  );
}

/**
 * PublishReadinessCard artifact component.
 *
 * Renders a publish readiness check with:
 * - Overall status (ready/not ready)
 * - Missing required fields
 * - Recommendations and warnings
 * - Actionable suggestions
 */
export function PublishReadinessCard({
  data,
  onAction,
  className,
}: PublishReadinessCardProps) {
  const { ready, missing, warnings, suggestions, topPriority, summary } = data;
  const hasMissing = missing.length > 0;
  const hasWarnings = warnings.length > 0;
  const hasSuggestions = suggestions.length > 0;

  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-4 animate-canvas-item-in',
        ready ? 'border-green-500/30 bg-green-500/5' : 'border-destructive/30',
        className
      )}
      data-testid="publish-readiness-card"
    >
      {/* Header with status */}
      <div className="flex items-start gap-3 mb-4">
        <div
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0',
            ready ? 'bg-green-500/20' : 'bg-destructive/20'
          )}
        >
          {ready ? (
            <CheckCircle2 className="h-6 w-6 text-green-500" />
          ) : (
            <XCircle className="h-6 w-6 text-destructive" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              'font-semibold text-base',
              ready ? 'text-green-600 dark:text-green-400' : 'text-destructive'
            )}
          >
            {ready ? 'Ready to Publish!' : 'Not Ready Yet'}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">{summary}</p>
        </div>
      </div>

      {/* Missing required fields */}
      {hasMissing && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold uppercase text-destructive mb-2">
            Missing Required ({missing.length})
          </h4>
          <ul className="space-y-1.5">
            {missing.map((field, index) => (
              <MissingFieldItem key={field} field={field} index={index} />
            ))}
          </ul>
        </div>
      )}

      {/* Warnings/recommendations */}
      {hasWarnings && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold uppercase text-amber-600 dark:text-amber-500 mb-2">
            Recommendations ({warnings.length})
          </h4>
          <ul className="space-y-1.5">
            {warnings.map((warning, index) => (
              <WarningItem key={index} warning={warning} index={index} />
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {hasSuggestions && !ready && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
            How to Fix
          </h4>
          <ul className="space-y-1.5">
            {suggestions.slice(0, 3).map((suggestion, index) => (
              <SuggestionItem key={index} suggestion={suggestion} index={index} />
            ))}
            {suggestions.length > 3 && (
              <li className="text-xs text-muted-foreground pl-6">
                +{suggestions.length - 3} more suggestions
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-border/50">
        {ready ? (
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => onAction?.({ type: 'publish' })}
          >
            Publish Now
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : topPriority ? (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => onAction?.({ type: 'fix', payload: { field: topPriority } })}
          >
            Fix: {FIELD_LABELS[topPriority] || topPriority}
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : null}

        {!ready && hasWarnings && (
          <span className="text-xs text-muted-foreground">
            Fix required items to publish
          </span>
        )}

        {ready && hasWarnings && (
          <span className="text-xs text-muted-foreground">
            Optional improvements available
          </span>
        )}
      </div>

      {/* ARIA live region for screen readers */}
      <div aria-live="polite" className="sr-only">
        {ready
          ? 'Project is ready to publish.'
          : `Project is not ready. Missing: ${missing.map((f) => FIELD_LABELS[f] || f).join(', ')}.`}
        {hasWarnings && ` Recommendations: ${warnings.join('; ')}.`}
      </div>
    </div>
  );
}

export default PublishReadinessCard;
