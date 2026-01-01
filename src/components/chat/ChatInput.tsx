'use client';

/**
 * Floating pill chat input with text, voice, and attachment support.
 *
 * Design: "Void Interface" - floating capsule shape with backdrop blur,
 * internal action buttons for attachment, mic, and send.
 *
 * Features:
 * - Floating pill design with shadow
 * - Attachment button (opens photo sheet)
 * - Auto-resizing textarea (1-5 lines, Enter to send, Shift+Enter for newline)
 * - Mic button for voice input (transcribed to text)
 * - Send button (or Enter key)
 * - Mobile-optimized with 44px touch targets
 * - Graceful fallback from voice to text
 *
 * Voice Recording Modes:
 * 1. External handling (onVoiceRecording provided): Parent handles transcription
 * 2. Internal handling (no onVoiceRecording): Component handles transcription via hook
 *
 * @see /src/hooks/useVoiceRecording.ts for voice state machine
 * @see /src/types/voice.ts for voice type definitions
 */

import { useState, useCallback, useRef, useEffect, type KeyboardEvent } from 'react';
import { Mic, MicOff, Loader2, Plus, ArrowUp, AlertCircle, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { CHAT_VOICE_CONSTRAINTS } from '@/types/voice';
import { useDropZone } from './hooks/useDropZone';

import type { VoiceInteractionMode } from '@/types/voice';
import { VoiceChatButton } from './VoiceModeButton';

interface ChatInputProps {
  /** Called when user sends a message */
  onSend: (text: string) => void;
  /** Whether voice input is enabled */
  enableVoice?: boolean;
  /**
   * Called when user records voice (external handling mode).
   * If provided, the parent component handles transcription.
   * If not provided, ChatInput handles transcription internally.
   */
  onVoiceRecording?: (blob: Blob) => void;
  /** Called when user wants to attach photos */
  onAttachPhotos?: () => void;
  /** Number of photos already attached */
  photoCount?: number;
  /** Whether input is disabled */
  disabled?: boolean;
  /** Whether a message is being processed */
  isLoading?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Optional additional className */
  className?: string;
  /** Current text value (controlled) */
  value?: string;
  /** Called when text changes (controlled) */
  onChange?: (text: string) => void;
  /** Called when images are dropped onto the input */
  onImageDrop?: (files: File[]) => void;
  /** Current voice mode ('text' or 'voice_chat') */
  voiceMode?: VoiceInteractionMode;
  /** Called when voice mode changes */
  onVoiceModeChange?: (mode: VoiceInteractionMode) => void;
  /** Whether Voice Chat feature is available */
  voiceChatEnabled?: boolean;
}

/**
 * Floating pill chat input component.
 *
 * Supports both controlled and uncontrolled modes for text input.
 * Voice input can be handled externally (via onVoiceRecording) or internally.
 */
export function ChatInput({
  onSend,
  enableVoice = true,
  onVoiceRecording,
  onAttachPhotos,
  photoCount = 0,
  disabled = false,
  isLoading = false,
  placeholder = 'Tell me what to change...',
  className,
  value: controlledValue,
  onChange: controlledOnChange,
  onImageDrop,
  voiceMode = 'text',
  onVoiceModeChange,
  voiceChatEnabled = false,
}: ChatInputProps) {
  // Determine voice handling mode
  const useExternalVoice = !!onVoiceRecording;

  // External voice recording state (only used when onVoiceRecording is provided)
  const [externalRecording, setExternalRecording] = useState(false);
  const [externalError, setExternalError] = useState<string | null>(null);
  const externalMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const externalAudioChunksRef = useRef<Blob[]>([]);
  const externalStreamRef = useRef<MediaStream | null>(null);
  const pendingInternalSubmitRef = useRef(false);

  // Internal voice recording hook (only used when onVoiceRecording is not provided)
  const internalVoice = useVoiceRecording({
    constraints: CHAT_VOICE_CONSTRAINTS,
    onTranscriptionComplete: (result) => {
      // Populate input with transcribed text
      if (result.text) {
        handleTextChange(result.text);
        inputRef.current?.focus();
      }
    },
    onError: (error) => {
      console.error('[ChatInput] Voice error:', error.type, error.message);
    },
  });

  const { state: internalState, submitRecording, reset: resetInternalVoice } = internalVoice;

  // Drag-and-drop support for images
  const { isDragging, handlers: dropHandlers } = useDropZone({
    onDrop: onImageDrop || (() => {}),
    accept: 'image/*',
    disabled: disabled || !onImageDrop,
  });

  // Clean up external recording on unmount
  useEffect(() => {
    return () => {
      if (externalMediaRecorderRef.current?.state === 'recording') {
        externalMediaRecorderRef.current.stop();
      }
      if (externalStreamRef.current) {
        externalStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [uncontrolledValue, setUncontrolledValue] = useState('');

  // Text state handling
  const isControlled = controlledValue !== undefined;

  const handleTextChange = useCallback(
    (newValue: string) => {
      if (isControlled) {
        controlledOnChange?.(newValue);
        return;
      }

      setUncontrolledValue(newValue);
    },
    [isControlled, controlledOnChange, setUncontrolledValue]
  );

  /**
   * Handle form submission.
   */
  const handleSubmit = useCallback(() => {
    const currentText = isControlled ? controlledValue ?? '' : uncontrolledValue;
    const trimmed = currentText.trim();

    if (trimmed && !disabled && !isLoading) {
      onSend(trimmed);
      handleTextChange('');
      if (!isControlled) {
        setUncontrolledValue('');
      }
    }
  }, [
    isControlled,
    controlledValue,
    uncontrolledValue,
    disabled,
    isLoading,
    onSend,
    handleTextChange,
    setUncontrolledValue,
  ]);

  /**
   * Handle Enter key to send (Shift+Enter for newline).
   */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  /**
   * Auto-resize textarea based on content.
   * Resets height first to properly shrink, then sets to scrollHeight.
   * Capped at 120px (~5 lines) to avoid taking too much space.
   */
  const handleTextAreaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      handleTextChange(e.target.value);
      // Auto-resize: reset height then set to scrollHeight (capped at 120px)
      e.target.style.height = 'auto';
      e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
    },
    [handleTextChange]
  );

  /**
   * Start external recording.
   */
  const startExternalRecording = useCallback(async () => {
    if (!onVoiceRecording) return;
    setExternalError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });

      externalStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      });

      externalAudioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          externalAudioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        externalStreamRef.current = null;

        if (externalAudioChunksRef.current.length > 0) {
          const audioBlob = new Blob(externalAudioChunksRef.current, {
            type: mediaRecorder.mimeType,
          });
          const mimeType = audioBlob.type || 'application/octet-stream';
          const baseType = mimeType.split(';')[0] || mimeType;
          const allowed = CHAT_VOICE_CONSTRAINTS.allowedMimeTypes;
          const isAllowed = allowed.includes(mimeType) || allowed.includes(baseType);

          if (!isAllowed) {
            setExternalError('Audio format not supported');
            setExternalRecording(false);
            return;
          }

          if (audioBlob.size > CHAT_VOICE_CONSTRAINTS.maxFileSizeBytes) {
            setExternalError('Recording is too long');
            setExternalRecording(false);
            return;
          }

          if (audioBlob.size < CHAT_VOICE_CONSTRAINTS.minFileSizeBytes) {
            setExternalError('Recording is too short');
            setExternalRecording(false);
            return;
          }

          onVoiceRecording(audioBlob);
        }
        setExternalRecording(false);
      };

      externalMediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setExternalRecording(true);
    } catch (err) {
      console.error('[ChatInput] Recording error:', err);
      setExternalError('Could not access microphone');
      setExternalRecording(false);
    }
  }, [onVoiceRecording]);

  /**
   * Stop external recording.
   */
  const stopExternalRecording = useCallback(() => {
    if (externalMediaRecorderRef.current?.state === 'recording') {
      externalMediaRecorderRef.current.stop();
    }
  }, []);

  /**
   * Toggle recording based on mode.
   */
  const handleVoiceToggle = useCallback(() => {
    if (useExternalVoice) {
      // External mode
      if (externalRecording) {
        stopExternalRecording();
      } else {
        startExternalRecording();
      }
    } else {
      // Internal mode
      if (internalState === 'recording') {
        pendingInternalSubmitRef.current = true;
        internalVoice.stopRecording();
      } else if (internalState === 'recorded') {
        pendingInternalSubmitRef.current = false;
        internalVoice.submitRecording();
      } else if (internalState === 'success') {
        pendingInternalSubmitRef.current = true;
        internalVoice.reset();
        internalVoice.startRecording();
      } else if (internalState === 'idle') {
        pendingInternalSubmitRef.current = true;
        internalVoice.startRecording();
      } else if (internalState === 'permission_denied') {
        internalVoice.retry();
      } else if (internalState === 'error') {
        internalVoice.retry();
      }
    }
  }, [
    useExternalVoice,
    externalRecording,
    startExternalRecording,
    stopExternalRecording,
    internalState,
    internalVoice,
  ]);

  // Submit after the recorder has actually finished (internal mode only)
  useEffect(() => {
    if (useExternalVoice) return;
    if (internalState !== 'recorded') return;
    if (!pendingInternalSubmitRef.current) return;

    pendingInternalSubmitRef.current = false;
    submitRecording();
  }, [useExternalVoice, internalState, submitRecording]);

  // Reset internal voice state after successful transcription so re-record works.
  useEffect(() => {
    if (useExternalVoice) return;
    if (internalState !== 'success') return;
    resetInternalVoice();
  }, [useExternalVoice, internalState, resetInternalVoice]);

  /**
   * Format duration as M:SS.
   */
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Compute state
  const isRecording = useExternalVoice ? externalRecording : internalState === 'recording';
  const isProcessing = !useExternalVoice && internalState === 'processing';
  const voiceError = useExternalVoice ? externalError : internalVoice.error?.message;

  const isDisabled = disabled || isLoading || isProcessing;
  const isVoiceActive = isRecording || isProcessing;
  const currentValue = isControlled ? controlledValue ?? '' : uncontrolledValue;
  const canSend = currentValue.trim().length > 0 && !isDisabled;

  return (
    <div
      className={cn('relative', className)}
      {...(onImageDrop ? dropHandlers : {})}
    >
      {/* Drop overlay - show when dragging with images */}
      {isDragging && onImageDrop && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-primary/10 backdrop-blur-sm rounded-full border-2 border-dashed border-primary">
          <div className="flex items-center gap-2 text-primary font-medium">
            <Upload className="h-5 w-5" />
            <span>Drop photos here</span>
          </div>
        </div>
      )}

      {/* Voice error - floating above input */}
      {voiceError && (
        <div className="absolute -top-12 left-0 right-0 flex items-center justify-center gap-2 px-3 py-2 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{voiceError}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              if (useExternalVoice) {
                setExternalError(null);
              } else {
                internalVoice.reset();
              }
            }}
            className="h-11 w-11 flex-shrink-0 hover:bg-destructive/20"
            aria-label="Dismiss error"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Floating pill input container */}
      <div
        className={cn(
          'flex items-center gap-1.5 bg-muted/60 backdrop-blur-sm border border-border/40 rounded-full px-2 py-1.5 shadow-chat-input',
          isVoiceActive && 'border-primary/50',
          isDragging && onImageDrop && 'ring-2 ring-primary ring-offset-2'
        )}
      >
        {/* Attachment button - opens photo sheet */}
        {onAttachPhotos && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onAttachPhotos}
            disabled={isDisabled}
            className="h-11 w-11 rounded-full flex-shrink-0 relative hover:bg-muted"
            aria-label="Attach photos"
          >
            <Plus className="h-5 w-5" />
            {/* Photo count badge */}
            {photoCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[10px] flex items-center justify-center text-primary-foreground font-medium">
                {photoCount > 9 ? '9+' : photoCount}
              </span>
            )}
          </Button>
        )}

        {/* Voice Chat toggle button - shows 🎧 to enter voice chat mode */}
        {voiceChatEnabled && onVoiceModeChange && (
          <VoiceChatButton
            mode={voiceMode}
            onModeChange={onVoiceModeChange}
            disabled={isDisabled}
            title="Start Voice Chat"
          />
        )}

        {/* Text input - auto-resizing textarea for multi-line support */}
        <textarea
          ref={inputRef}
          rows={1}
          value={currentValue}
          onChange={handleTextAreaChange}
          onKeyDown={handleKeyDown}
          placeholder={
            isRecording
              ? useExternalVoice
                ? 'Recording...'
                : `Recording ${formatDuration(internalVoice.duration)}...`
              : isProcessing
                ? 'Transcribing...'
                : placeholder
          }
          disabled={isDisabled || isVoiceActive}
          className={cn(
            'flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground min-w-0 min-h-[36px] max-h-[120px] px-2 py-2 resize-none overflow-y-auto',
            isVoiceActive && 'opacity-50'
          )}
          aria-label="Message input"
        />

        {/* Voice button */}
        {enableVoice && (
          <Button
            type="button"
            variant={isRecording ? 'destructive' : 'ghost'}
            size="icon"
            onClick={handleVoiceToggle}
            disabled={disabled || isLoading || isProcessing}
            className={cn(
              'h-11 w-11 rounded-full flex-shrink-0',
              !isRecording && !isProcessing && 'hover:bg-muted',
              isRecording && 'animate-pulse',
              isProcessing && 'opacity-50'
            )}
            aria-label={
              isRecording
                ? 'Stop recording'
                : isProcessing
                  ? 'Transcribing'
                  : 'Start voice recording'
            }
          >
            {isProcessing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isRecording ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>
        )}

        {/* Send button */}
        <Button
          type="button"
          size="icon"
          onClick={handleSubmit}
          disabled={!canSend}
          className="h-11 w-11 rounded-full flex-shrink-0"
          aria-label="Send message"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ArrowUp className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Recording state indicator - below input (internal mode only) */}
      {!useExternalVoice && isRecording && (
        <p className="text-center text-sm text-primary mt-2 animate-pulse">
          Recording {formatDuration(internalVoice.duration)} /{' '}
          {formatDuration(CHAT_VOICE_CONSTRAINTS.maxDurationSeconds)}
          <span className="text-muted-foreground ml-2">Tap mic to stop</span>
        </p>
      )}

      {/* External mode recording indicator */}
      {useExternalVoice && isRecording && (
        <p className="text-center text-sm text-muted-foreground mt-2 animate-pulse">
          Recording... Tap mic to stop
        </p>
      )}

      {/* Processing indicator (internal mode only) */}
      {!useExternalVoice && isProcessing && (
        <p className="text-center text-sm text-muted-foreground mt-2">
          Transcribing your message...
        </p>
      )}
    </div>
  );
}
