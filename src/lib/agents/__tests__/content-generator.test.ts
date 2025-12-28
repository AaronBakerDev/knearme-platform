/**
 * Content Generator Agent Tests
 *
 * Tests validation logic, constraint enforcement, and error handling.
 * AI calls are mocked to test the surrounding logic.
 *
 * @see /src/lib/agents/content-generator.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateContent, _internal } from '../content-generator';
import { createEmptyProjectState, type SharedProjectState } from '../types';

type GenerateObjectResult = Awaited<ReturnType<typeof import('ai').generateObject>>;

// Mock the AI providers module
vi.mock('@/lib/ai/providers', () => ({
  isGoogleAIEnabled: vi.fn(() => true),
  getGenerationModel: vi.fn(() => 'mocked-model'),
  OUTPUT_LIMITS: { contentGeneration: 1500 },
}));

// Mock the 'ai' module
vi.mock('ai', () => ({
  generateObject: vi.fn(),
}));

describe('ContentGenerator', () => {
  const { validateProjectData, enforceConstraints, truncateToLimit, buildContentPrompt } =
    _internal;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // Validation Tests
  // ============================================================================

  describe('validateProjectData', () => {
    it('returns error when required data is missing', () => {
      const emptyState = createEmptyProjectState();
      const error = validateProjectData(emptyState);

      expect(error).toBe(
        'Missing required data: need at least project type, problem description, or materials'
      );
    });

    it('returns error when content is insufficient', () => {
      const state: SharedProjectState = {
        ...createEmptyProjectState(),
        projectType: 'chimney-rebuild',
        customerProblem: 'Short', // Too short
      };
      const error = validateProjectData(state);

      expect(error).toBe(
        'Insufficient project details: need more information about the work performed'
      );
    });

    it('passes validation with project type and substantial content', () => {
      const state: SharedProjectState = {
        ...createEmptyProjectState(),
        projectType: 'chimney-rebuild',
        customerProblem:
          'The homeowner had a crumbling chimney that was leaking water into their attic.',
      };
      const error = validateProjectData(state);

      expect(error).toBeNull();
    });

    it('passes validation with materials and story', () => {
      const state: SharedProjectState = {
        ...createEmptyProjectState(),
        materials: ['reclaimed brick', 'Type S mortar'],
        solutionApproach:
          'We carefully matched the original brick pattern and rebuilt the chimney from the roofline up.',
      };
      const error = validateProjectData(state);

      expect(error).toBeNull();
    });
  });

  // ============================================================================
  // Constraint Enforcement Tests
  // ============================================================================

  describe('enforceConstraints', () => {
    const mockState = createEmptyProjectState();

    it('generates title under 60 characters', () => {
      const raw = {
        title:
          'This is a very long title that definitely exceeds the sixty character limit we have set',
        description: 'Test description',
        seoTitle: 'SEO Title',
        seoDescription: 'SEO Description',
        tags: ['masonry'],
      };

      const result = enforceConstraints(raw, mockState);

      expect(result.title.length).toBeLessThanOrEqual(60);
    });

    it('generates seoDescription under 160 characters', () => {
      const raw = {
        title: 'Test Title',
        description: 'Test description',
        seoTitle: 'SEO Title',
        seoDescription:
          'This is an extremely long SEO description that goes on and on and on and definitely exceeds the one hundred and sixty character limit that we have set for meta descriptions in search results.',
        tags: ['masonry'],
      };

      const result = enforceConstraints(raw, mockState);

      expect(result.seoDescription.length).toBeLessThanOrEqual(160);
    });

    it('includes location in title when available and fits', () => {
      const stateWithLocation: SharedProjectState = {
        ...createEmptyProjectState(),
        city: 'Denver',
        state: 'CO',
      };

      const raw = {
        title: 'Historic Chimney Restoration',
        description: 'Test description',
        seoTitle: 'SEO Title',
        seoDescription: 'SEO Description',
        tags: ['masonry'],
      };

      const result = enforceConstraints(raw, stateWithLocation);

      expect(result.title).toBe('Historic Chimney Restoration in Denver, CO');
    });

    it('does not add location if title would exceed 60 chars', () => {
      const stateWithLocation: SharedProjectState = {
        ...createEmptyProjectState(),
        city: 'Denver',
        state: 'CO',
      };

      const raw = {
        title: 'This Is Already A Fairly Long Title For The Project',
        description: 'Test description',
        seoTitle: 'SEO Title',
        seoDescription: 'SEO Description',
        tags: ['masonry'],
      };

      const result = enforceConstraints(raw, stateWithLocation);

      // Should not include location since it would exceed 60 chars
      expect(result.title).not.toContain('Denver');
      expect(result.title.length).toBeLessThanOrEqual(60);
    });

    it('deduplicates and lowercases tags', () => {
      const raw = {
        title: 'Test Title',
        description: 'Test description',
        seoTitle: 'SEO Title',
        seoDescription: 'SEO Description',
        tags: ['Masonry', 'masonry', 'BRICK', 'brick', 'Chimney'],
      };

      const result = enforceConstraints(raw, mockState);

      expect(result.tags).toEqual(['masonry', 'brick', 'chimney']);
    });
  });

  // ============================================================================
  // Truncation Tests
  // ============================================================================

  describe('truncateToLimit', () => {
    it('returns original string if under limit', () => {
      const result = truncateToLimit('Short string', 60);
      expect(result).toBe('Short string');
    });

    it('truncates at word boundary when possible', () => {
      // "Hello world test" has 16 chars, space at 11, which is 11/16 = 68.75% - below 70% threshold
      // So it should truncate at the exact limit
      // Use a string where the space is past 70%: "Hello world" (11 chars), with limit 14
      // Space at 5 is 5/14 = 35% - not enough
      // Try: "This is a longer test" with limit 18: space at 14, 14/18 = 77.7% > 70%
      const result = truncateToLimit('This is a longer test string here', 18);
      expect(result).toBe('This is a longer'); // Space at 16, 16/18 = 88% > 70%
      expect(result.length).toBeLessThanOrEqual(18);
    });

    it('truncates at exact limit if no good word boundary', () => {
      const result = truncateToLimit('Superlongwordwithoutanyspaces', 15);
      expect(result.length).toBeLessThanOrEqual(15);
    });
  });

  // ============================================================================
  // Prompt Building Tests
  // ============================================================================

  describe('buildContentPrompt', () => {
    it('includes all available fields in prompt', () => {
      const state: SharedProjectState = {
        ...createEmptyProjectState(),
        projectType: 'chimney-rebuild',
        city: 'Denver',
        state: 'CO',
        customerProblem: 'Chimney was crumbling',
        solutionApproach: 'Complete rebuild from roofline',
        materials: ['reclaimed brick', 'Type S mortar'],
        techniques: ['tuckpointing', 'flashing'],
        duration: '3 days',
        proudOf: 'Perfect brick matching',
      };

      const prompt = buildContentPrompt(state);

      expect(prompt).toContain('chimney-rebuild');
      expect(prompt).toContain('Denver, CO');
      expect(prompt).toContain('Chimney was crumbling');
      expect(prompt).toContain('Complete rebuild from roofline');
      expect(prompt).toContain('reclaimed brick');
      expect(prompt).toContain('tuckpointing');
      expect(prompt).toContain('3 days');
      expect(prompt).toContain('Perfect brick matching');
    });

    it('includes location instruction when location is available', () => {
      const state: SharedProjectState = {
        ...createEmptyProjectState(),
        projectType: 'tuckpointing',
        city: 'Boulder',
        state: 'CO',
        customerProblem: 'Mortar joints were deteriorating',
      };

      const prompt = buildContentPrompt(state);

      expect(prompt).toContain('Include "Boulder, CO" in the title');
    });

    it('omits location instruction when not available', () => {
      const state: SharedProjectState = {
        ...createEmptyProjectState(),
        projectType: 'tuckpointing',
        customerProblem: 'Mortar joints were deteriorating',
      };

      const prompt = buildContentPrompt(state);

      expect(prompt).not.toContain('Include "');
    });
  });

  // ============================================================================
  // generateContent Integration Tests
  // ============================================================================

  describe('generateContent', () => {
    it('throws when required data is missing', async () => {
      const emptyState = createEmptyProjectState();
      const result = await generateContent(emptyState);

      expect(result).toHaveProperty('error');
      if ('error' in result) {
        expect(result.error).toContain('Missing required data');
        expect(result.retryable).toBe(false);
      }
    });

    it('returns error when AI is disabled', async () => {
      // Re-mock with AI disabled
      const providers = await import('@/lib/ai/providers');
      vi.mocked(providers.isGoogleAIEnabled).mockReturnValue(false);

      const state: SharedProjectState = {
        ...createEmptyProjectState(),
        projectType: 'chimney-rebuild',
        customerProblem: 'The chimney was completely deteriorated and needed a full rebuild.',
      };

      const result = await generateContent(state);

      expect(result).toHaveProperty('error');
      if ('error' in result) {
        expect(result.error).toContain('not available');
        expect(result.retryable).toBe(false);
      }
    });

    it('calls generateObject with correct parameters when data is valid', async () => {
      const { generateObject } = await import('ai');
      const providers = await import('@/lib/ai/providers');

      vi.mocked(providers.isGoogleAIEnabled).mockReturnValue(true);
      const mockResult: GenerateObjectResult = {
        object: {
          title: 'Historic Chimney Rebuild',
          description: 'A comprehensive project description...',
          seoTitle: 'Chimney Rebuild Denver | Expert Masonry',
          seoDescription: 'Professional chimney rebuild in Denver by expert masons.',
          tags: ['chimney', 'masonry', 'denver'],
        },
        reasoning: undefined,
        finishReason: 'stop',
        usage: {
          inputTokens: 100,
          inputTokenDetails: {
            noCacheTokens: 100,
            cacheReadTokens: 0,
            cacheWriteTokens: 0,
          },
          outputTokens: 200,
          outputTokenDetails: {
            textTokens: 200,
            reasoningTokens: 0,
          },
          totalTokens: 300,
        },
        request: { body: null },
        response: {
          id: 'mock-response',
          timestamp: new Date(),
          modelId: 'mocked-model',
        },
        warnings: undefined,
        providerMetadata: undefined,
        toJsonResponse: () => new Response(),
      };

      vi.mocked(generateObject).mockResolvedValue(mockResult);

      const state: SharedProjectState = {
        ...createEmptyProjectState(),
        projectType: 'chimney-rebuild',
        city: 'Denver',
        state: 'CO',
        customerProblem: 'The chimney was completely deteriorated and needed a full rebuild.',
      };

      const result = await generateContent(state);

      expect(generateObject).toHaveBeenCalledOnce();
      expect(result).not.toHaveProperty('error');
      if (!('error' in result)) {
        expect(result.title).toBe('Historic Chimney Rebuild in Denver, CO');
        expect(result.tags).toEqual(['chimney', 'masonry', 'denver']);
      }
    });

    it('handles AI errors gracefully', async () => {
      const { generateObject } = await import('ai');
      const providers = await import('@/lib/ai/providers');

      vi.mocked(providers.isGoogleAIEnabled).mockReturnValue(true);
      vi.mocked(generateObject).mockRejectedValue(new Error('Rate limit exceeded (429)'));

      const state: SharedProjectState = {
        ...createEmptyProjectState(),
        projectType: 'chimney-rebuild',
        customerProblem: 'The chimney was completely deteriorated and needed a full rebuild.',
      };

      const result = await generateContent(state);

      expect(result).toHaveProperty('error');
      if ('error' in result) {
        expect(result.error).toContain('busy');
        expect(result.retryable).toBe(true);
      }
    });
  });
});
