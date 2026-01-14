import type { MutableRefObject } from 'react';
import {
  decodeBase64ToInt16,
  int16ToFloat32,
  parseSampleRate,
} from '@/lib/voice/audio-utils';

type PlaybackRefs = {
  outputContextRef: MutableRefObject<AudioContext | null>;
  nextPlaybackTimeRef: MutableRefObject<number>;
  activeSourcesRef: MutableRefObject<AudioBufferSourceNode[]>;
};

export function createPlaybackController({
  outputContextRef,
  nextPlaybackTimeRef,
  activeSourcesRef,
}: PlaybackRefs) {
  const flushPlayback = () => {
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
  };

  const enqueueAudioChunk = (base64: string, mimeType?: string) => {
    if (!base64) return;

    const sampleRate = parseSampleRate(mimeType);
    const pcm16 = decodeBase64ToInt16(base64);
    const float32 = int16ToFloat32(pcm16);

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
  };

  return { enqueueAudioChunk, flushPlayback };
}
