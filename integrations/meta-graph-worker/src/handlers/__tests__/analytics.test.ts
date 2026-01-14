import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Env } from '../../types';
import { handleGetInstagramInsights, handleGetPageInsights } from '../analytics';
import { getAccessToken, getInstagramAccessToken } from '../../auth';
import { getFromCache, setInCache } from '../../utils';

vi.mock('../../auth', () => ({
  getAccessToken: vi.fn(),
  getInstagramAccessToken: vi.fn(),
}));

vi.mock('../../utils', () => ({
  getFromCache: vi.fn(),
  setInCache: vi.fn(),
  CACHE_PREFIX: { INSIGHTS: 'insights:' },
  CACHE_TTL: { INSIGHTS: 3600 },
}));

const env = {} as Env;

describe('analytics handlers', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    (globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock;
    vi.mocked(getAccessToken).mockResolvedValue('token');
    vi.mocked(getInstagramAccessToken).mockResolvedValue('token');
    vi.mocked(getFromCache).mockResolvedValue(null);
    vi.mocked(setInCache).mockResolvedValue();
  });

  it('requires metrics for page insights', async () => {
    const result = await handleGetPageInsights(
      'page_1',
      undefined,
      undefined,
      undefined,
      undefined,
      env
    );

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/metrics/i);
  });

  it('fetches page insights with metrics', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ data: [] }),
    });

    const result = await handleGetPageInsights(
      'page_1',
      ['page_impressions'],
      '2024-01-01',
      '2024-01-02',
      'day',
      env
    );

    expect(result.success).toBe(true);
    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('/page_1/insights');
    expect(url).toContain('metric=page_impressions');
  });

  it('requires metrics for Instagram insights', async () => {
    const result = await handleGetInstagramInsights(
      'ig_1',
      undefined,
      undefined,
      undefined,
      undefined,
      env
    );

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/metrics/i);
  });
});
