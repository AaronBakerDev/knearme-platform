'use client';

/**
 * Live voice session hook for Voice -> Voice mode (Gemini Live API).
 *
 * Includes telemetry integration for observability:
 * - Session lifecycle tracking (start, connect, end)
 * - Transcript latency monitoring
 * - Tool execution metrics
 * - Fallback and error tracking
 *
 * @see src/lib/voice/voice-telemetry.ts - Telemetry implementation
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  FunctionCall,
  LiveConnectConfig,
  LiveServerMessage,
  Session,
} from '@google/genai';
import { GoogleGenAI } from '@google/genai';
import {
  trackSessionStart,
  trackSessionConnected,
  trackSessionEnd,
  trackUserTranscript,
  trackAssistantTranscript,
  trackToolStart,
  trackToolEnd,
  trackFallback,
  trackError,
} from '@/lib/voice/voice-telemetry';

type LiveVoiceStatus = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error';

interface LiveVoiceSessionOptions {
  enabled: boolean;
  /**
   * When true, enables continuous/hands-free mode with automatic voice activity detection.
   * Gemini will automatically detect when the user starts/stops talking.
   * When false (default), push-to-talk mode is used.
   */
  continuousMode?: boolean;
  ensureSessionReady: () => Promise<{ projectId: string; sessionId: string }>;
  onUserMessage: (text: string) => void;
  onAssistantMessage: (text: string) => void;
  onToolResult: (
    toolName: string,
    toolCallId: string,
    output?: unknown,
    error?: { message?: string }
  ) => void;
  onFallback: (reason: string) => void;
}

/**
 * Voice quota information returned from the session endpoint.
 * @see /src/lib/voice/usage-limits.ts
 */
export interface VoiceQuotaInfo {
  remainingMinutes: number;
  dailyQuotaMinutes: number | null;
  usedMinutes: number;
  planTier: 'free' | 'pro';
  lowQuotaWarning?: string;
}

interface LiveVoiceSessionState {
  status: LiveVoiceStatus;
  isConnected: boolean;
  /** True when connected in continuous/hands-free mode with automatic VAD */
  isContinuousMode: boolean;
  liveUserTranscript: string;
  liveAssistantTranscript: string;
  error: string | null;
  /** Current voice quota info (populated after successful connection) */
  quota: VoiceQuotaInfo | null;
  /** Whether the quota was exceeded (session rejected) */
  quotaExceeded: boolean;
  /** Current audio input level (0-1 normalized RMS) for VAD indicator */
  audioLevel: number;
  startTalking: () => Promise<void>;
  stopTalking: () => void;
  disconnect: () => void;
}

const OUTPUT_SAMPLE_RATE = 24000;
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_CHUNK_SIZE = 1600;
const TRANSCRIPT_THROTTLE_MS = 120;
const MAX_SESSION_DURATION_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Silence detection threshold for RMS (Root Mean Square) audio level.
 * Audio chunks with RMS below this value are considered silent and skipped
 * in push-to-talk mode to save bandwidth. Value of 0.01 corresponds to
 * approximately -40dB, which filters out background noise and silence
 * while preserving speech. Only applied in non-continuous mode since
 * continuous mode uses Gemini's built-in VAD.
 */
const SILENCE_THRESHOLD = 0.01;

/**
 * Calculate Root Mean Square (RMS) of audio samples to detect silence.
 * RMS provides a measure of the average power/volume of the audio signal.
 * @param samples - Int16Array of PCM audio samples
 * @returns RMS value between 0 and 1 (normalized)
 */
function calculateRMS(samples: Int16Array): number {
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

function decodeBase64ToInt16(base64: string): Int16Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Int16Array(bytes.buffer);
}

function encodeInt16ToBase64(int16: Int16Array): string {
  const bytes = new Uint8Array(int16.buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  return btoa(binary);
}

function downsampleTo16k(input: Float32Array, inputRate: number): Int16Array {
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

function parseSampleRate(mimeType?: string): number {
  if (!mimeType) return OUTPUT_SAMPLE_RATE;
  const match = mimeType.match(/rate=(\d+)/i);
  if (match) {
    const value = Number(match[1]);
    return Number.isFinite(value) ? value : OUTPUT_SAMPLE_RATE;
  }
  return OUTPUT_SAMPLE_RATE;
}

async function _getResponseError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return data?.error?.message ?? data?.message ?? response.statusText;
  } catch {
    return response.statusText || 'Request failed';
  }
}

export function useLiveVoiceSession({
  enabled,
  continuousMode = false,
  ensureSessionReady,
  onUserMessage,
  onAssistantMessage,
  onToolResult,
  onFallback,
}: LiveVoiceSessionOptions): LiveVoiceSessionState {
  const [status, setStatus] = useState<LiveVoiceStatus>('idle');
  const [isConnected, setIsConnected] = useState(false);
  const [liveUserTranscript, setLiveUserTranscript] = useState('');
  const [liveAssistantTranscript, setLiveAssistantTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [quota, setQuota] = useState<VoiceQuotaInfo | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const sessionRef = useRef<Session | null>(null);
  const sessionContextRef = useRef<{ projectId: string; sessionId: string } | null>(null);
  const isTalkingRef = useRef(false);
  const pcmBufferRef = useRef<number[]>([]);
  const pendingUserTranscriptRef = useRef('');
  const pendingAssistantTranscriptRef = useRef('');
  const lastUserTranscriptRef = useRef('');
  const lastAssistantTranscriptRef = useRef('');
  const inputContextRef = useRef<AudioContext | null>(null);
  const inputWorkletRef = useRef<AudioWorkletNode | null>(null);
  const inputStreamRef = useRef<MediaStream | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const nextPlaybackTimeRef = useRef(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const transcriptTimersRef = useRef<{ user?: number; assistant?: number }>({});
  const transcriptBufferRef = useRef<{ user: string; assistant: string }>({
    user: '',
    assistant: '',
  });
  const sessionDurationTimerRef = useRef<number | null>(null);
  const disconnectRef = useRef<((reason?: string) => void) | null>(null);
  const usageIdRef = useRef<string | null>(null);
  // Track whether this session was created in continuous mode
  const continuousModeRef = useRef(continuousMode);

  const flushPlayback = useCallback(() => {
    activeSourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch {
        // Ignore stop errors.
      }
    });
    activeSourcesRef.current = [];
    if (outputContextRef.current) {
      nextPlaybackTimeRef.current = outputContextRef.current.currentTime;
    }
  }, []);

  const enqueueAudioChunk = useCallback((base64: string, mimeType?: string) => {
    if (!base64) return;

    const sampleRate = parseSampleRate(mimeType);
    const pcm16 = decodeBase64ToInt16(base64);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i += 1) {
      float32[i] = (pcm16[i] ?? 0) / 0x7fff;
    }

    if (!outputContextRef.current) {
      outputContextRef.current = new AudioContext({ sampleRate });
      nextPlaybackTimeRef.current = outputContextRef.current.currentTime;
    }

    const context = outputContextRef.current;
    if (!context) return;

    const buffer = context.createBuffer(1, float32.length, sampleRate);
    buffer.copyToChannel(float32, 0);

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter((item) => item !== source);
    };

    const startAt = Math.max(context.currentTime, nextPlaybackTimeRef.current);
    source.start(startAt);
    nextPlaybackTimeRef.current = startAt + buffer.duration;
    activeSourcesRef.current.push(source);
  }, []);

  const commitUserTranscript = useCallback(() => {
    const text = pendingUserTranscriptRef.current.trim();
    if (!text || text === lastUserTranscriptRef.current) {
      return;
    }
    lastUserTranscriptRef.current = text;
    pendingUserTranscriptRef.current = '';
    transcriptBufferRef.current.user = '';
    if (transcriptTimersRef.current.user) {
      window.clearTimeout(transcriptTimersRef.current.user);
      transcriptTimersRef.current.user = undefined;
    }
    setLiveUserTranscript('');

    // Telemetry: Track user transcript completion
    trackUserTranscript(text.length);

    onUserMessage(text);
  }, [onUserMessage]);

  const commitAssistantTranscript = useCallback(() => {
    const text = pendingAssistantTranscriptRef.current.trim();
    if (!text || text === lastAssistantTranscriptRef.current) {
      return;
    }
    lastAssistantTranscriptRef.current = text;
    pendingAssistantTranscriptRef.current = '';
    transcriptBufferRef.current.assistant = '';
    if (transcriptTimersRef.current.assistant) {
      window.clearTimeout(transcriptTimersRef.current.assistant);
      transcriptTimersRef.current.assistant = undefined;
    }
    setLiveAssistantTranscript('');

    // Telemetry: Track assistant transcript completion
    trackAssistantTranscript(text.length);

    onAssistantMessage(text);
  }, [onAssistantMessage]);

  const scheduleTranscriptUpdate = useCallback(
    (role: 'user' | 'assistant', text: string, immediate = false) => {
      transcriptBufferRef.current[role] = text;

      if (immediate) {
        if (transcriptTimersRef.current[role]) {
          window.clearTimeout(transcriptTimersRef.current[role]);
          transcriptTimersRef.current[role] = undefined;
        }
        if (role === 'user') {
          setLiveUserTranscript(text);
        } else {
          setLiveAssistantTranscript(text);
        }
        return;
      }

      if (transcriptTimersRef.current[role]) return;
      transcriptTimersRef.current[role] = window.setTimeout(() => {
        transcriptTimersRef.current[role] = undefined;
        const latest = transcriptBufferRef.current[role];
        if (role === 'user') {
          setLiveUserTranscript(latest);
        } else {
          setLiveAssistantTranscript(latest);
        }
      }, TRANSCRIPT_THROTTLE_MS);
    },
    []
  );

  /**
   * Persist tool result to chat_messages for context continuity.
   * This ensures tool call results are saved even after the voice session ends.
   * Fires asynchronously and does not block voice flow on failure.
   *
   * @see /src/app/api/chat/sessions/[id]/messages/route.ts - Messages API endpoint
   */
  const persistToolResult = useCallback(
    async (
      sessionId: string,
      toolName: string,
      output?: unknown,
      error?: { message?: string }
    ) => {
      try {
        const response = await fetch(`/api/chat/sessions/${sessionId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: 'assistant',
            content: `[Tool: ${toolName}]`,
            metadata: {
              parts: [
                {
                  type: 'tool-result',
                  toolName,
                  output: error ? { error: error.message ?? 'Tool execution failed' } : output,
                },
              ],
            },
          }),
        });

        if (!response.ok) {
          console.warn(
            `[LiveVoice] Failed to persist tool result for ${toolName}: ${response.status}`
          );
        }
      } catch (err) {
        // Log but don't block voice flow - persistence is best-effort
        console.warn('[LiveVoice] Error persisting tool result:', err);
      }
    },
    []
  );

  const handleToolCalls = useCallback(async (calls: FunctionCall[]) => {
    const session = sessionRef.current;
    const context = sessionContextRef.current;
    if (!session || !context || calls.length === 0) return;

    const latestUserMessage =
      pendingUserTranscriptRef.current || lastUserTranscriptRef.current;

    const toolCallsPayload = calls.map((call, index) => ({
      id: call.id ?? `${call.name ?? 'tool'}-${index}`,
      name: call.name ?? 'unknown',
      args: call.args ?? {},
    }));

    // Telemetry: Track tool execution starts
    toolCallsPayload.forEach((tool) => {
      trackToolStart(tool.name, tool.id);
    });

    try {
      const response = await fetch('/api/chat/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolCalls: toolCallsPayload,
          projectId: context.projectId,
          sessionId: context.sessionId,
          latestUserMessage,
        }),
      });

      if (!response.ok) {
        // Telemetry: Track tool execution failures
        toolCallsPayload.forEach((tool) => {
          trackToolEnd(tool.name, tool.id, false, `HTTP ${response.status}`);
        });
        throw new Error(`Tool execution failed (${response.status})`);
      }

      const data = await response.json();
      const results = Array.isArray(data.results) ? data.results : [];

      session.sendToolResponse({
        functionResponses: results.map((result: { id?: string; name?: string; output?: unknown; error?: unknown }) => ({
          id: result.id,
          name: result.name,
          response: result.error ? { error: result.error } : { output: result.output },
        })),
      });

      results.forEach((result: { id?: string; name?: string; output?: unknown; error?: { message?: string } }) => {
        if (!result.name) return;

        // Telemetry: Track tool execution completion
        const toolId = result.id ?? result.name;
        trackToolEnd(
          result.name,
          toolId,
          !result.error,
          result.error?.message
        );

        // Persist tool result to chat_messages (async, non-blocking)
        // Only persist if we have a valid sessionId
        if (context.sessionId) {
          void persistToolResult(context.sessionId, result.name, result.output, result.error);
        }

        if (result.error) {
          onToolResult(result.name, toolId, undefined, result.error);
          return;
        }
        if (typeof result.output !== 'undefined') {
          onToolResult(result.name, toolId, result.output);
        }
      });
    } catch (err) {
      console.error('[LiveVoice] Tool execution error:', err);

      // Telemetry: Track tool error
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      trackError('tool-execution', errorMessage, true);

      setError('Tool execution failed. I can keep listening and respond in text.');
    }
  }, [onToolResult, persistToolResult]);

  const handleMessage = useCallback((message: LiveServerMessage) => {
    const serverContent = message.serverContent;

    if (serverContent?.interrupted) {
      flushPlayback();
    }

    if (serverContent?.inputTranscription?.text) {
      const newText = serverContent.inputTranscription.text;
      const currentText = pendingUserTranscriptRef.current;
      // Gemini sends full accumulated transcripts, but use the longer one
      // as a safeguard against any partial/incremental messages
      if (newText.length >= currentText.length || serverContent.inputTranscription.finished) {
        pendingUserTranscriptRef.current = newText;
        scheduleTranscriptUpdate(
          'user',
          newText,
          Boolean(serverContent.inputTranscription.finished)
        );
      } else if (!currentText.includes(newText)) {
        // New text is shorter but not contained - might be incremental, accumulate it
        pendingUserTranscriptRef.current = `${currentText} ${newText}`.trim();
        scheduleTranscriptUpdate(
          'user',
          pendingUserTranscriptRef.current,
          Boolean(serverContent.inputTranscription.finished)
        );
      }
      if (serverContent.inputTranscription.finished) {
        commitUserTranscript();
      }
    }

    if (serverContent?.outputTranscription?.text && !isTalkingRef.current) {
      const newText = serverContent.outputTranscription.text;
      const currentText = pendingAssistantTranscriptRef.current;
      // Gemini sends full accumulated transcripts, but use the longer one
      // as a safeguard against any partial/incremental messages
      if (newText.length >= currentText.length || serverContent.outputTranscription.finished) {
        pendingAssistantTranscriptRef.current = newText;
        scheduleTranscriptUpdate(
          'assistant',
          newText,
          Boolean(serverContent.outputTranscription.finished)
        );
      } else if (!currentText.includes(newText)) {
        // New text is shorter but not contained - might be incremental, accumulate it
        pendingAssistantTranscriptRef.current = `${currentText} ${newText}`.trim();
        scheduleTranscriptUpdate(
          'assistant',
          pendingAssistantTranscriptRef.current,
          Boolean(serverContent.outputTranscription.finished)
        );
      }
      if (serverContent.outputTranscription.finished) {
        commitAssistantTranscript();
      }
    }

    // Handle model turn parts - these contain audio chunks and possibly text
    // Note: For audio responses, prefer outputTranscription for the transcript
    // modelTurn.parts text is only used as fallback when no outputTranscription is received
    const parts = serverContent?.modelTurn?.parts ?? [];
    for (const part of parts) {
      if (part.text && !isTalkingRef.current) {
        // Only use modelTurn text if we don't have outputTranscription
        // outputTranscription provides the full accumulated transcript for audio
        if (!serverContent?.outputTranscription?.text) {
          // Accumulate text from model parts (these may arrive incrementally)
          const currentText = pendingAssistantTranscriptRef.current;
          // Check if this text is already contained to avoid duplicates
          if (!currentText.includes(part.text)) {
            pendingAssistantTranscriptRef.current = currentText
              ? `${currentText} ${part.text}`.trim()
              : part.text;
            scheduleTranscriptUpdate('assistant', pendingAssistantTranscriptRef.current);
          }
        }
      }
      if (part.inlineData?.data && part.inlineData.mimeType?.startsWith('audio/')) {
        // In push-to-talk mode, skip audio while user is talking
        // In continuous mode, Gemini's VAD handles this - we rely on serverContent.interrupted for barge-in
        if (!continuousModeRef.current && isTalkingRef.current) {
          continue;
        }
        enqueueAudioChunk(part.inlineData.data, part.inlineData.mimeType);
        setStatus('speaking');
      }
    }

    if (serverContent?.turnComplete) {
      commitAssistantTranscript();
      if (!isTalkingRef.current) {
        setStatus('idle');
      }
    }

    if (message.toolCall?.functionCalls?.length) {
      void handleToolCalls(message.toolCall.functionCalls);
    }
  }, [
    commitAssistantTranscript,
    commitUserTranscript,
    enqueueAudioChunk,
    flushPlayback,
    handleToolCalls,
    scheduleTranscriptUpdate,
  ]);

  const connectSession = useCallback(async () => {
    if (sessionRef.current) return sessionRef.current;

    setStatus('connecting');
    setError(null);

    const { projectId, sessionId } = await ensureSessionReady();
    sessionContextRef.current = { projectId, sessionId };

    // Store the continuous mode setting for this session
    continuousModeRef.current = continuousMode;

    // Telemetry: Track session start
    trackSessionStart({
      sessionId,
      projectId,
      continuousMode,
    });

    const response = await fetch('/api/ai/live-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, sessionId, continuousMode }),
    });

    if (!response.ok) {
      // Check for quota exceeded error specifically
      const data = await response.json().catch(() => null);
      const errorCode = data?.error?.code;
      const errorMessage = data?.error?.message ?? 'Failed to initialize live session.';

      if (errorCode === 'QUOTA_EXCEEDED') {
        // Handle quota exceeded - set state and don't retry
        setQuotaExceeded(true);
        setQuota({
          remainingMinutes: data.error.details?.remainingMinutes ?? 0,
          dailyQuotaMinutes: data.error.details?.dailyQuotaMinutes ?? null,
          usedMinutes: data.error.details?.usedMinutes ?? 0,
          planTier: data.error.details?.planTier ?? 'free',
        });
        // Telemetry: Track quota exceeded
        trackError('quota-exceeded', errorMessage, false);
        throw new Error(errorMessage);
      }

      // Telemetry: Track connection error
      trackError('connection', errorMessage, false);
      throw new Error(errorMessage);
    }

    const payload = await response.json() as {
      token: string;
      model: string;
      config: LiveConnectConfig;
      usageId?: string;
      quota?: VoiceQuotaInfo;
    };

    // Store quota info from successful response
    if (payload.quota) {
      setQuota(payload.quota);
      setQuotaExceeded(false);
    }

    // Store usage tracking ID for session end reporting
    usageIdRef.current = payload.usageId ?? null;

    const ai = new GoogleGenAI({
      apiKey: payload.token,
      httpOptions: { apiVersion: 'v1alpha' },
    });

    const session = await ai.live.connect({
      model: payload.model,
      config: payload.config,
      callbacks: {
        onopen: () => {
          setIsConnected(true);
          setStatus('idle');
          // Telemetry: Track session connected
          trackSessionConnected();
        },
        onmessage: (message) => {
          handleMessage(message);
        },
        onerror: (err) => {
          console.error('[LiveVoice] Session error:', err);
          // Telemetry: Track session error
          const errorMsg = err instanceof Error ? err.message : 'Session error';
          trackError('session', errorMsg, false);
          setError('Live voice session error. Switching to text responses.');
          setStatus('error');
          // Telemetry: Track fallback due to error
          trackFallback('live-error');
          onFallback('live-error');
        },
        onclose: () => {
          setIsConnected(false);
          setStatus('idle');
        },
      },
    });

    sessionRef.current = session;

    // Start session duration timer to prevent runaway costs
    sessionDurationTimerRef.current = window.setTimeout(() => {
      console.warn('[LiveVoice] Session duration limit reached (10 minutes)');
      // Telemetry: Track fallback due to timeout
      trackFallback('session-timeout');
      disconnectRef.current?.('session-timeout');
      onFallback('session-timeout');
    }, MAX_SESSION_DURATION_MS);

    return session;
  }, [ensureSessionReady, handleMessage, onFallback, continuousMode]);

  const initAudioInput = useCallback(async () => {
    if (inputContextRef.current) return;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        channelCount: 1,
      },
    });
    inputStreamRef.current = stream;

    const context = new AudioContext();
    inputContextRef.current = context;

    const source = context.createMediaStreamSource(stream);
    const workletCode = `
      class CaptureProcessor extends AudioWorkletProcessor {
        process(inputs) {
          const input = inputs[0];
          if (input && input[0]) {
            const channel = input[0];
            const copy = new Float32Array(channel.length);
            copy.set(channel);
            this.port.postMessage(copy);
          }
          return true;
        }
      }
      registerProcessor('capture-processor', CaptureProcessor);
    `;

    const blob = new Blob([workletCode], { type: 'application/javascript' });
    const moduleUrl = URL.createObjectURL(blob);
    await context.audioWorklet.addModule(moduleUrl);
    URL.revokeObjectURL(moduleUrl);

    const worklet = new AudioWorkletNode(context, 'capture-processor');
    inputWorkletRef.current = worklet;

    worklet.port.onmessage = (event) => {
      // In continuous mode, always stream audio (Gemini's VAD handles activity detection).
      // In push-to-talk mode, only stream when user is actively talking.
      if (!continuousModeRef.current && !isTalkingRef.current) return;
      const audioChunk = event.data as Float32Array;
      const int16 = downsampleTo16k(audioChunk, context.sampleRate);
      for (let i = 0; i < int16.length; i += 1) {
        pcmBufferRef.current.push(int16[i] ?? 0);
      }

      while (pcmBufferRef.current.length >= OUTPUT_CHUNK_SIZE) {
        const chunk = pcmBufferRef.current.splice(0, OUTPUT_CHUNK_SIZE);
        const chunkArray = new Int16Array(chunk);

        // Always calculate RMS for the voice activity indicator
        const rms = calculateRMS(chunkArray);
        setAudioLevel(rms);

        // In push-to-talk mode, skip silent frames to save bandwidth.
        // In continuous mode, Gemini's VAD handles silence detection, so send all frames.
        if (!continuousModeRef.current && rms < SILENCE_THRESHOLD) {
          // Silent frame - skip sending to save bandwidth
          continue;
        }

        const base64 = encodeInt16ToBase64(chunkArray);
        sessionRef.current?.sendRealtimeInput({
          audio: {
            data: base64,
            mimeType: `audio/pcm;rate=${INPUT_SAMPLE_RATE}`,
          },
        });
      }
    };

    const muteGain = context.createGain();
    muteGain.gain.value = 0;
    source.connect(worklet).connect(muteGain).connect(context.destination);
  }, []);

  const startTalking = useCallback(async () => {
    try {
      const session = await connectSession();
      await initAudioInput();
      flushPlayback();
      // In push-to-talk mode, track talking state for audio skip logic and send activityStart
      // In continuous mode, Gemini's VAD handles activity detection automatically
      if (!continuousModeRef.current) {
        isTalkingRef.current = true;
        session.sendRealtimeInput({ activityStart: {} });
      }
      pcmBufferRef.current = [];
      setStatus('listening');
    } catch (err) {
      console.error('[LiveVoice] Start error:', err);
      const message = err instanceof Error ? err.message : 'Unable to start live voice.';

      // Telemetry: Track start error and fallback
      trackError('start', message, false);
      trackFallback('start-failed');

      setError(`${message} Switching to text responses.`);
      setStatus('error');
      onFallback('start-failed');
    }
  }, [connectSession, flushPlayback, initAudioInput, onFallback]);

  const stopTalking = useCallback(() => {
    if (!sessionRef.current) return;
    if (!isTalkingRef.current) return;

    isTalkingRef.current = false;
    // In push-to-talk mode, send activityEnd signal.
    // In continuous mode, Gemini's automatic VAD handles activity detection.
    if (!continuousModeRef.current) {
      sessionRef.current.sendRealtimeInput({ activityEnd: {} });
    }
    setTimeout(() => {
      commitUserTranscript();
    }, 250);
  }, [commitUserTranscript]);

  const disconnect = useCallback((reason: string = 'user-disconnect') => {
    // Telemetry: Track session end with metrics summary
    trackSessionEnd(reason);

    // Clear session duration timer
    if (sessionDurationTimerRef.current) {
      clearTimeout(sessionDurationTimerRef.current);
      sessionDurationTimerRef.current = null;
    }

    // Report session end for usage tracking (fire and forget)
    if (usageIdRef.current) {
      fetch('/api/ai/end-voice-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usageId: usageIdRef.current }),
      }).catch((err) => {
        console.warn('[LiveVoice] Failed to report session end:', err);
      });
      usageIdRef.current = null;
    }

    isTalkingRef.current = false;
    pcmBufferRef.current = [];
    sessionRef.current?.close();
    sessionRef.current = null;
    setIsConnected(false);

    if (inputWorkletRef.current) {
      inputWorkletRef.current.disconnect();
      inputWorkletRef.current = null;
    }

    if (inputContextRef.current) {
      inputContextRef.current.close();
      inputContextRef.current = null;
    }

    if (inputStreamRef.current) {
      inputStreamRef.current.getTracks().forEach((track) => track.stop());
      inputStreamRef.current = null;
    }

    flushPlayback();

    if (outputContextRef.current) {
      outputContextRef.current.close();
      outputContextRef.current = null;
    }

    if (transcriptTimersRef.current.user) {
      window.clearTimeout(transcriptTimersRef.current.user);
      transcriptTimersRef.current.user = undefined;
    }
    if (transcriptTimersRef.current.assistant) {
      window.clearTimeout(transcriptTimersRef.current.assistant);
      transcriptTimersRef.current.assistant = undefined;
    }
    transcriptBufferRef.current.user = '';
    transcriptBufferRef.current.assistant = '';
    setStatus('idle');
    setLiveUserTranscript('');
    setLiveAssistantTranscript('');
  }, [flushPlayback]);

  // Keep disconnectRef in sync with disconnect for use in timer callbacks
  disconnectRef.current = disconnect;

  useEffect(() => {
    if (!enabled) {
      disconnect('disabled');
    }
  }, [enabled, disconnect]);

  useEffect(() => {
    if (!enabled) return;
    const handleVisibility = () => {
      if (document.hidden) {
        stopTalking();
        // Telemetry: Track fallback due to visibility change
        trackFallback('visibility');
        disconnect('visibility');
        onFallback('visibility');
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [enabled, stopTalking, disconnect, onFallback]);

  // Wrap disconnect to hide the reason parameter from external callers
  const publicDisconnect = useCallback(() => {
    disconnect('user-disconnect');
  }, [disconnect]);

  return {
    status,
    isConnected,
    isContinuousMode: continuousMode,
    liveUserTranscript,
    liveAssistantTranscript,
    error,
    quota,
    quotaExceeded,
    audioLevel, // 0-1 normalized audio level for VAD indicator
    startTalking,
    stopTalking,
    disconnect: publicDisconnect,
  };
}
