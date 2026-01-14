import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { ArtifactAction } from './types';

/**
 * Image category types for before/after/progress classification.
 */
export type ImageCategory = 'before' | 'after' | 'progress' | 'detail';

/**
 * Parameters for the usePhotoActions hook.
 */
export type UsePhotoActionsParams = {
  /** Assigns a category to an image */
  categorizeImage: (imageId: string, category: ImageCategory) => void;
  /** Removes an image from the project */
  removeImage: (imageId: string) => void;
  /** Opens the photo upload sheet */
  handleOpenPhotoSheet: () => void;
  /** Applies a new display order to images */
  applyImageOrder: (imageIds: string[]) => Promise<boolean>;
  /** Sets an error message */
  setError: Dispatch<SetStateAction<string | null>>;
};

/**
 * Hook for handling photo-related artifact actions.
 *
 * Handles the following action types:
 * - 'addPhotos' / 'add' / 'manageImages': Opens the photo upload sheet
 * - 'reorderImages' / 'reorder': Changes the display order of images
 * - 'categorize': Assigns a category (before/after/progress/detail) to an image
 * - 'remove': Removes an image from the project
 *
 * @param params - Callbacks and state setters for photo actions
 * @returns Handler function that returns true if action was handled
 */
export function usePhotoActions({
  categorizeImage,
  removeImage,
  handleOpenPhotoSheet,
  applyImageOrder,
  setError,
}: UsePhotoActionsParams) {
  return useCallback(
    (action: ArtifactAction): boolean => {
      // Handle image categorization
      if (action.type === 'categorize') {
        const { imageId, category } = action.payload as {
          imageId: string;
          category: string;
        };
        categorizeImage(imageId, category as ImageCategory);
        return true;
      }

      // Handle image removal
      if (action.type === 'remove') {
        const { imageId } = action.payload as { imageId: string };
        removeImage(imageId);
        return true;
      }

      // Handle opening photo sheet (supports multiple action names)
      if (
        action.type === 'add' ||
        action.type === 'addPhotos' ||
        action.type === 'manageImages'
      ) {
        handleOpenPhotoSheet();
        return true;
      }

      // Handle image reordering
      if (action.type === 'reorderImages' || action.type === 'reorder') {
        const payload = action.payload as {
          imageIds: string[];
          reason?: string;
        };

        if (!payload?.imageIds || payload.imageIds.length === 0) {
          setError('Missing image order.');
          return true;
        }

        void applyImageOrder(payload.imageIds);
        return true;
      }

      return false;
    },
    [categorizeImage, removeImage, handleOpenPhotoSheet, applyImageOrder, setError]
  );
}
