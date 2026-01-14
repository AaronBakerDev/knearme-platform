'use client';

/**
 * Responsive photo modal that switches between Sheet and Dialog based on viewport.
 *
 * Design Pattern: Hook-based conditional rendering
 * - Mobile (<768px): Bottom sheet for thumb-friendly interaction
 * - Desktop (≥768px): Centered dialog with constrained width
 *
 * Uses useIsDesktop hook to conditionally render only one component,
 * avoiding the portal issue where both would appear simultaneously.
 *
 * @see /src/hooks/useMediaQuery.ts - Media query hook
 * @see /src/components/chat/ChatPhotoSheet.tsx - Consumer component
 */

import { ReactNode } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
  Dialog, DialogContent, DialogHeader, DialogTitle,
  Button
} from '@/components/ui';
import { useIsDesktop } from '@/hooks/useMediaQuery';

interface ResponsivePhotoModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Modal title */
  title: ReactNode;
  /** Main content (photo grid, upload zone, etc.) */
  children: ReactNode;
  /** Footer content (typically Done button) */
  footer?: ReactNode;
}

/**
 * Responsive modal container for photo management.
 *
 * Conditionally renders Sheet (mobile) OR Dialog (desktop) based on viewport.
 */
export function ResponsivePhotoModal({
  open,
  onOpenChange,
  title,
  children,
  footer,
}: ResponsivePhotoModalProps) {
  const isDesktop = useIsDesktop();

  // Desktop: Centered dialog
  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-2xl max-h-[80vh] p-0 flex flex-col gap-0 overflow-hidden"
          showCloseButton={true}
        >
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle className="text-center">{title}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6">{children}</div>

          {footer && (
            <div className="px-6 py-4 border-t shrink-0">{footer}</div>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  // Mobile: Bottom sheet
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[70vh] max-h-[600px] rounded-t-2xl px-0 flex flex-col"
      >
        <SheetHeader className="px-4 pb-3 border-b shrink-0">
          <SheetTitle className="text-center">{title}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">{children}</div>

        {footer && (
          <div className="p-4 border-t shrink-0">{footer}</div>
        )}
      </SheetContent>
    </Sheet>
  );
}

/**
 * Pre-configured Done button for photo modal footer.
 * Provides consistent styling across the modal.
 */
export function PhotoModalDoneButton({
  onClick,
  photoCount,
}: {
  onClick: () => void;
  photoCount: number;
}) {
  return (
    <Button className="w-full rounded-full" onClick={onClick}>
      Done{photoCount > 0 && ` (${photoCount} photo${photoCount !== 1 ? 's' : ''})`}
    </Button>
  );
}
