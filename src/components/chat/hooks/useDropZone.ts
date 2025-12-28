'use client';

/**
 * useDropZone - Hook for drag-and-drop file handling.
 *
 * Provides drag state and event handlers for implementing drop zones.
 * Filters files by MIME type and provides visual feedback state.
 *
 * @example
 * ```tsx
 * const { isDragging, handlers } = useDropZone({
 *   onDrop: (files) => console.log('Dropped files:', files),
 *   accept: 'image/*',
 * });
 *
 * <div {...handlers} className={cn(isDragging && 'ring-2 ring-primary')}>
 *   {isDragging && <DropOverlay />}
 *   <Content />
 * </div>
 * ```
 *
 * @see /docs/ai-sdk/chat-ux-patterns.md for drag-drop UX spec
 */

import { useState, useCallback, useRef, type DragEvent } from 'react';

interface UseDropZoneOptions {
  /** Called when valid files are dropped */
  onDrop: (files: File[]) => void;
  /**
   * MIME type pattern to accept (e.g., 'image/*', 'image/png').
   * Files not matching this pattern are filtered out.
   */
  accept?: string;
  /** Whether the drop zone is disabled */
  disabled?: boolean;
}

interface UseDropZoneReturn {
  /** Whether a drag is currently over the zone with valid files */
  isDragging: boolean;
  /** Event handlers to spread on the drop zone element */
  handlers: {
    onDragOver: (e: DragEvent) => void;
    onDragEnter: (e: DragEvent) => void;
    onDragLeave: (e: DragEvent) => void;
    onDrop: (e: DragEvent) => void;
  };
}

/**
 * Check if a MIME type matches an accept pattern.
 *
 * @param mimeType - The file's MIME type (e.g., 'image/png')
 * @param pattern - Accept pattern (e.g., 'image/*', 'image/png')
 */
function matchesMimeType(mimeType: string, pattern: string): boolean {
  if (pattern === '*' || pattern === '*/*') return true;

  const [patternType, patternSubtype] = pattern.split('/');
  const [fileType, fileSubtype] = mimeType.split('/');

  if (patternSubtype === '*') {
    return patternType === fileType;
  }

  return patternType === fileType && patternSubtype === fileSubtype;
}

/**
 * Hook for managing drag-and-drop file uploads.
 *
 * Features:
 * - Tracks drag state for visual feedback
 * - Filters files by MIME type
 * - Handles nested element drag events correctly
 * - Supports disabled state
 */
export function useDropZone({
  onDrop,
  accept = '*/*',
  disabled = false,
}: UseDropZoneOptions): UseDropZoneReturn {
  const [isDragging, setIsDragging] = useState(false);
  // Counter to handle nested drag enter/leave events
  const dragCounterRef = useRef(0);

  /**
   * Check if the drag event contains valid files.
   */
  const hasValidFiles = useCallback(
    (e: DragEvent): boolean => {
      if (!e.dataTransfer?.types.includes('Files')) {
        return false;
      }
      // During drag, we can only check types, not actual files
      // So we return true if Files are present
      return true;
    },
    []
  );

  /**
   * Handle drag over - prevent default to allow drop.
   */
  const handleDragOver = useCallback(
    (e: DragEvent) => {
      if (disabled) return;

      e.preventDefault();
      e.stopPropagation();

      // Set drop effect to copy for visual feedback
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    },
    [disabled]
  );

  /**
   * Handle drag enter - set dragging state.
   */
  const handleDragEnter = useCallback(
    (e: DragEvent) => {
      if (disabled) return;

      e.preventDefault();
      e.stopPropagation();

      dragCounterRef.current += 1;

      if (hasValidFiles(e) && dragCounterRef.current === 1) {
        setIsDragging(true);
      }
    },
    [disabled, hasValidFiles]
  );

  /**
   * Handle drag leave - clear dragging state when fully exited.
   */
  const handleDragLeave = useCallback(
    (e: DragEvent) => {
      if (disabled) return;

      e.preventDefault();
      e.stopPropagation();

      dragCounterRef.current -= 1;

      if (dragCounterRef.current === 0) {
        setIsDragging(false);
      }
    },
    [disabled]
  );

  /**
   * Handle drop - filter files and call onDrop callback.
   */
  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Reset state
      dragCounterRef.current = 0;
      setIsDragging(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer?.files || []);

      // Filter files by accept pattern
      const validFiles = files.filter((file) => matchesMimeType(file.type, accept));

      if (validFiles.length > 0) {
        onDrop(validFiles);
      }
    },
    [disabled, accept, onDrop]
  );

  return {
    isDragging,
    handlers: {
      onDragOver: handleDragOver,
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
  };
}
