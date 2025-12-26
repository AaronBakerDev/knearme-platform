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
 * - Text input (single line, not textarea)
 * - Mic button for voice input (transcribed to text)
 * - Send button (or Enter key)
 * - Mobile-optimized with 44px touch targets
 */

import { useState, useRef, useCallback, useEffect, type KeyboardEvent } from 'react';
import { Mic, MicOff, Send, Loader2, Plus, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  /** Called when user sends a message */
  onSend: (text: string) => void;
  /** Called when user records voice (optional, for transcription) */
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
}

/**
 * Floating pill chat input component.
 */
export function ChatInput({
  onSend,
  onVoiceRecording,
  onAttachPhotos,
  photoCount = 0,
  disabled = false,
  isLoading = false,
  placeholder = 'Type or tap mic to record...',
  className,
}: ChatInputProps) {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Clean up MediaRecorder on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  /**
   * Handle form submission.
   */
  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (trimmed && !disabled && !isLoading) {
      onSend(trimmed);
      setText('');
    }
  }, [text, disabled, isLoading, onSend]);

  /**
   * Handle Enter key to send.
   */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  /**
   * Start voice recording.
   */
  const startRecording = useCallback(async () => {
    if (!onVoiceRecording) return;
    setRecordingError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4',
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());

        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: mediaRecorder.mimeType,
          });
          onVoiceRecording(audioBlob);
        }
        setIsRecording(false);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('[ChatInput] Recording error:', err);
      setRecordingError('Could not access microphone');
      setIsRecording(false);
    }
  }, [onVoiceRecording]);

  /**
   * Stop voice recording.
   */
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  /**
   * Toggle recording on/off.
   */
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const isDisabled = disabled || isLoading;
  const canSend = text.trim().length > 0 && !isDisabled;

  return (
    <div className={cn('relative', className)}>
      {/* Recording error - floating above input */}
      {recordingError && (
        <p className="absolute -top-8 left-0 right-0 text-center text-sm text-destructive">
          {recordingError}
        </p>
      )}

      {/* Floating pill input container */}
      <div className="flex items-center gap-1.5 bg-muted/60 backdrop-blur-sm border border-border/40 rounded-full px-2 py-1.5 shadow-chat-input">
        {/* Attachment button - opens photo sheet */}
        {onAttachPhotos && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onAttachPhotos}
            disabled={isDisabled}
            className="h-9 w-9 rounded-full flex-shrink-0 relative hover:bg-muted"
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

        {/* Text input - native input for single line */}
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isRecording ? 'Recording...' : placeholder}
          disabled={isDisabled || isRecording}
          className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground min-w-0 h-9 px-2"
          aria-label="Message input"
        />

        {/* Voice button */}
        {onVoiceRecording && (
          <Button
            type="button"
            variant={isRecording ? 'destructive' : 'ghost'}
            size="icon"
            onClick={toggleRecording}
            disabled={isDisabled}
            className={cn(
              'h-9 w-9 rounded-full flex-shrink-0 hover:bg-muted',
              isRecording && 'animate-pulse'
            )}
            aria-label={isRecording ? 'Stop recording' : 'Start voice recording'}
          >
            {isRecording ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>
        )}

        {/* Send button - teal when active */}
        <Button
          type="button"
          size="icon"
          onClick={handleSubmit}
          disabled={!canSend}
          className="h-9 w-9 rounded-full flex-shrink-0"
          aria-label="Send message"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ArrowUp className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Recording indicator - below input */}
      {isRecording && (
        <p className="text-center text-sm text-muted-foreground mt-2 animate-pulse">
          Recording... Tap mic to stop
        </p>
      )}
    </div>
  );
}
