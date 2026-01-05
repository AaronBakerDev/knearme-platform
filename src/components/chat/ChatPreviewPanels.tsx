'use client';

import type { ReactNode } from 'react';
import { CanvasPanel, type CanvasPanelSize, type CanvasTab } from './CanvasPanel';
import { PreviewOverlay } from './PreviewOverlay';
import { PreviewPill } from './PreviewPill';
import type { ProjectPreviewData } from './hooks/useProjectData';
import type { CompletenessState } from './hooks/useCompleteness';
import type { DesignTokens } from '@/lib/design/tokens';
import type { SemanticBlock } from '@/lib/design/semantic-blocks';
import type { Business, Contractor, Project, ProjectImage } from '@/types/database';
import type { RelatedProject } from '@/lib/data/projects';

interface PreviewHints {
  title: string | null;
  message: string | null;
  highlightFields: string[];
}

interface ChatPreviewPanelsProps {
  projectId: string;
  projectData: ProjectPreviewData;
  completeness: CompletenessState;
  previewHints: PreviewHints;
  previewTitle: string | null;
  publicPreview?: {
    project: Project;
    business: Business | Contractor;
    images: (ProjectImage & { url?: string })[];
    relatedProjects?: RelatedProject[];
    contractor?: Contractor;
  };
  portfolioLayout: {
    tokens: DesignTokens;
    blocks: SemanticBlock[];
    rationale?: string;
  } | null;
  canvasSize: CanvasPanelSize;
  onCanvasSizeChange: (size: CanvasPanelSize) => void;
  canvasTab: CanvasTab;
  onCanvasTabChange: (tab: CanvasTab) => void;
  hasFormContent: boolean;
  formContent?: ReactNode;
  showPreviewOverlay: boolean;
  onPreviewOverlayChange: (open: boolean) => void;
  overlayTab: 'preview' | 'form';
  onOverlayTabChange: (tab: 'preview' | 'form') => void;
  onOpenPreview: () => void;
}

export function ChatPreviewPanels({
  projectId,
  projectData,
  completeness,
  previewHints,
  previewTitle,
  publicPreview,
  portfolioLayout,
  canvasSize,
  onCanvasSizeChange,
  canvasTab,
  onCanvasTabChange,
  hasFormContent,
  formContent,
  showPreviewOverlay,
  onPreviewOverlayChange,
  overlayTab,
  onOverlayTabChange,
  onOpenPreview,
}: ChatPreviewPanelsProps) {
  return (
    <>
      <CanvasPanel
        projectId={projectId}
        data={projectData}
        completeness={completeness}
        highlightFields={previewHints.highlightFields}
        previewMessage={previewHints.message}
        publicPreview={publicPreview}
        titleOverride={previewHints.title}
        portfolioLayout={portfolioLayout}
        size={canvasSize}
        onSizeChange={onCanvasSizeChange}
        activeTab={hasFormContent ? canvasTab : 'preview'}
        onTabChange={onCanvasTabChange}
        formContent={formContent}
        className="hidden lg:flex"
      />

      <div className="hidden md:block lg:hidden">
        <PreviewPill
          title={previewTitle}
          percentage={completeness.percentage}
          onClick={onOpenPreview}
        />
      </div>

      <PreviewOverlay
        open={showPreviewOverlay}
        onOpenChange={onPreviewOverlayChange}
        data={projectData}
        completeness={completeness}
        publicPreview={publicPreview}
        titleOverride={previewHints.title}
        portfolioLayout={portfolioLayout}
        highlightFields={previewHints.highlightFields}
        previewMessage={previewHints.message}
        formContent={formContent}
        activeTab={overlayTab}
        onTabChange={onOverlayTabChange}
      />
    </>
  );
}
