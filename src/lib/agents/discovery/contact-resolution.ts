import { parseLocationFromAddress } from '@/lib/tools/business-discovery';
import type { DiscoveryState } from './types';

export interface ResolvedOnboardingContact {
  address: string | null;
  phone: string | null;
  website: string | null;
  city: string | null;
  state: string | null;
  hideAddress: boolean;
}

function pickFirstValue(...values: Array<string | null | undefined>): string | undefined {
  const found = values.find((value): value is string => typeof value === 'string' && value.trim().length > 0);
  return found;
}

export function resolveOnboardingContact(state: DiscoveryState): ResolvedOnboardingContact {
  const hideAddress = Boolean(state.hideAddress);
  const rawAddress = pickFirstValue(
    state.address,
    state.webSearchInfo?.address,
    state.discoveredData?.address
  );
  const address = hideAddress ? null : rawAddress ?? null;
  const phone = pickFirstValue(
    state.phone,
    state.webSearchInfo?.phone,
    state.discoveredData?.phone
  ) ?? null;
  const website = pickFirstValue(
    state.website,
    state.webSearchInfo?.website,
    state.discoveredData?.website
  ) ?? null;

  let city = pickFirstValue(state.city, state.webSearchInfo?.city) ?? null;
  let region = pickFirstValue(state.state, state.webSearchInfo?.state) ?? null;

  if (rawAddress && (!city || !region)) {
    const parsed = parseLocationFromAddress(rawAddress);
    if (parsed) {
      if (!city) city = parsed.city;
      if (!region && parsed.state) region = parsed.state;
    }
  }

  return {
    address,
    phone,
    website,
    city,
    state: region,
    hideAddress,
  };
}
