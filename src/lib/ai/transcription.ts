/**
 * OpenAI Whisper audio transcription for contractor interviews.
 *
 * Uses Vercel AI SDK with OpenAI provider for transcription.
 * Note: Gemini doesn't have a transcription API via AI SDK yet,
 * so we keep using OpenAI Whisper for audio-to-text.
 *
 * Transcribes voice recordings from the interview flow into text
 * that can be used for content generation.
 *
 * @see /docs/03-architecture/c4-container.md for AI pipeline flow
 * @see https://ai-sdk.dev/docs/ai-sdk-core/transcription
 */

import { experimental_transcribe as transcribe } from 'ai';
import { getTranscriptionModel, isOpenAIEnabled } from './providers';

/**
 * Result of transcribing audio.
 */
export interface TranscriptionResult {
  /** Transcribed text */
  text: string;
  /** Detected language */
  language?: string;
  /** Duration in seconds */
  duration?: number;
}

/**
 * Transcribe audio using OpenAI Whisper via AI SDK.
 *
 * @param audioBlob - Audio file as Blob (webm, mp4, wav, etc.)
 * @param filename - Original filename for format detection
 * @returns Transcribed text or error
 *
 * @example
 * const blob = new Blob([audioBuffer], { type: 'audio/webm' });
 * const result = await transcribeAudio(blob, 'recording.webm');
 *
 * if ('error' in result) {
 *   console.error(result.error);
 * } else {
 *   console.log(result.text); // "We repaired the chimney..."
 * }
 */
export async function transcribeAudio(
  audioBlob: Blob,
  filename: string = 'recording.webm'
): Promise<TranscriptionResult | { error: string; retryable: boolean }> {
  // Check if AI is available
  if (!isOpenAIEnabled()) {
    return {
      error: 'AI transcription is not available',
      retryable: false,
    };
  }

  // Validate blob size (Whisper has a 25MB limit)
  const maxSize = 25 * 1024 * 1024;
  if (audioBlob.size > maxSize) {
    return {
      error: 'Audio file is too large. Please record a shorter response.',
      retryable: false,
    };
  }

  // Minimum size check (avoid empty recordings)
  if (audioBlob.size < 1000) {
    return {
      error: 'Recording is too short. Please try again.',
      retryable: false,
    };
  }

  try {
    // Convert Blob to ArrayBuffer for the AI SDK
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioData = new Uint8Array(arrayBuffer);

    /**
     * Use AI SDK experimental_transcribe for Whisper.
     * This provides a unified interface for transcription
     * that can be swapped to other providers if needed.
     *
     * @see https://ai-sdk.dev/docs/ai-sdk-core/transcription
     */
    const result = await transcribe({
      model: getTranscriptionModel(),
      audio: audioData,
      // Masonry-specific context to improve accuracy
      providerOptions: {
        openai: {
          language: 'en',
          prompt: 'This is a masonry contractor describing their work. Common terms: tuckpointing, repointing, mortar, brick, chimney, flashing, weep holes, lintel.',
        },
      },
    });

    return {
      text: result.text,
      language: result.language,
      duration: result.durationInSeconds,
    };
  } catch (error) {
    const aiError = parseTranscriptionError(error);
    console.error('[transcribeAudio] Error:', aiError);
    return { error: aiError.message, retryable: aiError.retryable };
  }
}

/**
 * Transcribe audio from a URL (e.g., Supabase Storage).
 * Fetches the file and transcribes it.
 *
 * @param audioUrl - URL of the audio file
 * @param filename - Filename for format detection
 */
export async function transcribeAudioFromUrl(
  audioUrl: string,
  filename: string = 'recording.webm'
): Promise<TranscriptionResult | { error: string; retryable: boolean }> {
  try {
    // Fetch the audio file
    const response = await fetch(audioUrl);

    if (!response.ok) {
      return {
        error: 'Could not fetch audio file',
        retryable: true,
      };
    }

    const blob = await response.blob();
    return transcribeAudio(blob, filename);
  } catch (error) {
    console.error('[transcribeAudioFromUrl] Fetch error:', error);
    return {
      error: 'Failed to download audio for transcription',
      retryable: true,
    };
  }
}

/**
 * Parse errors from transcription into user-friendly messages.
 */
function parseTranscriptionError(error: unknown): { message: string; retryable: boolean } {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Rate limiting
    if (message.includes('rate') || message.includes('quota') || message.includes('429')) {
      return {
        message: 'AI service is busy. Please try again in a moment.',
        retryable: true,
      };
    }

    // File too large
    if (message.includes('size') || message.includes('large') || message.includes('limit')) {
      return {
        message: 'Audio file is too large. Please record a shorter response.',
        retryable: false,
      };
    }

    // Invalid audio format
    if (message.includes('format') || message.includes('audio') || message.includes('codec')) {
      return {
        message: 'Audio format not supported. Please try a different recording.',
        retryable: false,
      };
    }

    // Network/timeout
    if (message.includes('timeout') || message.includes('network')) {
      return {
        message: 'Transcription request timed out. Please try again.',
        retryable: true,
      };
    }

    // API key issues
    if (message.includes('api key') || message.includes('unauthorized') || message.includes('401')) {
      return {
        message: 'AI service configuration error. Please contact support.',
        retryable: false,
      };
    }

    return {
      message: error.message,
      retryable: true,
    };
  }

  return {
    message: 'An unexpected error occurred with transcription.',
    retryable: true,
  };
}

/**
 * Clean up transcribed text for use in content generation.
 * Removes filler words and normalizes punctuation.
 *
 * @param text - Raw transcription
 * @returns Cleaned text
 */
export function cleanTranscription(text: string): string {
  return (
    text
      // Remove common filler words/phrases
      .replace(/\b(um|uh|er|ah|like|you know|basically|actually|so yeah|I mean)\b/gi, '')
      // Normalize multiple spaces
      .replace(/\s+/g, ' ')
      // Fix punctuation spacing
      .replace(/\s+([.,!?])/g, '$1')
      // Capitalize first letter of sentences
      .replace(/(^|[.!?]\s+)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase())
      // Trim whitespace
      .trim()
  );
}
