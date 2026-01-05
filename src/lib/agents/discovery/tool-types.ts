import type { WebSearchAgentResult } from '../web-search';

export interface SearchBusinessResult {
  found: boolean;
  message: string;
  results: Array<{
    name: string;
    address: string | null;
    phone: string | null;
    website: string | null;
    rating: number | null;
    reviewCount: number | null;
    category: string | null;
    googlePlaceId: string | null;
    googleCid: string | null;
    coordinates: { lat: number; lng: number } | null;
  }>;
  error?: boolean;
}

export interface ConfirmBusinessResult {
  confirmed: boolean;
  data: {
    googlePlaceId: string;
    businessName: string;
    address?: string;
    city?: string;
    state?: string;
    phone?: string;
    website?: string;
    category?: string;
  };
}

export interface SaveProfileResult {
  saved: boolean;
  profile: {
    businessName: string;
    address: string;
    phone: string;
    website?: string;
    city: string;
    state: string;
    description?: string;
    services: string[];
    serviceAreas: string[];
  };
}

export interface ProfileRevealResult {
  revealed: boolean;
  profile: {
    businessName: string;
    address: string;
    city: string;
    state: string;
    phone?: string;
    website?: string;
    services: string[];
    rating?: number;
    reviewCount?: number;
    celebrationMessage: string;
  };
}

export type WebSearchBusinessResult = WebSearchAgentResult;
