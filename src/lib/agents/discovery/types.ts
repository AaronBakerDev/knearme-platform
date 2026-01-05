import type { CorrelationContext } from '@/lib/observability/agent-logger';
import type { DiscoveredBusiness } from '@/lib/tools/business-discovery';
import type { WebSearchSource } from '../web-search';

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
  isComplete: boolean;
  missingFields: string[];
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
