/**
 * Audio transcription using Google Gemini.
 *
 * Uses Vercel AI SDK with Google provider for multimodal transcription.
 * Gemini processes audio files via generateText with file parts.
 *
 * Transcribes voice recordings from the interview flow into text
 * that can be used for content generation.
 *
 * @see /docs/03-architecture/c4-container.md for AI pipeline flow
 * @see https://ai-sdk.dev/docs/ai-sdk-core/prompts#file-parts
 */

import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { isGoogleAIEnabled } from './providers';

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
  _filename: string = 'recording.webm'
): Promise<TranscriptionResult | { error: string; retryable: boolean }> {
  // Check if AI is available
  if (!isGoogleAIEnabled()) {
    return {
      error: 'AI transcription is not available',
      retryable: false,
    };
  }

  // Validate blob size (Gemini supports large files, but keep reasonable limit)
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

    // Extract base MIME type (strip codec parameters like "audio/webm;codecs=opus")
    const mimeType = (audioBlob.type.split(';')[0] || 'audio/webm') as
      | 'audio/webm'
      | 'audio/mp3'
      | 'audio/mpeg'
      | 'audio/wav'
      | 'audio/ogg';

    /**
     * Use Gemini's multimodal capabilities for transcription.
     * Gemini 2.0 Flash natively supports audio file processing.
     *
     * @see https://ai-sdk.dev/docs/ai-sdk-core/prompts#file-parts
     */
    const result = await generateText({
      model: google('gemini-2.0-flash'),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Transcribe this audio recording exactly as spoken. Return only the transcribed text, nothing else. Preserve any trade-specific or technical terms exactly as spoken.',
            },
            {
              type: 'file',
              mediaType: mimeType,
              data: audioData,
            },
          ],
        },
      ],
    });

    return {
      text: result.text.trim(),
      language: 'en', // Gemini doesn't return language detection in this mode
      duration: undefined, // Duration not available from generateText
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
  _filename: string = 'recording.webm'
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
    return transcribeAudio(blob, _filename);
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

    // Rate limiting (Gemini returns 429 for quota exceeded)
    if (message.includes('rate') || message.includes('quota') || message.includes('429') || message.includes('resource_exhausted')) {
      return {
        message: 'AI service is busy. Please try again in a moment.',
        retryable: true,
      };
    }

    // File too large
    if (message.includes('size') || message.includes('large') || message.includes('limit') || message.includes('payload')) {
      return {
        message: 'Audio file is too large. Please record a shorter response.',
        retryable: false,
      };
    }

    // Invalid audio format (Gemini returns specific MIME type errors)
    if (message.includes('format') || message.includes('mime') || message.includes('unsupported') || message.includes('invalid_argument')) {
      return {
        message: 'Audio format not supported. Please try a different recording.',
        retryable: false,
      };
    }

    // Network/timeout
    if (message.includes('timeout') || message.includes('network') || message.includes('econnrefused') || message.includes('fetch')) {
      return {
        message: 'Transcription request timed out. Please try again.',
        retryable: true,
      };
    }

    // API key issues (Gemini returns 401/403 for auth errors)
    if (message.includes('api key') || message.includes('unauthorized') || message.includes('401') || message.includes('403') || message.includes('permission')) {
      return {
        message: 'AI service configuration error. Please contact support.',
        retryable: false,
      };
    }

    // Safety filter (Gemini may block certain content)
    if (message.includes('safety') || message.includes('blocked') || message.includes('harm')) {
      return {
        message: 'Could not process this audio. Please try recording again.',
        retryable: true,
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
