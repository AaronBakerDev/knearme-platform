import type { CorrelationContext } from '@/lib/observability/agent-logger';
import type { DiscoveredBusiness, GoogleReview } from '@/lib/tools/business-discovery';
import type { WebSearchSource } from '../web-search';

/**
 * Review data stored during discovery for bio synthesis and reveal artifact
 * @see /docs/specs/typeform-onboarding-spec.md - Review Mining section
 */
export interface DiscoveryReview {
  text: string;
  rating: number;
  reviewerName: string | null;
  timeAgo: string | null;
  hasImages: boolean;
  imageUrls: string[] | null;
}

export interface DiscoveryState {
  businessName?: string;
  address?: string;
  phone?: string;
  website?: string;
  city?: string;
  state?: string;
  description?: string;
  services: string[];
  serviceAreas: string[];
  googlePlaceId?: string;
  googleCid?: string;
  discoveredData?: DiscoveredBusiness;
  searchResults?: DiscoveredBusiness[];
  /** Reviews extracted from Google for bio synthesis and reveal artifact */
  reviews?: DiscoveryReview[];
  /** Overall rating from Google (1-5) */
  rating?: number;
  /** Total review count from Google */
  reviewCount?: number;
  /** Web search results for bio synthesis */
  webSearchInfo?: {
    aboutDescription?: string;
    address?: string;
    phone?: string;
    website?: string;
    city?: string;
    state?: string;
    services?: string[];
    yearsInBusiness?: string;
    specialties?: string[];
    serviceAreas?: string[];
    sources?: Array<{ url: string; title?: string }>;
  };
  isComplete: boolean;
  missingFields: string[];
  /** Whether showProfileReveal was called (for completion tracking) */
  revealShown?: boolean;
  /** Service area business - don't display address publicly (stored for internal records only) */
  hideAddress?: boolean;
}

export interface DiscoveryResult {
  message: string;
  state: DiscoveryState;
  showSearchResults?: boolean;
  sources?: WebSearchSource[];
  isComplete?: boolean;
}

export interface DiscoveryContext {
  businessId: string;
  correlation?: CorrelationContext;
  currentState?: Partial<DiscoveryState>;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}
