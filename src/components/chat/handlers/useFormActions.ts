import { useCallback } from 'react';
import type { ArtifactAction } from './types';

/**
 * Parameters for the useFormActions hook.
 */
export type UseFormActionsParams = {
  /** Opens the form panel in the canvas/overlay */
  openFormPanel: () => void;
  /** Inserts text into the chat input field */
  handleInsertPrompt: (text: string) => void;
};

/**
 * Hook for handling form-related artifact actions.
 *
 * Handles the following action types:
 * - 'open-form' / 'openForm': Opens the form panel
 * - 'insertPrompt': Inserts suggested text into the chat input
 *
 * @param params - Callbacks for form actions
 * @returns Handler function that returns true if action was handled
 */
export function useFormActions({
  openFormPanel,
  handleInsertPrompt,
}: UseFormActionsParams) {
  return useCallback(
    (action: ArtifactAction): boolean => {
      // Handle form opening (supports both kebab-case and camelCase)
      if (action.type === 'open-form' || action.type === 'openForm') {
        openFormPanel();
        return true;
      }

      // Handle prompt insertion for chat input
      if (action.type === 'insertPrompt') {
        const payload = action.payload as { text?: string } | string | undefined;
        const text = typeof payload === 'string' ? payload : payload?.text;
        if (text) {
          handleInsertPrompt(text);
        }
        return true;
      }

      return false;
    },
    [openFormPanel, handleInsertPrompt]
  );
}
