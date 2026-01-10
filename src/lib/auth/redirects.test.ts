import { describe, expect, it } from 'vitest';
import { buildAuthCallbackUrl } from './redirects';

describe('buildAuthCallbackUrl', () => {
  it('builds the auth callback url with an encoded next path', () => {
    const url = buildAuthCallbackUrl('https://knearme.com', '/dashboard');

    expect(url).toBe('https://knearme.com/auth/callback?next=%2Fdashboard');
  });

  it('encodes query params in the next path', () => {
    const url = buildAuthCallbackUrl('https://knearme.com', '/dashboard?tab=projects');

    expect(url).toBe('https://knearme.com/auth/callback?next=%2Fdashboard%3Ftab%3Dprojects');
  });
});
