/**
 * Voice Recording Types - Comprehensive state machine for voice input UX.
 *
 * Defines the voice recording lifecycle states and related types
 * for both the interview VoiceRecorder and ChatInput components.
 *
 * @see /docs/ai-sdk/chat-ux-patterns.md for UX design patterns
 * @see /src/hooks/useVoiceRecording.ts for implementation
 */

/**
 * Voice recording state machine.
 *
 * State transitions:
 * - idle → requesting_permission (user taps record)
 * - requesting_permission → recording (permission granted)
 * - requesting_permission → permission_denied (user denied mic access)
 * - permission_denied → requesting_permission (user retries)
 * - recording → recorded (user stops recording)
 * - recording → idle (user cancels during recording)
 * - recorded → playing (user plays back)
 * - playing → recorded (playback ends or paused)
 * - recorded → processing (user submits)
 * - recorded → idle (user discards)
 * - processing → success (transcription complete)
 * - processing → error (transcription failed)
 * - error → recording (user retries)
 * - error → idle (user dismisses)
 * - success → idle (reset for next recording)
 */
export type VoiceRecordingState =
  | 'idle'
  | 'requesting_permission'
  | 'permission_denied'
  | 'recording'
  | 'recorded'
  | 'playing'
  | 'processing'
  | 'success'
  | 'error';

/**
 * Permission status for microphone access.
 */
export type MicPermissionStatus = 'prompt' | 'granted' | 'denied' | 'unavailable';

/**
 * Error types for voice recording.
 */
export type VoiceRecordingErrorType =
  | 'PERMISSION_DENIED'
  | 'NOT_SUPPORTED'
  | 'NO_AUDIO_DEVICE'
  | 'RECORDING_FAILED'
  | 'TRANSCRIPTION_FAILED'
  | 'NETWORK_ERROR'
  | 'UNSUPPORTED_FORMAT'
  | 'FILE_TOO_LARGE'
  | 'FILE_TOO_SHORT'
  | 'UNKNOWN';

/**
 * Voice recording error with user-friendly messaging.
 */
export interface VoiceRecordingError {
  type: VoiceRecordingErrorType;
  message: string;
  /** Whether the user can retry the operation */
  retryable: boolean;
  /** Suggested action for the user */
  suggestion?: string;
}

/**
 * Voice recording result after successful transcription.
 */
export interface VoiceRecordingResult {
  /** Transcribed text */
  text: string;
  /** Raw transcription before cleanup */
  rawText?: string;
  /** Duration in seconds */
  duration: number;
  /** Detected language code */
  language?: string;
  /** Audio blob for potential replay */
  audioBlob?: Blob;
}

/**
 * Voice recording constraints for validation.
 *
 * @see /src/app/api/ai/transcribe/route.ts for server-side validation
 */
export interface VoiceRecordingConstraints {
  /** Maximum recording duration in seconds */
  maxDurationSeconds: number;
  /** Maximum file size in bytes */
  maxFileSizeBytes: number;
  /** Minimum file size in bytes (prevents empty recordings) */
  minFileSizeBytes: number;
  /** Allowed MIME types */
  allowedMimeTypes: readonly string[];
}

/**
 * Default constraints for voice recording.
 */
export const DEFAULT_VOICE_CONSTRAINTS: VoiceRecordingConstraints = {
  maxDurationSeconds: 120, // 2 minutes for interviews
  maxFileSizeBytes: 10 * 1024 * 1024, // 10MB
  minFileSizeBytes: 1000, // 1KB
  allowedMimeTypes: [
    'audio/webm',
    'audio/webm;codecs=opus',
    'audio/mp4',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/x-wav',
  ] as const,
};

/**
 * Chat-specific constraints (shorter for conversational input).
 */
export const CHAT_VOICE_CONSTRAINTS: VoiceRecordingConstraints = {
  maxDurationSeconds: 30, // 30 seconds for chat messages
  maxFileSizeBytes: 10 * 1024 * 1024,
  minFileSizeBytes: 1000,
  allowedMimeTypes: DEFAULT_VOICE_CONSTRAINTS.allowedMimeTypes,
};

/**
 * Hook state for useVoiceRecording.
 */
export interface VoiceRecordingHookState {
  /** Current recording state */
  state: VoiceRecordingState;
  /** Microphone permission status */
  permissionStatus: MicPermissionStatus;
  /** Current error if any */
  error: VoiceRecordingError | null;
  /** Recorded audio blob */
  audioBlob: Blob | null;
  /** Audio playback URL */
  audioUrl: string | null;
  /** Recording duration in seconds */
  duration: number;
  /** Transcription result */
  result: VoiceRecordingResult | null;
}

/**
 * Hook actions for useVoiceRecording.
 */
export interface VoiceRecordingHookActions {
  /** Start recording (will request permission if needed) */
  startRecording: () => Promise<void>;
  /** Stop recording */
  stopRecording: () => void;
  /** Cancel and discard recording */
  cancelRecording: () => void;
  /** Submit recording for transcription */
  submitRecording: () => Promise<VoiceRecordingResult | null>;
  /** Play recorded audio */
  playRecording: () => void;
  /** Pause playback */
  pausePlayback: () => void;
  /** Reset to idle state */
  reset: () => void;
  /** Retry after error */
  retry: () => void;
  /** Check/request microphone permission */
  checkPermission: () => Promise<MicPermissionStatus>;
}

/**
 * Full hook return type.
 */
export type UseVoiceRecordingReturn = VoiceRecordingHookState & VoiceRecordingHookActions;

/**
 * Create a user-friendly error from an error type.
 */
export function createVoiceError(
  type: VoiceRecordingErrorType,
  details?: string
): VoiceRecordingError {
  const errorMap: Record<VoiceRecordingErrorType, Omit<VoiceRecordingError, 'type'>> = {
    PERMISSION_DENIED: {
      message: 'Microphone access was denied',
      retryable: true,
      suggestion: 'Please enable microphone access in your browser settings and try again.',
    },
    NOT_SUPPORTED: {
      message: 'Voice recording is not supported in this browser',
      retryable: false,
      suggestion: 'Try using Chrome, Safari, or Firefox on a desktop or mobile device.',
    },
    NO_AUDIO_DEVICE: {
      message: 'No microphone found',
      retryable: true,
      suggestion: 'Please connect a microphone and try again.',
    },
    RECORDING_FAILED: {
      message: 'Recording failed unexpectedly',
      retryable: true,
      suggestion: 'Please try recording again.',
    },
    TRANSCRIPTION_FAILED: {
      message: details || 'Failed to transcribe audio',
      retryable: true,
      suggestion: 'Please try recording again with clearer audio.',
    },
    NETWORK_ERROR: {
      message: 'Network error during transcription',
      retryable: true,
      suggestion: 'Please check your internet connection and try again.',
    },
    UNSUPPORTED_FORMAT: {
      message: 'Audio format not supported',
      retryable: true,
      suggestion: 'Please record again using your device microphone.',
    },
    FILE_TOO_LARGE: {
      message: 'Recording is too long',
      retryable: true,
      suggestion: 'Please record a shorter response (max 2 minutes).',
    },
    FILE_TOO_SHORT: {
      message: 'Recording is too short',
      retryable: true,
      suggestion: 'Please record a longer response.',
    },
    UNKNOWN: {
      message: details || 'An unexpected error occurred',
      retryable: true,
      suggestion: 'Please try again.',
    },
  };

  return {
    type,
    ...errorMap[type],
  };
}
