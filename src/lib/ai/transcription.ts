/**
 * Whisper audio transcription for contractor interviews.
 *
 * Transcribes voice recordings from the interview flow into text
 * that can be used for content generation.
 *
 * @see /docs/03-architecture/c4-container.md for AI pipeline flow
 */

import { openai, AI_MODELS, parseAIError, isAIEnabled } from './openai';

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
 * Transcribe audio using OpenAI Whisper.
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
  if (!isAIEnabled()) {
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
    // Convert Blob to File for the API
    const file = new File([audioBlob], filename, { type: audioBlob.type });

    const response = await openai.audio.transcriptions.create({
      file,
      model: AI_MODELS.transcription,
      language: 'en', // Optimize for English (masonry contractors in US)
      response_format: 'verbose_json',
      prompt: 'This is a masonry contractor describing their work. Common terms: tuckpointing, repointing, mortar, brick, chimney, flashing, weep holes, lintel.',
    });

    // Handle response format
    if (typeof response === 'string') {
      return { text: response };
    }

    return {
      text: response.text,
      language: response.language,
      duration: response.duration,
    };
  } catch (error) {
    const aiError = parseAIError(error);
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
