import type { WebSearchSource } from '../web-search';
import { parseLocationFromAddress, type DiscoveredBusiness } from '@/lib/tools/business-discovery';
import type { DiscoveryState } from './types';
import { createEmptyDiscoveryState } from './state';
import type {
  ConfirmBusinessResult,
  FetchReviewsResult,
  ProfileRevealResult,
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
            // BRI-007: Include isClaimed and workHours from DataForSEO API
            // @see SearchBusinessResult in ./tool-types.ts
            isClaimed: r.isClaimed,
            workHours: r.workHours,
          }));

          // BRI-007: Capture isClaimed and workHours from top result to state root
          // The top result is typically the best match and its metadata is useful
          const topResult = result.results[0];
          if (topResult) {
            if (topResult.isClaimed !== undefined) {
              state.isClaimed = topResult.isClaimed;
            }
            if (topResult.workHours !== undefined) {
              state.workHours = topResult.workHours;
            }
          }
        }

        // Process parallel web enrichment data (gathered alongside DataForSEO)
        // This provides richer context like years in business, about description, etc.
        if (result?.webEnrichment) {
          const enrichment = result.webEnrichment;
          state.webSearchInfo = {
            aboutDescription: enrichment.aboutDescription,
            website: enrichment.website,
            phone: enrichment.phone,
            address: enrichment.address,
            city: enrichment.city,
            state: enrichment.state,
            yearsInBusiness: enrichment.yearsInBusiness,
            specialties: enrichment.specialties,
            serviceAreas: enrichment.serviceAreas,
            services: enrichment.services,
            sources: enrichment.sources,
            // BRI-007: Include socialProfiles and portfolioUrl from web enrichment
            // @see WebEnrichmentData in ./tool-types.ts
            socialProfiles: enrichment.socialProfiles,
            portfolioUrl: enrichment.portfolioUrl,
          };
          // Fill in missing fields from web enrichment
          if (enrichment.website && !state.website) {
            state.website = enrichment.website;
          }
          if (enrichment.phone && !state.phone) {
            state.phone = enrichment.phone;
          }
          if (enrichment.city && !state.city) {
            state.city = enrichment.city;
          }
          if (enrichment.state && !state.state) {
            state.state = enrichment.state;
          }
          if (enrichment.services && enrichment.services.length > 0 && state.services.length === 0) {
            state.services = enrichment.services;
          }
          if (enrichment.serviceAreas && enrichment.serviceAreas.length > 0 && state.serviceAreas.length === 0) {
            state.serviceAreas = enrichment.serviceAreas;
          }
        }
        break;
      }

      case 'confirmBusiness': {
        const result = tr.output as ConfirmBusinessResult | undefined;
        if (result?.confirmed && result.data) {
          businessConfirmed = true;
          const discoveredData: DiscoveredBusiness = {
            name: result.data.businessName,
            address: result.data.address ?? null,
            phone: result.data.phone ?? null,
            website: result.data.website ?? null,
            rating: result.data.rating ?? null,
            reviewCount: result.data.reviewCount ?? null,
            category: result.data.category ?? null,
            googlePlaceId: result.data.googlePlaceId ?? null,
            googleCid: result.data.googleCid ?? null,
            coordinates: null,
            // BRI-007: Include isClaimed and workHours from confirmation data
            // @see ConfirmBusinessResult in ./tool-types.ts
            isClaimed: result.data.isClaimed,
            workHours: result.data.workHours,
          };
          state.discoveredData = discoveredData;
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
          // BRI-007: Capture isClaimed and workHours to state root from confirmation
          if (result.data.isClaimed !== undefined) state.isClaimed = result.data.isClaimed;
          if (result.data.workHours !== undefined) state.workHours = result.data.workHours;
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
          if (result.businessInfo.website && !state.website) {
            state.website = result.businessInfo.website;
          }
          if (result.businessInfo.phone && !state.phone) {
            state.phone = result.businessInfo.phone;
          }
          if (result.businessInfo.address && !state.address) {
            state.address = result.businessInfo.address;
          }
          if (result.businessInfo.city && !state.city) {
            state.city = result.businessInfo.city;
          }
          if (result.businessInfo.state && !state.state) {
            state.state = result.businessInfo.state;
          }
          if (result.businessInfo.address && (!state.city || !state.state)) {
            const parsedLocation = parseLocationFromAddress(result.businessInfo.address);
            if (parsedLocation) {
              if (!state.city) state.city = parsedLocation.city;
              if (!state.state && parsedLocation.state) state.state = parsedLocation.state;
            }
          }
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
          if (typeof result.profile.hideAddress === 'boolean') {
            state.hideAddress = result.profile.hideAddress;
          }
          state.isComplete = true;
        }
        break;
      }

      case 'showProfileReveal': {
        // Track that reveal was shown (artifact handles the display)
        revealShown = true;
        const result = tr.output as ProfileRevealResult | undefined;
        if (result?.profile && typeof result.profile.hideAddress === 'boolean') {
          state.hideAddress = result.profile.hideAddress;
        }
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
