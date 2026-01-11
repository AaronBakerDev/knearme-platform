/**
 * Project Suggestions Tests
 *
 * Tests the extraction of project suggestions from reviews and web content.
 * These suggestions are shown in the ProfileRevealArtifact.
 *
 * @see /docs/specs/typeform-onboarding-spec.md - Phase 6: Project Suggestions
 */

import { describe, it, expect } from 'vitest';
import { extractProjectSuggestions, type ProjectSuggestionsInput } from '../project-suggestions';
import type { DiscoveryReview } from '../types';

describe('Project Suggestions', () => {
  describe('Reviews with Photos (Primary Source)', () => {
    it('extracts suggestions from reviews with photos', () => {
      const input: ProjectSuggestionsInput = {
        businessName: 'ABC Masonry',
        reviews: [
          {
            text: 'Amazing chimney rebuild! Looks brand new.',
            rating: 5,
            reviewerName: 'John D.',
            timeAgo: '2 months ago',
            hasImages: true,
            imageUrls: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
          },
        ],
      };

      const suggestions = extractProjectSuggestions(input);

      expect(suggestions.length).toBe(1);
      expect(suggestions[0]?.title).toBe('Chimney Rebuild');
      expect(suggestions[0]?.source).toBe('review');
      expect(suggestions[0]?.imageUrls).toEqual([
        'https://example.com/photo1.jpg',
        'https://example.com/photo2.jpg',
      ]);
    });

    it('limits photo review suggestions to 2', () => {
      const reviews: DiscoveryReview[] = [
        {
          text: 'Great chimney work!',
          rating: 5,
          reviewerName: 'A',
          timeAgo: null,
          hasImages: true,
          imageUrls: ['https://example.com/1.jpg'],
        },
        {
          text: 'Beautiful fireplace restoration!',
          rating: 5,
          reviewerName: 'B',
          timeAgo: null,
          hasImages: true,
          imageUrls: ['https://example.com/2.jpg'],
        },
        {
          text: 'Excellent tuckpointing!',
          rating: 5,
          reviewerName: 'C',
          timeAgo: null,
          hasImages: true,
          imageUrls: ['https://example.com/3.jpg'],
        },
      ];

      const input: ProjectSuggestionsInput = {
        businessName: 'ABC Masonry',
        reviews,
      };

      const suggestions = extractProjectSuggestions(input);

      // Should only take 2 from photos
      expect(suggestions.length).toBe(2);
      expect(suggestions.every((s) => s.source === 'review')).toBe(true);
    });

    it('excludes low-rated reviews', () => {
      const input: ProjectSuggestionsInput = {
        businessName: 'ABC Masonry',
        reviews: [
          {
            text: 'The chimney rebuild was okay but took too long.',
            rating: 2,
            reviewerName: 'Unhappy',
            timeAgo: null,
            hasImages: true,
            imageUrls: ['https://example.com/bad.jpg'],
          },
        ],
      };

      const suggestions = extractProjectSuggestions(input);

      expect(suggestions.length).toBe(0);
    });
  });

  describe('Project Description Reviews (Secondary Source)', () => {
    it('extracts from 5-star reviews mentioning project work', () => {
      const input: ProjectSuggestionsInput = {
        businessName: 'ABC Masonry',
        reviews: [
          {
            text: 'They did an incredible job on our brick repair. The whole process was smooth and professional.',
            rating: 5,
            reviewerName: 'Jane S.',
            timeAgo: '1 month ago',
            hasImages: false,
            imageUrls: null,
          },
        ],
      };

      const suggestions = extractProjectSuggestions(input);

      expect(suggestions.length).toBe(1);
      expect(suggestions[0]?.title).toBe('Brick Restoration');
      expect(suggestions[0]?.source).toBe('review');
      expect(suggestions[0]?.imageUrls).toBeUndefined();
    });

    it('uses service names to generate titles', () => {
      const input: ProjectSuggestionsInput = {
        businessName: 'ABC Services',
        services: ['roofing', 'siding', 'gutters'],
        reviews: [
          {
            text: 'Excellent siding work on our house. Very professional team.',
            rating: 5,
            reviewerName: 'Mike T.',
            timeAgo: null,
            hasImages: false,
            imageUrls: null,
          },
        ],
      };

      const suggestions = extractProjectSuggestions(input);

      expect(suggestions.length).toBe(1);
      expect(suggestions[0]?.title).toBe('Siding Project');
    });
  });

  describe('Web Portfolio Sources (Fallback)', () => {
    it('extracts suggestions from portfolio URLs', () => {
      const input: ProjectSuggestionsInput = {
        businessName: 'ABC Masonry',
        reviews: [],
        webSearchInfo: {
          sources: [
            {
              url: 'https://abcmasonry.com/portfolio',
              title: 'Our Work | ABC Masonry',
            },
            {
              url: 'https://abcmasonry.com/projects/historic-restoration',
              title: 'Historic Restoration Project',
            },
          ],
        },
      };

      const suggestions = extractProjectSuggestions(input);

      expect(suggestions.length).toBe(2);
      expect(suggestions[0]?.source).toBe('web');
      expect(suggestions[1]?.source).toBe('web');
    });

    it('cleans up portfolio titles', () => {
      const input: ProjectSuggestionsInput = {
        businessName: 'ABC Masonry',
        reviews: [],
        webSearchInfo: {
          sources: [
            {
              url: 'https://example.com/gallery',
              title: 'Project Gallery | ABC Masonry Co',
            },
          ],
        },
      };

      const suggestions = extractProjectSuggestions(input);

      expect(suggestions.length).toBe(1);
      expect(suggestions[0]?.title).toBe('Project Gallery');
    });

    it('only uses portfolio-like URLs', () => {
      const input: ProjectSuggestionsInput = {
        businessName: 'ABC Masonry',
        reviews: [],
        webSearchInfo: {
          sources: [
            {
              url: 'https://abcmasonry.com/contact',
              title: 'Contact Us',
            },
            {
              url: 'https://abcmasonry.com/about',
              title: 'About ABC Masonry',
            },
          ],
        },
      };

      const suggestions = extractProjectSuggestions(input);

      // Neither should be used - not portfolio pages
      expect(suggestions.length).toBe(0);
    });
  });

  describe('Combined Sources', () => {
    it('prioritizes photo reviews over text reviews and web', () => {
      const input: ProjectSuggestionsInput = {
        businessName: 'ABC Masonry',
        reviews: [
          {
            text: 'Great chimney rebuild with photos!',
            rating: 5,
            reviewerName: 'Photo User',
            timeAgo: null,
            hasImages: true,
            imageUrls: ['https://example.com/photo.jpg'],
          },
          {
            text: 'Excellent fireplace work!',
            rating: 5,
            reviewerName: 'Text User',
            timeAgo: null,
            hasImages: false,
            imageUrls: null,
          },
        ],
        webSearchInfo: {
          sources: [
            {
              url: 'https://example.com/portfolio',
              title: 'Our Projects',
            },
          ],
        },
      };

      const suggestions = extractProjectSuggestions(input);

      // Should have photo review first
      expect(suggestions.length).toBeGreaterThanOrEqual(1);
      expect(suggestions[0]?.source).toBe('review');
      expect(suggestions[0]?.imageUrls).toBeDefined();
    });

    it('limits total suggestions to 3', () => {
      const input: ProjectSuggestionsInput = {
        businessName: 'ABC Masonry',
        reviews: [
          {
            text: 'Photo review 1',
            rating: 5,
            reviewerName: 'A',
            timeAgo: null,
            hasImages: true,
            imageUrls: ['https://example.com/1.jpg'],
          },
          {
            text: 'Photo review 2',
            rating: 5,
            reviewerName: 'B',
            timeAgo: null,
            hasImages: true,
            imageUrls: ['https://example.com/2.jpg'],
          },
          {
            text: 'Excellent brick restoration work!',
            rating: 5,
            reviewerName: 'C',
            timeAgo: null,
            hasImages: false,
            imageUrls: null,
          },
          {
            text: 'Great tuckpointing project!',
            rating: 5,
            reviewerName: 'D',
            timeAgo: null,
            hasImages: false,
            imageUrls: null,
          },
        ],
        webSearchInfo: {
          sources: [
            { url: 'https://example.com/portfolio', title: 'Our Work' },
            { url: 'https://example.com/gallery', title: 'Gallery' },
          ],
        },
      };

      const suggestions = extractProjectSuggestions(input);

      expect(suggestions.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Empty/Minimal Input', () => {
    it('returns empty array when no reviews or web info', () => {
      const input: ProjectSuggestionsInput = {
        businessName: 'ABC Masonry',
      };

      const suggestions = extractProjectSuggestions(input);

      expect(suggestions).toEqual([]);
    });

    it('handles empty reviews array', () => {
      const input: ProjectSuggestionsInput = {
        businessName: 'ABC Masonry',
        reviews: [],
      };

      const suggestions = extractProjectSuggestions(input);

      expect(suggestions).toEqual([]);
    });

    it('handles reviews without project keywords', () => {
      const input: ProjectSuggestionsInput = {
        businessName: 'ABC Services',
        reviews: [
          {
            text: 'Very nice people. Would recommend.',
            rating: 5,
            reviewerName: 'Generic',
            timeAgo: null,
            hasImages: false,
            imageUrls: null,
          },
        ],
      };

      const suggestions = extractProjectSuggestions(input);

      // Should still not generate a suggestion for generic review
      expect(suggestions.length).toBe(0);
    });
  });
});
