import { useEffect, useRef, useState } from 'react';

export function useUIState() {
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regeneratingSection, setRegeneratingSection] = useState<
    'title' | 'description' | 'seo' | null
  >(null);

  // Photo sheet state (replaces floating panel)
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);

  // Preview overlay state for tablet/mobile
  const [showPreviewOverlay, setShowPreviewOverlay] = useState(false);
  const [overlayTab, setOverlayTab] = useState<'preview' | 'form'>('preview');
  const [previewHints, setPreviewHints] = useState<{
    title: string | null;
    message: string | null;
    highlightFields: string[];
    updatedAt: number | null;
  }>({
    title: null,
    message: null,
    highlightFields: [],
    updatedAt: null,
  });

  const previewHighlightTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewMessageTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const highlightTimeout = previewHighlightTimeout.current;
    const messageTimeout = previewMessageTimeout.current;
    return () => {
      if (highlightTimeout) {
        clearTimeout(highlightTimeout);
      }
      if (messageTimeout) {
        clearTimeout(messageTimeout);
      }
    };
  }, []);

  return {
    isSavingContent,
    setIsSavingContent,
    isRegenerating,
    setIsRegenerating,
    regeneratingSection,
    setRegeneratingSection,
    showPhotoSheet,
    setShowPhotoSheet,
    showPreviewOverlay,
    setShowPreviewOverlay,
    overlayTab,
    setOverlayTab,
    previewHints,
    setPreviewHints,
    previewHighlightTimeout,
    previewMessageTimeout,
  };
}
