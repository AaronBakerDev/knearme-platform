'use client';

/**
 * Voice Mode Manager - simplified binary mode state management.
 *
 * Two modes:
 * - 'text': User can type OR speak (voice-to-text), AI responds with text
 * - 'voice_chat': Full two-way voice conversation with AI
 *
 * The old 'voice_text' mode was merged into 'text' since users can always
 * use the mic button for voice-to-text transcription in text mode.
 *
 * Features:
 * - Track preferred mode (text or voice_chat)
 * - Check mic availability/permissions
 * - Offer a request permission helper
 * - Network quality detection for auto-downgrade from voice_chat
 *
 * @see /src/lib/voice/network-quality.ts for network quality detection
 * @see /src/types/voice.ts for VoiceInteractionMode type
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  MicPermissionStatus,
  VoiceInteractionMode,
  VoiceModeStatus,
  VoiceNetworkQuality,
} from '@/types/voice';
import { useNetworkQuality, getRecommendedMode } from '@/lib/voice/network-quality';
import { logger } from '@/lib/logging';

const MODE_STORAGE_KEY = 'knearme.voiceMode';

const VALID_MODES: VoiceInteractionMode[] = ['text', 'voice_chat'];

function isVoiceMode(value: string): value is VoiceInteractionMode {
  return VALID_MODES.includes(value as VoiceInteractionMode);
}

// Migration helper: convert old mode values to new
function migrateMode(value: string): VoiceInteractionMode {
  // Old 'voice_text' is now merged into 'text'
  if (value === 'voice_text') return 'text';
  // Old 'voice_voice' is now 'voice_chat'
  if (value === 'voice_voice') return 'voice_chat';
  if (isVoiceMode(value)) return value;
  return 'text';
}

interface VoiceModeManagerOptions {
  /** Default mode when no preference is stored */
  defaultMode?: VoiceInteractionMode;
  /** Enable Voice Chat feature (Live API) */
  enableVoiceChat?: boolean;
  /** Enable network quality monitoring for auto-switching (default: false) */
  enableNetworkQuality?: boolean;
  /** Auto-switch to text mode when network degrades (default: true) */
  autoSwitchOnDegradedNetwork?: boolean;
  /** Callback when mode is auto-switched due to network quality */
  onNetworkQualitySwitch?: (from: VoiceInteractionMode, to: VoiceInteractionMode, quality: VoiceNetworkQuality) => void;
}

interface VoiceModeManagerState {
  mode: VoiceInteractionMode;
  setMode: (mode: VoiceInteractionMode) => void;
  status: VoiceModeStatus;
  setStatus: (status: VoiceModeStatus) => void;
  networkQuality: VoiceNetworkQuality;
  setNetworkQuality: (quality: VoiceNetworkQuality) => void;
  /** Current network latency in ms */
  networkLatency: number;
  /** Whether network is being monitored */
  isMonitoringNetwork: boolean;
  /** Recommended mode based on network quality */
  recommendedMode: VoiceInteractionMode;
  permissionStatus: MicPermissionStatus;
  supportsVoice: boolean;
  isRequestingPermission: boolean;
  requestPermission: () => Promise<void>;
  /** Available modes based on device/permission state */
  availableModes: VoiceInteractionMode[];
  /** Whether Voice Chat is available and enabled */
  voiceChatAvailable: boolean;
}

export function useVoiceModeManager(
  options: VoiceModeManagerOptions = {}
): VoiceModeManagerState {
  const {
    defaultMode = 'text',
    enableVoiceChat = false,
    enableNetworkQuality = false,
    autoSwitchOnDegradedNetwork = true,
    onNetworkQualitySwitch,
  } = options;

  const [mode, setModeState] = useState<VoiceInteractionMode>(defaultMode);
  const [status, setStatus] = useState<VoiceModeStatus>('idle');
  const [permissionStatus, setPermissionStatus] = useState<MicPermissionStatus>(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return 'unavailable';
    }
    return 'prompt';
  });
  const [supportsVoice, setSupportsVoice] = useState(() => {
    if (typeof navigator === 'undefined') return false;
    return Boolean(navigator.mediaDevices?.getUserMedia);
  });
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [_hasUserPreference, setHasUserPreference] = useState(false);

  // Network quality monitoring - only when in voice_chat mode
  const shouldMonitorNetwork = enableNetworkQuality && supportsVoice && mode === 'voice_chat';

  const {
    quality: detectedNetworkQuality,
    latency: networkLatency,
    isMonitoring: isMonitoringNetwork,
  } = useNetworkQuality({
    enabled: shouldMonitorNetwork,
  });

  const networkQuality = enableNetworkQuality ? detectedNetworkQuality : 'good';

  // Track previous mode for auto-switch detection
  const previousModeRef = useRef<VoiceInteractionMode>(mode);
  const userRequestedModeRef = useRef<VoiceInteractionMode | null>(null);

  // Setter for manual network quality override (interface compatibility)
  const setNetworkQuality = useCallback((_quality: VoiceNetworkQuality) => {
    logger.info('[VoiceModeManager] Manual network quality set ignored (using auto-detection)');
  }, []);

  // Load stored preference with migration from old mode names
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(MODE_STORAGE_KEY);
    if (stored) {
      const migrated = migrateMode(stored);
      setModeState(migrated);
      setHasUserPreference(true);
      // Update storage if migration changed the value
      if (migrated !== stored) {
        window.localStorage.setItem(MODE_STORAGE_KEY, migrated);
      }
    }
  }, []);

  const setMode = useCallback((next: VoiceInteractionMode) => {
    setModeState(next);
    setHasUserPreference(true);
    userRequestedModeRef.current = next;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(MODE_STORAGE_KEY, next);
    }
  }, []);

  const checkPermission = useCallback(async (): Promise<MicPermissionStatus> => {
    if (typeof navigator === 'undefined') {
      setSupportsVoice(false);
      setPermissionStatus('unavailable');
      return 'unavailable';
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setSupportsVoice(false);
      setPermissionStatus('unavailable');
      return 'unavailable';
    }

    setSupportsVoice(true);

    let status: MicPermissionStatus = 'prompt';

    if (navigator.permissions?.query) {
      try {
        const permission = await navigator.permissions.query({
          name: 'microphone' as PermissionName,
        });
        status =
          permission.state === 'granted'
            ? 'granted'
            : permission.state === 'denied'
              ? 'denied'
              : 'prompt';
      } catch {
        status = 'prompt';
      }
    }

    if (navigator.mediaDevices?.enumerateDevices) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasAudioInput = devices.some((device) => device.kind === 'audioinput');
        if (!hasAudioInput) {
          status = 'unavailable';
          setSupportsVoice(false);
        }
      } catch {
        // Keep existing status if device enumeration fails
      }
    }

    setPermissionStatus(status);
    return status;
  }, []);

  useEffect(() => {
    void checkPermission();
  }, [checkPermission]);

  const requestPermission = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setSupportsVoice(false);
      setPermissionStatus('unavailable');
      return;
    }

    setIsRequestingPermission(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setSupportsVoice(true);
      setPermissionStatus('granted');
    } catch {
      setPermissionStatus('denied');
    } finally {
      setIsRequestingPermission(false);
    }
  }, []);

  // Voice Chat is available when: enabled, has mic support, and permission granted
  const voiceChatAvailable = useMemo(() => {
    return enableVoiceChat && supportsVoice && permissionStatus === 'granted';
  }, [enableVoiceChat, supportsVoice, permissionStatus]);

  // Available modes - text is always available, voice_chat if enabled and permitted
  const availableModes = useMemo(() => {
    const modes: VoiceInteractionMode[] = ['text'];
    if (voiceChatAvailable) {
      modes.push('voice_chat');
    }
    return modes;
  }, [voiceChatAvailable]);

  // Ensure current mode is valid given available modes
  useEffect(() => {
    if (mode === 'voice_chat' && !voiceChatAvailable) {
      setModeState('text');
    }
  }, [mode, voiceChatAvailable]);

  // Calculate recommended mode based on network quality
  const recommendedMode = useMemo((): VoiceInteractionMode => {
    if (!voiceChatAvailable) {
      return 'text';
    }

    const recommended = getRecommendedMode(networkQuality);

    // Map old mode names to new
    if (recommended === 'voice_voice') return 'voice_chat';
    if (recommended === 'voice_text') return 'text';

    return recommended === 'text' ? 'text' : 'voice_chat';
  }, [networkQuality, voiceChatAvailable]);

  // Auto-switch between voice_chat and text based on network quality
  useEffect(() => {
    if (!autoSwitchOnDegradedNetwork) return;
    if (!enableNetworkQuality) return;

    // Store original mode for potential restoration (only when in voice_chat)
    if (mode === 'voice_chat' && userRequestedModeRef.current === null) {
      userRequestedModeRef.current = mode;
    }

    // Downgrade voice_chat to text on degraded/poor network
    if (mode === 'voice_chat' && (networkQuality === 'poor' || networkQuality === 'degraded')) {
      previousModeRef.current = mode;
      setModeState('text');

      if (onNetworkQualitySwitch) {
        onNetworkQualitySwitch(mode, 'text', networkQuality);
      }

      logger.info('[VoiceModeManager] Auto-switched from voice_chat to text', {
        networkQuality,
      });
    }

    // Restore voice_chat when network improves (if user originally wanted voice_chat)
    if (mode === 'text' && networkQuality === 'good' && userRequestedModeRef.current === 'voice_chat') {
      if (voiceChatAvailable) {
        setModeState('voice_chat');

        if (onNetworkQualitySwitch) {
          onNetworkQualitySwitch('text', 'voice_chat', networkQuality);
        }

        logger.info('[VoiceModeManager] Restored voice_chat mode after network improvement');
      }
    }
  }, [
    networkQuality,
    mode,
    autoSwitchOnDegradedNetwork,
    enableNetworkQuality,
    voiceChatAvailable,
    onNetworkQualitySwitch,
  ]);

  return {
    mode,
    setMode,
    status,
    setStatus,
    networkQuality,
    setNetworkQuality,
    networkLatency,
    isMonitoringNetwork,
    recommendedMode,
    permissionStatus,
    supportsVoice,
    isRequestingPermission,
    requestPermission,
    availableModes,
    voiceChatAvailable,
  };
}
