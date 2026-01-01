/**
 * Live API session token endpoint.
 *
 * POST /api/ai/live-session
 *
 * Creates ephemeral tokens for Gemini Live API connections.
 * Tracks voice usage for fair-use monitoring (see lib/voice/usage-tracking.ts).
 * Enforces daily usage quotas (see lib/voice/usage-limits.ts).
 *
 * Returns remaining quota info in successful responses so client can display usage.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  GoogleGenAI,
  Modality,
  StartSensitivity,
  EndSensitivity,
  type LiveConnectConfig,
} from '@google/genai';
import { requireAuth, isAuthError } from '@/lib/api/auth';
import { apiError, apiSuccess, handleApiError } from '@/lib/api/errors';
import { buildSystemPromptWithContext, UNIFIED_PROJECT_SYSTEM_PROMPT } from '@/lib/chat/chat-prompts';
import { loadPromptContext } from '@/lib/chat/prompt-context';
import { buildLiveToolDeclarations } from '@/lib/chat/live-tools';
import { AI_MODELS } from '@/lib/ai/providers';
import { startVoiceSession } from '@/lib/voice/usage-tracking';
import { checkVoiceQuota } from '@/lib/voice/usage-limits.server';

const requestSchema = z.object({
  projectId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional(),
  /**
   * When true, enables Gemini's automatic voice activity detection (VAD).
   * The user can speak hands-free without pressing a button.
   * When false (default), push-to-talk mode is used and client must send
   * activityStart/activityEnd signals manually.
   */
  continuousMode: z.boolean().optional().default(false),
});

const DEFAULT_TOKEN_TTL_SECONDS = 600;
const DEFAULT_NEW_SESSION_TTL_SECONDS = 60;

function normalizeLiveModel(model: string): string {
  return model.replace(/^models\//, '');
}

export async function POST(request: NextRequest) {
  const start = Date.now();

  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) {
      return apiError(auth.type === 'UNAUTHORIZED' ? 'UNAUTHORIZED' : 'FORBIDDEN', auth.message);
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return apiError('SERVICE_UNAVAILABLE', 'Google AI is not configured.');
    }

    const body = await request.json().catch(() => null);
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid request payload', {
        errors: parsed.error.flatten(),
      });
    }

    const { projectId, sessionId, continuousMode } = parsed.data;

    // Check voice quota before creating session
    const quota = await checkVoiceQuota(auth.user.id, auth.contractor.id, 'voice_voice');

    if (!quota.allowed) {
      return apiError('QUOTA_EXCEEDED', quota.reason ?? 'Voice quota exceeded for today.', {
        remainingMinutes: quota.remainingMinutes,
        dailyQuotaMinutes: quota.dailyQuotaMinutes,
        usedMinutes: quota.usedMinutes,
        planTier: quota.planTier,
        upgradeUrl: '/settings/billing',
      });
    }
    const includeSummary = true;

    const promptContext = await loadPromptContext({
      projectId,
      sessionId,
      contractorId: auth.contractor.id,
      includeSummary,
    });

    const systemPrompt = buildSystemPromptWithContext({
      basePrompt: UNIFIED_PROJECT_SYSTEM_PROMPT,
      summary: promptContext.summary,
      projectData: promptContext.projectData,
      businessProfile: promptContext.businessProfile,
    });

    const tools = [
      {
        functionDeclarations: buildLiveToolDeclarations(),
      },
    ];

    const liveModel = normalizeLiveModel(process.env.GEMINI_LIVE_MODEL || AI_MODELS.live);

    /**
     * Build VAD configuration based on mode.
     *
     * Continuous mode: Enable automatic VAD with tuned sensitivity for hands-free
     * Push-to-talk mode: Disable automatic VAD, client sends activityStart/activityEnd
     *
     * @see https://ai.google.dev/gemini-api/docs/live-guide
     */
    const liveConfig: LiveConnectConfig = {
      responseModalities: [Modality.AUDIO],
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      realtimeInputConfig: {
        automaticActivityDetection: continuousMode
          ? {
              // Hands-free mode: Enable Gemini's automatic VAD with tuned settings
              disabled: false,
              // High sensitivity to detect speech quickly
              startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_HIGH,
              // Low end sensitivity to allow natural pauses without cutting off
              endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_LOW,
              // Padding before speech detection
              prefixPaddingMs: 100,
              // Silence duration before considering speech ended (allow natural pauses)
              silenceDurationMs: 500,
            }
          : {
              // Push-to-talk mode: Disable automatic VAD
              // Client sends manual activityStart/activityEnd signals
              // See: useLiveVoiceSession.ts
              disabled: true,
            },
      },
      // Enable proactive audio in continuous mode - Gemini decides when to respond
      // This prevents unnecessary interruptions when the user is just thinking out loud
      ...(continuousMode && {
        proactivity: {
          proactiveAudio: true,
        },
      }),
      systemInstruction: systemPrompt,
      tools,
    };

    const client = new GoogleGenAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      httpOptions: { apiVersion: 'v1alpha' },
    });

    const now = Date.now();
    const expireTime = new Date(now + DEFAULT_TOKEN_TTL_SECONDS * 1000).toISOString();
    const newSessionExpireTime = new Date(
      now + DEFAULT_NEW_SESSION_TTL_SECONDS * 1000
    ).toISOString();

    // Note: liveConnectConstraints is an alpha API feature not yet in the SDK types
    const token = await client.authTokens.create({
      config: {
        uses: 1,
        expireTime,
        newSessionExpireTime,
        httpOptions: { apiVersion: 'v1alpha' },
      },
      liveConnectConstraints: {
        model: liveModel,
        config: liveConfig,
      },
    } as Record<string, unknown>);

    if (!token?.name) {
      return apiError('AI_SERVICE_ERROR', 'Failed to create live session token.');
    }

    // Log voice session start for usage tracking
    // Note: usageId is returned so client can call end-session endpoint when done
    const usageId = await startVoiceSession({
      userId: auth.user.id,
      contractorId: auth.contractor.id,
      sessionId,
      mode: 'voice_voice',
    });

    return apiSuccess({
      token: token.name,
      model: liveModel,
      config: liveConfig,
      usageId, // Client should call /api/ai/end-voice-session with this ID when done
      // Include quota info so client can display remaining usage
      quota: {
        remainingMinutes: quota.remainingMinutes,
        dailyQuotaMinutes: quota.dailyQuotaMinutes,
        usedMinutes: quota.usedMinutes,
        planTier: quota.planTier,
        lowQuotaWarning: quota.reason, // Will be set if < 5 minutes remaining
      },
    });
  } catch (error) {
    return handleApiError(error, {
      route: '/api/ai/live-session',
      method: 'POST',
      duration: Date.now() - start,
    });
  }
}
