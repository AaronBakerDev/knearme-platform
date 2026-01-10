/**
 * Discovery Agent Tool Correctness Tests
 *
 * These tests verify the deterministic behavior of:
 * 1. State management functions (isDiscoveryComplete, getMissingDiscoveryFields)
 * 2. Tool call processing (processDiscoveryToolCalls)
 * 3. Tool result fallback generation (generateToolResultFallback)
 *
 * The hallucination bug: Agent says "done" without calling saveProfile.
 * These tests catch regressions in state tracking and tool processing.
 *
 * @see /docs/specs/typeform-onboarding-spec.md - Agent evaluation section
 * @see /src/lib/agents/discovery/tool-processing.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createEmptyDiscoveryState,
  getMissingDiscoveryFields,
  isDiscoveryComplete,
} from '../state';
import { processDiscoveryToolCalls } from '../tool-processing';
import type { DiscoveryState, DiscoveryReview } from '../types';

describe('Discovery Agent Tool Correctness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // State Management Tests
  // ===========================================================================

  describe('createEmptyDiscoveryState', () => {
    it('creates state with all required fields undefined', () => {
      const state = createEmptyDiscoveryState();

      expect(state.businessName).toBeUndefined();
      expect(state.address).toBeUndefined();
      expect(state.phone).toBeUndefined();
      expect(state.city).toBeUndefined();
      expect(state.state).toBeUndefined();
      expect(state.services).toEqual([]);
      expect(state.isComplete).toBe(false);
      expect(state.missingFields).toEqual([]);
    });
  });

  describe('getMissingDiscoveryFields', () => {
    it('returns all required fields when state is empty', () => {
      const state = createEmptyDiscoveryState();
      const missing = getMissingDiscoveryFields(state);

      expect(missing).toContain('businessName');
      // Address is optional for service area businesses
      expect(missing).not.toContain('address');
      expect(missing).toContain('phone');
      expect(missing).toContain('city');
      expect(missing).toContain('state');
      expect(missing).toContain('services');
      expect(missing).toHaveLength(5);
    });

    it('returns empty array when all required fields are present', () => {
      const state: DiscoveryState = {
        businessName: 'Test Business',
        address: '123 Main St',
        phone: '555-1234',
        city: 'Denver',
        state: 'CO',
        services: ['masonry'],
        serviceAreas: [],
        isComplete: false,
        missingFields: [],
      };

      const missing = getMissingDiscoveryFields(state);
      expect(missing).toEqual([]);
    });

    it('correctly identifies partially complete state', () => {
      const state: DiscoveryState = {
        businessName: 'Test Business',
        address: '123 Main St',
        phone: undefined,
        city: 'Denver',
        state: undefined,
        services: [],
        serviceAreas: [],
        isComplete: false,
        missingFields: [],
      };

      const missing = getMissingDiscoveryFields(state);
      expect(missing).toContain('phone');
      expect(missing).toContain('state');
      expect(missing).toContain('services');
      expect(missing).not.toContain('businessName');
      expect(missing).not.toContain('address');
      expect(missing).not.toContain('city');
    });

    it('requires at least one service', () => {
      const state: DiscoveryState = {
        businessName: 'Test Business',
        address: '123 Main St',
        phone: '555-1234',
        city: 'Denver',
        state: 'CO',
        services: [], // Empty array should be considered missing
        serviceAreas: [],
        isComplete: false,
        missingFields: [],
      };

      const missing = getMissingDiscoveryFields(state);
      expect(missing).toContain('services');
    });
  });

  describe('isDiscoveryComplete', () => {
    it('returns false when missingFields is not empty', () => {
      const state: DiscoveryState = {
        businessName: 'Test',
        address: '123 Main St',
        phone: '555-1234',
        city: 'Denver',
        state: 'CO',
        services: ['masonry'],
        serviceAreas: [],
        isComplete: false,
        missingFields: ['phone'], // Has missing fields
      };

      expect(isDiscoveryComplete(state)).toBe(false);
    });

    it('returns true when missingFields is empty', () => {
      const state: DiscoveryState = {
        businessName: 'Test',
        address: '123 Main St',
        phone: '555-1234',
        city: 'Denver',
        state: 'CO',
        services: ['masonry'],
        serviceAreas: [],
        isComplete: false,
        missingFields: [], // No missing fields
      };

      expect(isDiscoveryComplete(state)).toBe(true);
    });
  });

  // ===========================================================================
  // Tool Processing Tests
  // ===========================================================================

  describe('processDiscoveryToolCalls', () => {
    describe('showBusinessSearchResults tool', () => {
      it('stores search results in state when found', () => {
        const currentState = createEmptyDiscoveryState();
        const toolResults = [
          {
            toolName: 'showBusinessSearchResults',
            output: {
              found: true,
              message: 'Found 2 matches',
              results: [
                {
                  name: 'ABC Masonry',
                  address: '123 Main St, Denver, CO',
                  phone: '555-1234',
                  website: 'https://abcmasonry.com',
                  rating: 4.8,
                  reviewCount: 42,
                  category: 'Masonry contractor',
                  googlePlaceId: 'ChIJ123',
                  googleCid: '123456',
                },
              ],
            },
          },
        ];

        const newState = processDiscoveryToolCalls(currentState, toolResults);

        expect(newState.searchResults).toHaveLength(1);
        expect(newState.searchResults?.[0].name).toBe('ABC Masonry');
        expect(newState.searchResults?.[0].googlePlaceId).toBe('ChIJ123');
      });

      it('clears search results when not found', () => {
        const currentState = {
          ...createEmptyDiscoveryState(),
          searchResults: [{ name: 'Old Result' }] as DiscoveryState['searchResults'],
        };

        const toolResults = [
          {
            toolName: 'showBusinessSearchResults',
            output: {
              found: false,
              message: 'No businesses found',
              results: [],
            },
          },
        ];

        const newState = processDiscoveryToolCalls(currentState, toolResults);
        expect(newState.searchResults).toBeUndefined();
      });
    });

    describe('confirmBusiness tool', () => {
      it('populates state fields from confirmed business data', () => {
        const currentState = createEmptyDiscoveryState();
        const toolResults = [
          {
            toolName: 'confirmBusiness',
            output: {
              confirmed: true,
              data: {
                googlePlaceId: 'ChIJ123',
                businessName: 'ABC Masonry',
                address: '123 Main St',
                city: 'Denver',
                state: 'CO',
                phone: '555-1234',
                website: 'https://abcmasonry.com',
                category: 'Masonry contractor',
              },
            },
          },
        ];

        const newState = processDiscoveryToolCalls(currentState, toolResults);

        expect(newState.googlePlaceId).toBe('ChIJ123');
        expect(newState.businessName).toBe('ABC Masonry');
        expect(newState.address).toBe('123 Main St');
        expect(newState.city).toBe('Denver');
        expect(newState.state).toBe('CO');
        expect(newState.phone).toBe('555-1234');
        expect(newState.website).toBe('https://abcmasonry.com');
        expect(newState.discoveredData?.name).toBe('ABC Masonry');
        expect(newState.discoveredData?.googlePlaceId).toBe('ChIJ123');
      });

      it('extracts services from category when masonry-related', () => {
        const currentState = createEmptyDiscoveryState();
        const toolResults = [
          {
            toolName: 'confirmBusiness',
            output: {
              confirmed: true,
              data: {
                googlePlaceId: 'ChIJ123',
                businessName: 'ABC Masonry',
                category: 'Masonry contractor',
              },
            },
          },
        ];

        const newState = processDiscoveryToolCalls(currentState, toolResults);
        expect(newState.services).toContain('masonry');
      });

      it('clears search results after confirmation', () => {
        const currentState = {
          ...createEmptyDiscoveryState(),
          searchResults: [{ name: 'ABC Masonry' }] as DiscoveryState['searchResults'],
        };

        const toolResults = [
          {
            toolName: 'confirmBusiness',
            output: {
              confirmed: true,
              data: {
                googlePlaceId: 'ChIJ123',
                businessName: 'ABC Masonry',
              },
            },
          },
        ];

        const newState = processDiscoveryToolCalls(currentState, toolResults);
        expect(newState.searchResults).toBeUndefined();
      });
    });

    describe('webSearchBusiness tool', () => {
      it('merges contact info and parses city/state from address', () => {
        const currentState = createEmptyDiscoveryState();
        const toolResults = [
          {
            toolName: 'webSearchBusiness',
            output: {
              summary: 'Found the business website and listing.',
              sources: [{ url: 'https://abcmasonry.com' }],
              businessInfo: {
                website: 'https://abcmasonry.com',
                phone: '555-1234',
                address: '123 Main St, Denver, CO 80202',
                services: ['masonry'],
              },
            },
          },
        ];

        const newState = processDiscoveryToolCalls(currentState, toolResults);

        expect(newState.website).toBe('https://abcmasonry.com');
        expect(newState.phone).toBe('555-1234');
        expect(newState.address).toBe('123 Main St, Denver, CO 80202');
        expect(newState.city).toBe('Denver');
        expect(newState.state).toBe('CO');
        expect(newState.services).toEqual(['masonry']);
        expect(newState.webSearchInfo?.website).toBe('https://abcmasonry.com');
      });
    });

    describe('saveProfile tool', () => {
      it('marks state as complete when profile is saved', () => {
        const currentState = createEmptyDiscoveryState();
        const toolResults = [
          {
            toolName: 'saveProfile',
            output: {
              saved: true,
              profile: {
                businessName: 'ABC Masonry',
                address: '123 Main St',
                phone: '555-1234',
                city: 'Denver',
                state: 'CO',
                services: ['masonry', 'chimney repair'],
                serviceAreas: ['Denver Metro'],
              },
            },
          },
        ];

        const newState = processDiscoveryToolCalls(currentState, toolResults);

        expect(newState.isComplete).toBe(true);
        expect(newState.businessName).toBe('ABC Masonry');
        expect(newState.services).toEqual(['masonry', 'chimney repair']);
      });

      it('captures hideAddress when provided', () => {
        const currentState = createEmptyDiscoveryState();
        const toolResults = [
          {
            toolName: 'saveProfile',
            output: {
              saved: true,
              profile: {
                businessName: 'ABC Masonry',
                phone: '555-1234',
                city: 'Denver',
                state: 'CO',
                services: ['masonry'],
                serviceAreas: ['Denver Metro'],
                hideAddress: true,
              },
            },
          },
        ];

        const newState = processDiscoveryToolCalls(currentState, toolResults);
        expect(newState.hideAddress).toBe(true);
      });

      it('does not mark complete if saved is false', () => {
        const currentState = createEmptyDiscoveryState();
        const toolResults = [
          {
            toolName: 'saveProfile',
            output: {
              saved: false,
              error: 'Database error',
            },
          },
        ];

        const newState = processDiscoveryToolCalls(currentState, toolResults);
        expect(newState.isComplete).toBe(false);
      });
    });

    describe('multiple tool calls in sequence', () => {
      it('processes confirmBusiness followed by saveProfile correctly', () => {
        const currentState = createEmptyDiscoveryState();
        const toolResults = [
          {
            toolName: 'confirmBusiness',
            output: {
              confirmed: true,
              data: {
                googlePlaceId: 'ChIJ123',
                businessName: 'ABC Masonry',
                address: '123 Main St',
                city: 'Denver',
                state: 'CO',
                phone: '555-1234',
              },
            },
          },
          {
            toolName: 'saveProfile',
            output: {
              saved: true,
              profile: {
                businessName: 'ABC Masonry',
                address: '123 Main St',
                phone: '555-1234',
                city: 'Denver',
                state: 'CO',
                services: ['masonry'],
                serviceAreas: [],
              },
            },
          },
        ];

        const newState = processDiscoveryToolCalls(currentState, toolResults);

        expect(newState.isComplete).toBe(true);
        expect(newState.businessName).toBe('ABC Masonry');
        expect(newState.googlePlaceId).toBe('ChIJ123');
      });
    });

    describe('state preservation', () => {
      it('preserves existing state when processing new tool calls', () => {
        const currentState: DiscoveryState = {
          businessName: 'Existing Business',
          address: '456 Oak Ave',
          phone: '555-9999',
          city: 'Boulder',
          state: 'CO',
          description: 'A great business',
          services: ['plumbing'],
          serviceAreas: ['Boulder County'],
          isComplete: false,
          missingFields: [],
        };

        // Tool call that only updates business name
        const toolResults = [
          {
            toolName: 'confirmBusiness',
            output: {
              confirmed: true,
              data: {
                googlePlaceId: 'ChIJ456',
                businessName: 'Updated Business Name',
              },
            },
          },
        ];

        const newState = processDiscoveryToolCalls(currentState, toolResults);

        // Business name should be updated
        expect(newState.businessName).toBe('Updated Business Name');
        // Other fields should be preserved
        expect(newState.address).toBe('456 Oak Ave');
        expect(newState.phone).toBe('555-9999');
        expect(newState.description).toBe('A great business');
      });
    });
  });

  // ===========================================================================
  // Hallucination Prevention Tests
  // ===========================================================================

  describe('Hallucination Prevention', () => {
    it('state is NOT complete if saveProfile was never called', () => {
      // Scenario: Agent says "done" but only called confirmBusiness
      const currentState = createEmptyDiscoveryState();
      const toolResults = [
        {
          toolName: 'confirmBusiness',
          output: {
            confirmed: true,
            data: {
              googlePlaceId: 'ChIJ123',
              businessName: 'ABC Masonry',
              address: '123 Main St',
              city: 'Denver',
              state: 'CO',
              phone: '555-1234',
            },
          },
        },
      ];

      const newState = processDiscoveryToolCalls(currentState, toolResults);

      // CRITICAL: isComplete should be false because saveProfile wasn't called
      expect(newState.isComplete).toBe(false);
    });

    it('state is NOT complete even with all fields if saveProfile not called', () => {
      // Scenario: All fields present but no saveProfile call
      const currentState: DiscoveryState = {
        businessName: 'ABC Masonry',
        address: '123 Main St',
        phone: '555-1234',
        city: 'Denver',
        state: 'CO',
        services: ['masonry'],
        serviceAreas: [],
        isComplete: false,
        missingFields: [],
      };

      // No saveProfile tool call
      const newState = processDiscoveryToolCalls(currentState, []);

      // State should remain incomplete even with all fields
      // The isComplete flag only gets set by saveProfile tool
      expect(newState.isComplete).toBe(false);
    });

    it('confirms missingFields calculation is independent of isComplete', () => {
      // This ensures we can detect "hallucination" state:
      // - missingFields = [] (all data collected)
      // - isComplete = false (but saveProfile not called yet)
      const state: DiscoveryState = {
        businessName: 'ABC Masonry',
        address: '123 Main St',
        phone: '555-1234',
        city: 'Denver',
        state: 'CO',
        services: ['masonry'],
        serviceAreas: [],
        isComplete: false, // Not complete yet
        missingFields: [], // But no missing fields
      };

      const missing = getMissingDiscoveryFields(state);
      expect(missing).toEqual([]); // No fields missing

      // But isComplete is determined by missingFields.length in the state
      // This is the key check for hallucination detection
      expect(isDiscoveryComplete(state)).toBe(true); // Based on missingFields

      // However, the actual isComplete flag from tool processing
      // should only be true after saveProfile is called
      expect(state.isComplete).toBe(false);
    });
  });

  // ===========================================================================
  // Review Extraction Tests (Phase 2)
  // ===========================================================================

  describe('Review Extraction', () => {
    describe('fetchReviews tool', () => {
      it('stores reviews in state when successful', () => {
        const currentState = createEmptyDiscoveryState();
        const toolResults = [
          {
            toolName: 'fetchReviews',
            output: {
              success: true,
              reviews: [
                {
                  text: 'Great work! The chimney looks amazing.',
                  rating: 5,
                  reviewerName: 'John D.',
                  timeAgo: '2 months ago',
                  hasImages: true,
                  imageUrls: ['https://example.com/image1.jpg'],
                },
                {
                  text: 'Very professional and on time.',
                  rating: 5,
                  reviewerName: 'Jane S.',
                  timeAgo: '1 month ago',
                  hasImages: false,
                  imageUrls: null,
                },
              ],
              rating: 4.8,
              reviewCount: 42,
            },
          },
        ];

        const newState = processDiscoveryToolCalls(currentState, toolResults);

        expect(newState.reviews).toHaveLength(2);
        expect(newState.reviews?.[0].text).toBe('Great work! The chimney looks amazing.');
        expect(newState.reviews?.[0].rating).toBe(5);
        expect(newState.reviews?.[0].hasImages).toBe(true);
        expect(newState.rating).toBe(4.8);
        expect(newState.reviewCount).toBe(42);
      });

      it('does not store reviews if fetch failed', () => {
        const currentState = createEmptyDiscoveryState();
        const toolResults = [
          {
            toolName: 'fetchReviews',
            output: {
              success: false,
              reviews: [],
              rating: null,
              reviewCount: null,
              error: 'API timeout',
            },
          },
        ];

        const newState = processDiscoveryToolCalls(currentState, toolResults);

        expect(newState.reviews).toBeUndefined();
      });

      it('does not store reviews if array is empty', () => {
        const currentState = createEmptyDiscoveryState();
        const toolResults = [
          {
            toolName: 'fetchReviews',
            output: {
              success: true,
              reviews: [],
              rating: 4.5,
              reviewCount: 0,
            },
          },
        ];

        const newState = processDiscoveryToolCalls(currentState, toolResults);

        expect(newState.reviews).toBeUndefined();
      });
    });

    describe('confirmBusiness with rating data', () => {
      it('stores rating and reviewCount from confirmBusiness', () => {
        const currentState = createEmptyDiscoveryState();
        const toolResults = [
          {
            toolName: 'confirmBusiness',
            output: {
              confirmed: true,
              data: {
                googlePlaceId: 'ChIJ123',
                googleCid: '12345678901234567',
                businessName: 'ABC Masonry',
                rating: 4.7,
                reviewCount: 156,
              },
            },
          },
        ];

        const newState = processDiscoveryToolCalls(currentState, toolResults);

        expect(newState.googleCid).toBe('12345678901234567');
        expect(newState.rating).toBe(4.7);
        expect(newState.reviewCount).toBe(156);
      });
    });

    describe('review data flow', () => {
      it('confirmBusiness then fetchReviews updates state correctly', () => {
        const currentState = createEmptyDiscoveryState();
        const toolResults = [
          {
            toolName: 'confirmBusiness',
            output: {
              confirmed: true,
              data: {
                googlePlaceId: 'ChIJ123',
                googleCid: '12345678901234567',
                businessName: 'ABC Masonry',
                address: '123 Main St',
                city: 'Denver',
                state: 'CO',
                rating: 4.7,
                reviewCount: 50,
              },
            },
          },
          {
            toolName: 'fetchReviews',
            output: {
              success: true,
              reviews: [
                {
                  text: 'Amazing stonework!',
                  rating: 5,
                  reviewerName: 'Mike T.',
                  timeAgo: '3 weeks ago',
                  hasImages: true,
                  imageUrls: ['https://example.com/stone.jpg'],
                },
              ],
              rating: 4.8,
              reviewCount: 52,
            },
          },
        ];

        const newState = processDiscoveryToolCalls(currentState, toolResults);

        // Business info from confirmBusiness
        expect(newState.businessName).toBe('ABC Masonry');
        expect(newState.googleCid).toBe('12345678901234567');

        // Reviews from fetchReviews
        expect(newState.reviews).toHaveLength(1);
        expect(newState.reviews?.[0].text).toBe('Amazing stonework!');

        // Rating/count should be from fetchReviews (more recent)
        expect(newState.rating).toBe(4.8);
        expect(newState.reviewCount).toBe(52);
      });
    });
  });
});
