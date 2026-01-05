import { describe, expect, it } from 'vitest';
import { mergeTranscriptText, shouldCommitTranscript } from '../transcript-utils';

describe('mergeTranscriptText', () => {
  it('prefers the longer transcript when not final', () => {
    const result = mergeTranscriptText({
      currentText: 'We rebuilt a chimney',
      incomingText: 'We rebuilt a chimney in Denver',
      isFinal: false,
    });

    expect(result).toBe('We rebuilt a chimney in Denver');
  });

  it('appends incoming text when shorter and not contained', () => {
    const result = mergeTranscriptText({
      currentText: 'We rebuilt a chimney',
      incomingText: 'in Denver',
      isFinal: false,
    });

    expect(result).toBe('We rebuilt a chimney in Denver');
  });

  it('keeps current when incoming is contained and not final', () => {
    const result = mergeTranscriptText({
      currentText: 'We rebuilt a chimney in Denver',
      incomingText: 'chimney',
      isFinal: false,
    });

    expect(result).toBe('We rebuilt a chimney in Denver');
  });

  it('prefers incoming when final even if shorter', () => {
    const result = mergeTranscriptText({
      currentText: 'We rebuilt a chimney in Denver',
      incomingText: 'We rebuilt a chimney',
      isFinal: true,
    });

    expect(result).toBe('We rebuilt a chimney');
  });
});

describe('shouldCommitTranscript', () => {
  it('rejects empty transcripts', () => {
    expect(shouldCommitTranscript('   ', '')).toBe(false);
  });

  it('rejects duplicate transcripts', () => {
    expect(shouldCommitTranscript('Same text', 'Same text')).toBe(false);
  });

  it('accepts new transcripts', () => {
    expect(shouldCommitTranscript('New text', 'Old text')).toBe(true);
  });
});
