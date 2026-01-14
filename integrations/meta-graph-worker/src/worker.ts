/**
 * Meta Graph Worker - Main Entry Point
 *
 * Cloudflare Worker providing comprehensive Meta Graph API access
 * for Facebook Pages and Instagram Business accounts.
 *
 * Flow: MCP Server → Cloudflare Worker → Meta Graph API → Response
 *
 * @version 1.0.0
 * @description Independent Cloudflare Worker providing Meta Graph API access
 *
 * Supported Actions:
 * - Authentication (6): oauth_status, oauth_connect, oauth_verify, list_accounts,
 *   list_businesses, set_default_business
 * - Comments (6): get_comments, reply_comment, hide_comment, unhide_comment, delete_comment, batch_get_comments
 * - Posts (5): get_posts, create_post, update_post, delete_post, schedule_post
 * - Analytics (2): get_page_insights, get_ig_insights
 * - Webhook events (1): get_recent_events
 * - Ads: list_ad_accounts, get_campaigns, create_campaign, update_campaign, pause_campaign, resume_campaign,
 *        delete_campaign, get_ad_insights, get_ad_sets, create_ad_set, update_ad_set, pause_ad_set,
 *        resume_ad_set, delete_ad_set, get_ads, create_ad, update_ad, pause_ad, resume_ad, delete_ad,
 *        get_ad_creatives, create_ad_creative, delete_ad_creative, get_ad_images, upload_ad_image,
 *        upload_ad_video
 *
 * @see https://developers.facebook.com/docs/graph-api
 */

import type { Env, MetaRequest, MetaResponse } from './types';
import { VALID_ACTIONS } from './types';
import { validateApiAuth } from './auth';
import {
  getCorsHeaders,
  createCorsPreflightResponse,
  checkRateLimit,
  getRateLimitHeaders,
} from './utils';
import {
  // Account handlers
  handleOAuthStatus,
  handleOAuthConnect,
  handleOAuthCallback,
  handleOAuthVerify,
  handleListAccounts,
  handleDebugToken,
  handleListBusinesses,
  handleSetDefaultBusiness,
  // Comment handlers
  handleGetComments,
  handleReplyComment,
  handleHideComment,
  handleUnhideComment,
  handleDeleteComment,
  handleBatchGetComments,
  // Webhook handlers
  handleWebhookVerification,
  handleWebhookEvent,
  getRecentEvents,
  // Post handlers
  handleGetPosts,
  handleCreatePost,
  handleUpdatePost,
  handleDeletePost,
  handleSchedulePost,
  // Analytics handlers
  handleGetPageInsights,
  handleGetInstagramInsights,
  // Ads handlers
  handleListAdAccounts,
  handleGetCampaigns,
  handleCreateCampaign,
  handleUpdateCampaign,
  handlePauseCampaign,
  handleResumeCampaign,
  handleDeleteCampaign,
  handleGetAdInsights,
  handleGetAdSets,
  handleCreateAdSet,
  handleUpdateAdSet,
  handlePauseAdSet,
  handleResumeAdSet,
  handleDeleteAdSet,
  handleGetAds,
  handleCreateAd,
  handleUpdateAd,
  handlePauseAd,
  handleResumeAd,
  handleDeleteAd,
  handleGetAdCreatives,
  handleCreateAdCreative,
  handleDeleteAdCreative,
  handleGetAdImages,
  handleUploadAdImage,
  handleUploadAdVideo,
} from './handlers';

/**
 * Validate Meta request format
 */
function validateMetaRequest(request: unknown): request is MetaRequest {
  if (!request || typeof request !== 'object') {
    return false;
  }

  const req = request as Record<string, unknown>;
  return (
    typeof req.action === 'string' &&
    VALID_ACTIONS.includes(req.action as MetaRequest['action']) &&
    (req.params === undefined || typeof req.params === 'object')
  );
}

/**
 * Main Meta API Request Handler
 *
 * Routes requests to appropriate handler functions based on action type.
 */
async function handleMetaRequest(
  request: MetaRequest,
  env: Env
): Promise<MetaResponse> {
  try {
    const { action, params } = request;
    const rawParams = params as Record<string, unknown> | undefined;

    switch (action) {
      // ========== Authentication (5) ==========
      case 'oauth_status':
        return await handleOAuthStatus(env);

      case 'oauth_connect':
        return await handleOAuthConnect(env, params?.business_alias);

      case 'oauth_verify':
        return await handleOAuthVerify(env);

      case 'list_businesses':
        return await handleListBusinesses(env);

      case 'set_default_business': {
        const businessIdentifier = params?.business_id || params?.business_alias;
        if (!businessIdentifier) {
          throw new Error(
            'business_id or business_alias is required for set_default_business'
          );
        }
        return await handleSetDefaultBusiness(env, businessIdentifier);
      }

      case 'list_accounts':
        return await handleListAccounts(env, params?.business_id);

      case 'debug_token':
        return await handleDebugToken(env, params?.page_id as string);

      // ========== Webhook Events (1) ==========
      case 'get_recent_events': {
        const events = await getRecentEvents(
          env,
          params?.event_type,
          params?.limit
        );
        return {
          success: true,
          data: events,
          message: 'Recent webhook events retrieved',
        };
      }

      // ========== Comments (6) ==========
      case 'get_comments': {
        if (!params?.post_id || !params?.page_id) {
          throw new Error('post_id and page_id are required for get_comments');
        }
        return await handleGetComments(
          params.post_id,
          params.page_id,
          params.limit || 25,
          params.after,
          env
        );
      }

      case 'reply_comment': {
        if (!params?.comment_id || !params?.page_id || !params?.message) {
          throw new Error(
            'comment_id, page_id, and message are required for reply_comment'
          );
        }
        return await handleReplyComment(
          params.comment_id,
          params.page_id,
          params.message,
          env
        );
      }

      case 'hide_comment': {
        if (!params?.comment_id || !params?.page_id) {
          throw new Error('comment_id and page_id are required for hide_comment');
        }
        return await handleHideComment(params.comment_id, params.page_id, env);
      }

      case 'unhide_comment': {
        if (!params?.comment_id || !params?.page_id) {
          throw new Error('comment_id and page_id are required for unhide_comment');
        }
        return await handleUnhideComment(params.comment_id, params.page_id, env);
      }

      case 'delete_comment': {
        if (!params?.comment_id || !params?.page_id) {
          throw new Error('comment_id and page_id are required for delete_comment');
        }
        return await handleDeleteComment(params.comment_id, params.page_id, env);
      }

      case 'batch_get_comments': {
        if (!params?.post_ids || !Array.isArray(params.post_ids) || !params?.page_id) {
          throw new Error(
            'post_ids array and page_id are required for batch_get_comments'
          );
        }
        return await handleBatchGetComments(
          params.post_ids,
          params.page_id,
          params.limit || 10,
          env
        );
      }

      // ========== Posts (5) ==========
      case 'get_posts': {
        if (!params?.page_id) {
          throw new Error('page_id is required for get_posts');
        }
        return await handleGetPosts(
          params.page_id,
          params.limit || 25,
          params.after,
          params.fields,
          env
        );
      }

      case 'create_post': {
        if (!params?.page_id || !params?.post) {
          throw new Error('page_id and post are required for create_post');
        }
        return await handleCreatePost(params.page_id, params.post, env);
      }

      case 'update_post': {
        if (!params?.page_id || !params?.post_id || !params?.post) {
          throw new Error('page_id, post_id, and post are required for update_post');
        }
        return await handleUpdatePost(
          params.post_id,
          params.page_id,
          params.post,
          env
        );
      }

      case 'delete_post': {
        if (!params?.page_id || !params?.post_id) {
          throw new Error('page_id and post_id are required for delete_post');
        }
        return await handleDeletePost(params.post_id, params.page_id, env);
      }

      case 'schedule_post': {
        if (!params?.page_id || !params?.post) {
          throw new Error('page_id and post are required for schedule_post');
        }
        return await handleSchedulePost(params.page_id, params.post, env);
      }

      // ========== Analytics (2) ==========
      case 'get_page_insights': {
        if (!params?.page_id) {
          throw new Error('page_id is required for get_page_insights');
        }
        return await handleGetPageInsights(
          params.page_id,
          params.metrics,
          params.since,
          params.until,
          params.period,
          env
        );
      }

      case 'get_ig_insights': {
        if (!params?.ig_account_id) {
          throw new Error('ig_account_id is required for get_ig_insights');
        }
        return await handleGetInstagramInsights(
          params.ig_account_id,
          params.metrics,
          params.since,
          params.until,
          params.period,
          env
        );
      }

      // ========== Ads ==========
      case 'list_ad_accounts': {
        return await handleListAdAccounts(
          params?.business_scoped_user_id,
          env,
          params?.business_id
        );
      }

      case 'get_campaigns': {
        if (!params?.ad_account_id) {
          throw new Error('ad_account_id is required for get_campaigns');
        }
        return await handleGetCampaigns(
          params.ad_account_id,
          params.fields,
          env,
          params?.business_id
        );
      }

      case 'create_campaign': {
        if (!params?.ad_account_id || !params?.campaign) {
          throw new Error('ad_account_id and campaign are required for create_campaign');
        }
        return await handleCreateCampaign(
          params.ad_account_id,
          params.campaign,
          env,
          params?.business_id
        );
      }

      case 'update_campaign': {
        if (!params?.campaign_id || !params?.campaign) {
          throw new Error('campaign_id and campaign are required for update_campaign');
        }
        return await handleUpdateCampaign(
          params.campaign_id,
          params.campaign,
          env,
          params?.business_id
        );
      }

      case 'pause_campaign': {
        if (!params?.campaign_id) {
          throw new Error('campaign_id is required for pause_campaign');
        }
        return await handlePauseCampaign(params.campaign_id, env, params?.business_id);
      }

      case 'resume_campaign': {
        if (!params?.campaign_id) {
          throw new Error('campaign_id is required for resume_campaign');
        }
        return await handleResumeCampaign(params.campaign_id, env, params?.business_id);
      }

      case 'delete_campaign': {
        if (!params?.campaign_id) {
          throw new Error('campaign_id is required for delete_campaign');
        }
        return await handleDeleteCampaign(params.campaign_id, env, params?.business_id);
      }

      case 'get_ad_insights': {
        if (!params?.ad_account_id) {
          throw new Error('ad_account_id is required for get_ad_insights');
        }
        return await handleGetAdInsights(
          params.ad_account_id,
          params.fields,
          params.since,
          params.until,
          params.level,
          params.time_increment,
          params.filtering,
          params.date_preset,
          params.breakdowns,
          params.summary,
          params.sort,
          env,
          params?.business_id
        );
      }

      case 'get_ad_sets': {
        if (!params?.ad_account_id) {
          throw new Error('ad_account_id is required for get_ad_sets');
        }
        return await handleGetAdSets(
          params.ad_account_id,
          params.fields,
          params.campaign_id,
          params.filtering,
          params.limit,
          params.after,
          params.before,
          env,
          params?.business_id
        );
      }

      case 'create_ad_set': {
        const adSetPayload =
          params?.ad_set ?? (rawParams?.adset as typeof params.ad_set);
        if (!params?.ad_account_id || !adSetPayload) {
          throw new Error('ad_account_id and ad_set are required for create_ad_set');
        }
        return await handleCreateAdSet(
          params.ad_account_id,
          adSetPayload,
          env,
          params?.business_id
        );
      }

      case 'update_ad_set': {
        const adSetId =
          params?.ad_set_id ?? (rawParams?.adset_id as string | undefined);
        const adSetPayload =
          params?.ad_set ?? (rawParams?.adset as typeof params.ad_set);
        if (!adSetId || !adSetPayload) {
          throw new Error('ad_set_id and ad_set are required for update_ad_set');
        }
        return await handleUpdateAdSet(adSetId, adSetPayload, env, params?.business_id);
      }

      case 'pause_ad_set': {
        const adSetId =
          params?.ad_set_id ?? (rawParams?.adset_id as string | undefined);
        if (!adSetId) {
          throw new Error('ad_set_id is required for pause_ad_set');
        }
        return await handlePauseAdSet(adSetId, env, params?.business_id);
      }

      case 'resume_ad_set': {
        const adSetId =
          params?.ad_set_id ?? (rawParams?.adset_id as string | undefined);
        if (!adSetId) {
          throw new Error('ad_set_id is required for resume_ad_set');
        }
        return await handleResumeAdSet(adSetId, env, params?.business_id);
      }

      case 'delete_ad_set': {
        const adSetId =
          params?.ad_set_id ?? (rawParams?.adset_id as string | undefined);
        if (!adSetId) {
          throw new Error('ad_set_id is required for delete_ad_set');
        }
        return await handleDeleteAdSet(adSetId, env, params?.business_id);
      }

      case 'get_ads': {
        if (!params?.ad_account_id) {
          throw new Error('ad_account_id is required for get_ads');
        }
        const adSetId =
          params?.ad_set_id ?? (rawParams?.adset_id as string | undefined);
        return await handleGetAds(
          params.ad_account_id,
          params.fields,
          adSetId,
          params.campaign_id,
          params.filtering,
          params.limit,
          params.after,
          params.before,
          env,
          params?.business_id
        );
      }

      case 'create_ad': {
        const adPayload = params?.ad ?? (rawParams?.ad as typeof params.ad);
        if (!params?.ad_account_id || !adPayload) {
          throw new Error('ad_account_id and ad are required for create_ad');
        }
        return await handleCreateAd(params.ad_account_id, adPayload, env, params?.business_id);
      }

      case 'update_ad': {
        const adId = params?.ad_id ?? (rawParams?.ad_id as string | undefined);
        const adPayload = params?.ad ?? (rawParams?.ad as typeof params.ad);
        if (!adId || !adPayload) {
          throw new Error('ad_id and ad are required for update_ad');
        }
        return await handleUpdateAd(adId, adPayload, env, params?.business_id);
      }

      case 'pause_ad': {
        const adId = params?.ad_id ?? (rawParams?.ad_id as string | undefined);
        if (!adId) {
          throw new Error('ad_id is required for pause_ad');
        }
        return await handlePauseAd(adId, env, params?.business_id);
      }

      case 'resume_ad': {
        const adId = params?.ad_id ?? (rawParams?.ad_id as string | undefined);
        if (!adId) {
          throw new Error('ad_id is required for resume_ad');
        }
        return await handleResumeAd(adId, env, params?.business_id);
      }

      case 'delete_ad': {
        const adId = params?.ad_id ?? (rawParams?.ad_id as string | undefined);
        if (!adId) {
          throw new Error('ad_id is required for delete_ad');
        }
        return await handleDeleteAd(adId, env, params?.business_id);
      }

      case 'get_ad_creatives': {
        if (!params?.ad_account_id) {
          throw new Error('ad_account_id is required for get_ad_creatives');
        }
        return await handleGetAdCreatives(
          params.ad_account_id,
          params.fields,
          params.filtering,
          params.limit,
          params.after,
          params.before,
          env,
          params?.business_id
        );
      }

      case 'create_ad_creative': {
        const creativePayload =
          params?.ad_creative ?? (rawParams?.creative as typeof params.ad_creative);
        if (!params?.ad_account_id || !creativePayload) {
          throw new Error(
            'ad_account_id and ad_creative are required for create_ad_creative'
          );
        }
        return await handleCreateAdCreative(
          params.ad_account_id,
          creativePayload,
          env,
          params?.business_id
        );
      }

      case 'delete_ad_creative': {
        const adCreativeId =
          params?.ad_creative_id ??
          (rawParams?.ad_creative_id as string | undefined) ??
          (rawParams?.creative_id as string | undefined);
        if (!adCreativeId) {
          throw new Error('ad_creative_id is required for delete_ad_creative');
        }
        return await handleDeleteAdCreative(adCreativeId, env, params?.business_id);
      }

      case 'get_ad_images': {
        if (!params?.ad_account_id) {
          throw new Error('ad_account_id is required for get_ad_images');
        }
        return await handleGetAdImages(
          params.ad_account_id,
          params.fields,
          params.filtering,
          params.limit,
          params.after,
          params.before,
          env,
          params?.business_id
        );
      }

      case 'upload_ad_image': {
        const imagePayload =
          params?.ad_image ??
          (rawParams?.ad_image as typeof params.ad_image) ??
          (rawParams?.image_url
            ? ({ url: rawParams.image_url } as typeof params.ad_image)
            : undefined);
        if (!params?.ad_account_id || !imagePayload) {
          throw new Error(
            'ad_account_id and ad_image are required for upload_ad_image'
          );
        }
        return await handleUploadAdImage(
          params.ad_account_id,
          imagePayload,
          env,
          params?.business_id
        );
      }

      case 'upload_ad_video': {
        const videoPayload =
          params?.ad_video ??
          (rawParams?.ad_video as typeof params.ad_video) ??
          (rawParams?.file_url
            ? ({ file_url: rawParams.file_url } as typeof params.ad_video)
            : undefined) ??
          (rawParams?.video_url
            ? ({ file_url: rawParams.video_url } as typeof params.ad_video)
            : undefined);
        if (!params?.ad_account_id || !videoPayload) {
          throw new Error(
            'ad_account_id and ad_video are required for upload_ad_video'
          );
        }
        return await handleUploadAdVideo(
          params.ad_account_id,
          videoPayload,
          env,
          params?.business_id
        );
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Meta API request error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to process Meta request',
    };
  }
}

/**
 * Main request handler - Cloudflare Worker entry point
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const corsHeaders = getCorsHeaders(env, origin);
    console.log(`Meta Worker: ${request.method} ${url.pathname}`);

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return createCorsPreflightResponse(env, origin);
    }

    // ========== Webhook Routes (GET + POST /webhook) ==========
    if (url.pathname === '/webhook') {
      // Webhook verification (GET)
      if (request.method === 'GET') {
        return handleWebhookVerification(url, env);
      }

      // Webhook event (POST)
      if (request.method === 'POST') {
        return await handleWebhookEvent(request, env);
      }
    }

    // ========== OAuth Callback Route (GET /oauth/callback) ==========
    if (request.method === 'GET' && url.pathname === '/oauth/callback') {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const error = url.searchParams.get('error');

      if (error) {
        return new Response(
          `<html><body>
            <h1>OAuth Error</h1>
            <p>Error: ${error}</p>
            <p>Description: ${url.searchParams.get('error_description') || 'Unknown error'}</p>
          </body></html>`,
          {
            status: 400,
            headers: { 'Content-Type': 'text/html', ...corsHeaders },
          }
        );
      }

      if (!code) {
        return new Response(
          '<html><body><h1>OAuth Error</h1><p>No authorization code received</p></body></html>',
          {
            status: 400,
            headers: { 'Content-Type': 'text/html', ...corsHeaders },
          }
        );
      }

      try {
        const result = await handleOAuthCallback(code, state, env);

        if (result.success) {
          return new Response(
            `<html><body>
              <h1>OAuth Success!</h1>
              <p>Meta API access authorized successfully.</p>
              <pre>${JSON.stringify(result.data, null, 2)}</pre>
              <p>You can close this window.</p>
            </body></html>`,
            {
              status: 200,
              headers: { 'Content-Type': 'text/html', ...corsHeaders },
            }
          );
        } else {
          return new Response(
            `<html><body><h1>OAuth Error</h1><p>${result.error}</p></body></html>`,
            {
              status: 500,
              headers: { 'Content-Type': 'text/html', ...corsHeaders },
            }
          );
        }
      } catch (err) {
        return new Response(
          `<html><body><h1>OAuth Error</h1><p>${err instanceof Error ? err.message : 'Unknown error'}</p></body></html>`,
          {
            status: 500,
            headers: { 'Content-Type': 'text/html', ...corsHeaders },
          }
        );
      }
    }

    // ========== API Routes (POST /) ==========
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Method not allowed',
          message: 'Only POST requests are supported for API endpoints',
        }),
        {
          status: 405,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    try {
      // Check rate limiting
      const rateLimitResult = await checkRateLimit(request, env);
      if (!rateLimitResult.allowed) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Rate limit exceeded',
            message: `Too many requests. Try again after ${new Date(rateLimitResult.resetTime).toISOString()}`,
            rateLimit: rateLimitResult,
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              ...getRateLimitHeaders(rateLimitResult),
              ...corsHeaders,
            },
          }
        );
      }

      // Validate authentication
      const authHeader = request.headers.get('Authorization');
      if (!validateApiAuth(authHeader, env)) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Unauthorized',
            message: 'Valid API key required',
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      // Parse and validate request body
      let requestBody: unknown;
      try {
        requestBody = await request.json();
      } catch {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid JSON',
            message: 'Request body must be valid JSON',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      if (!validateMetaRequest(requestBody)) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid request format',
            message: `Request must include valid action. Supported: ${VALID_ACTIONS.join(', ')}`,
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      // Handle Meta API request
      const result = await handleMetaRequest(requestBody, env);

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : result.error?.includes('Unauthorized') ? 401 : 500,
        headers: {
          'Content-Type': 'application/json',
          ...getRateLimitHeaders(rateLimitResult),
          'Cache-Control': result.cached ? 'public, max-age=300' : 'no-cache',
          ...corsHeaders,
        },
      });
    } catch (error) {
      console.error('Meta Worker error:', error);

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }
  },
};
