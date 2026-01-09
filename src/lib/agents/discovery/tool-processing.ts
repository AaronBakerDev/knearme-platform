import type { WebSearchSource } from '../web-search';
import type { DiscoveryState } from './types';
import { createEmptyDiscoveryState } from './state';
import type {
  ConfirmBusinessResult,
  FetchReviewsResult,
  SaveProfileResult,
  SearchBusinessResult,
  WebSearchBusinessResult,
} from './tool-types';

export interface DiscoveryToolResult {
  toolName: string;
  output?: unknown;
}

export function extractWebSearchSources(toolResults?: DiscoveryToolResult[]): WebSearchSource[] {
  if (!toolResults) return [];
  for (const result of toolResults) {
    if (result.toolName !== 'webSearchBusiness') continue;
    const output = result.output as WebSearchBusinessResult | undefined;
    if (output?.sources && output.sources.length > 0) {
      return output.sources;
    }
  }
  return [];
}

export function processDiscoveryToolCalls(
  currentState: Partial<DiscoveryState>,
  toolResults?: DiscoveryToolResult[]
): DiscoveryState {
  const state: DiscoveryState = {
    ...createEmptyDiscoveryState(),
    ...currentState,
  };

  if (!toolResults || toolResults.length === 0) {
    state.searchResults = undefined;
    return state;
  }

  let hasSearchResults = false;
  // Track if saveProfile was called in this batch - suppresses search results
  let profileSaved = false;
  // Track if confirmBusiness was called - also suppresses search results
  let businessConfirmed = false;
  // Track if showProfileReveal was called
  let revealShown = false;

  for (const tr of toolResults) {
    switch (tr.toolName) {
      case 'showBusinessSearchResults':
      case 'searchBusiness': {
        const result = tr.output as SearchBusinessResult | undefined;
        if (result?.found && result.results) {
          hasSearchResults = true;
          state.searchResults = result.results.map((r) => ({
            name: r.name,
            address: r.address,
            phone: r.phone,
            website: r.website,
            rating: r.rating,
            reviewCount: r.reviewCount,
            category: r.category,
            googlePlaceId: r.googlePlaceId,
            googleCid: r.googleCid,
            coordinates: null,
          }));
        }
        break;
      }

      case 'confirmBusiness': {
        const result = tr.output as ConfirmBusinessResult | undefined;
        if (result?.confirmed && result.data) {
          businessConfirmed = true;
          if (result.data.googlePlaceId) state.googlePlaceId = result.data.googlePlaceId;
          if (result.data.googleCid) state.googleCid = result.data.googleCid;
          if (result.data.businessName) state.businessName = result.data.businessName;
          if (result.data.address) state.address = result.data.address;
          if (result.data.city) state.city = result.data.city;
          if (result.data.state) state.state = result.data.state;
          if (result.data.phone) state.phone = result.data.phone;
          if (result.data.website) state.website = result.data.website;
          if (result.data.rating != null) state.rating = result.data.rating;
          if (result.data.reviewCount != null) state.reviewCount = result.data.reviewCount;
          if (result.data.category) {
            const category = result.data.category.toLowerCase();
            if (category.includes('masonry') || category.includes('mason')) {
              state.services = ['masonry'];
            } else if (category.includes('plumb')) {
              state.services = ['plumbing'];
            } else if (category.includes('electr')) {
              state.services = ['electrical'];
            }
          }
          state.searchResults = undefined;
        }
        break;
      }

      case 'fetchReviews': {
        const result = tr.output as FetchReviewsResult | undefined;
        if (result?.success && result.reviews.length > 0) {
          state.reviews = result.reviews;
          if (result.rating != null) state.rating = result.rating;
          if (result.reviewCount != null) state.reviewCount = result.reviewCount;
        }
        break;
      }

      case 'webSearchBusiness': {
        const result = tr.output as WebSearchBusinessResult | undefined;
        if (result?.businessInfo) {
          state.webSearchInfo = {
            ...result.businessInfo,
            sources: result.sources,
          };
          // Also merge services if we have them from web search
          if (
            result.businessInfo.services &&
            result.businessInfo.services.length > 0 &&
            state.services.length === 0
          ) {
            state.services = result.businessInfo.services;
          }
          // Merge service areas
          if (
            result.businessInfo.serviceAreas &&
            result.businessInfo.serviceAreas.length > 0 &&
            state.serviceAreas.length === 0
          ) {
            state.serviceAreas = result.businessInfo.serviceAreas;
          }
        }
        break;
      }

      case 'saveProfile': {
        const result = tr.output as SaveProfileResult | undefined;
        if (result?.saved && result.profile) {
          profileSaved = true;
          if (result.profile.businessName) state.businessName = result.profile.businessName;
          if (result.profile.address) state.address = result.profile.address;
          if (result.profile.phone) state.phone = result.profile.phone;
          if (result.profile.website) state.website = result.profile.website;
          if (result.profile.city) state.city = result.profile.city;
          if (result.profile.state) state.state = result.profile.state;
          if (result.profile.description) state.description = result.profile.description;
          if (result.profile.services) state.services = result.profile.services;
          if (result.profile.serviceAreas) state.serviceAreas = result.profile.serviceAreas;
          state.isComplete = true;
        }
        break;
      }

      case 'showProfileReveal': {
        // Track that reveal was shown (artifact handles the display)
        revealShown = true;
        break;
      }
    }
  }

  // Clear search results if:
  // 1. No search was performed this batch, OR
  // 2. Business was confirmed (user already selected one), OR
  // 3. Profile was saved (suppress stale search results on completion)
  // This prevents showing "Which one is yours?" after the user already confirmed.
  if (!hasSearchResults || businessConfirmed || profileSaved) {
    state.searchResults = undefined;
  }

  // Log reveal status for debugging
  if (revealShown) {
    state.revealShown = true;
  }

  return state;
}
