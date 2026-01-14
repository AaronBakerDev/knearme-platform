/**
 * Analytics Handlers
 *
 * Handles Page and Instagram insights retrieval.
 *
 * @module handlers/analytics
 */

import type { Env, MetaResponse } from '../types';
import { getGraphApiUrl } from '../types';
import { getAccessToken, getInstagramAccessToken } from '../auth';
import { getFromCache, setInCache, CACHE_PREFIX, CACHE_TTL } from '../utils';

function normalizeMetrics(metrics?: string[] | string): string[] {
  if (!metrics) return [];
  if (Array.isArray(metrics)) return metrics.map((metric) => metric.trim()).filter(Boolean);
  return metrics
    .split(',')
    .map((metric) => metric.trim())
    .filter(Boolean);
}

export async function handleGetPageInsights(
  pageId: string,
  metrics: string[] | string | undefined,
  since: string | undefined,
  until: string | undefined,
  period: string | undefined,
  env: Env
): Promise<MetaResponse> {
  try {
    const accessToken = await getAccessToken(pageId, env);
    const metricList = normalizeMetrics(metrics);
    if (metricList.length === 0) {
      throw new Error('metrics are required for get_page_insights');
    }

    const cacheKey = `${CACHE_PREFIX.INSIGHTS}page:${pageId}:${metricList.join('|')}:${since || 'none'}:${until || 'none'}:${period || 'none'}`;
    const cached = await getFromCache<{ data: unknown }>(cacheKey, env);
    if (cached) {
      return {
        success: true,
        data: cached.data,
        cached: true,
        message: 'Page insights retrieved from cache',
      };
    }

    const url = `${getGraphApiUrl(env.GRAPH_API_VERSION)}/${pageId}/insights`;
    const params = new URLSearchParams({
      access_token: accessToken,
      metric: metricList.join(','),
    });
    if (since) params.set('since', since);
    if (until) params.set('until', until);
    if (period) params.set('period', period);

    const response = await fetch(`${url}?${params.toString()}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        (error as { error?: { message?: string } }).error?.message ||
          'Failed to fetch page insights'
      );
    }

    const data = await response.json();
    await setInCache(cacheKey, { data }, CACHE_TTL.INSIGHTS, env);

    return {
      success: true,
      data,
      message: 'Page insights retrieved successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to get page insights',
    };
  }
}

export async function handleGetInstagramInsights(
  igAccountId: string,
  metrics: string[] | string | undefined,
  since: string | undefined,
  until: string | undefined,
  period: string | undefined,
  env: Env
): Promise<MetaResponse> {
  try {
    const accessToken = await getInstagramAccessToken(igAccountId, env);
    const metricList = normalizeMetrics(metrics);
    if (metricList.length === 0) {
      throw new Error('metrics are required for get_ig_insights');
    }

    const cacheKey = `${CACHE_PREFIX.INSIGHTS}ig:${igAccountId}:${metricList.join('|')}:${since || 'none'}:${until || 'none'}:${period || 'none'}`;
    const cached = await getFromCache<{ data: unknown }>(cacheKey, env);
    if (cached) {
      return {
        success: true,
        data: cached.data,
        cached: true,
        message: 'Instagram insights retrieved from cache',
      };
    }

    const url = `${getGraphApiUrl(env.GRAPH_API_VERSION)}/${igAccountId}/insights`;
    const params = new URLSearchParams({
      access_token: accessToken,
      metric: metricList.join(','),
    });
    if (since) params.set('since', since);
    if (until) params.set('until', until);
    if (period) params.set('period', period);

    const response = await fetch(`${url}?${params.toString()}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        (error as { error?: { message?: string } }).error?.message ||
          'Failed to fetch Instagram insights'
      );
    }

    const data = await response.json();
    await setInCache(cacheKey, { data }, CACHE_TTL.INSIGHTS, env);

    return {
      success: true,
      data,
      message: 'Instagram insights retrieved successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to get Instagram insights',
    };
  }
}
