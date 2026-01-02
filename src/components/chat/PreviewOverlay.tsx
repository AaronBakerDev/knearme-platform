/**
 * Preview Overlay - Mobile bottom sheet with Preview/Edit tabs.
 *
 * Opens as a bottom sheet on mobile, providing access to both
 * the LivePortfolioCanvas (Preview) and ProjectEditFormArtifact (Edit).
 *
 * Note: SheetContent already includes a built-in close button,
 * so we don't add a manual one to avoid duplication.
 *
 * @see /docs/ai-sdk/chat-artifacts-spec.md
 */

'use client';

import { useEffect, useState } from 'react';
import { Eye, FileEdit, ChevronDown } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LivePortfolioCanvas } from './LivePortfolioCanvas';
import type { ProjectPreviewData } from './hooks/useProjectData';
import type { CompletenessState } from './hooks/useCompleteness';
import type { Project, Business, Contractor, ProjectImage } from '@/types/database';
import type { RelatedProject } from '@/lib/data/projects';
import type { DesignTokens } from '@/lib/design/tokens';
import type { SemanticBlock } from '@/lib/design/semantic-blocks';

type OverlayTab = 'preview' | 'form';

interface PreviewOverlayProps {
  /** Whether the overlay is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Aggregated project data from useProjectData */
  data: ProjectPreviewData;
  /** Completeness state from useCompleteness */
  completeness: CompletenessState;
  /** Optional public preview data for full parity rendering */
  publicPreview?: {
    project: Project;
    /** Business data for the preview */
    business: Business | Contractor;
    images: (ProjectImage & { url?: string })[];
    relatedProjects?: RelatedProject[];
    /** @deprecated Use business instead */
    contractor?: Contractor;
  };
  /** Optional override title (e.g. showPortfolioPreview tool) */
  titleOverride?: string | null;
  /** Fields to highlight as recently updated */
  highlightFields?: string[];
  /** Optional preview status message */
  previewMessage?: string | null;
  /** Optional dynamic portfolio layout from AI-generated design tokens and blocks */
  portfolioLayout?: {
    tokens: DesignTokens;
    blocks: SemanticBlock[];
    rationale?: string;
  } | null;
  /** Form content to render in edit tab */
  formContent?: React.ReactNode;
  /** Optional controlled active tab */
  activeTab?: OverlayTab;
  /** Optional controlled tab change handler */
  onTabChange?: (tab: OverlayTab) => void;
}

/**
 * Mobile bottom sheet with Preview/Edit tabs.
 */
export function PreviewOverlay({
  open,
  onOpenChange,
  data,
  completeness,
  publicPreview,
  titleOverride,
  highlightFields,
  previewMessage,
  portfolioLayout,
  formContent,
  activeTab,
  onTabChange,
}: PreviewOverlayProps) {
  const [internalTab, setInternalTab] = useState<OverlayTab>('preview');
  const resolvedTab = activeTab ?? internalTab;
  const hasForm = Boolean(formContent);
  const displayTab = !hasForm && resolvedTab === 'form' ? 'preview' : resolvedTab;

  useEffect(() => {
    if (!hasForm && resolvedTab === 'form' && onTabChange) {
      onTabChange('preview');
    }
  }, [hasForm, resolvedTab, onTabChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[85vh] rounded-t-2xl p-0 flex flex-col"
      >
        {/* Header with drag handle and tabs */}
        <SheetHeader className="px-4 pt-4 pb-2 border-b flex-shrink-0">
          {/* Drag handle indicator */}
          <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-3" />

          {/* Title (screen reader) + Tabs */}
          <SheetTitle className="sr-only">Canvas Panel</SheetTitle>

          <Tabs
            value={displayTab}
            onValueChange={(v) => {
              if (!hasForm && v === 'form') return;
              if (onTabChange) {
                onTabChange(v as OverlayTab);
              } else {
                setInternalTab(v as OverlayTab);
              }
            }}
            className="w-full"
          >
            <TabsList
              className={`grid w-full h-10 ${hasForm ? 'grid-cols-2' : 'grid-cols-1'}`}
            >
              <TabsTrigger
                value="preview"
                className="gap-2 data-[state=active]:bg-background"
              >
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
              {hasForm && (
                <TabsTrigger
                  value="form"
                  className="gap-2 data-[state=active]:bg-background"
                >
                  <FileEdit className="h-4 w-4" />
                  Edit
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        </SheetHeader>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          {displayTab === 'preview' ? (
            <LivePortfolioCanvas
              data={data}
              completeness={completeness}
              publicPreview={publicPreview}
              titleOverride={titleOverride}
              portfolioLayout={portfolioLayout}
              highlightFields={highlightFields}
              previewMessage={previewMessage}
              className="h-full"
            />
          ) : (
            <div className="h-full overflow-y-auto overscroll-contain">
              {formContent || null}
            </div>
          )}
        </div>

        {/* Swipe down hint for mobile */}
        <div className="py-2 text-center border-t">
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <ChevronDown className="h-3 w-3" />
            <span>Swipe down to close</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
