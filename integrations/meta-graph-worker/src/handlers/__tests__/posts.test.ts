import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Env } from '../../types';
import { handleCreatePost, handleGetPosts, handleSchedulePost } from '../posts';
import { getAccessToken } from '../../auth';
import { getFromCache, setInCache } from '../../utils';

vi.mock('../../auth', () => ({
  getAccessToken: vi.fn(),
}));

vi.mock('../../utils', () => ({
  getFromCache: vi.fn(),
  setInCache: vi.fn(),
  CACHE_PREFIX: { POSTS: 'posts:' },
  CACHE_TTL: { POSTS: 900 },
}));

const env = {} as Env;

describe('posts handlers', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    (globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock;
    vi.mocked(getAccessToken).mockResolvedValue('token');
    vi.mocked(getFromCache).mockResolvedValue(null);
    vi.mocked(setInCache).mockResolvedValue();
  });

  it('returns cached posts without calling fetch', async () => {
    vi.mocked(getFromCache).mockResolvedValueOnce({ data: { items: [] } });

    const result = await handleGetPosts('page_1', 10, undefined, undefined, env);

    expect(result.success).toBe(true);
    expect(result.cached).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('creates a photo post via /photos', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ id: 'photo_1' }),
    });

    const result = await handleCreatePost(
      'page_1',
      { photo_url: 'https://example.com/photo.jpg', message: 'Hello' },
      env
    );

    expect(result.success).toBe(true);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain('/page_1/photos');
    const body = options?.body as URLSearchParams;
    expect(body.get('url')).toBe('https://example.com/photo.jpg');
    expect(body.get('caption')).toBe('Hello');
  });

  it('schedules a feed post with published=false', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ id: 'post_1' }),
    });

    const result = await handleSchedulePost(
      'page_1',
      { message: 'Scheduled', scheduled_publish_time: 1700000000 },
      env
    );

    expect(result.success).toBe(true);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain('/page_1/feed');
    const body = options?.body as URLSearchParams;
    expect(body.get('published')).toBe('false');
    expect(body.get('scheduled_publish_time')).toBe('1700000000');
  });
});
