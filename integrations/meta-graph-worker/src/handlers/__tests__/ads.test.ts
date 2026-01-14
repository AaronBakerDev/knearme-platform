import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Env } from '../../types';
import {
  handleListAdAccounts,
  handleGetCampaigns,
  handleCreateAdSet,
  handleCreateAd,
  handleGetAdCreatives,
  handleGetAdImages,
  handleUploadAdImage,
  handleUploadAdVideo,
  handleGetAdInsights,
  handlePauseAdSet,
  handlePauseAd,
  handleDeleteAd,
} from '../ads';
import { getUserToken } from '../../utils';

vi.mock('../../utils', () => ({
  getUserToken: vi.fn(),
}));

const env = {} as Env;

describe('ads handlers', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    (globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock;
    vi.mocked(getUserToken).mockResolvedValue('token');
  });

  it('requires business_scoped_user_id for list_ad_accounts', async () => {
    const result = await handleListAdAccounts(undefined, env);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/business_scoped_user_id/i);
  });

  it('normalizes ad account id for get_campaigns', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ data: [] }),
    });

    const result = await handleGetCampaigns('123', undefined, env);
    expect(result.success).toBe(true);
    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('/act_123/campaigns');
  });

  it('creates ad set with default paused status', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ id: 'adset_1' }),
    });

    const result = await handleCreateAdSet(
      'act_123',
      {
        name: 'Ad Set',
        campaign_id: 'camp_1',
        billing_event: 'IMPRESSIONS',
        optimization_goal: 'REACH',
        targeting: { geo_locations: { countries: ['US'] } },
        daily_budget: 1000,
      },
      env
    );

    expect(result.success).toBe(true);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain('/act_123/adsets');
    const body = options?.body as URLSearchParams;
    expect(body.get('status')).toBe('PAUSED');
  });

  it('creates ad with default paused status', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ id: 'ad_1' }),
    });

    const result = await handleCreateAd(
      '123',
      { name: 'Ad', adset_id: 'adset_1', creative_id: 'c1' },
      env
    );

    expect(result.success).toBe(true);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain('/act_123/ads');
    const body = options?.body as URLSearchParams;
    expect(body.get('creative_id')).toBeNull();
    expect(body.get('creative')).toBe(JSON.stringify({ creative_id: 'c1' }));
    expect(body.get('status')).toBe('PAUSED');
  });

  it('lists ad creatives with filtering', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ data: [] }),
    });

    const result = await handleGetAdCreatives(
      '123',
      undefined,
      [{ field: 'name', operator: 'CONTAIN', value: 'Test' }],
      5,
      'after_cursor',
      undefined,
      env
    );

    expect(result.success).toBe(true);
    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('/act_123/adcreatives');
    expect(url).toContain('filtering=');
    expect(url).toContain('limit=5');
  });

  it('lists ad images with default fields', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ data: [] }),
    });

    const result = await handleGetAdImages(
      '123',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      env
    );

    expect(result.success).toBe(true);
    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('/act_123/adimages');
    expect(url).toContain('fields=');
  });

  it('requires url or bytes for upload_ad_image', async () => {
    const result = await handleUploadAdImage('123', {}, env);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/url or bytes/i);
  });

  it('requires file_url or source for upload_ad_video', async () => {
    const result = await handleUploadAdVideo('123', {}, env);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/file_url|source/i);
  });

  it('pauses an ad set with status=PAUSED', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true }),
    });

    const result = await handlePauseAdSet('adset_1', env);

    expect(result.success).toBe(true);
    const [, options] = fetchMock.mock.calls[0];
    const body = options?.body as URLSearchParams;
    expect(body.get('status')).toBe('PAUSED');
  });

  it('deletes an ad with DELETE method', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true }),
    });

    const result = await handleDeleteAd('ad_1', env);

    expect(result.success).toBe(true);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain('/ad_1');
    expect(options?.method).toBe('DELETE');
  });

  it('pauses an ad with status=PAUSED', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true }),
    });

    const result = await handlePauseAd('ad_1', env);

    expect(result.success).toBe(true);
    const [, options] = fetchMock.mock.calls[0];
    const body = options?.body as URLSearchParams;
    expect(body.get('status')).toBe('PAUSED');
  });

  it('adds level and time_increment to ad insights', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ data: [] }),
    });

    const result = await handleGetAdInsights(
      '123',
      ['impressions'],
      '2024-01-01',
      '2024-01-31',
      'ad',
      7,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      env
    );

    expect(result.success).toBe(true);
    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('level=ad');
    expect(url).toContain('time_increment=7');
  });
});
