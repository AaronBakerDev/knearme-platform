/**
 * Posts Management Handlers
 *
 * Handles listing, creating, updating, deleting, and scheduling Page posts.
 *
 * @module handlers/posts
 * @see https://developers.facebook.com/docs/graph-api/reference/page/feed
 */

import type { Env, MetaResponse, PostContent } from '../types';
import { getGraphApiUrl } from '../types';
import { getAccessToken } from '../auth';
import { getFromCache, setInCache, CACHE_PREFIX, CACHE_TTL } from '../utils';

// Default fields for /posts endpoint
// Note: full_picture and status_type are deprecated in v3.3+
// Using attachments subquery for media instead
const DEFAULT_POST_FIELDS =
  'id,message,story,created_time,permalink_url,attachments{media_type,url,media}';

function normalizeFields(fields?: string[] | string): string {
  if (!fields) return DEFAULT_POST_FIELDS;
  if (Array.isArray(fields)) {
    return fields.map((field) => field.trim()).filter(Boolean).join(',');
  }
  return fields;
}

function ensurePostContent(content?: PostContent): PostContent {
  if (!content) {
    throw new Error('post content is required');
  }
  return content;
}

function hasPostBody(content: PostContent): boolean {
  return Boolean(
    content.message ||
      content.link ||
      content.photo_url ||
      content.video_url
  );
}

export async function handleGetPosts(
  pageId: string,
  limit: number,
  after: string | undefined,
  fields: string[] | string | undefined,
  env: Env
): Promise<MetaResponse> {
  try {
    const accessToken = await getAccessToken(pageId, env);
    const selectedFields = normalizeFields(fields);
    const cacheKey = `${CACHE_PREFIX.POSTS}${pageId}:${limit}:${after || 'first'}:${selectedFields}`;

    const cached = await getFromCache<{ data: unknown }>(cacheKey, env);
    if (cached) {
      return {
        success: true,
        data: cached.data,
        cached: true,
        message: 'Posts retrieved from cache',
      };
    }

    // Use /posts endpoint instead of /feed for reading posts
    // /feed requires "Page Public Content Access" feature in addition to pages_read_engagement
    // /posts only requires pages_read_engagement and works with Development Mode apps
    // @see https://developers.facebook.com/docs/graph-api/reference/page/feed vs /page/posts
    const url = `${getGraphApiUrl(env.GRAPH_API_VERSION)}/${pageId}/posts`;
    const params = new URLSearchParams({
      access_token: accessToken,
      fields: selectedFields,
      limit: limit.toString(),
    });

    if (after) {
      params.set('after', after);
    }

    const response = await fetch(`${url}?${params.toString()}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        (error as { error?: { message?: string } }).error?.message ||
          'Failed to fetch posts'
      );
    }

    const data = await response.json();
    await setInCache(cacheKey, { data }, CACHE_TTL.POSTS, env);

    return {
      success: true,
      data,
      message: 'Posts retrieved successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to get posts',
    };
  }
}

export async function handleCreatePost(
  pageId: string,
  content: PostContent | undefined,
  env: Env
): Promise<MetaResponse> {
  try {
    const post = ensurePostContent(content);
    if (!hasPostBody(post)) {
      throw new Error('post content must include message, link, photo_url, or video_url');
    }

    const accessToken = await getAccessToken(pageId, env);
    const baseUrl = getGraphApiUrl(env.GRAPH_API_VERSION);

    if (post.photo_url) {
      const url = `${baseUrl}/${pageId}/photos`;
      const params = new URLSearchParams({
        access_token: accessToken,
        url: post.photo_url,
      });
      if (post.message) {
        params.set('caption', post.message);
      }
      if (typeof post.published === 'boolean') {
        params.set('published', post.published ? 'true' : 'false');
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          (error as { error?: { message?: string } }).error?.message ||
            'Failed to create photo post'
        );
      }

      const data = await response.json();
      return {
        success: true,
        data,
        message: 'Photo post created successfully',
      };
    }

    if (post.video_url) {
      const url = `${baseUrl}/${pageId}/videos`;
      const params = new URLSearchParams({
        access_token: accessToken,
        file_url: post.video_url,
      });
      if (post.message) {
        params.set('description', post.message);
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          (error as { error?: { message?: string } }).error?.message ||
            'Failed to create video post'
        );
      }

      const data = await response.json();
      return {
        success: true,
        data,
        message: 'Video post created successfully',
      };
    }

    const url = `${baseUrl}/${pageId}/feed`;
    const params = new URLSearchParams({
      access_token: accessToken,
    });

    if (post.message) params.set('message', post.message);
    if (post.link) params.set('link', post.link);
    if (typeof post.published === 'boolean') {
      params.set('published', post.published ? 'true' : 'false');
    }
    if (typeof post.scheduled_publish_time === 'number') {
      params.set('scheduled_publish_time', post.scheduled_publish_time.toString());
      params.set('published', 'false');
    }
    if (post.targeting) {
      params.set('targeting', JSON.stringify(post.targeting));
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        (error as { error?: { message?: string } }).error?.message ||
          'Failed to create post'
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
      message: 'Post created successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to create post',
    };
  }
}

export async function handleUpdatePost(
  postId: string,
  pageId: string,
  content: PostContent | undefined,
  env: Env
): Promise<MetaResponse> {
  try {
    const post = ensurePostContent(content);
    if (!post.message && !post.link) {
      throw new Error('post content must include message or link');
    }

    const accessToken = await getAccessToken(pageId, env);
    const url = `${getGraphApiUrl(env.GRAPH_API_VERSION)}/${postId}`;

    const params = new URLSearchParams({
      access_token: accessToken,
    });
    if (post.message) params.set('message', post.message);
    if (post.link) params.set('link', post.link);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        (error as { error?: { message?: string } }).error?.message ||
          'Failed to update post'
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
      message: 'Post updated successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to update post',
    };
  }
}

export async function handleDeletePost(
  postId: string,
  pageId: string,
  env: Env
): Promise<MetaResponse> {
  try {
    const accessToken = await getAccessToken(pageId, env);
    const url = `${getGraphApiUrl(env.GRAPH_API_VERSION)}/${postId}`;

    const response = await fetch(`${url}?access_token=${accessToken}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        (error as { error?: { message?: string } }).error?.message ||
          'Failed to delete post'
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
      message: 'Post deleted successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to delete post',
    };
  }
}

export async function handleSchedulePost(
  pageId: string,
  content: PostContent | undefined,
  env: Env
): Promise<MetaResponse> {
  try {
    const post = ensurePostContent(content);
    if (post.photo_url || post.video_url) {
      throw new Error('scheduled posts currently support message/link feed posts only');
    }
    if (!hasPostBody(post)) {
      throw new Error('post content must include message or link');
    }
    if (typeof post.scheduled_publish_time !== 'number') {
      throw new Error('scheduled_publish_time is required for schedule_post');
    }

    const accessToken = await getAccessToken(pageId, env);
    const url = `${getGraphApiUrl(env.GRAPH_API_VERSION)}/${pageId}/feed`;

    const params = new URLSearchParams({
      access_token: accessToken,
      scheduled_publish_time: post.scheduled_publish_time.toString(),
      published: 'false',
    });
    if (post.message) params.set('message', post.message);
    if (post.link) params.set('link', post.link);
    if (post.targeting) {
      params.set('targeting', JSON.stringify(post.targeting));
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        (error as { error?: { message?: string } }).error?.message ||
          'Failed to schedule post'
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
      message: 'Post scheduled successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to schedule post',
    };
  }
}
