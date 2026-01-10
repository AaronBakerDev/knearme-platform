'use client';

/**
 * Voice recording component for contractor interviews.
 * Designed for ease-of-use on mobile devices at job sites.
 *
 * Features:
 * - Hold-to-record interaction (like voice messages)
 * - Visual feedback during recording
 * - Playback before submission
 * - Fallback to text input
 *
 * @see /docs/02-requirements/capabilities.md INTERVIEW capabilities
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Play, Pause, X, RefreshCw, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logging';

export interface VoiceRecorderProps {
  /** Called when recording is complete */
  onRecordingComplete: (audioBlob: Blob) => void;
  /** Called when user types a text response instead */
  onTextResponse?: (text: string) => void;
  /** Whether recording is being processed (show loading) */
  isProcessing?: boolean;
  /** Disable interaction */
  disabled?: boolean;
  /** Max recording duration in seconds */
  maxDuration?: number;
  /** Class name for styling */
  className?: string;
}

type RecordingState = 'idle' | 'recording' | 'recorded' | 'playing' | 'text-mode';

/**
 * VoiceRecorder component for capturing contractor responses.
 *
 * The primary interaction is hold-to-record, but users can switch to
 * text input if they prefer typing.
 */
export function VoiceRecorder({
  onRecordingComplete,
  onTextResponse,
  isProcessing = false,
  disabled = false,
  maxDuration = 60,
  className,
}: VoiceRecorderProps) {
  const [state, setState] = useState<RecordingState>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [textValue, setTextValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /**
   * Clean up audio URL when component unmounts or recording changes.
   */
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [audioUrl]);

  /**
   * Stop recording audio.
   */
  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === 'recording') {
      recorder.stop();

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, []);

  /**
   * Start recording audio.
   */
  const startRecording = useCallback(async () => {
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

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

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());

        setState('recorded');
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setState('recording');
      setDuration(0);

      // Start duration timer
      timerRef.current = setInterval(() => {
        setDuration((d) => {
          if (d >= maxDuration) {
            stopRecording();
            return d;
          }
          return d + 1;
        });
      }, 1000);
    } catch (err) {
      logger.error('[VoiceRecorder] Error accessing microphone', { error: err });
      setError('Could not access microphone. Please check permissions.');
      setState('text-mode'); // Fallback to text
    }
  }, [audioUrl, maxDuration, stopRecording]);

  /**
   * Play/pause recorded audio.
   */
  const togglePlayback = useCallback(() => {
    if (!audioRef.current || !audioUrl) return;

    if (state === 'playing') {
      audioRef.current.pause();
      setState('recorded');
    } else {
      audioRef.current.play();
      setState('playing');
    }
  }, [state, audioUrl]);

  /**
   * Handle audio playback end.
   */
  const handlePlaybackEnd = () => {
    setState('recorded');
  };

  /**
   * Discard recording and start over.
   */
  const discardRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setState('idle');
  };

  /**
   * Submit the recording.
   */
  const submitRecording = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob);
    }
  };

  /**
   * Submit text response.
   */
  const submitText = () => {
    if (textValue.trim() && onTextResponse) {
      onTextResponse(textValue.trim());
    }
  };

  /**
   * Format duration as MM:SS.
   */
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Text mode UI
  if (state === 'text-mode') {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Type your response:</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setState('idle')}
            disabled={disabled}
          >
            <Mic className="h-4 w-4 mr-1" />
            Use Voice
          </Button>
        </div>

        <Textarea
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          placeholder="Type your answer here..."
          rows={3}
          disabled={disabled || isProcessing}
          className="resize-none"
        />

        <Button
          type="button"
          onClick={submitText}
          disabled={!textValue.trim() || disabled || isProcessing}
          className="w-full"
        >
          {isProcessing ? 'Processing...' : 'Submit Answer'}
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Hidden audio element for playback */}
      {audioUrl && (
        <audio ref={audioRef} src={audioUrl} onEnded={handlePlaybackEnd} className="hidden" />
      )}

      {/* Error message */}
      {error && (
        <div className="text-sm text-destructive text-center p-2 bg-destructive/10 rounded">
          {error}
        </div>
      )}

      {/* Recording/Playback UI */}
      <div className="flex flex-col items-center gap-4">
        {/* Main recording button */}
        {state === 'idle' && (
          <button
            type="button"
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            disabled={disabled || isProcessing}
            className={cn(
              'w-24 h-24 rounded-full flex items-center justify-center transition-all',
              'bg-primary text-primary-foreground shadow-lg',
              'hover:bg-primary/90 active:scale-95',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              'touch-none select-none',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            aria-label="Hold to record"
          >
            <Mic className="h-8 w-8" />
          </button>
        )}

        {/* Recording state */}
        {state === 'recording' && (
          <button
            type="button"
            onMouseUp={stopRecording}
            onMouseLeave={stopRecording}
            onTouchEnd={stopRecording}
            className={cn(
              'w-24 h-24 rounded-full flex items-center justify-center',
              'bg-destructive text-white animate-pulse shadow-lg',
              'focus:outline-none touch-none select-none'
            )}
            aria-label="Recording - release to stop"
          >
            <MicOff className="h-8 w-8" />
          </button>
        )}

        {/* Recorded state - playback controls */}
        {(state === 'recorded' || state === 'playing') && (
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={togglePlayback}
              disabled={disabled}
              className="h-12 w-12 rounded-full"
            >
              {state === 'playing' ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={discardRecording}
              disabled={disabled || isProcessing}
              className="h-11 w-11"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={discardRecording}
              disabled={disabled || isProcessing}
              className="h-11 w-11 text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Duration display */}
        {(state === 'recording' || state === 'recorded' || state === 'playing') && (
          <div className="text-lg font-mono">
            {formatDuration(duration)}
            {state === 'recording' && (
              <span className="text-red-500 ml-2">/ {formatDuration(maxDuration)}</span>
            )}
          </div>
        )}

        {/* Instructions */}
        <p className={cn(
          'text-sm text-center',
          state === 'recording' ? 'text-destructive font-medium animate-pulse' : 'text-muted-foreground'
        )}>
          {state === 'idle' && 'Hold to record your answer'}
          {state === 'recording' && 'Recording... Release to stop'}
          {state === 'recorded' && 'Listen to your response or re-record'}
          {state === 'playing' && 'Playing...'}
        </p>

        {/* Submit button for recorded audio */}
        {(state === 'recorded' || state === 'playing') && (
          <Button
            type="button"
            onClick={submitRecording}
            disabled={disabled || isProcessing}
            className="w-full max-w-xs"
          >
            {isProcessing ? 'Transcribing...' : 'Submit Answer'}
          </Button>
        )}

        {/* Text mode toggle */}
        {state === 'idle' && onTextResponse && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setState('text-mode')}
            disabled={disabled}
          >
            <Keyboard className="h-4 w-4 mr-1" />
            Type instead
          </Button>
        )}
      </div>
    </div>
  );
}
