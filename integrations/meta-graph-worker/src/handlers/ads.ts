/**
 * Ads Handlers
 *
 * Handles ad account, campaign, and insights operations.
 *
 * @module handlers/ads
 */

import type {
  Env,
  MetaResponse,
  CampaignContent,
  AdSetContent,
  AdContent,
  AdCreativeContent,
  AdImageContent,
  AdVideoContent,
} from '../types';
import { getGraphApiUrl } from '../types';

/**
 * Get user token for a specific business context
 * Uses the scoped token storage for multi-business support
 *
 * @see src/auth/meta-auth.ts - resolveBusinessAlias for alias resolution
 * @see src/utils/cache.ts - getUserTokenForBusiness for token retrieval
 */
async function getScopedUserToken(
  businessId: string | undefined,
  env: Env
): Promise<string> {
  const { resolveBusinessAlias } = await import('../auth/meta-auth');
  const { getUserTokenForBusiness } = await import('../utils/cache');

  const businessAlias = await resolveBusinessAlias(businessId, env);
  const token = await getUserTokenForBusiness(businessAlias, env);

  if (!token) {
    throw new Error(
      `No user access token found for business "${businessAlias}". Run oauth_connect with business_alias="${businessAlias}" first.`
    );
  }

  return token;
}

const DEFAULT_CAMPAIGN_FIELDS =
  'id,name,objective,status,effective_status,configured_status,created_time';
const DEFAULT_INSIGHT_FIELDS = 'impressions,clicks,spend';
const DEFAULT_ADSET_FIELDS = 'id,name,campaign_id,status,effective_status,created_time';
const DEFAULT_AD_FIELDS = 'id,name,adset_id,campaign_id,status,effective_status,created_time';
const DEFAULT_ADCREATIVE_FIELDS =
  'id,name,object_story_spec,effective_object_story_id,thumbnail_url';
const DEFAULT_ADIMAGE_FIELDS = 'hash,name,url';

function ensureCampaignContent(content?: CampaignContent): CampaignContent {
  if (!content) {
    throw new Error('campaign content is required');
  }
  return content;
}

function ensurePayload<T extends Record<string, unknown>>(
  payload: T | undefined,
  label: string
): T {
  if (!payload) {
    throw new Error(`${label} is required`);
  }
  return payload;
}

function hasCampaignUpdateFields(content: Partial<CampaignContent>): boolean {
  return Boolean(
    content.name ||
      content.objective ||
      content.status ||
      content.special_ad_categories ||
      content.daily_budget ||
      content.lifetime_budget ||
      content.start_time ||
      content.end_time
  );
}


function normalizeAdAccountId(adAccountId: string): string {
  return adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
}

function normalizeFields(
  fields: string[] | string | undefined,
  fallback: string
): string {
  if (!fields) return fallback;
  if (Array.isArray(fields)) {
    return fields.map((field) => field.trim()).filter(Boolean).join(',');
  }
  return fields;
}

function hasPayloadFields(payload: Record<string, unknown>): boolean {
  return Object.values(payload).some((value) => value !== undefined && value !== null);
}

function appendPagination(
  params: URLSearchParams,
  limit: number | undefined,
  after: string | undefined,
  before: string | undefined
): void {
  if (limit !== undefined) params.set('limit', String(limit));
  if (after) params.set('after', after);
  if (before) params.set('before', before);
}

function buildIdFilter(field: string, value: string): Record<string, unknown> {
  return { field, operator: 'IN', value: [value] };
}

function resolveFiltering(
  filtering: unknown,
  fallbackFilters: Array<Record<string, unknown>>
): unknown {
  if (filtering !== undefined) return filtering;
  return fallbackFilters.length ? fallbackFilters : undefined;
}

function appendPayload(
  params: URLSearchParams,
  payload: Record<string, unknown>
): void {
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === 'object') {
      params.set(key, JSON.stringify(value));
    } else {
      params.set(key, String(value));
    }
  });
}

export async function handleListAdAccounts(
  businessScopedUserId: string | undefined,
  env: Env,
  businessId?: string
): Promise<MetaResponse> {
  try {
    const userToken = await getScopedUserToken(businessId, env);

    // Use /me/adaccounts if no specific ID provided, otherwise use /{id}/owned_ad_accounts
    // The old /{id}/assigned_ad_accounts endpoint is deprecated for v2.11+
    let url: string;
    if (!businessScopedUserId) {
      // List all ad accounts the user has access to
      url = `${getGraphApiUrl(env.GRAPH_API_VERSION)}/me/adaccounts`;
    } else {
      // List ad accounts owned by a specific business
      url = `${getGraphApiUrl(env.GRAPH_API_VERSION)}/${businessScopedUserId}/owned_ad_accounts`;
    }

    const params = new URLSearchParams({
      access_token: userToken,
      fields: 'id,name,account_status,currency,timezone_name,business',
    });

    const response = await fetch(`${url}?${params.toString()}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        (error as { error?: { message?: string } }).error?.message ||
          'Failed to list ad accounts'
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
      message: 'Ad accounts retrieved successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to list ad accounts',
    };
  }
}

export async function handleGetCampaigns(
  adAccountId: string,
  fields: string[] | string | undefined,
  env: Env,
  businessId?: string
): Promise<MetaResponse> {
  try {
    if (!adAccountId) {
      throw new Error('ad_account_id is required for get_campaigns');
    }

    const normalizedId = normalizeAdAccountId(adAccountId);
    const userToken = await getScopedUserToken(businessId, env);
    const fieldList = normalizeFields(fields, DEFAULT_CAMPAIGN_FIELDS);

    const url = `${getGraphApiUrl(env.GRAPH_API_VERSION)}/${normalizedId}/campaigns`;
    const params = new URLSearchParams({
      access_token: userToken,
      fields: fieldList,
    });

    const response = await fetch(`${url}?${params.toString()}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        (error as { error?: { message?: string } }).error?.message ||
          'Failed to fetch campaigns'
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
      message: 'Campaigns retrieved successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to get campaigns',
    };
  }
}

export async function handleCreateCampaign(
  adAccountId: string,
  campaign: CampaignContent | undefined,
  env: Env,
  businessId?: string
): Promise<MetaResponse> {
  try {
    if (!adAccountId) {
      throw new Error('ad_account_id is required for create_campaign');
    }
    const campaignContent = ensureCampaignContent(campaign);
    if (!campaignContent.name) {
      throw new Error('campaign name is required for create_campaign');
    }
    if (!campaignContent.objective) {
      throw new Error('campaign objective is required for create_campaign');
    }
    const normalizedId = normalizeAdAccountId(adAccountId);
    const userToken = await getScopedUserToken(businessId, env);

    const url = `${getGraphApiUrl(env.GRAPH_API_VERSION)}/${normalizedId}/campaigns`;
    const params = new URLSearchParams({
      access_token: userToken,
      name: campaignContent.name,
      objective: campaignContent.objective,
      status: campaignContent.status || 'PAUSED',
      special_ad_categories: JSON.stringify(
        campaignContent.special_ad_categories || ['NONE']
      ),
    });

    if (campaignContent.daily_budget) {
      params.set('daily_budget', campaignContent.daily_budget.toString());
    }
    if (campaignContent.lifetime_budget) {
      params.set('lifetime_budget', campaignContent.lifetime_budget.toString());
    }
    if (campaignContent.start_time) {
      params.set('start_time', campaignContent.start_time);
    }
    if (campaignContent.end_time) {
      params.set('end_time', campaignContent.end_time);
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
          'Failed to create campaign'
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
      message: 'Campaign created successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to create campaign',
    };
  }
}

export async function handleUpdateCampaign(
  campaignId: string,
  campaign: Partial<CampaignContent> | undefined,
  env: Env,
  businessId?: string
): Promise<MetaResponse> {
  try {
    if (!campaignId) {
      throw new Error('campaign_id is required for update_campaign');
    }
    if (!campaign || !hasCampaignUpdateFields(campaign)) {
      throw new Error('campaign updates require at least one field to change');
    }
    const userToken = await getScopedUserToken(businessId, env);

    const url = `${getGraphApiUrl(env.GRAPH_API_VERSION)}/${campaignId}`;
    const params = new URLSearchParams({
      access_token: userToken,
    });

    if (campaign.name) params.set('name', campaign.name);
    if (campaign.status) params.set('status', campaign.status);
    if (campaign.objective) params.set('objective', campaign.objective);
    if (campaign.special_ad_categories) {
      params.set(
        'special_ad_categories',
        JSON.stringify(campaign.special_ad_categories)
      );
    }
    if (campaign.daily_budget) {
      params.set('daily_budget', campaign.daily_budget.toString());
    }
    if (campaign.lifetime_budget) {
      params.set('lifetime_budget', campaign.lifetime_budget.toString());
    }
    if (campaign.start_time) {
      params.set('start_time', campaign.start_time);
    }
    if (campaign.end_time) {
      params.set('end_time', campaign.end_time);
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
          'Failed to update campaign'
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
      message: 'Campaign updated successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to update campaign',
    };
  }
}

export async function handlePauseCampaign(
  campaignId: string,
  env: Env,
  businessId?: string
): Promise<MetaResponse> {
  return updateCampaignStatus(campaignId, 'PAUSED', env, businessId);
}

export async function handleResumeCampaign(
  campaignId: string,
  env: Env,
  businessId?: string
): Promise<MetaResponse> {
  return updateCampaignStatus(campaignId, 'ACTIVE', env, businessId);
}

export async function handleDeleteCampaign(
  campaignId: string,
  env: Env,
  businessId?: string
): Promise<MetaResponse> {
  if (!campaignId) {
    return {
      success: false,
      error: 'campaign_id is required for delete_campaign',
      message: 'Failed to delete campaign',
    };
  }
  return deleteGraphObject(campaignId, 'Campaign', env, businessId);
}

export async function handleGetAdSets(
  adAccountId: string,
  fields: string[] | string | undefined,
  campaignId: string | undefined,
  filtering: unknown,
  limit: number | undefined,
  after: string | undefined,
  before: string | undefined,
  env: Env,
  businessId?: string
): Promise<MetaResponse> {
  try {
    if (!adAccountId) {
      throw new Error('ad_account_id is required for get_ad_sets');
    }
    const normalizedId = normalizeAdAccountId(adAccountId);
    const userToken = await getScopedUserToken(businessId, env);
    const fieldList = normalizeFields(fields, DEFAULT_ADSET_FIELDS);
    const url = `${getGraphApiUrl(env.GRAPH_API_VERSION)}/${normalizedId}/adsets`;

    const params = new URLSearchParams({
      access_token: userToken,
      fields: fieldList,
    });
    const fallbackFilters: Array<Record<string, unknown>> = [];
    if (campaignId) {
      fallbackFilters.push(buildIdFilter('campaign.id', campaignId));
    }
    const filteringValue = resolveFiltering(filtering, fallbackFilters);
    if (filteringValue !== undefined) {
      params.set('filtering', JSON.stringify(filteringValue));
    }
    appendPagination(params, limit, after, before);

    const response = await fetch(`${url}?${params.toString()}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        (error as { error?: { message?: string } }).error?.message ||
          'Failed to fetch ad sets'
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
      message: 'Ad sets retrieved successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to get ad sets',
    };
  }
}

export async function handleCreateAdSet(
  adAccountId: string,
  adSet: AdSetContent | undefined,
  env: Env,
  businessId?: string
): Promise<MetaResponse> {
  try {
    if (!adAccountId) {
      throw new Error('ad_account_id is required for create_ad_set');
    }
    const adSetContent = ensurePayload(adSet, 'ad_set');
    if (!adSetContent.name || !adSetContent.campaign_id) {
      throw new Error('ad_set name and campaign_id are required for create_ad_set');
    }
    const hasBudget =
      adSetContent.daily_budget !== undefined ||
      adSetContent.lifetime_budget !== undefined;
    if (
      !adSetContent.billing_event ||
      !adSetContent.optimization_goal ||
      !adSetContent.targeting ||
      !hasBudget
    ) {
      throw new Error(
        'ad_set requires billing_event, optimization_goal, targeting, and daily_budget or lifetime_budget'
      );
    }

    const normalizedId = normalizeAdAccountId(adAccountId);
    const userToken = await getScopedUserToken(businessId, env);
    const url = `${getGraphApiUrl(env.GRAPH_API_VERSION)}/${normalizedId}/adsets`;

    const params = new URLSearchParams({
      access_token: userToken,
    });
    appendPayload(params, adSetContent);
    if (!adSetContent.status) {
      params.set('status', 'PAUSED');
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
          'Failed to create ad set'
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
      message: 'Ad set created successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to create ad set',
    };
  }
}

export async function handleUpdateAdSet(
  adSetId: string,
  adSet: Partial<AdSetContent> | undefined,
  env: Env,
  businessId?: string
): Promise<MetaResponse> {
  try {
    if (!adSetId) {
      throw new Error('ad_set_id is required for update_ad_set');
    }
    const adSetContent = ensurePayload(adSet, 'ad_set');
    if (!hasPayloadFields(adSetContent)) {
      throw new Error('ad_set updates require at least one field to change');
    }

    const userToken = await getScopedUserToken(businessId, env);
    const url = `${getGraphApiUrl(env.GRAPH_API_VERSION)}/${adSetId}`;
    const params = new URLSearchParams({
      access_token: userToken,
    });
    appendPayload(params, adSetContent);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        (error as { error?: { message?: string } }).error?.message ||
          'Failed to update ad set'
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
      message: 'Ad set updated successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to update ad set',
    };
  }
}

export async function handlePauseAdSet(
  adSetId: string,
  env: Env,
  businessId?: string
): Promise<MetaResponse> {
  return updateAdSetStatus(adSetId, 'PAUSED', env, businessId);
}

export async function handleResumeAdSet(
  adSetId: string,
  env: Env,
  businessId?: string
): Promise<MetaResponse> {
  return updateAdSetStatus(adSetId, 'ACTIVE', env, businessId);
}

export async function handleDeleteAdSet(
  adSetId: string,
  env: Env,
  businessId?: string
): Promise<MetaResponse> {
  if (!adSetId) {
    return {
      success: false,
      error: 'ad_set_id is required for delete_ad_set',
      message: 'Failed to delete ad set',
    };
  }
  return deleteGraphObject(adSetId, 'Ad set', env, businessId);
}

async function updateAdSetStatus(
  adSetId: string,
  status: 'PAUSED' | 'ACTIVE',
  env: Env,
  businessId?: string
): Promise<MetaResponse> {
  try {
    if (!adSetId) {
      throw new Error('ad_set_id is required');
    }
    const userToken = await getScopedUserToken(businessId, env);
    const url = `${getGraphApiUrl(env.GRAPH_API_VERSION)}/${adSetId}`;
    const params = new URLSearchParams({
      access_token: userToken,
      status,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        (error as { error?: { message?: string } }).error?.message ||
          `Failed to update ad set status to ${status}`
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
      message: `Ad set ${status === 'PAUSED' ? 'paused' : 'resumed'} successfully`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: `Failed to ${status === 'PAUSED' ? 'pause' : 'resume'} ad set`,
    };
  }
}

export async function handleGetAds(
  adAccountId: string,
  fields: string[] | string | undefined,
  adSetId: string | undefined,
  campaignId: string | undefined,
  filtering: unknown,
  limit: number | undefined,
  after: string | undefined,
  before: string | undefined,
  env: Env,
  businessId?: string
): Promise<MetaResponse> {
  try {
    if (!adAccountId) {
      throw new Error('ad_account_id is required for get_ads');
    }
    const normalizedId = normalizeAdAccountId(adAccountId);
    const userToken = await getScopedUserToken(businessId, env);
    const fieldList = normalizeFields(fields, DEFAULT_AD_FIELDS);
    const url = `${getGraphApiUrl(env.GRAPH_API_VERSION)}/${normalizedId}/ads`;

    const params = new URLSearchParams({
      access_token: userToken,
      fields: fieldList,
    });
    const fallbackFilters: Array<Record<string, unknown>> = [];
    if (adSetId) {
      fallbackFilters.push(buildIdFilter('adset.id', adSetId));
    }
    if (campaignId) {
      fallbackFilters.push(buildIdFilter('campaign.id', campaignId));
    }
    const filteringValue = resolveFiltering(filtering, fallbackFilters);
    if (filteringValue !== undefined) {
      params.set('filtering', JSON.stringify(filteringValue));
    }
    appendPagination(params, limit, after, before);

    const response = await fetch(`${url}?${params.toString()}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        (error as { error?: { message?: string } }).error?.message ||
          'Failed to fetch ads'
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
      message: 'Ads retrieved successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to get ads',
    };
  }
}

export async function handleCreateAd(
  adAccountId: string,
  ad: AdContent | undefined,
  env: Env,
  businessId?: string
): Promise<MetaResponse> {
  try {
    if (!adAccountId) {
      throw new Error('ad_account_id is required for create_ad');
    }
    const adContent = ensurePayload(ad, 'ad');
    if (!adContent.name || !adContent.adset_id) {
      throw new Error('ad name and adset_id are required for create_ad');
    }
    const payload: Record<string, unknown> = { ...adContent };
    if (!payload.creative && typeof adContent.creative_id === 'string') {
      payload.creative = { creative_id: adContent.creative_id };
    }
    if (!payload.creative) {
      throw new Error('ad creative or creative_id is required for create_ad');
    }
    if ('creative_id' in payload) {
      delete payload.creative_id;
    }

    const normalizedId = normalizeAdAccountId(adAccountId);
    const userToken = await getScopedUserToken(businessId, env);
    const url = `${getGraphApiUrl(env.GRAPH_API_VERSION)}/${normalizedId}/ads`;
    const params = new URLSearchParams({
      access_token: userToken,
    });
    appendPayload(params, payload);
    if (!adContent.status) {
      params.set('status', 'PAUSED');
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
          'Failed to create ad'
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
      message: 'Ad created successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to create ad',
    };
  }
}

export async function handleUpdateAd(
  adId: string,
  ad: Partial<AdContent> | undefined,
  env: Env,
  businessId?: string
): Promise<MetaResponse> {
  try {
    if (!adId) {
      throw new Error('ad_id is required for update_ad');
    }
    const adContent = ensurePayload(ad, 'ad');
    if (!hasPayloadFields(adContent)) {
      throw new Error('ad updates require at least one field to change');
    }

    const userToken = await getScopedUserToken(businessId, env);
    const url = `${getGraphApiUrl(env.GRAPH_API_VERSION)}/${adId}`;
    const params = new URLSearchParams({
      access_token: userToken,
    });
    appendPayload(params, adContent);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        (error as { error?: { message?: string } }).error?.message ||
          'Failed to update ad'
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
      message: 'Ad updated successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to update ad',
    };
  }
}

export async function handlePauseAd(
  adId: string,
  env: Env,
  businessId?: string
): Promise<MetaResponse> {
  return updateAdStatus(adId, 'PAUSED', env, businessId);
}

export async function handleResumeAd(
  adId: string,
  env: Env,
  businessId?: string
): Promise<MetaResponse> {
  return updateAdStatus(adId, 'ACTIVE', env, businessId);
}

export async function handleDeleteAd(
  adId: string,
  env: Env,
  businessId?: string
): Promise<MetaResponse> {
  if (!adId) {
    return {
      success: false,
      error: 'ad_id is required for delete_ad',
      message: 'Failed to delete ad',
    };
  }
  return deleteGraphObject(adId, 'Ad', env, businessId);
}

async function updateAdStatus(
  adId: string,
  status: 'PAUSED' | 'ACTIVE',
  env: Env,
  businessId?: string
): Promise<MetaResponse> {
  try {
    if (!adId) {
      throw new Error('ad_id is required');
    }
    const userToken = await getScopedUserToken(businessId, env);
    const url = `${getGraphApiUrl(env.GRAPH_API_VERSION)}/${adId}`;
    const params = new URLSearchParams({
      access_token: userToken,
      status,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        (error as { error?: { message?: string } }).error?.message ||
          `Failed to update ad status to ${status}`
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
      message: `Ad ${status === 'PAUSED' ? 'paused' : 'resumed'} successfully`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: `Failed to ${status === 'PAUSED' ? 'pause' : 'resume'} ad`,
    };
  }
}

export async function handleGetAdCreatives(
  adAccountId: string,
  fields: string[] | string | undefined,
  filtering: unknown,
  limit: number | undefined,
  after: string | undefined,
  before: string | undefined,
  env: Env,
  businessId?: string
): Promise<MetaResponse> {
  try {
    if (!adAccountId) {
      throw new Error('ad_account_id is required for get_ad_creatives');
    }
    const normalizedId = normalizeAdAccountId(adAccountId);
    const userToken = await getScopedUserToken(businessId, env);
    const fieldList = normalizeFields(fields, DEFAULT_ADCREATIVE_FIELDS);
    const url = `${getGraphApiUrl(env.GRAPH_API_VERSION)}/${normalizedId}/adcreatives`;

    const params = new URLSearchParams({
      access_token: userToken,
      fields: fieldList,
    });
    if (filtering !== undefined) {
      params.set('filtering', JSON.stringify(filtering));
    }
    appendPagination(params, limit, after, before);

    const response = await fetch(`${url}?${params.toString()}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        (error as { error?: { message?: string } }).error?.message ||
          'Failed to fetch ad creatives'
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
      message: 'Ad creatives retrieved successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to get ad creatives',
    };
  }
}

export async function handleCreateAdCreative(
  adAccountId: string,
  creative: AdCreativeContent | undefined,
  env: Env,
  businessId?: string
): Promise<MetaResponse> {
  try {
    if (!adAccountId) {
      throw new Error('ad_account_id is required for create_ad_creative');
    }
    const creativeContent = ensurePayload(creative, 'ad_creative');
    const hasStorySpec = Boolean(creativeContent.object_story_spec);
    const hasStoryId = typeof creativeContent.object_story_id === 'string';
    const hasAssetFeedSpec = Boolean(creativeContent.asset_feed_spec);
    if (!hasStorySpec && !hasStoryId && !hasAssetFeedSpec) {
      throw new Error(
        'ad_creative requires object_story_spec, object_story_id, or asset_feed_spec'
      );
    }

    const normalizedId = normalizeAdAccountId(adAccountId);
    const userToken = await getScopedUserToken(businessId, env);
    const url = `${getGraphApiUrl(env.GRAPH_API_VERSION)}/${normalizedId}/adcreatives`;
    const params = new URLSearchParams({
      access_token: userToken,
    });
    appendPayload(params, creativeContent);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        (error as { error?: { message?: string } }).error?.message ||
          'Failed to create ad creative'
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
      message: 'Ad creative created successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to create ad creative',
    };
  }
}

export async function handleDeleteAdCreative(
  adCreativeId: string,
  env: Env,
  businessId?: string
): Promise<MetaResponse> {
  if (!adCreativeId) {
    return {
      success: false,
      error: 'ad_creative_id is required for delete_ad_creative',
      message: 'Failed to delete ad creative',
    };
  }
  return deleteGraphObject(adCreativeId, 'Ad creative', env, businessId);
}

export async function handleGetAdImages(
  adAccountId: string,
  fields: string[] | string | undefined,
  filtering: unknown,
  limit: number | undefined,
  after: string | undefined,
  before: string | undefined,
  env: Env,
  businessId?: string
): Promise<MetaResponse> {
  try {
    if (!adAccountId) {
      throw new Error('ad_account_id is required for get_ad_images');
    }
    const normalizedId = normalizeAdAccountId(adAccountId);
    const userToken = await getScopedUserToken(businessId, env);
    const fieldList = normalizeFields(fields, DEFAULT_ADIMAGE_FIELDS);
    const url = `${getGraphApiUrl(env.GRAPH_API_VERSION)}/${normalizedId}/adimages`;

    const params = new URLSearchParams({
      access_token: userToken,
      fields: fieldList,
    });
    if (filtering !== undefined) {
      params.set('filtering', JSON.stringify(filtering));
    }
    appendPagination(params, limit, after, before);

    const response = await fetch(`${url}?${params.toString()}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        (error as { error?: { message?: string } }).error?.message ||
          'Failed to fetch ad images'
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
      message: 'Ad images retrieved successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to get ad images',
    };
  }
}

export async function handleUploadAdImage(
  adAccountId: string,
  adImage: AdImageContent | undefined,
  env: Env,
  businessId?: string
): Promise<MetaResponse> {
  try {
    if (!adAccountId) {
      throw new Error('ad_account_id is required for upload_ad_image');
    }
    const imageContent = ensurePayload(adImage, 'ad_image');
    const normalizedId = normalizeAdAccountId(adAccountId);

    const urlValue =
      typeof imageContent.url === 'string'
        ? imageContent.url
        : typeof imageContent.image_url === 'string'
          ? imageContent.image_url
          : undefined;

    if (!urlValue && !imageContent.bytes) {
      throw new Error('ad_image requires url or bytes');
    }

    const userToken = await getScopedUserToken(businessId, env);
    const url = `${getGraphApiUrl(env.GRAPH_API_VERSION)}/${normalizedId}/adimages`;
    const params = new URLSearchParams({
      access_token: userToken,
    });

    const payload: Record<string, unknown> = { ...imageContent };
    if (urlValue && !imageContent.url) {
      payload.url = urlValue;
    }
    appendPayload(params, payload);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        (error as { error?: { message?: string } }).error?.message ||
          'Failed to upload ad image'
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
      message: 'Ad image uploaded successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to upload ad image',
    };
  }
}

export async function handleUploadAdVideo(
  adAccountId: string,
  adVideo: AdVideoContent | undefined,
  env: Env,
  businessId?: string
): Promise<MetaResponse> {
  try {
    if (!adAccountId) {
      throw new Error('ad_account_id is required for upload_ad_video');
    }
    const videoContent = ensurePayload(adVideo, 'ad_video');
    const normalizedId = normalizeAdAccountId(adAccountId);

    const fileUrlValue =
      typeof videoContent.file_url === 'string'
        ? videoContent.file_url
        : typeof videoContent.url === 'string'
          ? videoContent.url
          : typeof videoContent.video_url === 'string'
            ? videoContent.video_url
            : undefined;
    const hasSource = typeof videoContent.source === 'string';

    if (!fileUrlValue && !hasSource) {
      throw new Error('ad_video requires file_url, url, video_url, or source');
    }

    const userToken = await getScopedUserToken(businessId, env);
    const url = `${getGraphApiUrl(env.GRAPH_API_VERSION)}/${normalizedId}/advideos`;
    const params = new URLSearchParams({
      access_token: userToken,
    });

    const payload: Record<string, unknown> = { ...videoContent };
    if (fileUrlValue && !videoContent.file_url) {
      payload.file_url = fileUrlValue;
    }
    if ('video_url' in payload) {
      delete payload.video_url;
    }
    if ('url' in payload && typeof payload.url === 'string') {
      if (payload.url === fileUrlValue) {
        delete payload.url;
      }
    }
    appendPayload(params, payload);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        (error as { error?: { message?: string } }).error?.message ||
          'Failed to upload ad video'
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
      message: 'Ad video uploaded successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to upload ad video',
    };
  }
}

async function deleteGraphObject(
  objectId: string,
  label: string,
  env: Env,
  businessId?: string
): Promise<MetaResponse> {
  try {
    const userToken = await getScopedUserToken(businessId, env);
    const url = `${getGraphApiUrl(env.GRAPH_API_VERSION)}/${objectId}`;
    const params = new URLSearchParams({
      access_token: userToken,
    });

    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      const fallbackParams = new URLSearchParams({
        access_token: userToken,
        status: 'DELETED',
      });
      const fallbackResponse = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: fallbackParams,
      });

      if (!fallbackResponse.ok) {
        const fallbackError = await fallbackResponse.json();
        throw new Error(
          (fallbackError as { error?: { message?: string } }).error?.message ||
            (error as { error?: { message?: string } }).error?.message ||
            `Failed to delete ${label}`
        );
      }

      const data = await fallbackResponse.json();
      return {
        success: true,
        data,
        message: `${label} deleted successfully`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
      message: `${label} deleted successfully`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: `Failed to delete ${label}`,
    };
  }
}

async function updateCampaignStatus(
  campaignId: string,
  status: 'PAUSED' | 'ACTIVE',
  env: Env,
  businessId?: string
): Promise<MetaResponse> {
  try {
    if (!campaignId) {
      throw new Error('campaign_id is required');
    }
    const userToken = await getScopedUserToken(businessId, env);
    const url = `${getGraphApiUrl(env.GRAPH_API_VERSION)}/${campaignId}`;
    const params = new URLSearchParams({
      access_token: userToken,
      status,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        (error as { error?: { message?: string } }).error?.message ||
          `Failed to update campaign status to ${status}`
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
      message: `Campaign ${status === 'PAUSED' ? 'paused' : 'resumed'} successfully`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: `Failed to ${status === 'PAUSED' ? 'pause' : 'resume'} campaign`,
    };
  }
}

export async function handleGetAdInsights(
  adAccountId: string,
  fields: string[] | string | undefined,
  since: string | undefined,
  until: string | undefined,
  level: string | undefined,
  timeIncrement: number | 'monthly' | 'all_days' | undefined,
  filtering: unknown,
  datePreset: string | undefined,
  breakdowns: string[] | string | undefined,
  summary: string[] | string | undefined,
  sort: string[] | string | undefined,
  env: Env,
  businessId?: string
): Promise<MetaResponse> {
  try {
    if (!adAccountId) {
      throw new Error('ad_account_id is required for get_ad_insights');
    }

    const normalizedId = normalizeAdAccountId(adAccountId);
    const userToken = await getScopedUserToken(businessId, env);
    const fieldList = normalizeFields(fields, DEFAULT_INSIGHT_FIELDS);

    const url = `${getGraphApiUrl(env.GRAPH_API_VERSION)}/${normalizedId}/insights`;
    const params = new URLSearchParams({
      access_token: userToken,
      fields: fieldList,
    });

    if (since && until) {
      params.set('time_range', JSON.stringify({ since, until }));
    } else {
      if (since) params.set('since', since);
      if (until) params.set('until', until);
    }

    if (level) params.set('level', level);
    if (datePreset) params.set('date_preset', datePreset);
    if (timeIncrement !== undefined) {
      params.set('time_increment', String(timeIncrement));
    }
    if (filtering !== undefined) {
      params.set('filtering', JSON.stringify(filtering));
    }
    if (breakdowns) {
      params.set(
        'breakdowns',
        Array.isArray(breakdowns) ? breakdowns.join(',') : breakdowns
      );
    }
    if (summary) {
      params.set(
        'summary',
        Array.isArray(summary) ? summary.join(',') : summary
      );
    }
    if (sort) {
      params.set('sort', Array.isArray(sort) ? sort.join(',') : sort);
    }

    const response = await fetch(`${url}?${params.toString()}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        (error as { error?: { message?: string } }).error?.message ||
          'Failed to fetch ad insights'
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
      message: 'Ad insights retrieved successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to get ad insights',
    };
  }
}
