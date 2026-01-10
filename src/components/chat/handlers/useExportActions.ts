import { useCallback } from 'react';
import type { ArtifactAction } from './types';

type UseExportActionsParams = {
  onExportProject?: (payload?: unknown) => void;
};

export function useExportActions({ onExportProject }: UseExportActionsParams = {}) {
  return useCallback(
    (action: ArtifactAction): boolean => {
      if (action.type !== 'exportProject') {
        return false;
      }

      onExportProject?.(action.payload);
      return true;
    },
    [onExportProject]
  );
}
