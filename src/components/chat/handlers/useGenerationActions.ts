import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { sanitizeDescriptionBlocks } from '@/lib/content/description-blocks';
import type { DesignTokens } from '@/lib/design/tokens';
import type { SemanticBlock } from '@/lib/design/semantic-blocks';
import type { ArtifactAction } from './types';
import type { CanvasPanelSize } from '../CanvasPanel';

type PortfolioLayoutState = {
  tokens: DesignTokens;
  blocks: SemanticBlock[];
  rationale?: string;
} | null;

type UseGenerationActionsParams = {
  canvasSize: CanvasPanelSize;
  setCanvasSize: (size: CanvasPanelSize) => void;
  setPortfolioLayout: Dispatch<SetStateAction<PortfolioLayoutState>>;
  applyDescriptionBlocks: (blocks: unknown) => Promise<boolean>;
  applyImageOrder: (imageIds: string[]) => Promise<boolean>;
  setError: Dispatch<SetStateAction<string | null>>;
};

export function useGenerationActions({
  canvasSize,
  setCanvasSize,
  setPortfolioLayout,
  applyDescriptionBlocks,
  applyImageOrder,
  setError,
}: UseGenerationActionsParams) {
  return useCallback(
    (action: ArtifactAction): boolean => {
      if (action.type === 'composePortfolioLayout') {
        const payload = action.payload as {
          blocks?: unknown;
          imageOrder?: string[];
          confidence?: number;
          missingContext?: string[];
        } | undefined;

        if (!payload) {
          setError('Missing layout data to apply.');
          return true;
        }

        void (async () => {
          if (payload.blocks) {
            const sanitizedBlocks = sanitizeDescriptionBlocks(payload.blocks);
            const confidence = payload.confidence ?? 1;
            const missingCount = payload.missingContext?.length ?? 0;
            const canApplyBlocks =
              sanitizedBlocks.length > 0 && confidence >= 0.4 && missingCount <= 6;

            if (canApplyBlocks) {
              await applyDescriptionBlocks(sanitizedBlocks);
            }
          }

          if (payload.imageOrder && payload.imageOrder.length > 0) {
            await applyImageOrder(payload.imageOrder);
          }
        })();

        return true;
      }

      if (action.type === 'composeUILayout') {
        const payload = action.payload as {
          designTokens?: unknown;
          blocks?: unknown[];
          rationale?: string;
          confidence?: number;
        } | undefined;

        if (payload?.designTokens && Array.isArray(payload.blocks)) {
          setPortfolioLayout({
            tokens: payload.designTokens as DesignTokens,
            blocks: payload.blocks as SemanticBlock[],
            rationale: payload.rationale,
          });
          // Auto-expand canvas to show the new layout
          if (canvasSize === 'collapsed') {
            setCanvasSize('medium');
          }
        }

        return true;
      }

      return false;
    },
    [
      applyDescriptionBlocks,
      applyImageOrder,
      canvasSize,
      setCanvasSize,
      setError,
      setPortfolioLayout,
    ]
  );
}
