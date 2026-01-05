import type { DiscoveryState } from './types';

export function createEmptyDiscoveryState(): DiscoveryState {
  return {
    businessName: undefined,
    address: undefined,
    phone: undefined,
    website: undefined,
    city: undefined,
    state: undefined,
    description: undefined,
    services: [],
    serviceAreas: [],
    googlePlaceId: undefined,
    googleCid: undefined,
    discoveredData: undefined,
    searchResults: undefined,
    isComplete: false,
    missingFields: [],
  };
}

export function isDiscoveryComplete(state: DiscoveryState): boolean {
  return state.missingFields.length === 0;
}

export function getMissingDiscoveryFields(state: DiscoveryState): string[] {
  const missing: string[] = [];

  if (!state.businessName) missing.push('businessName');
  if (!state.address) missing.push('address');
  if (!state.phone) missing.push('phone');
  if (!state.city) missing.push('city');
  if (!state.state) missing.push('state');
  if (!state.services || state.services.length === 0) missing.push('services');

  return missing;
}
