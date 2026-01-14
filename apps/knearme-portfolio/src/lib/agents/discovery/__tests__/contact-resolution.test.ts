import { describe, it, expect } from 'vitest';
import { createEmptyDiscoveryState } from '../state';
import { resolveOnboardingContact } from '../contact-resolution';

describe('resolveOnboardingContact', () => {
  it('respects hideAddress while keeping other contact fields', () => {
    const state = createEmptyDiscoveryState();
    state.address = '123 Main St';
    state.phone = '555-1234';
    state.city = 'Denver';
    state.state = 'CO';
    state.hideAddress = true;

    const resolved = resolveOnboardingContact(state);

    expect(resolved.hideAddress).toBe(true);
    expect(resolved.address).toBeNull();
    expect(resolved.phone).toBe('555-1234');
    expect(resolved.city).toBe('Denver');
    expect(resolved.state).toBe('CO');
  });

  it('uses web search contact info when state is missing', () => {
    const state = createEmptyDiscoveryState();
    state.webSearchInfo = {
      website: 'https://abcmasonry.com',
      phone: '555-1234',
      address: '123 Main St, Denver, CO 80202',
    };

    const resolved = resolveOnboardingContact(state);

    expect(resolved.website).toBe('https://abcmasonry.com');
    expect(resolved.phone).toBe('555-1234');
    expect(resolved.address).toBe('123 Main St, Denver, CO 80202');
    expect(resolved.city).toBe('Denver');
    expect(resolved.state).toBe('CO');
  });
});
