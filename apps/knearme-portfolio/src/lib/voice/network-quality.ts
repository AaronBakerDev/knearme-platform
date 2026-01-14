'use client';

/**
 * Network Quality Detection for Voice Modes
 *
 * Uses the Navigator Connection API (client-side only, zero server cost) to
 * detect network quality. Falls back to optimistic 'good' if API unavailable.
 *
 * Quality mapping from effectiveType:
 * - '4g' → 'good' - voice_voice mode works well
 * - '3g' → 'degraded' - prefer voice_text
 * - '2g'/'slow-2g' → 'poor' - text mode recommended
 *
 * Additional RTT-based refinement:
 * - rtt < 100ms → 'good'
 * - rtt 100-300ms → 'good' (if 4g) or 'degraded'
 * - rtt > 300ms → 'degraded' or 'poor'
 *
 * COST: Zero serverless invocations - entirely client-side.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation
 * @see /src/types/voice.ts for VoiceNetworkQuality type
 * @see /src/components/chat/hooks/useVoiceModeManager.ts for integration
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { VoiceNetworkQuality } from '@/types/voice';

/**
 * Navigator Connection API types (not in all TypeScript libs)
 * @see https://wicg.github.io/netinfo/
 */
interface NetworkInformation extends EventTarget {
  readonly effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
  readonly rtt?: number; // Round-trip time in ms
  readonly downlink?: number; // Mbps
  readonly saveData?: boolean;
  onchange?: EventListener;
}

declare global {
  interface Navigator {
    connection?: NetworkInformation;
    mozConnection?: NetworkInformation;
    webkitConnection?: NetworkInformation;
  }
}

/**
 * Configuration for network quality detection.
 */
interface NetworkQualityConfig {
  /** Enable monitoring (default: false - must opt-in) */
  enabled?: boolean;
  /** RTT threshold for 'degraded' quality in ms (default: 300) */
  degradedThresholdMs?: number;
  /** RTT threshold for 'poor' quality in ms (default: 500) */
  poorThresholdMs?: number;
}

/**
 * Default configuration values.
 */
const DEFAULT_CONFIG: Required<NetworkQualityConfig> = {
  enabled: false,
  degradedThresholdMs: 300,
  poorThresholdMs: 500,
};

/**
 * State returned by useNetworkQuality hook.
 */
export interface NetworkQualityState {
  /** Current network quality assessment */
  quality: VoiceNetworkQuality;
  /** Browser-reported RTT in ms (0 if unavailable) */
  latency: number;
  /** Same as latency for API compatibility */
  averageLatency: number;
  /** Always 0 - variance not available from Connection API */
  variance: number;
  /** Whether monitoring is active (always true when enabled) */
  isMonitoring: boolean;
  /** Always 1 - Connection API provides single reading */
  sampleCount: number;
  /** Error message if Connection API unavailable */
  error: string | null;
  /** No-op for API compatibility */
  measureNow: () => Promise<void>;
  /** No-op for API compatibility */
  startMonitoring: () => void;
  /** No-op for API compatibility */
  stopMonitoring: () => void;
}

/**
 * Get the network connection object (browser-specific prefixes).
 */
function getConnection(): NetworkInformation | null {
  if (typeof navigator === 'undefined') return null;
  return navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
}

/**
 * Determine quality from Connection API data.
 * Zero server cost - entirely client-side.
 */
function determineQualityFromConnection(
  connection: NetworkInformation | null,
  config: Required<NetworkQualityConfig>
): { quality: VoiceNetworkQuality; rtt: number } {
  if (!connection) {
    // API unavailable - optimistically assume good
    // Safari and Firefox don't support this API
    return { quality: 'good', rtt: 0 };
  }

  const { effectiveType, rtt = 0 } = connection;

  // If saveData is enabled, user wants minimal data usage
  if (connection.saveData) {
    return { quality: 'poor', rtt };
  }

  // Map effectiveType to quality
  // effectiveType reflects actual network performance, not just connection type
  switch (effectiveType) {
    case '4g':
      // 4G but check RTT for refinement
      if (rtt > config.poorThresholdMs) {
        return { quality: 'degraded', rtt };
      }
      return { quality: 'good', rtt };

    case '3g':
      // 3G is generally degraded for real-time voice
      if (rtt > config.poorThresholdMs) {
        return { quality: 'poor', rtt };
      }
      return { quality: 'degraded', rtt };

    case '2g':
    case 'slow-2g':
      // 2G is too slow for voice
      return { quality: 'poor', rtt };

    default:
      // Unknown type - check RTT
      if (rtt > config.poorThresholdMs) {
        return { quality: 'poor', rtt };
      }
      if (rtt > config.degradedThresholdMs) {
        return { quality: 'degraded', rtt };
      }
      return { quality: 'good', rtt };
  }
}

/**
 * Hook for monitoring network quality for voice mode decisions.
 *
 * Uses the Navigator Connection API (client-side only) to detect network quality.
 * Zero server cost - no polling, no fetch requests.
 *
 * Falls back to optimistic 'good' if API is unavailable (Safari, Firefox).
 *
 * @example
 * ```tsx
 * const { quality, latency } = useNetworkQuality({ enabled: true });
 *
 * useEffect(() => {
 *   if (quality === 'poor') {
 *     console.log('Network too slow for voice');
 *   }
 * }, [quality]);
 * ```
 */
export function useNetworkQuality(
  config: NetworkQualityConfig = {}
): NetworkQualityState {
  const {
    enabled = DEFAULT_CONFIG.enabled,
    degradedThresholdMs = DEFAULT_CONFIG.degradedThresholdMs,
    poorThresholdMs = DEFAULT_CONFIG.poorThresholdMs,
  } = config;

  const mergedConfig = useMemo<Required<NetworkQualityConfig>>(
    () => ({
      enabled,
      degradedThresholdMs,
      poorThresholdMs,
    }),
    [enabled, degradedThresholdMs, poorThresholdMs]
  );

  const [quality, setQuality] = useState<VoiceNetworkQuality>('good');
  const [latency, setLatency] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  // Update quality from connection
  const updateQuality = useCallback(() => {
    if (!isMountedRef.current || !mergedConfig.enabled) return;

    const connection = getConnection();
    const result = determineQualityFromConnection(connection, mergedConfig);

    setQuality(result.quality);
    setLatency(result.rtt);

    if (!connection) {
      setError('Connection API unavailable - using optimistic quality');
    } else {
      setError(null);
    }
  }, [mergedConfig]);

  // Set up connection change listener
  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled) {
      return () => {
        isMountedRef.current = false;
      };
    }

    // Listen for connection changes (when supported)
    const connection = getConnection();
    if (connection) {
      const handleChange = () => updateQuality();
      connection.addEventListener('change', handleChange);

      const timeoutId = setTimeout(handleChange, 0);

      return () => {
        isMountedRef.current = false;
        connection.removeEventListener('change', handleChange);
        clearTimeout(timeoutId);
      };
    }

    const timeoutId = setTimeout(updateQuality, 0);

    return () => {
      isMountedRef.current = false;
      clearTimeout(timeoutId);
    };
  }, [enabled, updateQuality]);

  // No-op functions for API compatibility with old polling-based interface
  const measureNow = useCallback(async () => {
    updateQuality();
  }, [updateQuality]);

  const startMonitoring = useCallback(() => {
    // No-op - Connection API is event-based, not polling
  }, []);

  const stopMonitoring = useCallback(() => {
    // No-op - Connection API is event-based, not polling
  }, []);

  const resolvedQuality = enabled ? quality : 'good';
  const resolvedLatency = enabled ? latency : 0;
  const resolvedError = enabled ? error : null;

  return {
    quality: resolvedQuality,
    latency: resolvedLatency,
    averageLatency: resolvedLatency,
    variance: 0,
    isMonitoring: enabled,
    sampleCount: enabled ? 1 : 0,
    error: resolvedError,
    measureNow,
    startMonitoring,
    stopMonitoring,
  };
}

/**
 * Utility function to get a human-readable quality description.
 */
export function getQualityDescription(quality: VoiceNetworkQuality): string {
  switch (quality) {
    case 'good':
      return 'Network conditions are optimal for voice interaction.';
    case 'degraded':
      return 'Network latency is elevated. Voice-to-text mode recommended.';
    case 'poor':
      return 'Network connection is slow. Text input recommended.';
    default:
      return 'Unknown network quality.';
  }
}

/**
 * Get the recommended voice mode based on network quality.
 */
export function getRecommendedMode(
  quality: VoiceNetworkQuality
): 'voice_voice' | 'voice_text' | 'text' {
  switch (quality) {
    case 'good':
      return 'voice_voice';
    case 'degraded':
      return 'voice_text';
    case 'poor':
      return 'text';
    default:
      return 'text';
  }
}
