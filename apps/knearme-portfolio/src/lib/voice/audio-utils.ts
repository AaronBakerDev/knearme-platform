/**
 * Audio processing utilities for voice sessions.
 *
 * Pure functions for audio encoding, decoding, and analysis.
 * Used by useLiveVoiceSession.ts for Gemini Live API integration.
 *
 * @see useLiveVoiceSession.ts - Primary consumer
 * @see https://ai.google.dev/api/multimodal-live - Gemini Live API docs
 */

// ============================================================================
// Audio Constants
// ============================================================================

/**
 * Output sample rate expected by Gemini for playback (24kHz).
 * Gemini Live API returns audio at this rate.
 */
export const OUTPUT_SAMPLE_RATE = 24000;

/**
 * Input sample rate required by Gemini for audio input (16kHz).
 * All captured audio must be downsampled to this rate before sending.
 */
export const INPUT_SAMPLE_RATE = 16000;

/**
 * Number of PCM samples per chunk sent to Gemini.
 * At 16kHz, 1600 samples = 100ms of audio.
 */
export const OUTPUT_CHUNK_SIZE = 1600;

/**
 * Silence detection threshold for RMS (Root Mean Square) audio level.
 * Audio chunks with RMS below this value are considered silent and skipped
 * in push-to-talk mode to save bandwidth. Value of 0.01 corresponds to
 * approximately -40dB, which filters out background noise and silence
 * while preserving speech. Only applied in non-continuous mode since
 * continuous mode uses Gemini's built-in VAD.
 */
export const SILENCE_THRESHOLD = 0.01;

// ============================================================================
// Audio Analysis
// ============================================================================

/**
 * Calculate Root Mean Square (RMS) of audio samples to detect silence.
 * RMS provides a measure of the average power/volume of the audio signal.
 *
 * @param samples - Int16Array of PCM audio samples
 * @returns RMS value between 0 and 1 (normalized)
 *
 * @example
 * ```typescript
 * const rms = calculateRMS(audioSamples);
 * if (rms < SILENCE_THRESHOLD) {
 *   // Skip silent frame
 * }
 * ```
 */
export function calculateRMS(samples: Int16Array): number {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    // Normalize Int16 sample to -1.0 to 1.0 range
    // TypeScript noUncheckedIndexedAccess requires explicit check
    const sample = samples[i] ?? 0;
    const normalized = sample / 0x7fff;
    sum += normalized * normalized;
  }
  return Math.sqrt(sum / samples.length);
}

// ============================================================================
// Audio Encoding/Decoding
// ============================================================================

/**
 * Decode Base64-encoded PCM audio to Int16Array.
 * Used to process audio chunks received from Gemini Live API.
 *
 * @param base64 - Base64-encoded PCM audio data
 * @returns Int16Array of PCM samples
 *
 * @example
 * ```typescript
 * const pcm = decodeBase64ToInt16(geminiAudioChunk);
 * // Convert to Float32 for Web Audio API playback
 * ```
 */
export function decodeBase64ToInt16(base64: string): Int16Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Int16Array(bytes.buffer);
}

/**
 * Encode Int16 PCM audio to Base64 string.
 * Used to send audio chunks to Gemini Live API.
 *
 * @param int16 - Int16Array of PCM samples
 * @returns Base64-encoded string
 *
 * @example
 * ```typescript
 * const base64 = encodeInt16ToBase64(downsampled);
 * session.sendRealtimeInput({ audio: { data: base64, ... } });
 * ```
 */
export function encodeInt16ToBase64(int16: Int16Array): string {
  const bytes = new Uint8Array(int16.buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  return btoa(binary);
}

// ============================================================================
// Sample Rate Conversion
// ============================================================================

/**
 * Downsample Float32 audio to 16kHz Int16 PCM.
 * Gemini Live API requires 16kHz input audio.
 *
 * Uses linear averaging for downsampling to avoid aliasing artifacts.
 *
 * @param input - Float32Array of audio samples (range -1.0 to 1.0)
 * @param inputRate - Sample rate of input audio (e.g., 44100, 48000)
 * @returns Int16Array at 16kHz sample rate
 *
 * @example
 * ```typescript
 * // In AudioWorklet message handler
 * const int16 = downsampleTo16k(audioChunk, audioContext.sampleRate);
 * ```
 */
export function downsampleTo16k(input: Float32Array, inputRate: number): Int16Array {
  if (inputRate === INPUT_SAMPLE_RATE) {
    const result = new Int16Array(input.length);
    for (let i = 0; i < input.length; i += 1) {
      const clamped = Math.max(-1, Math.min(1, input[i] ?? 0));
      result[i] = clamped * 0x7fff;
    }
    return result;
  }

  const ratio = inputRate / INPUT_SAMPLE_RATE;
  const outputLength = Math.round(input.length / ratio);
  const result = new Int16Array(outputLength);
  let offsetResult = 0;
  let offsetBuffer = 0;

  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < input.length; i += 1) {
      accum += input[i] ?? 0;
      count += 1;
    }
    const averaged = count > 0 ? accum / count : 0;
    const clamped = Math.max(-1, Math.min(1, averaged));
    result[offsetResult] = clamped * 0x7fff;
    offsetResult += 1;
    offsetBuffer = nextOffsetBuffer;
  }

  return result;
}

/**
 * Parse sample rate from MIME type string.
 * Gemini audio chunks include rate in MIME type (e.g., "audio/pcm;rate=24000").
 *
 * @param mimeType - MIME type string, possibly with rate parameter
 * @returns Parsed sample rate, defaults to OUTPUT_SAMPLE_RATE (24000)
 *
 * @example
 * ```typescript
 * const rate = parseSampleRate("audio/pcm;rate=24000"); // 24000
 * const rate = parseSampleRate("audio/pcm"); // 24000 (default)
 * ```
 */
export function parseSampleRate(mimeType?: string): number {
  if (!mimeType) return OUTPUT_SAMPLE_RATE;
  const match = mimeType.match(/rate=(\d+)/i);
  if (match) {
    const value = Number(match[1]);
    return Number.isFinite(value) ? value : OUTPUT_SAMPLE_RATE;
  }
  return OUTPUT_SAMPLE_RATE;
}

// ============================================================================
// Audio Format Conversion
// ============================================================================

/**
 * Convert Int16 PCM to Float32 for Web Audio API playback.
 * Web Audio API expects Float32 samples in -1.0 to 1.0 range.
 *
 * @param int16 - Int16Array of PCM samples
 * @returns Float32Array normalized to -1.0 to 1.0
 *
 * @example
 * ```typescript
 * const float32 = int16ToFloat32(pcmData);
 * audioBuffer.copyToChannel(float32, 0);
 * ```
 */
export function int16ToFloat32(int16: Int16Array): Float32Array<ArrayBuffer> {
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i += 1) {
    float32[i] = (int16[i] ?? 0) / 0x7fff;
  }
  return float32;
}
