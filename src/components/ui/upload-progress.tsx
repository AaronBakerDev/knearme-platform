'use client';

import { X, Check, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

type UploadProgressStatus = 'uploading' | 'processing' | 'complete' | 'error';

export interface UploadProgressProps {
  progress: number; // 0-100
  fileName: string;
  status: UploadProgressStatus;
  onCancel?: () => void;
}

export function UploadProgress({ progress, fileName, status, onCancel }: UploadProgressProps) {
  const normalized = Math.min(100, Math.max(0, progress));

  const statusText: Record<UploadProgressStatus, string> = {
    uploading: 'Uploading...',
    processing: 'Processing...',
    complete: 'Complete!',
    error: 'Upload failed',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-md border bg-card px-3 py-2 shadow-sm',
        status === 'error' && 'border-destructive/40 bg-destructive/5',
        status === 'complete' && 'border-green-500/40 bg-green-500/5'
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-center h-9 w-9 rounded-md bg-muted">
        {status === 'complete' ? (
          <Check className="h-5 w-5 text-green-600" />
        ) : status === 'error' ? (
          <X className="h-5 w-5 text-destructive" />
        ) : (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium">{fileName}</p>
        <div className="flex items-center gap-2">
          <Progress value={normalized} className="h-2" />
          <span className="text-xs text-muted-foreground tabular-nums w-12 text-right">
            {normalized.toFixed(0)}%
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{statusText[status]}</p>
      </div>

      {status === 'uploading' && onCancel && (
        <button
          type="button"
          className="p-1 text-muted-foreground hover:text-foreground"
          aria-label="Cancel upload"
          onClick={onCancel}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export default UploadProgress;
