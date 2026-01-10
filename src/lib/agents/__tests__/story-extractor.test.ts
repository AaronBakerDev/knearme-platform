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
  countWords,
  extractStory,
  getExtractionProgress,
  getMissingFields,
  normalizeProjectType,
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
    it('does not require location to be ready', () => {
      const state: Partial<SharedProjectState> = {
        projectType: 'chimney-rebuild',
        customerProblem:
          'The customer had a chimney that was leaking water into their home due to damaged flashing.',
        solutionApproach:
          'We rebuilt the entire chimney from the roofline up using reclaimed brick and lime mortar.',
        materials: ['reclaimed brick', 'lime mortar'],
      };

      expect(checkReadyForImages(state)).toBe(true);
    });

    /**
     * @deprecated checkReadyForImages now always returns true.
     * Users can upload images anytime - no gating required.
     * The model handles conversation flow naturally.
     * @see /docs/philosophy/agent-philosophy.md
     */
    it('always returns true (no gating - users can upload images anytime)', () => {
      const state: Partial<SharedProjectState> = {
        projectType: 'chimney-rebuild',
        customerProblem: 'Chimney leak.',
        solutionApproach: 'Repaired it.',
        materials: ['reclaimed brick'],
      };

      // Philosophy: Users can upload images whenever they want
      expect(checkReadyForImages(state)).toBe(true);
    });
  });

  describe('getMissingFields', () => {
    it('does not require city and state for readiness', () => {
      const missing = getMissingFields({
        projectType: 'chimney-rebuild',
        customerProblem:
          'The customer had a chimney that was leaking water into their home due to damaged flashing.',
        solutionApproach:
          'We rebuilt the entire chimney from the roofline up using reclaimed brick and lime mortar.',
        materials: ['reclaimed brick', 'lime mortar'],
      });

      expect(missing).not.toContain('city');
      expect(missing).not.toContain('state');
    });
  });

  describe('countWords', () => {
    it('counts words and ignores extra whitespace', () => {
      expect(countWords('  quick   brown  fox  ')).toBe(3);
      expect(countWords('')).toBe(0);
    });
  });

  describe('normalizeProjectType', () => {
    it('normalizes fuzzy project type phrases', () => {
      expect(normalizeProjectType('Kitchen Remodel')).toBe('remodel');
      expect(normalizeProjectType('Custom Work')).toBe('custom-work');
    });

    it('falls back to other for unknown types', () => {
      expect(normalizeProjectType('Unicorn Sculpture')).toBe('other');
    });
  });

  describe('getExtractionProgress', () => {
    it('treats location parsing as completed city/state', () => {
      const progress = getExtractionProgress({
        projectType: 'remodel',
        customerProblem: 'Old layout.',
        solutionApproach: 'Rebuilt the space.',
        materials: ['tile'],
        techniques: ['grouting'],
        duration: '3 days',
        proudOf: 'Precision work.',
        location: 'Denver, CO',
      });

      expect(progress.percentComplete).toBe(100);
      expect(progress.incomplete).not.toContain('city');
      expect(progress.incomplete).not.toContain('state');
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
