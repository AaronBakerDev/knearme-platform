/**
 * Bio Synthesis Tests
 *
 * Tests the bio generation from reviews + web content.
 * Focuses on fallback behavior since AI tests require mocking.
 *
 * @see /docs/specs/typeform-onboarding-spec.md - Phase 4: Bio Synthesis
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { synthesizeBio, type BioSynthesisInput } from '../bio-synthesis';

// Mock AI provider
vi.mock('@/lib/ai/providers', () => ({
  isGoogleAIEnabled: vi.fn(() => false),
  getChatModel: vi.fn(),
}));

describe('Bio Synthesis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Fallback Bio (AI disabled)', () => {
    it('generates fallback bio with business name and location', async () => {
      const input: BioSynthesisInput = {
        businessName: 'ABC Masonry',
        city: 'Denver',
        state: 'CO',
        services: ['masonry', 'chimney repair'],
      };

      const result = await synthesizeBio(input);

      expect(result.bio).toContain('ABC Masonry');
      expect(result.bio).toContain('Denver, CO');
      expect(result.bio).toContain('masonry');
    });

    it('includes rating and review count in fallback bio', async () => {
      const input: BioSynthesisInput = {
        businessName: 'ABC Masonry',
        city: 'Denver',
        state: 'CO',
        services: ['masonry'],
        rating: 4.8,
        reviewCount: 42,
      };

      const result = await synthesizeBio(input);

      expect(result.bio).toContain('4.8-star rating');
      expect(result.bio).toContain('42 customer reviews');
    });

    it('includes website about description in fallback bio', async () => {
      const input: BioSynthesisInput = {
        businessName: 'ABC Masonry',
        services: ['masonry'],
        webSearchInfo: {
          aboutDescription:
            'Family-owned business serving the Denver metro area for over 20 years.',
          yearsInBusiness: '20 years',
        },
      };

      const result = await synthesizeBio(input);

      expect(result.bio).toContain('Family-owned business');
      expect(result.yearsInBusiness).toBe('20 years');
    });
  });

  describe('Review Highlights Extraction', () => {
    it('extracts highlights from 5-star reviews', async () => {
      const input: BioSynthesisInput = {
        businessName: 'ABC Masonry',
        services: ['masonry'],
        reviews: [
          {
            text: 'Amazing work! The chimney looks brand new.',
            rating: 5,
            reviewerName: 'John D.',
            timeAgo: '2 months ago',
            hasImages: false,
            imageUrls: null,
          },
          {
            text: 'Very professional and on time.',
            rating: 5,
            reviewerName: 'Jane S.',
            timeAgo: '1 month ago',
            hasImages: false,
            imageUrls: null,
          },
          {
            text: 'Okay work but took longer than expected.',
            rating: 3,
            reviewerName: 'Bob T.',
            timeAgo: '3 months ago',
            hasImages: false,
            imageUrls: null,
          },
        ],
      };

      const result = await synthesizeBio(input);

      // Should have 2 highlights from 5-star reviews
      expect(result.highlights).toHaveLength(2);
      expect(result.highlights).toContain('Amazing work! The chimney looks brand new.');
      expect(result.highlights).toContain('Very professional and on time.');
      // Should NOT include the 3-star review
      expect(result.highlights).not.toContain('Okay work but took longer than expected.');
    });

    it('handles empty reviews array', async () => {
      const input: BioSynthesisInput = {
        businessName: 'ABC Masonry',
        services: ['masonry'],
        reviews: [],
      };

      const result = await synthesizeBio(input);

      expect(result.highlights).toEqual([]);
    });

    it('limits highlights to 3', async () => {
      const input: BioSynthesisInput = {
        businessName: 'ABC Masonry',
        services: ['masonry'],
        reviews: [
          { text: 'Great work!', rating: 5, reviewerName: 'A', timeAgo: null, hasImages: false, imageUrls: null },
          { text: 'Excellent service!', rating: 5, reviewerName: 'B', timeAgo: null, hasImages: false, imageUrls: null },
          { text: 'Top notch quality!', rating: 5, reviewerName: 'C', timeAgo: null, hasImages: false, imageUrls: null },
          { text: 'Highly recommend!', rating: 5, reviewerName: 'D', timeAgo: null, hasImages: false, imageUrls: null },
          { text: 'Best in town!', rating: 5, reviewerName: 'E', timeAgo: null, hasImages: false, imageUrls: null },
        ],
      };

      const result = await synthesizeBio(input);

      expect(result.highlights.length).toBeLessThanOrEqual(3);
    });

    it('prefers shorter reviews for highlights', async () => {
      // The extractHighlights function prefers shorter, punchier quotes (< 200 chars)
      const shortReview = 'Amazing work! The chimney looks brand new. Highly recommend!';
      const longReview =
        'This is a very long review that goes on and on about how amazing the work was. ' +
        'They did such a fantastic job with our chimney rebuild. The attention to detail was incredible.';

      const input: BioSynthesisInput = {
        businessName: 'ABC Masonry',
        services: ['masonry'],
        reviews: [
          {
            text: longReview,
            rating: 5,
            reviewerName: 'John',
            timeAgo: null,
            hasImages: false,
            imageUrls: null,
          },
          {
            text: shortReview,
            rating: 5,
            reviewerName: 'Jane',
            timeAgo: null,
            hasImages: false,
            imageUrls: null,
          },
        ],
      };

      const result = await synthesizeBio(input);

      // Should include both since both pass the < 200 char filter
      expect(result.highlights.length).toBe(2);
      // Short review should come first since they're sorted by length
      expect(result.highlights[0]).toBe(shortReview);
    });
  });

  describe('Minimal Input Handling', () => {
    it('generates bio with only business name', async () => {
      const input: BioSynthesisInput = {
        businessName: 'ABC Masonry',
        services: [],
      };

      const result = await synthesizeBio(input);

      expect(result.bio).toContain('ABC Masonry');
      expect(result.bio.length).toBeGreaterThan(10);
    });
  });
});
