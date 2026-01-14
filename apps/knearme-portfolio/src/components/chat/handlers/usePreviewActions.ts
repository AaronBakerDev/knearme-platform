import { useCallback, type Dispatch, type SetStateAction, type MutableRefObject } from 'react';
import type { ShowPortfolioPreviewOutput } from '@/lib/chat/tool-schemas';
import type { ArtifactAction } from './types';
import type { CanvasPanelSize, CanvasTab } from '../CanvasPanel';

/**
 * Parameters for the usePreviewActions hook.
 */
export type UsePreviewActionsParams = {
  /** Current canvas panel size */
  canvasSize: CanvasPanelSize;
  /** Whether the device is mobile */
  isMobile: boolean;
  /** Sets the canvas panel size */
  setCanvasSize: (size: CanvasPanelSize) => void;
  /** Sets the active canvas tab */
  setCanvasTab: (tab: CanvasTab) => void;
  /** Sets the active overlay tab (mobile/tablet) */
  setOverlayTab: (tab: 'preview' | 'form') => void;
  /** Shows/hides the preview overlay (mobile/tablet) */
  setShowPreviewOverlay: (value: boolean) => void;
  /** Sets preview hints (title, message, highlights) */
  setPreviewHints: Dispatch<
    SetStateAction<{
      title: string | null;
      message: string | null;
      highlightFields: string[];
      updatedAt: number | null;
    }>
  >;
  /** Ref for highlight timeout cleanup */
  previewHighlightTimeoutRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  /** Ref for message timeout cleanup */
  previewMessageTimeoutRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  /** Logs preview events for debugging */
  logPreviewEvent: (event: string, details?: Record<string, unknown>) => void;
};

/**
 * Hook for handling preview-related artifact actions.
 *
 * Handles the following action types:
 * - 'openPreview' / 'showPreview': Opens the preview panel/overlay
 * - 'previewWithHighlight': Opens preview with specific fields highlighted
 * - 'setTab': Switches to a specific tab in the canvas/overlay
 *
 * @param params - State and callbacks for preview management
 * @returns Handler function that returns true if action was handled
 */
export function usePreviewActions({
  canvasSize,
  isMobile,
  setCanvasSize,
  setCanvasTab,
  setOverlayTab,
  setShowPreviewOverlay,
  setPreviewHints,
  previewHighlightTimeoutRef,
  previewMessageTimeoutRef,
  logPreviewEvent,
}: UsePreviewActionsParams) {
  return useCallback(
    (action: ArtifactAction): boolean => {
      // Handle tab switching
      if (action.type === 'setTab') {
        const payload = action.payload as { tab: CanvasTab } | undefined;
        const tab = payload?.tab;
        if (tab === 'preview' || tab === 'form') {
          if (canvasSize === 'collapsed') {
            setCanvasSize('medium');
          }
          setCanvasTab(tab);
          setOverlayTab(tab);
          if (isMobile) {
            setShowPreviewOverlay(true);
          }
          logPreviewEvent('setTab', { tab });
          return true;
        }
        return false;
      }

      // Handle preview with highlight (specific fields to emphasize)
      if (action.type === 'previewWithHighlight') {
        const payload = action.payload as {
          highlightFields?: string[];
          message?: string;
          title?: string;
        } | undefined;

        if (payload) {
          const nextHighlightFields = (payload.highlightFields || []).map((field) =>
            field.toLowerCase()
          );

          setPreviewHints((prev) => ({
            title: payload.title ?? prev.title,
            message: payload.message ?? prev.message,
            highlightFields: nextHighlightFields.length > 0 ? nextHighlightFields : prev.highlightFields,
            updatedAt: Date.now(),
          }));

          logPreviewEvent('previewWithHighlight', {
            highlightFields: payload.highlightFields ?? null,
            message: payload.message ?? null,
          });

          // Clear highlights after timeout
          if (nextHighlightFields.length > 0) {
            if (previewHighlightTimeoutRef.current) {
              clearTimeout(previewHighlightTimeoutRef.current);
            }
            previewHighlightTimeoutRef.current = setTimeout(() => {
              setPreviewHints((prev) => ({ ...prev, highlightFields: [] }));
            }, 4000);
          }

          // Clear message after timeout
          if (payload.message) {
            if (previewMessageTimeoutRef.current) {
              clearTimeout(previewMessageTimeoutRef.current);
            }
            previewMessageTimeoutRef.current = setTimeout(() => {
              setPreviewHints((prev) => ({ ...prev, message: null }));
            }, 4000);
          }
        }

        // Open preview panel
        if (canvasSize === 'collapsed') {
          setCanvasSize('medium');
        }
        setCanvasTab('preview');
        setOverlayTab('preview');
        if (isMobile) {
          setShowPreviewOverlay(true);
        }

        return true;
      }

      // Handle opening preview (supports multiple action names)
      if (action.type === 'openPreview' || action.type === 'showPreview') {
        const payload = action.payload as ShowPortfolioPreviewOutput | undefined;

        if (payload) {
          const nextHighlightFields = (payload.highlightFields || []).map((field) =>
            field.toLowerCase()
          );

          setPreviewHints((prev) => ({
            title: payload.title ?? prev.title,
            message: payload.message ?? prev.message,
            highlightFields: payload.highlightFields ? nextHighlightFields : prev.highlightFields,
            updatedAt: Date.now(),
          }));

          logPreviewEvent('showPortfolioPreview', {
            title: payload.title ?? null,
            message: payload.message ?? null,
            highlightFields: payload.highlightFields ?? null,
          });

          if (payload.highlightFields) {
            if (previewHighlightTimeoutRef.current) {
              clearTimeout(previewHighlightTimeoutRef.current);
            }
            previewHighlightTimeoutRef.current = setTimeout(() => {
              setPreviewHints((prev) => ({ ...prev, highlightFields: [] }));
            }, 4000);
          }

          if (payload.message) {
            if (previewMessageTimeoutRef.current) {
              clearTimeout(previewMessageTimeoutRef.current);
            }
            previewMessageTimeoutRef.current = setTimeout(() => {
              setPreviewHints((prev) => ({ ...prev, message: null }));
            }, 4000);
          }
        }

        // Open preview panel on desktop, overlay on mobile
        if (canvasSize === 'collapsed') {
          setCanvasSize('medium');
        }
        setCanvasTab('preview');
        setOverlayTab('preview');
        if (isMobile) {
          setShowPreviewOverlay(true);
        }

        return true;
      }

      return false;
    },
    [
      canvasSize,
      isMobile,
      setCanvasSize,
      setCanvasTab,
      setOverlayTab,
      setShowPreviewOverlay,
      setPreviewHints,
      previewHighlightTimeoutRef,
      previewMessageTimeoutRef,
      logPreviewEvent,
    ]
  );
}
