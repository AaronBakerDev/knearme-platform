/**
 * Comments Management Handlers
 *
 * Handles reading, replying, hiding, and deleting comments
 * on Facebook Pages and Instagram posts.
 *
 * @module handlers/comments
 * @see https://developers.facebook.com/docs/graph-api/reference/comment
 */

import type { Env, MetaResponse } from '../types';
import { getGraphApiUrl } from '../types';
import { getAccessToken, getInstagramAccessToken } from '../auth';
import { getFromCache, setInCache, CACHE_PREFIX, CACHE_TTL } from '../utils';

/**
 * Get comments on a post
 *
 * @param postId - Post/Media ID
 * @param pageId - Page ID (for token lookup)
 * @param limit - Number of comments to return
 * @param after - Pagination cursor
 * @param env - Environment
 */
export async function handleGetComments(
  postId: string,
  pageId: string,
  limit: number = 25,
  after: string | undefined,
  env: Env
): Promise<MetaResponse> {
  try {
    const accessToken = await getAccessToken(pageId, env);
    const cacheKey = `${CACHE_PREFIX.COMMENTS}${postId}:${limit}:${after || 'first'}`;

    // Check cache
    const cached = await getFromCache<{ data: unknown }>(cacheKey, env);
    if (cached) {
      return {
        success: true,
        data: cached.data,
        cached: true,
        message: 'Comments retrieved from cache',
      };
    }

    // Build URL
    const url = `${getGraphApiUrl(env.GRAPH_API_VERSION)}/${postId}/comments`;
    const params = new URLSearchParams({
      access_token: accessToken,
      fields: 'id,message,from{id,name},created_time,like_count,comment_count,is_hidden,attachment',
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
          'Failed to fetch comments'
      );
    }

    const data = await response.json();

    // Cache result
    await setInCache(cacheKey, { data }, CACHE_TTL.COMMENTS, env);

    return {
      success: true,
      data,
      message: 'Comments retrieved successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to get comments',
    };
  }
}

/**
 * Reply to a comment
 *
 * @param commentId - Comment ID to reply to
 * @param pageId - Page ID
 * @param message - Reply message
 * @param env - Environment
 */
export async function handleReplyComment(
  commentId: string,
  pageId: string,
  message: string,
  env: Env
): Promise<MetaResponse> {
  try {
    const accessToken = await getAccessToken(pageId, env);

    const url = `${getGraphApiUrl(env.GRAPH_API_VERSION)}/${commentId}/comments`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        access_token: accessToken,
        message,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        (error as { error?: { message?: string } }).error?.message ||
          'Failed to reply to comment'
      );
    }

    const data = await response.json();

    return {
      success: true,
      data,
      message: 'Reply posted successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to reply to comment',
    };
  }
}

/**
 * Hide a comment
 *
 * @param commentId - Comment ID
 * @param pageId - Page ID
 * @param env - Environment
 */
export async function handleHideComment(
  commentId: string,
  pageId: string,
  env: Env
): Promise<MetaResponse> {
  try {
    const accessToken = await getAccessToken(pageId, env);

    const url = `${getGraphApiUrl(env.GRAPH_API_VERSION)}/${commentId}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        access_token: accessToken,
        is_hidden: 'true',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        (error as { error?: { message?: string } }).error?.message ||
          'Failed to hide comment'
      );
    }

    const data = await response.json();

    return {
      success: true,
      data,
      message: 'Comment hidden successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to hide comment',
    };
  }
}

/**
 * Unhide a comment
 *
 * @param commentId - Comment ID
 * @param pageId - Page ID
 * @param env - Environment
 */
export async function handleUnhideComment(
  commentId: string,
  pageId: string,
  env: Env
): Promise<MetaResponse> {
  try {
    const accessToken = await getAccessToken(pageId, env);

    const url = `${getGraphApiUrl(env.GRAPH_API_VERSION)}/${commentId}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        access_token: accessToken,
        is_hidden: 'false',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        (error as { error?: { message?: string } }).error?.message ||
          'Failed to unhide comment'
      );
    }

    const data = await response.json();

    return {
      success: true,
      data,
      message: 'Comment unhidden successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to unhide comment',
    };
  }
}

/**
 * Delete a comment
 *
 * @param commentId - Comment ID
 * @param pageId - Page ID
 * @param env - Environment
 */
export async function handleDeleteComment(
  commentId: string,
  pageId: string,
  env: Env
): Promise<MetaResponse> {
  try {
    const accessToken = await getAccessToken(pageId, env);

    const url = `${getGraphApiUrl(env.GRAPH_API_VERSION)}/${commentId}`;

    const response = await fetch(`${url}?access_token=${accessToken}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        (error as { error?: { message?: string } }).error?.message ||
          'Failed to delete comment'
      );
    }

    const data = await response.json();

    return {
      success: true,
      data,
      message: 'Comment deleted successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to delete comment',
    };
  }
}

/**
 * Batch get comments from multiple posts
 *
 * @param postIds - Array of post IDs
 * @param pageId - Page ID
 * @param limit - Comments per post
 * @param env - Environment
 */
export async function handleBatchGetComments(
  postIds: string[],
  pageId: string,
  limit: number = 10,
  env: Env
): Promise<MetaResponse> {
  try {
    const results: Array<{
      postId: string;
      success: boolean;
      data?: unknown;
      error?: string;
    }> = [];

    // Process posts with rate limiting (100ms between requests)
    for (const postId of postIds) {
      const result = await handleGetComments(postId, pageId, limit, undefined, env);
      results.push({
        postId,
        success: result.success,
        data: result.data,
        error: result.error,
      });

      // Rate limit delay
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return {
      success: failed === 0,
      data: {
        results,
        total_posts: postIds.length,
        successful_posts: successful,
        failed_posts: failed,
      },
      message: `Fetched comments from ${successful}/${postIds.length} posts`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to batch get comments',
    };
  }
}
