/**
 * StoryExtractor Agent Tests
 *
 * Focuses on readiness rules and location parsing.
 *
 * @see /src/lib/agents/story-extractor.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  checkReadyForImages,
  extractStory,
  getMissingFields,
} from '../story-extractor';
import type { SharedProjectState } from '../types';

// Mock AI provider to force fallback extraction
vi.mock('@/lib/ai/providers', () => ({
  isGoogleAIEnabled: vi.fn(() => false),
  AI_MODELS: {
    generation: 'gemini-3-flash-preview',
    vision: 'gemini-3-flash-preview',
    chat: 'gemini-3-flash-preview',
    fallback: 'gemini-2.0-flash',
    transcription: 'whisper-1',
  },
}));

vi.mock('ai', () => ({
  generateObject: vi.fn(),
}));

vi.mock('@ai-sdk/google', () => ({
  google: vi.fn(() => ({})),
}));

describe('StoryExtractor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkReadyForImages', () => {
    it('requires city and state to be ready', () => {
      const state: Partial<SharedProjectState> = {
        projectType: 'chimney-rebuild',
        customerProblem:
          'The customer had a chimney that was leaking water into their home due to damaged flashing.',
        solutionApproach:
          'We rebuilt the entire chimney from the roofline up using reclaimed brick and lime mortar.',
        materials: ['reclaimed brick', 'lime mortar'],
      };

      expect(checkReadyForImages(state)).toBe(false);
    });

    it('returns true when all requirements are met', () => {
      const state: Partial<SharedProjectState> = {
        projectType: 'chimney-rebuild',
        customerProblem:
          'The customer had a chimney that was leaking water into their home due to damaged flashing.',
        solutionApproach:
          'We rebuilt the entire chimney from the roofline up using reclaimed brick and lime mortar.',
        materials: ['reclaimed brick', 'lime mortar'],
        city: 'Denver',
        state: 'CO',
      };

      expect(checkReadyForImages(state)).toBe(true);
    });
  });

  describe('getMissingFields', () => {
    it('includes city and state when missing', () => {
      const missing = getMissingFields({
        projectType: 'chimney-rebuild',
        customerProblem:
          'The customer had a chimney that was leaking water into their home due to damaged flashing.',
        solutionApproach:
          'We rebuilt the entire chimney from the roofline up using reclaimed brick and lime mortar.',
        materials: ['reclaimed brick', 'lime mortar'],
      });

      expect(missing).toContain('city');
      expect(missing).toContain('state');
    });
  });

  describe('extractStory fallback', () => {
    it('extracts city and state from location phrase', async () => {
      const result = await extractStory('We rebuilt a chimney in Denver, CO last week.');

      expect(result.state.city).toBe('Denver');
      expect(result.state.state).toBe('CO');
    });
  });
});
