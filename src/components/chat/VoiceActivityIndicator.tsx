'use client';

/**
 * Voice Activity Detection (VAD) Indicator
 *
 * A compact 5-bar audio level meter that responds to real-time audio input.
 * Designed for the voice chat interface to show when the system detects speech.
 *
 * Visual States:
 * - Idle: Bars at minimal height, gray
 * - Listening (waiting): Breathing pulse, light green
 * - Hearing (voice detected): Bars jump to audio level, bright green
 * - Speaking (AI): Blue color, different animation rhythm
 *
 * Accessibility:
 * - Bar HEIGHT changes provide visual feedback (not just color)
 * - ARIA live region announces state changes
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface VoiceActivityIndicatorProps {
  /** Current audio input level (0-1 normalized RMS from useLiveVoiceSession) */
  audioLevel: number;
  /** True when session is in listening state */
  isListening: boolean;
  /** True when AI is speaking/responding */
  isSpeaking: boolean;
  /** True when in continuous/hands-free mode */
  isContinuousMode: boolean;
  className?: string;
}

/**
 * Voice activity threshold - audio above this level is considered "voice detected"
 * Value of 0.02 (~-34dB) filters out typical background noise while detecting speech.
 */
const VOICE_THRESHOLD = 0.02;

/**
 * Sensitivity multipliers for each bar - creates organic "equalizer" look
 * Center bar (index 2) is most sensitive, outer bars less so.
 */
const BAR_SENSITIVITIES = [0.5, 0.8, 1.0, 0.85, 0.6];

export function VoiceActivityIndicator({
  audioLevel,
  isListening,
  isSpeaking,
  isContinuousMode,
  className,
}: VoiceActivityIndicatorProps) {
  const isActive = audioLevel > VOICE_THRESHOLD;

  // Determine accessibility label based on current state
  const ariaLabel = isSpeaking
    ? 'AI is speaking'
    : isActive
      ? 'Voice detected'
      : isListening
        ? 'Listening for voice'
        : 'Voice inactive';

  return (
    <div
      className={cn(
        'flex items-end justify-center gap-[3px] h-5 w-8',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
    >
      {BAR_SENSITIVITIES.map((sensitivity, index) => {
        // Calculate bar height based on state
        // Base: 15-25% depending on listening state
        // Active: scales up to 100% based on audio level
        const baseHeight = isListening || isContinuousMode ? 25 : 15;
        const audioContribution = isActive
          ? Math.min(75, audioLevel * sensitivity * 400)
          : 0;
        const height = baseHeight + audioContribution;

        // Staggered animation delays for organic feel
        const animationDelay = `${index * 60}ms`;

        return (
          <div
            key={index}
            className={cn(
              // Base bar styles
              'w-[3px] rounded-full transition-all',
              // Fast transition when active for responsive feel
              isActive ? 'duration-50' : 'duration-150',
              // Color states - layered for specificity
              // Default: muted gray
              'bg-muted-foreground/25',
              // Listening but no voice: light green with breathing
              isListening && !isActive && !isSpeaking && 'bg-green-500/40 animate-pulse',
              // Voice detected: bright green
              isActive && !isSpeaking && 'bg-green-500',
              // AI speaking: blue
              isSpeaking && 'bg-blue-500 animate-pulse'
            )}
            style={{
              height: `${height}%`,
              animationDelay: isListening && !isActive ? animationDelay : undefined,
              // Add subtle transform for more dynamic feel when active
              transform: isActive ? `scaleY(${1 + audioLevel * 0.15})` : undefined,
              transformOrigin: 'bottom',
            }}
          />
        );
      })}
    </div>
  );
}
