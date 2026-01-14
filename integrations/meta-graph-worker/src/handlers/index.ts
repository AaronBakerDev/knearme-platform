/**
 * Handlers Index
 *
 * Re-exports all handler functions for clean imports
 *
 * @module handlers
 */

// Account handlers
export {
  handleOAuthStatus,
  handleOAuthConnect,
  handleOAuthCallback,
  handleOAuthVerify,
  handleListAccounts,
  handleDebugToken,
  handleListBusinesses,
  handleSetDefaultBusiness,
} from './accounts';

// Comment handlers
export {
  handleGetComments,
  handleReplyComment,
  handleHideComment,
  handleUnhideComment,
  handleDeleteComment,
  handleBatchGetComments,
} from './comments';

// Webhook handlers
export {
  handleWebhookVerification,
  handleWebhookEvent,
  getRecentEvents,
} from './webhooks';

// Posts handlers
export {
  handleGetPosts,
  handleCreatePost,
  handleUpdatePost,
  handleDeletePost,
  handleSchedulePost,
} from './posts';

// Analytics handlers
export { handleGetPageInsights, handleGetInstagramInsights } from './analytics';

// Ads handlers
export {
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
} from './ads';
