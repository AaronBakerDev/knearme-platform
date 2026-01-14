'use client';

import { AlertCircle, CheckCircle2, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SaveIndicator, type SaveStatus } from './artifacts/shared/SaveStatusBadge';

interface ChatStatusOverlaysProps {
  isEditMode: boolean;
  saveStatus: SaveStatus;
  error: string | null;
  canRetry: boolean;
  onRetry: () => void;
  successMessage: string | null;
  imageError: Error | null;
  onClearImageError: () => void;
}

export function ChatStatusOverlays({
  isEditMode,
  saveStatus,
  error,
  canRetry,
  onRetry,
  successMessage,
  imageError,
  onClearImageError,
}: ChatStatusOverlaysProps) {
  return (
    <>
      {!isEditMode && saveStatus !== 'idle' && (
        <div className="absolute top-3 right-3 z-10">
          <SaveIndicator status={saveStatus} />
        </div>
      )}

      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 max-w-[360px] w-full px-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20 shadow-lg animate-fade-in">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1 line-clamp-2">{error}</span>
            {canRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="ml-2 h-7 px-2 text-xs border-destructive/30 hover:bg-destructive/10"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
          </div>
        </div>
      )}

      {successMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 max-w-[360px] w-full px-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-600 text-sm border border-emerald-500/20 shadow-lg animate-fade-in">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-2">{successMessage}</span>
          </div>
        </div>
      )}

      {imageError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 max-w-[360px] w-full px-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20 shadow-lg animate-fade-in">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-2">{imageError.message}</span>
            <button
              onClick={onClearImageError}
              className="ml-auto hover:bg-destructive/20 rounded p-0.5"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
