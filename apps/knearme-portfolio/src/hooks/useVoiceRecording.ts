'use client';

/**
 * Voice Recording Hook - Complete state machine for voice input.
 *
 * Provides a comprehensive voice recording experience with:
 * - Microphone permission handling
 * - Recording state machine (idle → recording → recorded → processing)
 * - Audio playback
 * - Transcription integration
 * - Error handling with user-friendly messages
 * - Duration constraints
 *
 * @see /src/types/voice.ts for type definitions
 * @see /docs/ai-sdk/chat-ux-patterns.md for UX patterns
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type {
  VoiceRecordingState,
  MicPermissionStatus,
  VoiceRecordingError,
  VoiceRecordingResult,
  VoiceRecordingConstraints,
  UseVoiceRecordingReturn,
} from '@/types/voice';
import { createVoiceError, DEFAULT_VOICE_CONSTRAINTS } from '@/types/voice';

interface UseVoiceRecordingOptions {
  /** Constraints for recording */
  constraints?: VoiceRecordingConstraints;
  /** API endpoint for transcription */
  transcribeEndpoint?: string;
  /** Callback when transcription completes */
  onTranscriptionComplete?: (result: VoiceRecordingResult) => void;
  /** Callback when error occurs */
  onError?: (error: VoiceRecordingError) => void;
  /** Project ID for interview context (optional) */
  projectId?: string;
  /** Question ID for interview context (optional) */
  questionId?: string;
  /** Question text for interview context (optional) */
  questionText?: string;
}

/**
 * Hook for managing voice recording with complete state machine.
 */
export function useVoiceRecording(
  options: UseVoiceRecordingOptions = {}
): UseVoiceRecordingReturn {
  const {
    constraints = DEFAULT_VOICE_CONSTRAINTS,
    transcribeEndpoint = '/api/ai/transcribe',
    onTranscriptionComplete,
    onError,
    projectId,
    questionId,
    questionText,
  } = options;

  // State
  const [state, setState] = useState<VoiceRecordingState>('idle');
  const [permissionStatus, setPermissionStatus] = useState<MicPermissionStatus>('prompt');
  const [error, setError] = useState<VoiceRecordingError | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [result, setResult] = useState<VoiceRecordingResult | null>(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Clean up resources.
   */
  const cleanup = useCallback(() => {
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop media recorder
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;

    // Stop stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Abort any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * Clean up on unmount.
   */
  useEffect(() => {
    return () => {
      cleanup();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [cleanup, audioUrl]);

  /**
   * Check microphone permission status.
   */
  const checkPermission = useCallback(async (): Promise<MicPermissionStatus> => {
    // Check if browser supports permissions API
    if (!navigator.permissions) {
      // Fallback: try to enumerate devices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasAudioInput = devices.some((d) => d.kind === 'audioinput');
        if (!hasAudioInput) {
          setPermissionStatus('unavailable');
          return 'unavailable';
        }
        // Can't determine permission without permissions API
        setPermissionStatus('prompt');
        return 'prompt';
      } catch {
        setPermissionStatus('unavailable');
        return 'unavailable';
      }
    }

    try {
      const permissionResult = await navigator.permissions.query({
        name: 'microphone' as PermissionName,
      });
      const status =
        permissionResult.state === 'granted'
          ? 'granted'
          : permissionResult.state === 'denied'
            ? 'denied'
            : 'prompt';
      setPermissionStatus(status);
      return status;
    } catch {
      // Firefox doesn't support microphone permission query
      setPermissionStatus('prompt');
      return 'prompt';
    }
  }, []);

  /**
   * Start recording audio.
   */
  const startRecording = useCallback(async () => {
    setError(null);
    setState('requesting_permission');

    // Check for MediaRecorder support
    if (!navigator.mediaDevices?.getUserMedia) {
      const err = createVoiceError('NOT_SUPPORTED');
      setError(err);
      setState('idle');
      onError?.(err);
      return;
    }

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;
      setPermissionStatus('granted');

      // Determine best supported MIME type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);

        // Clean up old URL
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        setAudioUrl(URL.createObjectURL(blob));

        // Stop stream only if it hasn't been cleaned up by cleanup()
        // This prevents race condition between onstop handler and unmount cleanup
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        // Only transition to recorded if we weren't cancelled
        setState((current) => (current === 'recording' ? 'recorded' : current));
      };

      mediaRecorder.onerror = () => {
        const err = createVoiceError('RECORDING_FAILED');
        setError(err);
        setState('error');
        cleanup();
        onError?.(err);
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      setState('recording');
      setDuration(0);

      // Start duration timer
      timerRef.current = setInterval(() => {
        setDuration((d) => {
          const newDuration = d + 1;
          // Auto-stop at max duration
          if (newDuration >= constraints.maxDurationSeconds) {
            mediaRecorder.stop();
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
          }
          return newDuration;
        });
      }, 1000);
    } catch (err) {
      // Handle permission denied
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setPermissionStatus('denied');
          const voiceErr = createVoiceError('PERMISSION_DENIED');
          setError(voiceErr);
          setState('permission_denied');
          onError?.(voiceErr);
          return;
        }
        if (err.name === 'NotFoundError') {
          const voiceErr = createVoiceError('NO_AUDIO_DEVICE');
          setError(voiceErr);
          setState('error');
          onError?.(voiceErr);
          return;
        }
      }

      const voiceErr = createVoiceError('UNKNOWN', String(err));
      setError(voiceErr);
      setState('error');
      onError?.(voiceErr);
    }
  }, [audioUrl, cleanup, constraints.maxDurationSeconds, onError]);

  /**
   * Stop recording.
   */
  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  /**
   * Cancel and discard recording.
   */
  const cancelRecording = useCallback(() => {
    cleanup();

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setError(null);
    setState('idle');
  }, [cleanup, audioUrl]);

  /**
   * Submit recording for transcription.
   */
  const submitRecording = useCallback(async (): Promise<VoiceRecordingResult | null> => {
    if (!audioBlob) {
      const err = createVoiceError('UNKNOWN', 'No recording to submit');
      setError(err);
      onError?.(err);
      return null;
    }

    // Validate MIME type
    const mimeType = audioBlob.type || 'application/octet-stream';
    const baseType = mimeType.split(';')[0] || mimeType;
    const allowedTypes = constraints.allowedMimeTypes;
    const isAllowed = allowedTypes.includes(mimeType) || allowedTypes.includes(baseType);

    if (!isAllowed) {
      const err = createVoiceError('UNSUPPORTED_FORMAT');
      setError(err);
      setState('error');
      onError?.(err);
      return null;
    }

    // Validate file size
    if (audioBlob.size > constraints.maxFileSizeBytes) {
      const err = createVoiceError('FILE_TOO_LARGE');
      setError(err);
      setState('error');
      onError?.(err);
      return null;
    }

    if (audioBlob.size < constraints.minFileSizeBytes) {
      const err = createVoiceError('FILE_TOO_SHORT');
      setError(err);
      setState('error');
      onError?.(err);
      return null;
    }

    setState('processing');

    try {
      abortControllerRef.current = new AbortController();

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      // Add interview metadata if provided
      if (projectId && questionId && questionText) {
        formData.append(
          'metadata',
          JSON.stringify({
            project_id: projectId,
            question_id: questionId,
            question_text: questionText,
          })
        );
      }

      const response = await fetch(transcribeEndpoint, {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const apiMessage =
          typeof data?.error?.message === 'string'
            ? data.error.message
            : typeof data?.message === 'string'
              ? data.message
              : null;
        throw new Error(apiMessage || `Transcription failed: ${response.status}`);
      }

      /**
       * API response shape from /api/ai/transcribe.
       * @see /src/app/api/ai/transcribe/route.ts apiSuccess() call
       */
      interface TranscribeApiResponse {
        text: string;
        transcription?: string;
        raw?: string;
        duration?: number;
        language?: string;
      }

      const data = (await response.json()) as TranscribeApiResponse;

      // Validate response has required text field
      if (!data.text) {
        throw new Error('Invalid transcription response: missing text');
      }

      const transcriptionResult: VoiceRecordingResult = {
        text: data.text,
        rawText: data.raw,
        duration: data.duration ?? duration,
        language: data.language,
        audioBlob,
      };

      setResult(transcriptionResult);
      setState('success');
      onTranscriptionComplete?.(transcriptionResult);

      return transcriptionResult;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled
        setState('recorded');
        return null;
      }

      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      const isNetworkError =
        err instanceof TypeError && errorMessage.includes('Failed to fetch');

      const voiceErr = createVoiceError(
        isNetworkError ? 'NETWORK_ERROR' : 'TRANSCRIPTION_FAILED',
        errorMessage
      );
      setError(voiceErr);
      setState('error');
      onError?.(voiceErr);
      return null;
    }
  }, [
    audioBlob,
    constraints.allowedMimeTypes,
    constraints.maxFileSizeBytes,
    constraints.minFileSizeBytes,
    duration,
    onError,
    onTranscriptionComplete,
    projectId,
    questionId,
    questionText,
    transcribeEndpoint,
  ]);

  /**
   * Play recorded audio.
   */
  const playRecording = useCallback(() => {
    if (!audioUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => {
        setState('recorded');
      };
    }

    audioRef.current.play();
    setState('playing');
  }, [audioUrl]);

  /**
   * Pause playback.
   */
  const pausePlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setState('recorded');
  }, []);

  /**
   * Reset to idle state.
   */
  const reset = useCallback(() => {
    cleanup();

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setError(null);
    setResult(null);
    setState('idle');
  }, [cleanup, audioUrl]);

  /**
   * Retry after error.
   */
  const retry = useCallback(() => {
    setError(null);

    if (state === 'permission_denied') {
      // Retry permission request
      startRecording();
    } else if (state === 'error') {
      // If we have audio, retry transcription; otherwise start new recording
      if (audioBlob) {
        submitRecording();
      } else {
        setState('idle');
        startRecording();
      }
    }
  }, [state, audioBlob, startRecording, submitRecording]);

  return {
    // State
    state,
    permissionStatus,
    error,
    audioBlob,
    audioUrl,
    duration,
    result,
    // Actions
    startRecording,
    stopRecording,
    cancelRecording,
    submitRecording,
    playRecording,
    pausePlayback,
    reset,
    retry,
    checkPermission,
  };
}
