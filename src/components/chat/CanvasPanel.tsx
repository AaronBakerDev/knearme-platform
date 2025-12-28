'use client';

/**
 * Canvas Panel - Tabbed container for Preview and Edit Form.
 *
 * Right-side panel in the chat-first edit layout.
 * Contains two tabs:
 * - Preview: LivePortfolioCanvas showing real-time preview
 * - Form: ProjectEditFormArtifact for direct editing
 *
 * Features size toggle: collapsed | medium | expanded
 *
 * @see /docs/ai-sdk/chat-artifacts-spec.md
 */

import { useCallback } from 'react';
import {
  Eye,
  FileEdit,
  PanelRightClose,
  PanelRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { LivePortfolioCanvas } from './LivePortfolioCanvas';
import { cn } from '@/lib/utils';
import type { ProjectPreviewData } from './hooks/useProjectData';
import type { CompletenessState } from './hooks/useCompleteness';
import type { Project, Contractor, ProjectImage } from '@/types/database';
import type { RelatedProject } from '@/lib/data/projects';

/**
 * Canvas panel size states.
 */
export type CanvasPanelSize = 'collapsed' | 'medium' | 'expanded';

/**
 * Canvas tab options.
 */
export type CanvasTab = 'preview' | 'form';

/**
 * Size configuration for each state.
 */
const SIZE_CONFIG: Record<CanvasPanelSize, { width: string; label: string }> = {
  collapsed: { width: 'w-[52px]', label: 'Collapsed' },
  medium: { width: 'w-[400px]', label: 'Medium' },
  expanded: { width: 'w-[600px]', label: 'Expanded' },
};

interface CanvasPanelProps {
  /** Project ID */
  projectId: string;
  /** Aggregated project data for preview */
  data: ProjectPreviewData;
  /** Completeness state for preview */
  completeness: CompletenessState;
  /** Fields to highlight as recently updated */
  highlightFields?: string[];
  /** Optional preview status message */
  previewMessage?: string | null;
  /** Optional public preview data for full parity rendering */
  publicPreview?: {
    project: Project;
    contractor: Contractor;
    images: (ProjectImage & { url?: string })[];
    relatedProjects?: RelatedProject[];
  };
  /** Optional override title (e.g. saved project title in edit mode) */
  titleOverride?: string | null;
  /** Current panel size */
  size: CanvasPanelSize;
  /** Callback when size changes */
  onSizeChange: (size: CanvasPanelSize) => void;
  /** Currently active tab */
  activeTab: CanvasTab;
  /** Callback when tab changes */
  onTabChange: (tab: CanvasTab) => void;
  /** Form content to render in form tab */
  formContent?: React.ReactNode;
  /** Optional additional className */
  className?: string;
}

/**
 * Size toggle button component.
 */
function SizeToggle({
  size,
  onSizeChange,
  isCollapsed,
}: {
  size: CanvasPanelSize;
  onSizeChange: (size: CanvasPanelSize) => void;
  isCollapsed: boolean;
}) {
  const toggleExpanded = useCallback(() => {
    onSizeChange(size === 'expanded' ? 'medium' : 'expanded');
  }, [size, onSizeChange]);

  const toggleCollapsed = useCallback(() => {
    onSizeChange(size === 'collapsed' ? 'medium' : 'collapsed');
  }, [size, onSizeChange]);

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapsed}
            className="h-8 w-8 hover:bg-accent/50"
          >
            <PanelRight className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Expand panel</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapsed}
            className="h-7 w-7 hover:bg-accent/50"
          >
            <PanelRightClose className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Collapse panel</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleExpanded}
            className={cn(
              'h-7 w-7 hover:bg-accent/50',
              size === 'expanded' && 'bg-accent'
            )}
          >
            {size === 'expanded' ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {size === 'expanded' ? 'Shrink' : 'Expand'}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

/**
 * Collapsed state view.
 */
function CollapsedView({
  activeTab,
  onTabChange,
  onExpand,
  showForm,
}: {
  activeTab: CanvasTab;
  onTabChange: (tab: CanvasTab) => void;
  onExpand: () => void;
  showForm: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onExpand}
            className="h-9 w-9 hover:bg-accent/50"
          >
            <PanelRight className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Expand canvas</TooltipContent>
      </Tooltip>

      <div className="w-8 h-px bg-border/50 my-1" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={activeTab === 'preview' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => {
              onTabChange('preview');
              onExpand();
            }}
            className={cn(
              'h-9 w-9',
              activeTab === 'preview' && 'bg-accent ring-1 ring-primary/30'
            )}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Preview</TooltipContent>
      </Tooltip>

      {showForm && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeTab === 'form' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => {
                onTabChange('form');
                onExpand();
              }}
              className={cn(
                'h-9 w-9',
                activeTab === 'form' && 'bg-accent ring-1 ring-primary/30'
              )}
            >
              <FileEdit className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Edit Form</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

/**
 * Main CanvasPanel component.
 */
export function CanvasPanel({
  data,
  completeness,
  highlightFields,
  previewMessage,
  publicPreview,
  titleOverride,
  size,
  onSizeChange,
  activeTab,
  onTabChange,
  formContent,
  className,
}: CanvasPanelProps) {
  const isCollapsed = size === 'collapsed';
  const hasForm = Boolean(formContent);
  const resolvedTab = hasForm ? activeTab : 'preview';

  const handleExpand = useCallback(() => {
    onSizeChange('medium');
  }, [onSizeChange]);

  return (
    <div
      className={cn(
        'flex flex-col h-full min-h-0',
        'bg-muted/10 border-l border-border/50',
        'transition-all duration-300 ease-out',
        SIZE_CONFIG[size].width,
        className
      )}
    >
      {isCollapsed ? (
        <CollapsedView
          activeTab={resolvedTab}
          onTabChange={onTabChange}
          onExpand={handleExpand}
          showForm={hasForm}
        />
      ) : (
        <>
          {/* Header with tabs and size toggle */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
            <Tabs
              value={resolvedTab}
              onValueChange={(v) => {
                if (!hasForm && v === 'form') return;
                onTabChange(v as CanvasTab);
              }}
              className="flex-1"
            >
              <TabsList
                className={cn(
                  'h-8 bg-muted/50',
                  hasForm ? 'grid grid-cols-2' : 'grid grid-cols-1'
                )}
              >
                <TabsTrigger
                  value="preview"
                  className="h-7 px-3 text-xs gap-1.5 data-[state=active]:bg-background"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </TabsTrigger>
                {hasForm && (
                  <TabsTrigger
                    value="form"
                    className="h-7 px-3 text-xs gap-1.5 data-[state=active]:bg-background"
                  >
                    <FileEdit className="h-3.5 w-3.5" />
                    Edit
                  </TabsTrigger>
                )}
              </TabsList>
            </Tabs>

            <SizeToggle
              size={size}
              onSizeChange={onSizeChange}
              isCollapsed={isCollapsed}
            />
          </div>

          {/* Content area */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {resolvedTab === 'preview' ? (
              <LivePortfolioCanvas
                data={data}
                completeness={completeness}
                publicPreview={publicPreview}
                titleOverride={titleOverride}
                highlightFields={highlightFields}
                previewMessage={previewMessage}
                className="h-full"
              />
            ) : (
              <div className="h-full overflow-y-auto overscroll-contain">
                {formContent || (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p className="text-sm">Edit form will appear here</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default CanvasPanel;
