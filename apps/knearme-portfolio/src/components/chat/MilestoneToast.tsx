'use client';

/**
 * MilestoneToast - Celebratory toast for progress milestones.
 *
 * Brief, delightful notifications that appear when users hit key
 * progress milestones during portfolio creation. Uses the
 * `animate-toast-slide-up` animation from globals.css.
 *
 * Milestones:
 * - firstPhoto: First image uploaded
 * - typeDetected: Project type identified
 * - materialsFound: Materials detected
 * - readyToGenerate: Minimum content threshold reached
 * - generated: Portfolio content generated
 * - published: Project published
 *
 * @see /docs/ai-sdk/chat-ux-patterns.md#milestonetoast
 */

import { useEffect, useState, useCallback } from 'react';
import { Camera, Sparkles, Package, Zap, Check, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Milestone types that trigger toasts.
 */
export type MilestoneType =
  | 'firstPhoto'
  | 'typeDetected'
  | 'materialsFound'
  | 'readyToGenerate'
  | 'generated'
  | 'published';

/**
 * Milestone configuration with icons and messages.
 */
const MILESTONES: Record<MilestoneType, { icon: typeof Camera; message: string }> = {
  firstPhoto: { icon: Camera, message: 'First photo added!' },
  typeDetected: { icon: Sparkles, message: 'Project type detected!' },
  materialsFound: { icon: Package, message: 'Materials identified!' },
  readyToGenerate: { icon: Zap, message: 'Ready to generate!' },
  generated: { icon: Check, message: 'Portfolio created!' },
  published: { icon: Rocket, message: 'Project published!' },
};

interface MilestoneToastProps {
  /** The milestone to celebrate */
  milestone: MilestoneType | null;
  /** Called when the toast finishes its animation and should be dismissed */
  onDismiss?: () => void;
  /** Optional additional className */
  className?: string;
}

/**
 * MilestoneToast component.
 *
 * Shows a celebratory toast that slides up, holds, then fades out.
 * Animation is handled by CSS (animate-toast-slide-up: 3s total).
 *
 * @example
 * ```tsx
 * const [milestone, setMilestone] = useState<MilestoneType | null>(null);
 *
 * // Trigger a milestone
 * setMilestone('firstPhoto');
 *
 * // In render
 * <MilestoneToast
 *   milestone={milestone}
 *   onDismiss={() => setMilestone(null)}
 * />
 * ```
 */
export function MilestoneToast({ milestone, onDismiss, className }: MilestoneToastProps) {
  const [visible, setVisible] = useState(false);
  const [key, setKey] = useState(0);

  // Handle milestone changes
  useEffect(() => {
    if (!milestone) {
      return;
    }

    // Increment key to force re-render and restart animation
    const frame = window.requestAnimationFrame(() => {
      setKey((k) => k + 1);
      setVisible(true);
    });

    // Auto-dismiss after animation completes (3s from CSS)
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 3000);

    return () => {
      window.cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [milestone, onDismiss]);

  if (!visible || !milestone) {
    return null;
  }

  const config = MILESTONES[milestone];
  const Icon = config.icon;

  return (
    <div
      key={key}
      role="status"
      aria-live="polite"
      className={cn(
        'fixed bottom-28 left-1/2 -translate-x-1/2 z-50',
        'flex items-center gap-3 px-5 py-3 rounded-full',
        'bg-primary text-primary-foreground shadow-lg',
        'animate-toast-slide-up',
        className
      )}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      <span className="font-medium whitespace-nowrap">{config.message}</span>
    </div>
  );
}

/**
 * Hook to manage milestone toasts with automatic deduplication.
 *
 * Tracks which milestones have been shown to prevent duplicates
 * during a session. Call `triggerMilestone(type)` to show a toast
 * if that milestone hasn't been shown yet.
 *
 * @example
 * ```tsx
 * const { currentMilestone, triggerMilestone, dismissMilestone, resetMilestones } = useMilestoneToasts();
 *
 * // Trigger when photo count goes from 0 to 1
 * useEffect(() => {
 *   if (images.length === 1) {
 *     triggerMilestone('firstPhoto');
 *   }
 * }, [images.length, triggerMilestone]);
 *
 * // In render
 * <MilestoneToast milestone={currentMilestone} onDismiss={dismissMilestone} />
 * ```
 */
export function useMilestoneToasts() {
  const [currentMilestone, setCurrentMilestone] = useState<MilestoneType | null>(null);
  const [shownMilestones, setShownMilestones] = useState<Set<MilestoneType>>(new Set());

  const triggerMilestone = useCallback((type: MilestoneType) => {
    // Don't show duplicates
    if (shownMilestones.has(type)) return;

    setShownMilestones((prev) => new Set([...prev, type]));
    setCurrentMilestone(type);
  }, [shownMilestones]);

  const dismissMilestone = useCallback(() => {
    setCurrentMilestone(null);
  }, []);

  const resetMilestones = useCallback(() => {
    setShownMilestones(new Set());
    setCurrentMilestone(null);
  }, []);

  return {
    currentMilestone,
    triggerMilestone,
    dismissMilestone,
    resetMilestones,
    shownMilestones,
  };
}

export default MilestoneToast;
