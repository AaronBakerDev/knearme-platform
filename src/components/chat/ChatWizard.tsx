'use client';

/**
 * Chat-based project creation wizard.
 *
 * Full-screen immersive chat interface for gathering project info,
 * uploading images, and generating portfolio content.
 *
 * Layout (matching edit page pattern):
 * - Desktop (lg+): Flex layout with chat (flex-1) + collapsible canvas (400px)
 * - Canvas starts collapsed, auto-expands when first photo uploaded
 * - Tablet/Mobile: Single column chat + preview pill/overlay
 *
 * Uses Vercel AI SDK v6's useChat hook for streaming chat.
 * Persists conversation to database so users can resume sessions.
 *
 * @see /src/app/api/chat/route.ts for the streaming chat API
 * @see /src/app/api/chat/sessions/ for persistence API
 * @see /src/components/chat/CanvasPanel.tsx for side panel layout pattern
 * @see https://sdk.vercel.ai/docs/ai-sdk-ui for AI SDK v6 docs
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { Loader2, AlertCircle, Sparkles, X, CheckCircle2, RefreshCw } from 'lucide-react';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { ChatPhotoSheet } from './ChatPhotoSheet';
import { CanvasPanel, type CanvasPanelSize, type CanvasTab } from './CanvasPanel';
import { VoiceLiveControls, type VoiceTalkMode } from './VoiceLiveControls';
import { PreviewPill } from './PreviewPill';
import { PreviewOverlay } from './PreviewOverlay';
import { CollectedDataPeekBar } from './CollectedDataPeekBar';
import { QuickActionChips } from './QuickActionChips';
import { Button } from '@/components/ui/button';
import { MicPermissionPrompt } from '@/components/voice';
import { getOpeningMessage } from '@/lib/chat/chat-prompts';
import {
  createSummarySystemMessage,
  type ContextLoadResult,
} from '@/lib/chat/context-shared';
import {
  useInlineImages,
  useProjectData,
  useCompleteness,
  useAutoSummarize,
  useSaveQueue,
  useQuickActions,
  useVoiceModeManager,
  useLiveVoiceSession,
  useMilestoneToasts,
  MilestoneToast,
} from './hooks';
import type { QuickActionItem, QuickActionType } from './hooks';
import { SaveIndicator } from './artifacts/shared/SaveStatusBadge';
import type { UploadedImage } from '@/components/upload/ImageUploader';
import type { ExtractedProjectData, ChatPhase, GeneratedContent } from '@/lib/chat/chat-types';
import type {
  GeneratePortfolioContentOutput,
  ShowPortfolioPreviewOutput,
  SuggestQuickActionsOutput,
} from '@/lib/chat/tool-schemas';
import { cn } from '@/lib/utils';
import { formatProjectLocation } from '@/lib/utils/location';
import { getPublicUrl } from '@/lib/storage/upload';
import {
  buildDescriptionBlocksFromContent,
} from '@/lib/content/description-blocks.client';
import { blocksToHtml, sanitizeDescriptionBlocks } from '@/lib/content/description-blocks';
import type { Contractor, Project, ProjectImage } from '@/types/database';
import type { RelatedProject } from '@/lib/data/projects';

/**
 * Task A6: Type-safe interface for ContentEditor tool parts.
 * Used for safe updates when regenerating content.
 */
interface ContentEditorToolPart {
  type: 'tool-showContentEditor';
  state: string;
  toolCallId: string;
  output?: unknown;
  input?: unknown;
  errorText?: string;
}

/**
 * Task A6: Type guard to validate ContentEditor tool part structure.
 * @see /src/types/artifacts.ts for related type definitions
 */
function isContentEditorToolPart(part: unknown): part is ContentEditorToolPart {
  if (typeof part !== 'object' || part === null) return false;
  const p = part as Record<string, unknown>;
  return (
    p.type === 'tool-showContentEditor' &&
    typeof p.state === 'string' &&
    typeof p.toolCallId === 'string'
  );
}

const QUICK_ACTION_LIMIT = 5;

const QUICK_ACTION_TYPES: QuickActionType[] = [
  'addPhotos',
  'generate',
  'openForm',
  'showPreview',
  'composeLayout',
  'checkPublishReady',
  'insert',
];

function isQuickActionType(value: string): value is QuickActionType {
  return QUICK_ACTION_TYPES.includes(value as QuickActionType);
}

function mergeQuickActions(primary: QuickActionItem[], fallback: QuickActionItem[]): QuickActionItem[] {
  const merged: QuickActionItem[] = [];
  const seen = new Set<string>();

  const addAction = (action: QuickActionItem) => {
    if (action.type === 'insert' && !action.value) return;
    const key = `${action.type}:${action.label}`.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(action);
  };

  for (const action of [...primary, ...fallback]) {
    addAction(action);
    if (merged.length >= QUICK_ACTION_LIMIT) break;
  }

  return merged;
}

/**
 * Tool types that trigger side-effects in ArtifactRenderer.
 * When messages are restored from session history, we need to track
 * these tool call IDs to prevent re-firing side-effects.
 * @see /src/components/chat/artifacts/ArtifactRenderer.tsx SIDE_EFFECT_TOOLS
 */
const SIDE_EFFECT_TOOL_TYPES = new Set([
  'tool-showContentEditor',
  'tool-showPortfolioPreview',
  'tool-updateField',
  'tool-updateDescriptionBlocks',
  'tool-suggestQuickActions',
  'tool-composePortfolioLayout',
  'tool-reorderImages',
  'tool-regenerateSection',
  'tool-validateForPublish',
]);

/**
 * Extract side-effect tool call IDs from messages.
 * Used to pre-populate processedSideEffectToolCalls when restoring session.
 */
function extractSideEffectToolCallIds(messages: UIMessage[]): Set<string> {
  const ids = new Set<string>();
  for (const msg of messages) {
    if (!msg.parts) continue;
    for (const part of msg.parts) {
      if (typeof part !== 'object' || part === null) continue;
      const toolPart = part as { type?: string; toolCallId?: string };
      if (toolPart.type && toolPart.toolCallId && SIDE_EFFECT_TOOL_TYPES.has(toolPart.type)) {
        ids.add(toolPart.toolCallId);
      }
    }
  }
  return ids;
}

function coerceQuickActionSuggestions(payload: unknown): QuickActionItem[] {
  if (!payload || typeof payload !== 'object') return [];
  const actions = (payload as SuggestQuickActionsOutput).actions;
  if (!Array.isArray(actions)) return [];

  const now = Date.now();
  return actions
    .flatMap((action, index): QuickActionItem[] => {
      if (!action || typeof action !== 'object') return [];
      const { label, type, value } = action as {
        label?: unknown;
        type?: unknown;
        value?: unknown;
      };

      if (typeof label !== 'string' || !label.trim()) return [];
      if (typeof type !== 'string' || !isQuickActionType(type)) return [];
      if (type === 'insert' && (typeof value !== 'string' || !value.trim())) return [];

      return [
        {
          id: `agent-${now}-${index}`,
          label: label.trim(),
          type,
          value: typeof value === 'string' ? value : undefined,
        },
      ];
    })
    .slice(0, QUICK_ACTION_LIMIT);
}

async function getResponseErrorMessage(response: Response, fallback: string): Promise<string> {
  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    return fallback;
  }

  try {
    const data = await response.json();
    return data?.error?.message ?? data?.message ?? fallback;
  } catch {
    return fallback;
  }
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function mergeUniqueStrings(...arrays: string[][]): string[] {
  return Array.from(
    new Set(
      arrays
        .flat()
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    )
  );
}

type DeepToolChoice = 'generatePortfolioContent' | 'checkPublishReady' | 'composePortfolioLayout';

function inferDeepToolChoice(text: string): DeepToolChoice | undefined {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return undefined;

  const wantsLayout =
    /\blayout\b/.test(normalized) ||
    /\b(description|content)\s+blocks\b/.test(normalized) ||
    /\bblock\s+layout\b/.test(normalized) ||
    /\bcontent\s+structure\b/.test(normalized);

  if (wantsLayout) return 'composePortfolioLayout';

  const wantsPublishCheck =
    /ready to publish|publish ready|publish readiness|am i ready to publish|can i publish|check publish/.test(
      normalized
    ) || (normalized.includes('publish') && normalized.includes('ready'));

  if (wantsPublishCheck) return 'checkPublishReady';

  const wantsGenerate =
    /\b(generate|draft|write)\b/.test(normalized) &&
    !/\bregenerate\b/.test(normalized) &&
    /(content|description|portfolio|page|story|write up|write-up)/.test(normalized);

  if (wantsGenerate) return 'generatePortfolioContent';

  return undefined;
}

/**
 * Mode determines whether ChatWizard is creating a new project or editing existing.
 *
 * - 'create': Gathering project info from scratch, uses conversation prompts
 * - 'edit': Refining existing project content, loads project data on mount
 */
export type ChatWizardMode = 'create' | 'edit';

interface ChatWizardProps {
  /**
   * Project ID to associate with this wizard session.
   * In create mode, this is null initially and set after first message
   * triggers project creation via onEnsureProject.
   */
  projectId: string | null;
  /**
   * Eager creation callback - creates project on first user message.
   * Only used in create mode. Returns the new project ID.
   * Called before sending the first message to enable immediate persistence.
   *
   * Fallback: Also called by useInlineImages if user uploads before typing.
   *
   * @see /src/app/(contractor)/projects/new/page.tsx for implementation
   */
  onEnsureProject?: () => Promise<string>;
  /**
   * Operation mode - 'create' for new projects, 'edit' for existing.
   * Edit mode loads existing project data and uses edit-focused prompts.
   * @default 'create'
   */
  mode?: ChatWizardMode;
  /** Optional additional className */
  className?: string;
  /** Optional form content for the side panel */
  formContent?: React.ReactNode;
  /** Optional public preview data for full parity rendering */
  publicPreview?: {
    project: Project;
    contractor: Contractor;
    images: (ProjectImage & { url?: string })[];
    relatedProjects?: RelatedProject[];
  };
  /** Callback when project data changes (edit mode) */
  onProjectUpdate?: () => void;
}

/**
 * Main chat wizard component.
 *
 * Flow (Create Mode):
 * 1. Conversation - Gather project info (photos can be added anytime via floating button)
 * 2. Generate - When user has photos + conversation, they can generate content
 * 3. Review - User reviews/edits content
 * 4. Publish - Save and publish
 *
 * Flow (Edit Mode):
 * 1. Load existing project data + images
 * 2. Review - Start in review phase with existing content
 * 3. Edit via chat - User requests changes, AI applies them
 * 4. Publish - Save updates and optionally publish
 */
export function ChatWizard({
  projectId,
  onEnsureProject,
  mode = 'create',
  className,
  formContent,
  publicPreview,
  onProjectUpdate,
}: ChatWizardProps) {
  const isEditMode = mode === 'edit';
  // In edit mode, start in 'review' phase; in create mode, start in 'conversation'
  const [phase, setPhase] = useState<ChatPhase>(isEditMode ? 'review' : 'conversation');
  const [extractedData, setExtractedData] = useState<ExtractedProjectData>({});
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [agentQuickActions, setAgentQuickActions] = useState<QuickActionItem[]>([]);
  const { currentMilestone, triggerMilestone, dismissMilestone, resetMilestones } = useMilestoneToasts();
  const voiceChatEnabled = process.env.NEXT_PUBLIC_VOICE_VOICE_ENABLED === 'true';
  const {
    mode: voiceMode,
    setMode: setVoiceMode,
    permissionStatus: micPermissionStatus,
    supportsVoice,
    requestPermission: requestMicPermission,
    isRequestingPermission: isRequestingMicPermission,
    voiceChatAvailable,
  } = useVoiceModeManager({
    enableVoiceChat: voiceChatEnabled,
    // Only monitor network quality when voice chat is enabled
    enableNetworkQuality: voiceChatEnabled,
  });

  /**
   * Talk mode for voice controls - local state with localStorage persistence.
   * When switching to 'continuous', we need to reconnect the live session
   * with automatic VAD enabled.
   */
  const [voiceTalkMode, setVoiceTalkMode] = useState<VoiceTalkMode>('tap');

  /**
   * When true, shows a retry button for recoverable errors (e.g., load failures).
   * Critical errors that can be retried should set this along with setError.
   * @see Issue #4 in todo/ai-sdk-phase-6-edit-mode.md
   */
  const [canRetry, setCanRetry] = useState(false);
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regeneratingSection, setRegeneratingSection] = useState<'title' | 'description' | 'seo' | null>(null);

  // Photo sheet state (replaces floating panel)
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);

  // Preview overlay state for tablet/mobile
  const [showPreviewOverlay, setShowPreviewOverlay] = useState(false);
  const [overlayTab, setOverlayTab] = useState<'preview' | 'form'>('preview');
  const [previewHints, setPreviewHints] = useState<{
    title: string | null;
    message: string | null;
    highlightFields: string[];
    updatedAt: number | null;
  }>({
    title: null,
    message: null,
    highlightFields: [],
    updatedAt: null,
  });

  const milestoneReadyRef = useRef(false);
  const prevImageCountRef = useRef(0);
  const prevProjectTypeRef = useRef<string | undefined>(undefined);
  const prevMaterialsCountRef = useRef(0);
  const prevCanGenerateRef = useRef(false);
  const prevPhaseRef = useRef<ChatPhase>(phase);

  // Canvas state for desktop (matches edit page behavior)
  const [canvasSize, setCanvasSize] = useState<CanvasPanelSize>(
    isEditMode ? 'medium' : 'collapsed'
  );
  const [canvasTab, setCanvasTab] = useState<CanvasTab>('preview');
  const hasFormContent = Boolean(formContent);

  const previewHighlightTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewMessageTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Inline image upload hook for drag-drop and artifact actions
  // EAGER CREATION: Project is created on first message, so projectId exists before image upload.
  // We keep onEnsureProject as a fallback for edge cases (e.g., user uploads before typing).
  const {
    addImages,
    categorizeImage,
    removeImage,
    error: imageError,
    clearError: clearImageError,
  } = useInlineImages({
    projectId: projectId || '',
    initialImages: uploadedImages,
    onImagesChange: setUploadedImages,
    onEnsureProject, // Fallback: create project if user uploads before sending a message
  });

  // Derived data for live preview canvas
  const projectData = useProjectData(extractedData, uploadedImages);
  const completeness = useCompleteness(extractedData, uploadedImages);
  const previewTitle = previewHints.title ?? projectData.suggestedTitle;

  // Auto-expand canvas when first photo is uploaded (desktop only)
  const hasPhotos = uploadedImages.length > 0;
  useEffect(() => {
    if (hasPhotos && canvasSize === 'collapsed') {
      setCanvasSize('medium');
    }
  }, [hasPhotos, canvasSize]);

  // Session persistence state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  /**
   * Auto-summarize session on end (tab close, inactivity).
   * Only triggers when the conversation exceeds the context budget.
   * Uses Beacon API for reliable delivery even on tab close.
   *
   * @see /src/lib/chat/memory.ts for memory system
   * @see /src/app/api/chat/sessions/[id]/summarize/route.ts
   */
  const { updateMessageCount } = useAutoSummarize({
    sessionId,
    enabled: true,
    minMessages: 3,
  });

  /**
   * Optimistic save queue with retry.
   * Replaces the old debounced save for more reliable persistence.
   *
   * @see /src/components/chat/hooks/useSaveQueue.ts
   */
  const { save: queueSave, status: saveStatus } = useSaveQueue({
    sessionId,
    enabled: true,
  });

  // For create mode with no projectId, don't show loading state initially.
  // This avoids SSR/hydration issues where useEffect may not run immediately.
  const [isLoadingSession, setIsLoadingSession] = useState(() => {
    // Create mode without projectId: skip loading
    if (!projectId && mode === 'create') return false;
    // Edit mode or has projectId: show loading until session loads
    return true;
  });

  // Track which messages have been saved to avoid duplicates
  const savedMessageIds = useRef<Set<string>>(new Set());
  const lastMessageCount = useRef<number>(0);
  const processedExtractToolCalls = useRef<Set<string>>(new Set());
  const processedGeneratedToolCalls = useRef<Set<string>>(new Set());
  /**
   * Track side-effect tool calls that were loaded from session history.
   * These should NOT fire their side-effects again (e.g., showPortfolioPreview
   * would auto-open the preview overlay on every page load).
   * @see ArtifactRenderer.tsx - uses this to skip firing side-effects
   */
  const processedSideEffectToolCalls = useRef<Set<string>>(new Set());

  const logPreviewEvent = useCallback((event: string, details?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'production') return;
    console.info('[Preview]', event, details ?? {});
  }, []);

  /**
   * Create initial welcome message based on mode.
   *
   * - Create mode: Generic opening message
   * - Edit mode: Personalized edit greeting (updated after project loads)
   */
  const getWelcomeMessage = useCallback(
    (_projectTitle?: string | null): UIMessage => ({
      id: 'welcome',
      role: 'assistant',
      parts: [
        {
          type: 'text',
          text: getOpeningMessage(),
        },
      ],
    }),
    []
  );

  // AI SDK v6 chat hook
  // NOTE: `messages` prop only sets initial value - use setMessages for async updates
  // Unified chat route now handles both create and edit flows with a shared tool set.
  // For create mode with lazy creation, use 'new' as placeholder until projectId is set.
  //
  // FIX: Memoize initial messages to prevent infinite re-renders
  // @see https://github.com/vercel/ai/issues/5428
  const initialMessages = useMemo(
    () => [getWelcomeMessage()],
    [getWelcomeMessage]
  );

  // CRITICAL: Use stable ID that NEVER changes during this component's lifecycle!
  // Any dynamic value (projectId, sessionId) that changes mid-conversation will cause
  // useChat to reset to initialMessages, losing the entire conversation.
  // Generate a stable ID once on mount using useRef.
  // @see https://github.com/vercel/ai/issues/5428
  const stableChatId = useRef(`chat-${mode}-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  const { messages, sendMessage, status, setMessages } = useChat({
    id: stableChatId.current,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  });

  const appendLiveMessage = useCallback(
    (role: 'user' | 'assistant', text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `live-${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setMessages((prev) => [
        ...prev,
        {
          id,
          role,
          parts: [{ type: 'text', text: trimmed }],
        },
      ]);
    },
    [setMessages]
  );

  const appendLiveToolResult = useCallback(
    (
      toolName: string,
      toolCallId: string,
      output?: unknown,
      error?: { message?: string }
    ) => {
      if (typeof output === 'undefined' && !error) return;
      const id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `live-tool-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setMessages((prev) => [
        ...prev,
        {
          id,
          role: 'assistant' as const,
          parts: [
            error
              ? {
                  type: `tool-${toolName}` as const,
                  state: 'output-error' as const,
                  toolCallId,
                  input: undefined,
                  errorText: error.message ?? 'Tool failed.',
                }
              : {
                  type: `tool-${toolName}` as const,
                  state: 'output-available' as const,
                  toolCallId,
                  input: undefined,
                  output,
                },
          ],
        },
      ]);
    },
    [setMessages]
  );

  const ensureLiveSessionReady = useCallback(async () => {
    let currentProjectId = projectId;

    if (!currentProjectId && onEnsureProject && !isEditMode) {
      currentProjectId = await onEnsureProject();
    }

    if (!currentProjectId) {
      throw new Error('Missing project context.');
    }

    if (sessionIdRef.current) {
      return { projectId: currentProjectId, sessionId: sessionIdRef.current };
    }

    return await new Promise<{ projectId: string; sessionId: string }>((resolve, reject) => {
      const started = Date.now();
      const interval = setInterval(() => {
        if (sessionIdRef.current) {
          clearInterval(interval);
          resolve({ projectId: currentProjectId as string, sessionId: sessionIdRef.current });
          return;
        }
        if (Date.now() - started > 5000) {
          clearInterval(interval);
          reject(new Error('Timed out waiting for session.'));
        }
      }, 100);
    });
  }, [projectId, onEnsureProject, isEditMode]);

  const liveVoiceSession = useLiveVoiceSession({
    enabled: voiceMode === 'voice_chat' && micPermissionStatus === 'granted',
    continuousMode: voiceTalkMode === 'continuous',
    ensureSessionReady: ensureLiveSessionReady,
    onUserMessage: (text) => appendLiveMessage('user', text),
    onAssistantMessage: (text) => appendLiveMessage('assistant', text),
    onToolResult: appendLiveToolResult,
    onFallback: () => setVoiceMode('text'),
  });

  // Keep startTalking ref in sync for use in timer callbacks (avoids stale closure)
  const startTalkingRef = useRef(liveVoiceSession.startTalking);
  useEffect(() => {
    startTalkingRef.current = liveVoiceSession.startTalking;
  }, [liveVoiceSession.startTalking]);

  /**
   * Handle talk mode changes from VoiceLiveControls.
   * When switching to continuous mode, auto-connect and start listening.
   * When switching away, disconnect so the session can reconnect with new VAD settings.
   */
  const handleTalkModeChange = useCallback((mode: VoiceTalkMode) => {
    const wasConnected = liveVoiceSession.isConnected;
    const wasContinuous = voiceTalkMode === 'continuous';
    const willBeContinuous = mode === 'continuous';

    setVoiceTalkMode(mode);

    // If switching between continuous and non-continuous mode while connected,
    // disconnect so the session can reconnect with new VAD settings
    if (wasConnected && wasContinuous !== willBeContinuous) {
      liveVoiceSession.disconnect();
    }

    // Auto-connect when switching TO continuous mode (hands-free experience)
    // This starts the session immediately so user can just start talking
    // Note: If we just disconnected above, we still want to auto-start
    if (willBeContinuous && micPermissionStatus === 'granted') {
      // Small delay to allow state update and disconnect to complete
      // Uses ref to always get the latest startTalking with correct continuousMode
      setTimeout(() => {
        startTalkingRef.current();
      }, wasConnected ? 150 : 100);
    }
  }, [voiceTalkMode, liveVoiceSession, micPermissionStatus]);

  /**
   * Load session and project data on mount.
   *
   * Create Mode: Skip session loading if projectId is null.
   *   On first message, onEnsureProject creates project, updating projectId prop.
   *   This effect then runs to create/restore the session.
   * Edit Mode: Loads project data, creates fresh session per visit.
   *
   * @see /api/chat/sessions/by-project/[projectId] for session persistence
   */
  useEffect(() => {
    async function loadSession() {
      try {
        if (isEditMode) {
          // ===== EDIT MODE =====
          // Load existing project data + images, RESUME existing session

          // Step 1: Load project + session in parallel
          const [projectResponse, sessionResponse] = await Promise.all([
            fetch(`/api/projects/${projectId}`),
            fetch(`/api/chat/sessions/by-project/${projectId}`),
          ]);
          if (!projectResponse.ok) {
            throw new Error('Failed to load project');
          }
          if (!sessionResponse.ok) {
            throw new Error('Failed to load session');
          }

          const { project } = await projectResponse.json();
          const { session, isNew } = await sessionResponse.json();

          const projectImages = Array.isArray(project.project_images)
            ? [...(project.project_images as ProjectImage[])]
            : [];
          projectImages.sort(
            (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
          );
          const images = projectImages
            .filter((image) => typeof image.storage_path === 'string')
            .map((image) => ({
              id: image.id,
              url: getPublicUrl('project-images', image.storage_path),
              filename:
                image.storage_path.split('/').pop() ?? 'project-image',
              storage_path: image.storage_path,
              image_type: image.image_type ?? undefined,
              width: image.width ?? undefined,
              height: image.height ?? undefined,
            }));

          // Step 2: Set loaded data
          setUploadedImages(images || []);

          // Convert project to extracted data format for preview
          const locationLabel = formatProjectLocation({
            neighborhood: project.neighborhood,
            city: project.city,
            state: project.state,
          });
          setExtractedData({
            project_type: project.project_type || undefined,
            materials_mentioned: project.materials || [],
            techniques_mentioned: project.techniques || [],
            location: locationLabel || undefined,
          });

          // Step 3: RESUME existing session (same pattern as create mode)
          // Uses get-or-create pattern to maintain ONE session per project
          setSessionId(session.id);

          if (!isNew) {
            // Load existing conversation context including tool parts
            const contextResponse = await fetch(
              `/api/chat/sessions/${session.id}/context?projectId=${projectId}&mode=ui`
            );

            if (contextResponse.ok) {
              const context: ContextLoadResult = await contextResponse.json();

              if (context.messages.length > 0) {
                let messagesToLoad = context.messages;

                // If using compacted loading, prepend summary as system context
                if (!context.loadedFully && context.summary) {
                  const summaryMessage = createSummarySystemMessage(
                    context.summary,
                    context.projectData
                  );
                  messagesToLoad = [summaryMessage, ...context.messages];
                }

                // Pre-populate side-effect tool call IDs to prevent re-firing
                // (e.g., showPortfolioPreview would auto-open preview overlay)
                const sideEffectIds = extractSideEffectToolCallIds(messagesToLoad);
                sideEffectIds.forEach((id) => processedSideEffectToolCalls.current.add(id));

                // Set messages in chat (includes tool parts for visibility)
                setMessages(messagesToLoad);

                // Mark as already saved to avoid re-saving
                context.messages.forEach((msg) => {
                  savedMessageIds.current.add(msg.id);
                });
                lastMessageCount.current = messagesToLoad.length;

                // Restore phase if available in session
                if (session.phase) {
                  setPhase(session.phase);
                }
              }
            }
          } else {
            // New session - show welcome message with project title
            setMessages([getWelcomeMessage(project.title)]);
          }
        } else {
          // ===== CREATE MODE =====
          // Use get-or-create pattern with smart context loading
          // See /src/lib/chat/context-loader.ts for loading strategy
          const response = await fetch(`/api/chat/sessions/by-project/${projectId}`);
          if (!response.ok) {
            throw new Error('Failed to load session');
          }

          const { session, isNew } = await response.json();
          setSessionId(session.id);

          if (!isNew) {
            // SMART CONTEXT LOADING: Load conversation context based on size
            // - Short conversations: Full message history
            // - Long conversations: Summary + recent messages
            // @see /src/lib/chat/context-loader.ts for loading strategy
            const contextResponse = await fetch(
              `/api/chat/sessions/${session.id}/context?projectId=${projectId}&mode=ui`
            );

            if (contextResponse.ok) {
              const context: ContextLoadResult = await contextResponse.json();

              if (context.messages.length > 0) {
                let messagesToLoad = context.messages;

                // If using compacted loading, prepend summary as system context
                if (!context.loadedFully && context.summary) {
                  const summaryMessage = createSummarySystemMessage(
                    context.summary,
                    context.projectData
                  );
                  messagesToLoad = [summaryMessage, ...context.messages];
                }

                // Pre-populate side-effect tool call IDs to prevent re-firing
                // (e.g., showPortfolioPreview would auto-open preview overlay)
                const sideEffectIds = extractSideEffectToolCallIds(messagesToLoad);
                sideEffectIds.forEach((id) => processedSideEffectToolCalls.current.add(id));

                // Set messages in chat
                setMessages(messagesToLoad);

                // Mark as already saved to avoid re-saving
                context.messages.forEach((msg) => {
                  savedMessageIds.current.add(msg.id);
                });
                lastMessageCount.current = messagesToLoad.length;

                // Restore phase if available in session
                if (session.phase) {
                  setPhase(session.phase);
                }
              }

              // Set extracted data from project (source of truth)
              if (context.projectData.extractedData &&
                  Object.keys(context.projectData.extractedData).length > 0) {
                setExtractedData(context.projectData.extractedData);
              }
            }
          }
          // New session keeps the welcome message already set by useChat
        }
      } catch (err) {
        console.error('[ChatWizard] Failed to load session:', err);
        // Issue #4: Set persistent error with retry capability
        setError(
          isEditMode
            ? 'Failed to load project. Please try again or refresh the page.'
            : 'Failed to start session. Please try again.'
        );
        setCanRetry(true);
        // Keep welcome message on error
      } finally {
        setIsLoadingSession(false);
      }
    }

    // LAZY CREATION: In create mode with no projectId, skip session loading.
    // User can chat locally; session will be created after first image upload.
    if (!projectId && !isEditMode) {
      setIsLoadingSession(false);
      return;
    }

    loadSession();
  }, [projectId, isEditMode, setMessages, getWelcomeMessage]);

  /**
   * Retry handler for recoverable errors (e.g., load failures).
   * Resets state and re-triggers session loading.
   * @see Issue #4 in todo/ai-sdk-phase-6-edit-mode.md
   */
  const handleRetry = useCallback(() => {
    setError(null);
    setCanRetry(false);
    setIsLoadingSession(true);
    // The useEffect above will re-run when isLoadingSession changes,
    // but we need to trigger a fresh load. Use a key change pattern.
    // For simplicity, just reload the page for now.
    window.location.reload();
  }, []);

  /**
   * Save new messages to database after AI responses complete.
   * Runs when status changes from streaming to ready.
   */
  useEffect(() => {
    // Only save when we have a session and streaming just finished
    if (!sessionId || status !== 'ready') return;
    if (messages.length <= lastMessageCount.current) return;

    async function saveNewMessages() {
      const newMessages = messages.slice(lastMessageCount.current);

      for (const msg of newMessages) {
        // Skip if already saved or is welcome message
        if (savedMessageIds.current.has(msg.id)) continue;
        if (msg.id === 'welcome') continue;

        try {
          const parts = msg.parts;
          // Extract text content from parts
          const textContent =
            parts
              ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
              .map((p) => p.text)
              .join('\n') || '';
          const hasParts = Array.isArray(parts) && parts.length > 0;
          const hasNonTextParts = hasParts && parts.some((p) => p.type !== 'text');

          if (!textContent && !hasNonTextParts) continue;

          const response = await fetch(`/api/chat/sessions/${sessionId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              role: msg.role,
              content: textContent,
              parts: hasParts ? parts : undefined, // Store full parts array including tool calls
              metadata: {},
            }),
          });

          if (response.ok) {
            savedMessageIds.current.add(msg.id);
          }
        } catch (err) {
          console.error('[ChatWizard] Failed to save message:', err);
        }
      }

      lastMessageCount.current = messages.length;
    }

    saveNewMessages();
  }, [sessionId, status, messages]);

  /**
   * Update auto-summarize message count on message changes.
   * This resets the inactivity timer and ensures proper summarization.
   */
  useEffect(() => {
    updateMessageCount(messages.length);
  }, [messages.length, updateMessageCount]);

  /**
   * Check for tool results in messages to extract data.
   *
   * In AI SDK v6, tool parts use type `tool-${toolName}` pattern
   * and have `state` and `output` properties.
   */
  useEffect(() => {
    if (messages.length === 0) return;

    const pendingResults: ExtractedProjectData[] = [];

    for (const message of messages) {
      if (message.role !== 'assistant' || !message.parts) continue;

      for (const part of message.parts) {
        if (typeof part !== 'object' || part === null) continue;

        const toolPart = part as {
          type?: string;
          state?: string;
          output?: unknown;
          toolCallId?: string;
        };

        // In v6, tool parts have type 'tool-extractProjectData'
        // and state 'output-available' when result is ready
        if (toolPart.type !== 'tool-extractProjectData') continue;
        if (toolPart.state !== 'output-available') continue;
        if (!toolPart.toolCallId) continue;
        if (processedExtractToolCalls.current.has(toolPart.toolCallId)) continue;

        const result = toolPart.output as ExtractedProjectData;
        if (result && typeof result === 'object') {
          pendingResults.push(result);
          processedExtractToolCalls.current.add(toolPart.toolCallId);
          logPreviewEvent('extractProjectData', {
            toolCallId: toolPart.toolCallId,
            keys: Object.keys(result),
          });
        }
      }
    }

    if (pendingResults.length > 0) {
      setExtractedData((prev) =>
        pendingResults.reduce<ExtractedProjectData>(
          (acc, result) => ({ ...acc, ...result }),
          prev
        )
      );
    }
  }, [messages, logPreviewEvent]);

  useEffect(() => {
    if (messages.length === 0) {
      processedExtractToolCalls.current.clear();
    }
  }, [messages.length]);

  /**
   * Transition to review when content generation completes.
   * If generation fails, return to conversation so users can retry.
   */
  useEffect(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const message = messages[i];
      if (!message || message.role !== 'assistant' || !message.parts) continue;

      for (const part of message.parts) {
        if (typeof part !== 'object' || part === null) continue;

        const toolPart = part as {
          type?: string;
          state?: string;
          output?: unknown;
        };

        if (toolPart.type === 'tool-generatePortfolioContent') {
          if (toolPart.state === 'input-available' || toolPart.state === 'input-streaming') {
            if (phase !== 'generating') {
              setPhase('generating');
            }
            return;
          }

          if (toolPart.state === 'output-available') {
            const output = toolPart.output as { success?: boolean } | undefined;
            if (output && output.success === false) {
              setPhase('conversation');
            } else {
              setPhase('review');
            }
            return;
          }
        }

        if (toolPart.type === 'tool-showContentEditor' && toolPart.state === 'output-available') {
          setPhase('review');
          return;
        }
      }
    }
  }, [messages, phase]);

  /**
   * Save extracted data to session when it changes.
   * Uses optimistic save queue with automatic retry.
   */
  useEffect(() => {
    if (!sessionId || Object.keys(extractedData).length === 0) return;

    // Queue save with coalescing (handles rapid updates)
    queueSave({
      extracted_data: extractedData,
      phase,
    });
  }, [sessionId, extractedData, phase, queueSave]);

  /**
   * Sync extracted data to project record.
   *
   * CRITICAL: This effect persists extracted interview data to the project
   * so it's available for content generation and publishing.
   *
   * Maps ExtractedProjectData fields to Project API fields:
   * - project_type → project_type
   * - customer_problem → challenge
   * - solution_approach → solution
   * - materials_mentioned → materials
   * - techniques_mentioned → techniques
   * - duration → duration
   * - city → city
   * - state → state
   *
   * @see /src/app/api/projects/[id]/route.ts PATCH endpoint
   */
  const lastSyncedData = useRef<string>('');

  useEffect(() => {
    // Skip if no projectId, no data, or edit mode
    if (!projectId || isEditMode) return;
    if (Object.keys(extractedData).length === 0) return;

    // Check if data has actually changed (avoid unnecessary API calls)
    const dataHash = JSON.stringify(extractedData);
    if (dataHash === lastSyncedData.current) return;

    // Debounce: wait 1 second after last change before syncing
    const syncTimeout = setTimeout(async () => {
      try {
        // Map extracted fields to project API fields
        const projectUpdate: Record<string, unknown> = {};

        if (extractedData.project_type) {
          projectUpdate.project_type = extractedData.project_type;
        }
        if (extractedData.city) {
          projectUpdate.city = extractedData.city;
        }
        if (extractedData.state) {
          projectUpdate.state = extractedData.state;
        }
        if (extractedData.duration) {
          projectUpdate.duration = extractedData.duration;
        }
        if (extractedData.materials_mentioned?.length) {
          projectUpdate.materials = extractedData.materials_mentioned;
        }
        if (extractedData.techniques_mentioned?.length) {
          projectUpdate.techniques = extractedData.techniques_mentioned;
        }
        // Map interview fields to case-study narrative fields
        if (extractedData.customer_problem) {
          projectUpdate.challenge = extractedData.customer_problem;
        }
        if (extractedData.solution_approach) {
          projectUpdate.solution = extractedData.solution_approach;
        }

        // Only sync if we have fields to update
        if (Object.keys(projectUpdate).length === 0) return;

        const response = await fetch(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(projectUpdate),
        });

        if (response.ok) {
          lastSyncedData.current = dataHash;
          console.log('[ChatWizard] Synced extracted data to project:', Object.keys(projectUpdate));
        } else {
          console.error('[ChatWizard] Failed to sync extracted data:', response.status);
        }
      } catch (err) {
        console.error('[ChatWizard] Error syncing extracted data:', err);
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(syncTimeout);
  }, [projectId, extractedData, isEditMode]);

  const isLoading = status === 'streaming' || status === 'submitted';
  // Voice-to-text mic button is always enabled when mic is available (in text mode)
  const enableVoiceInput =
    supportsVoice &&
    micPermissionStatus !== 'denied' &&
    micPermissionStatus !== 'unavailable';
  // Show permission prompt when in voice_chat mode but permission is denied/unavailable
  const showMicPermissionPrompt =
    voiceMode === 'voice_chat' &&
    (micPermissionStatus === 'denied' || micPermissionStatus === 'unavailable');
  const canStartLiveVoice = micPermissionStatus === 'granted';
  const inputPlaceholder =
    phase === 'review'
      ? 'Tell me what to change...'
      : 'Tell me about this project...';

  // Can generate when completeness hook says we have enough data
  const canGenerate = completeness.canGenerate && messages.length > 2;

  const heuristicQuickActions = useQuickActions({
    extractedData,
    completeness,
    imageCount: uploadedImages.length,
    allowGenerate: canGenerate,
    phase,
  });

  const quickActions = useMemo(
    () => mergeQuickActions(agentQuickActions, heuristicQuickActions),
    [agentQuickActions, heuristicQuickActions]
  );

  useEffect(() => {
    resetMilestones();
    milestoneReadyRef.current = false;
    prevImageCountRef.current = 0;
    prevProjectTypeRef.current = undefined;
    prevMaterialsCountRef.current = 0;
    prevCanGenerateRef.current = false;
    prevPhaseRef.current = isEditMode ? 'review' : 'conversation';
    setAgentQuickActions([]);
  }, [projectId, resetMilestones, isEditMode]);

  useEffect(() => {
    if (isLoadingSession) return;

    if (!milestoneReadyRef.current) {
      milestoneReadyRef.current = true;
      prevImageCountRef.current = uploadedImages.length;
      prevProjectTypeRef.current = extractedData.project_type;
      prevMaterialsCountRef.current = extractedData.materials_mentioned?.length ?? 0;
      prevCanGenerateRef.current = canGenerate;
      prevPhaseRef.current = phase;
      return;
    }

    if (prevImageCountRef.current === 0 && uploadedImages.length > 0) {
      triggerMilestone('firstPhoto');
    }

    if (!prevProjectTypeRef.current && extractedData.project_type) {
      triggerMilestone('typeDetected');
    }

    const materialsCount = extractedData.materials_mentioned?.length ?? 0;
    if (prevMaterialsCountRef.current < 2 && materialsCount >= 2) {
      triggerMilestone('materialsFound');
    }

    if (!prevCanGenerateRef.current && canGenerate) {
      triggerMilestone('readyToGenerate');
    }

    if (prevPhaseRef.current === 'generating' && phase === 'review') {
      triggerMilestone('generated');
    }

    prevImageCountRef.current = uploadedImages.length;
    prevProjectTypeRef.current = extractedData.project_type;
    prevMaterialsCountRef.current = materialsCount;
    prevCanGenerateRef.current = canGenerate;
    prevPhaseRef.current = phase;
  }, [
    isLoadingSession,
    uploadedImages.length,
    extractedData.project_type,
    extractedData.materials_mentioned,
    canGenerate,
    phase,
    triggerMilestone,
  ]);

  /**
   * Send a text message.
   *
   * EAGER CREATION: In create mode, if no project exists, we create one
   * before sending the first message. This triggers session creation
   * and enables persistence from the start.
   *
   * NOTE: All useCallback hooks must be declared BEFORE any conditional returns
   * to satisfy React's Rules of Hooks (consistent hook order on every render).
   *
   * @see /src/app/(contractor)/projects/new/page.tsx for ensureProject implementation
   */
  const sendMessageWithContext = useCallback(
    async (text: string, toolChoice?: DeepToolChoice) => {
      // EAGER CREATION: Create project on first message if not exists
      // This ensures session persistence is available from the start
      if (!projectId && onEnsureProject && !isEditMode) {
        await onEnsureProject();
        // projectId prop will update via parent state change
        // Session loading useEffect will trigger automatically
      }

      // Pass projectId and sessionId in the request body for API context
      // @see /src/app/api/chat/route.ts expects these in the body
      await sendMessage(
        { text },
        {
          body: {
            projectId: projectId || undefined,
            sessionId: sessionId || undefined,
            toolChoice,
          },
        }
      );
    },
    [sendMessage, projectId, sessionId, onEnsureProject, isEditMode]
  );

  const handleSendMessage = useCallback(
    async (text: string) => {
      setError(null);
      setAgentQuickActions([]);

      const toolChoice = inferDeepToolChoice(text);

      try {
        await sendMessageWithContext(text, toolChoice);
      } catch (err) {
        console.error('[ChatWizard] Send error:', err);
        setError('Failed to send message. Please try again.');
      }
    },
    [sendMessageWithContext]
  );

  /**
   * Handle images changed from floating panel.
   */
  const handleImagesChange = useCallback((images: UploadedImage[]) => {
    setUploadedImages(images);
    logPreviewEvent('imagesUpdated', { count: images.length });
  }, [logPreviewEvent]);

  /**
   * Generate content from conversation + images.
   */
  const handleGenerate = useCallback(async () => {
    if (uploadedImages.length === 0) {
      setError('Please add at least one photo first.');
      return;
    }

    setPhase('analyzing');
    setError(null);

    try {
      let currentProjectId = projectId;

      if (!currentProjectId && onEnsureProject && !isEditMode) {
        try {
          currentProjectId = await onEnsureProject();
        } catch (err) {
          console.error('[ChatWizard] Failed to create project:', err);
          setError('Failed to start project. Please try again.');
          setPhase('conversation');
          return;
        }
      }

      if (!currentProjectId) {
        setError('Missing project context. Please try again.');
        setPhase('conversation');
        return;
      }

      // Step 1: Analyze images
      const analysisResponse = await fetch('/api/ai/analyze-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: currentProjectId }),
      });

      if (!analysisResponse.ok) {
        const message = await getResponseErrorMessage(
          analysisResponse,
          'Image analysis failed. Please try again.'
        );
        throw new Error(message);
      }

      const analysisResult = await analysisResponse.json();

      // Merge analysis with extracted data
      const analysis = analysisResult?.analysis as Record<string, unknown> | undefined;
      const analysisMaterials = normalizeStringArray(analysis?.materials);
      const analysisTechniques = normalizeStringArray(analysis?.techniques);

      const combinedData: ExtractedProjectData = {
        ...extractedData,
        ...(analysis ?? {}),
        materials_mentioned: mergeUniqueStrings(
          extractedData.materials_mentioned ?? [],
          analysisMaterials
        ),
        techniques_mentioned: mergeUniqueStrings(
          extractedData.techniques_mentioned ?? [],
          analysisTechniques
        ),
      };

      setExtractedData(combinedData);
      // Ensure project has the latest extracted data before generation.
      const projectUpdate: Record<string, unknown> = {};
      if (combinedData.project_type) projectUpdate.project_type = combinedData.project_type;
      if (combinedData.city) projectUpdate.city = combinedData.city;
      if (combinedData.state) projectUpdate.state = combinedData.state;
      if (combinedData.duration) projectUpdate.duration = combinedData.duration;
      if (combinedData.materials_mentioned?.length) {
        projectUpdate.materials = combinedData.materials_mentioned;
      }
      if (combinedData.techniques_mentioned?.length) {
        projectUpdate.techniques = combinedData.techniques_mentioned;
      }
      if (combinedData.customer_problem) {
        projectUpdate.challenge = combinedData.customer_problem;
      }
      if (combinedData.solution_approach) {
        projectUpdate.solution = combinedData.solution_approach;
      }

      if (Object.keys(projectUpdate).length > 0) {
        const syncResponse = await fetch(`/api/projects/${currentProjectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(projectUpdate),
        });

        if (!syncResponse.ok) {
          console.warn('[ChatWizard] Failed to sync project before generation.');
        }
      }

      setPhase('conversation');

      // Step 2: Ask the chat agent to generate content (unified flow)
      await sendMessage(
        { text: 'Generate the portfolio content now.' },
        {
          body: {
            projectId: currentProjectId,
            sessionId: sessionId || undefined,
            toolChoice: 'generatePortfolioContent',
          },
        }
      );
    } catch (err) {
      console.error('[ChatWizard] Generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate content. Please try again.');
      setPhase('conversation');
    }
  }, [projectId, uploadedImages, extractedData, onEnsureProject, isEditMode, sendMessage, sessionId]);

  /**
   * Handle opening the photo sheet (used by both button and artifact actions).
   */
  const handleOpenPhotoSheet = useCallback(() => {
    setShowPhotoSheet(true);
  }, []);

  const handleInsertPrompt = useCallback((text: string) => {
    setInputValue(text);
  }, []);

  const openFormPanel = useCallback(() => {
    if (!hasFormContent) return;
    if (canvasSize === 'collapsed') {
      setCanvasSize('medium');
    }
    setCanvasTab('form');
    setOverlayTab('form');
    setShowPreviewOverlay(true);
  }, [hasFormContent, canvasSize, setCanvasSize, setCanvasTab, setOverlayTab, setShowPreviewOverlay]);

  const handleQuickAction = useCallback(
    (action: Exclude<QuickActionType, 'insert'>) => {
      setAgentQuickActions([]);
      switch (action) {
        case 'addPhotos':
          handleOpenPhotoSheet();
          break;
        case 'generate':
          handleGenerate();
          break;
        case 'openForm':
          openFormPanel();
          break;
        case 'composeLayout':
          void (async () => {
            try {
              await sendMessageWithContext(
                'Compose a layout for this project.',
                'composePortfolioLayout'
              );
            } catch (err) {
              console.error('[ChatWizard] Compose layout error:', err);
              setError('Failed to compose layout. Please try again.');
            }
          })();
          break;
        case 'checkPublishReady':
          void (async () => {
            try {
              await sendMessageWithContext(
                'Check if this project is ready to publish.',
                'checkPublishReady'
              );
            } catch (err) {
              console.error('[ChatWizard] Publish readiness error:', err);
              setError('Failed to check publish readiness. Please try again.');
            }
          })();
          break;
        case 'showPreview':
          if (canvasSize === 'collapsed') {
            setCanvasSize('medium');
          }
          setCanvasTab('preview');
          setOverlayTab('preview');
          setShowPreviewOverlay(true);
          break;
        default:
          break;
      }
    },
    [
      handleGenerate,
      handleOpenPhotoSheet,
      openFormPanel,
      canvasSize,
      setCanvasSize,
      setCanvasTab,
      setOverlayTab,
      setShowPreviewOverlay,
      sendMessageWithContext,
    ]
  );

  const saveGeneratedContent = useCallback(
    async (content: GeneratePortfolioContentOutput) => {
      if (!projectId || !content?.success) return;

      setIsSavingContent(true);
      setError(null);

      try {
        const payload: Record<string, unknown> = {
          title: content.title,
          description: content.description,
          description_blocks: buildDescriptionBlocksFromContent({
            description: content.description,
            materials: extractedData.materials_mentioned,
            techniques: extractedData.techniques_mentioned,
            duration: extractedData.duration,
            proudOf: extractedData.proud_of,
          }),
          seo_title: content.seoTitle || undefined,
          seo_description: content.seoDescription || undefined,
          tags: content.tags,
        };

        if (extractedData.materials_mentioned?.length) {
          payload.materials = extractedData.materials_mentioned;
        }

        if (extractedData.techniques_mentioned?.length) {
          payload.techniques = extractedData.techniques_mentioned;
        }

        const response = await fetch(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          let message = 'Failed to save draft. Please try again.';
          try {
            const data = await response.json();
            if (data?.error?.message) {
              message = data.error.message;
            } else if (data?.message) {
              message = data.message;
            }
          } catch {
            // Ignore JSON parse errors and keep fallback message.
          }
          throw new Error(message);
        }

        setPhase('review');
        setSuccessMessage('Draft saved to your project.');
        onProjectUpdate?.();
        openFormPanel();
      } catch (err) {
        console.error('[ChatWizard] Failed to save draft:', err);
        setError(err instanceof Error ? err.message : 'Failed to save draft. Please try again.');
      } finally {
        setIsSavingContent(false);
      }
    },
    [projectId, extractedData, onProjectUpdate, openFormPanel]
  );

  /**
   * Update the latest ContentEditor tool part with regenerated content.
   * Task A6: Uses type guard for safe updates.
   */
  const updateContentEditorOutput = useCallback(
    (content: GeneratedContent) => {
      setMessages((currentMessages) => {
        for (let i = currentMessages.length - 1; i >= 0; i -= 1) {
          const message = currentMessages[i];
          // Task A6: Add proper null check for TypeScript safety
          if (!message || !message.parts || message.parts.length === 0) continue;

          // Task A6: Use type guard to find and validate ContentEditor part
          const partIndex = message.parts.findIndex(isContentEditorToolPart);

          if (partIndex === -1) continue;

          const part = message.parts[partIndex];
          // Task A6: Validate with type guard for TypeScript safety
          if (!isContentEditorToolPart(part)) continue;

          const nextOutput = {
            title: content.title,
            description: content.description,
            seo_title: content.seo_title,
            seo_description: content.seo_description,
            tags: content.tags,
            materials: content.materials,
            techniques: content.techniques,
            editable: true,
          };

          // Task A6: Create updated part, cast to maintain SDK compatibility
          // The spread preserves all SDK properties; we only update 'output'
          const nextParts = [...message.parts];
          nextParts[partIndex] = {
            ...part,
            output: nextOutput,
          } as typeof part;

          const nextMessages = [...currentMessages];
          nextMessages[i] = {
            ...message,
            parts: nextParts,
          };

          return nextMessages;
        }

        return currentMessages;
      });
    },
    [setMessages]
  );

  const applyDescriptionBlocks = useCallback(
    async (blocks: unknown): Promise<boolean> => {
      if (!projectId) {
        setError('Missing project context.');
        return false;
      }

      const sanitizedBlocks = sanitizeDescriptionBlocks(blocks);
      if (sanitizedBlocks.length === 0) {
        setError('No valid description blocks to save.');
        return false;
      }

      const descriptionHtml = blocksToHtml(sanitizedBlocks);

      setIsSavingContent(true);
      setError(null);

      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: descriptionHtml,
            description_blocks: sanitizedBlocks,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save description blocks');
        }

        setSuccessMessage('Description updated!');
        onProjectUpdate?.();
        return true;
      } catch (err) {
        console.error('[ChatWizard] Failed to save description blocks:', err);
        setError('Failed to save description blocks. Please try again.');
        return false;
      } finally {
        setIsSavingContent(false);
      }
    },
    [projectId, onProjectUpdate]
  );

  const applyImageOrder = useCallback(
    async (imageIds: string[]): Promise<boolean> => {
      if (!projectId) {
        setError('Missing project context.');
        return false;
      }

      if (!imageIds || imageIds.length === 0) {
        setError('Missing image order.');
        return false;
      }

      setIsSavingContent(true);
      setError(null);

      try {
        const response = await fetch(`/api/projects/${projectId}/images`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_ids: imageIds }),
        });

        if (!response.ok) {
          throw new Error('Failed to reorder images');
        }

        const reorderedImages = imageIds
          .map((id) => uploadedImages.find((img) => img.id === id))
          .filter(Boolean) as typeof uploadedImages;
        setUploadedImages(reorderedImages);

        setSuccessMessage('Images reordered.');
        onProjectUpdate?.();
        return true;
      } catch (err) {
        console.error('[ChatWizard] Failed to reorder images:', err);
        setError(err instanceof Error ? err.message : 'Failed to reorder images.');
        return false;
      } finally {
        setIsSavingContent(false);
      }
    },
    [projectId, uploadedImages, onProjectUpdate]
  );

  /**
   * Handle artifact actions from ImageGalleryArtifact and other artifacts.
   * Routes actions to the appropriate handlers from useInlineImages.
   */
  const handleArtifactAction = useCallback(
    (action: { type: string; payload?: unknown }) => {
      if (action.type === 'suggestQuickActions') {
        const nextActions = coerceQuickActionSuggestions(action.payload);
        if (nextActions.length > 0) {
          setAgentQuickActions(nextActions);
        }
        return;
      }

      if (action.type === 'accept') {
        const payload = action.payload as {
          title: string;
          description: string;
          seo_title?: string;
          seo_description?: string;
          tags?: string[];
          materials?: string[];
          techniques?: string[];
        };

        if (!payload?.title || !payload?.description) {
          setError('Missing content to save. Please try again.');
          return;
        }

        setIsSavingContent(true);
        setError(null);

        void (async () => {
          try {
            const response = await fetch(`/api/projects/${projectId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: payload.title,
                description: payload.description,
                description_blocks: buildDescriptionBlocksFromContent({
                  description: payload.description,
                  materials: extractedData.materials_mentioned,
                  techniques: extractedData.techniques_mentioned,
                  duration: extractedData.duration,
                  proudOf: extractedData.proud_of,
                }),
                seo_title: payload.seo_title,
                seo_description: payload.seo_description,
                tags: payload.tags,
                materials: payload.materials,
                techniques: payload.techniques,
              }),
            });

            if (!response.ok) {
              let message = 'Failed to save content. Please try again.';
              try {
                const data = await response.json();
                if (data?.error?.message) {
                  message = data.error.message;
                } else if (data?.message) {
                  message = data.message;
                }
              } catch {
                // Ignore JSON parse errors and keep fallback message.
              }
              throw new Error(message);
            }

            setPhase('review');
            setSuccessMessage('Content saved to your project.');
            onProjectUpdate?.();
          } catch (err) {
            console.error('[ChatWizard] Failed to save content:', err);
            setError(err instanceof Error ? err.message : 'Failed to save content. Please try again.');
          } finally {
            setIsSavingContent(false);
          }
        })();
      } else if (action.type === 'acceptAndPublish') {
        // One-tap accept and publish flow
        const payload = action.payload as {
          title: string;
          description: string;
          seo_title?: string;
          seo_description?: string;
          tags?: string[];
          materials?: string[];
          techniques?: string[];
        };

        if (!payload?.title || !payload?.description) {
          setError('Missing content to save. Please try again.');
          return;
        }

        setIsSavingContent(true);
        setError(null);

        void (async () => {
          try {
            // Step 1: Save the content
            const saveResponse = await fetch(`/api/projects/${projectId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: payload.title,
                description: payload.description,
                description_blocks: buildDescriptionBlocksFromContent({
                  description: payload.description,
                  materials: extractedData.materials_mentioned,
                  techniques: extractedData.techniques_mentioned,
                  duration: extractedData.duration,
                  proudOf: extractedData.proud_of,
                }),
                seo_title: payload.seo_title,
                seo_description: payload.seo_description,
                tags: payload.tags,
                materials: payload.materials,
                techniques: payload.techniques,
              }),
            });

            if (!saveResponse.ok) {
              let message = 'Failed to save content. Please try again.';
              try {
                const data = await saveResponse.json();
                if (data?.error?.message) {
                  message = data.error.message;
                } else if (data?.message) {
                  message = data.message;
                }
              } catch {
                // Ignore JSON parse errors
              }
              throw new Error(message);
            }

            // Step 2: Publish the project
            const publishResponse = await fetch(`/api/projects/${projectId}/publish`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            });

            if (!publishResponse.ok) {
              let message = 'Content saved, but publishing failed. You can publish from the dashboard.';
              try {
                const data = await publishResponse.json();
                if (data?.error?.missing) {
                  message = `Cannot publish: ${(data.error.missing as string[]).join(', ')}`;
                } else if (data?.error?.code === 'FORBIDDEN') {
                  message = data.error.message ?? 'Publishing limit reached.';
                } else if (data?.error?.message) {
                  message = data.error.message;
                }
              } catch {
                // Ignore JSON parse errors
              }
              throw new Error(message);
            }

            setPhase('review');
            setSuccessMessage('Project published! Your portfolio is now live.');
            triggerMilestone('published');
            onProjectUpdate?.();
          } catch (err) {
            console.error('[ChatWizard] Accept & Publish error:', err);
            setError(err instanceof Error ? err.message : 'Failed to publish. Please try again.');
          } finally {
            setIsSavingContent(false);
          }
        })();
      } else if (action.type === 'reject') {
        setPhase('review');
        setSuccessMessage('Okay, we can keep refining. Tell me what you want to change.');
      } else if (action.type === 'regenerate') {
        const payload = action.payload as {
          section?: 'title' | 'description' | 'seo';
          guidance?: string;
          preserveElements?: string[];
          current?: {
            title?: string;
            description?: string;
            seo_title?: string;
            seo_description?: string;
            tags?: string[];
            materials?: string[];
            techniques?: string[];
          };
        };

        const section = payload?.section;
        if (!section) {
          handleGenerate();
          return;
        }

        const feedbackParts: string[] = [];
        if (section === 'title') {
          feedbackParts.push('Regenerate only the title.');
        } else if (section === 'description') {
          feedbackParts.push('Regenerate only the description.');
        } else {
          feedbackParts.push('Regenerate only the SEO title and SEO description.');
        }

        feedbackParts.push('Keep all other fields consistent with the current content.');

        if (payload?.guidance) {
          feedbackParts.push(`Guidance: ${payload.guidance}.`);
        }
        if (payload?.preserveElements && payload.preserveElements.length > 0) {
          feedbackParts.push(`Preserve: ${payload.preserveElements.join(', ')}.`);
        }

        if (payload?.current?.title) {
          feedbackParts.push(`Current title: "${payload.current.title}".`);
        }
        if (payload?.current?.description) {
          feedbackParts.push('Use the existing description context when rewriting.');
        }
        if (payload?.current?.tags && payload.current.tags.length > 0) {
          feedbackParts.push(`Tags: ${payload.current.tags.join(', ')}.`);
        }
        if (payload?.current?.materials && payload.current.materials.length > 0) {
          feedbackParts.push(`Materials: ${payload.current.materials.join(', ')}.`);
        }
        if (payload?.current?.techniques && payload.current.techniques.length > 0) {
          feedbackParts.push(`Techniques: ${payload.current.techniques.join(', ')}.`);
        }

        setIsRegenerating(true);
        setRegeneratingSection(section);
        setError(null);

        // Task A5: Add AbortController with timeout for cleanup
        const abortController = new AbortController();
        const REGENERATE_TIMEOUT_MS = 30000; // 30 seconds
        const timeoutId = setTimeout(() => abortController.abort(), REGENERATE_TIMEOUT_MS);

        void (async () => {
          try {
            const previousContent =
              payload?.current?.title && payload?.current?.description
                ? {
                    title: payload.current.title,
                    description: payload.current.description,
                    seo_title: payload.current.seo_title,
                    seo_description: payload.current.seo_description,
                    tags: payload.current.tags,
                    materials: payload.current.materials,
                    techniques: payload.current.techniques,
                  }
                : undefined;

            const response = await fetch('/api/ai/generate-content?action=regenerate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                project_id: projectId,
                feedback: feedbackParts.join(' '),
                previous_content: previousContent,
              }),
              signal: abortController.signal, // Task A5: Enable cancellation
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
              let message = 'Failed to regenerate content. Please try again.';
              // Task A5: Safely handle non-JSON responses
              const contentType = response.headers.get('content-type');
              if (contentType?.includes('application/json')) {
                try {
                  const data = await response.json();
                  if (data?.error?.message) {
                    message = data.error.message;
                  } else if (data?.message) {
                    message = data.message;
                  }
                } catch {
                  // Ignore JSON parse errors
                }
              }
              throw new Error(message);
            }

            const data = await response.json();

            // Task A5: Validate response structure before using
            if (!data?.content || typeof data.content !== 'object') {
              throw new Error('Invalid response: missing content object.');
            }

            const { title, description } = data.content as Record<string, unknown>;
            if (!title || !description) {
              throw new Error('Invalid response: missing required fields (title, description).');
            }

            updateContentEditorOutput(data.content as GeneratedContent);
            setSuccessMessage(`Regenerated ${section} section.`);
          } catch (err) {
            console.error('[ChatWizard] Regeneration error:', err);

            // Task A5: Specific error messages for different failure types
            if (err instanceof DOMException && err.name === 'AbortError') {
              setError('Regeneration timed out. Please try again.');
            } else if (err instanceof TypeError && err.message.includes('fetch')) {
              setError('Network error. Check your connection and try again.');
            } else {
              setError(
                err instanceof Error
                  ? err.message
                  : 'Failed to regenerate content. Please try again.'
              );
            }
          } finally {
            clearTimeout(timeoutId);
            setIsRegenerating(false);
            setRegeneratingSection(null);
          }
        })();
      } else if (action.type === 'categorize') {
        const { imageId, category } = action.payload as {
          imageId: string;
          category: string;
        };
        categorizeImage(imageId, category as 'before' | 'after' | 'progress' | 'detail');
      } else if (action.type === 'remove') {
        const { imageId } = action.payload as { imageId: string };
        removeImage(imageId);
      } else if (action.type === 'add') {
        handleOpenPhotoSheet();
      } else if (action.type === 'showPreview') {
        const payload = action.payload as ShowPortfolioPreviewOutput | undefined;

        if (payload) {
          const nextHighlightFields = (payload.highlightFields || []).map((field) =>
            field.toLowerCase()
          );

          setPreviewHints((prev) => ({
            title: payload.title ?? prev.title,
            message: payload.message ?? prev.message,
            highlightFields: payload.highlightFields ? nextHighlightFields : prev.highlightFields,
            updatedAt: Date.now(),
          }));

          logPreviewEvent('showPortfolioPreview', {
            title: payload.title ?? null,
            message: payload.message ?? null,
            highlightFields: payload.highlightFields ?? null,
          });

          if (payload.highlightFields) {
            if (previewHighlightTimeout.current) {
              clearTimeout(previewHighlightTimeout.current);
            }
            previewHighlightTimeout.current = setTimeout(() => {
              setPreviewHints((prev) => ({ ...prev, highlightFields: [] }));
            }, 4000);
          }

          if (payload.message) {
            if (previewMessageTimeout.current) {
              clearTimeout(previewMessageTimeout.current);
            }
            previewMessageTimeout.current = setTimeout(() => {
              setPreviewHints((prev) => ({ ...prev, message: null }));
            }, 4000);
          }
        }

        // Side-effect from showPortfolioPreview tool - open mobile preview overlay
        // On desktop the preview is already visible in the split pane
        if (canvasSize === 'collapsed') {
          setCanvasSize('medium');
        }
        setCanvasTab('preview');
        setOverlayTab('preview');
        setShowPreviewOverlay(true);
      } else if (action.type === 'updateDescriptionBlocks') {
        const payload = action.payload as { blocks?: unknown };

        if (!payload?.blocks) {
          setError('Missing description blocks to save.');
          return;
        }

        void applyDescriptionBlocks(payload.blocks);
      } else if (action.type === 'composePortfolioLayout') {
        const payload = action.payload as {
          blocks?: unknown;
          imageOrder?: string[];
          confidence?: number;
          missingContext?: string[];
        } | undefined;

        if (!payload) {
          setError('Missing layout data to apply.');
          return;
        }

        void (async () => {
          if (payload.blocks) {
            const sanitizedBlocks = sanitizeDescriptionBlocks(payload.blocks);
            const confidence = payload.confidence ?? 1;
            const missingCount = payload.missingContext?.length ?? 0;
            const canApplyBlocks =
              sanitizedBlocks.length > 0 && confidence >= 0.4 && missingCount <= 6;

            if (canApplyBlocks) {
              await applyDescriptionBlocks(sanitizedBlocks);
            }
          }

          if (payload.imageOrder && payload.imageOrder.length > 0) {
            await applyImageOrder(payload.imageOrder);
          }
        })();
      } else if (action.type === 'openForm') {
        openFormPanel();
      } else if (action.type === 'updateProjectData') {
        // ===== EDIT MODE: Update multiple project data fields =====
        const payload = action.payload as {
          project_type?: string;
          materials?: string[];
          techniques?: string[];
        };

        if (
          !payload ||
          (typeof payload.project_type === 'undefined' &&
            typeof payload.materials === 'undefined' &&
            typeof payload.techniques === 'undefined')
        ) {
          setError('Missing project data to update.');
          return;
        }

        setIsSavingContent(true);
        setError(null);

        void (async () => {
          try {
            const response = await fetch(`/api/projects/${projectId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                project_type: payload.project_type,
                materials: payload.materials,
                techniques: payload.techniques,
              }),
            });

            if (!response.ok) {
              throw new Error('Failed to update project data');
            }

            // Keep extracted data in sync for live preview
            setExtractedData((prev) => ({
              ...prev,
              project_type: payload.project_type ?? prev.project_type,
              materials_mentioned: payload.materials ?? prev.materials_mentioned,
              techniques_mentioned: payload.techniques ?? prev.techniques_mentioned,
            }));
            const updatedFields = [
              payload.project_type !== undefined && 'project_type',
              payload.materials !== undefined && 'materials',
              payload.techniques !== undefined && 'techniques',
            ].filter(Boolean) as string[];
            logPreviewEvent('projectDataUpdated', { fields: updatedFields });

            setSuccessMessage('Project data updated.');
            onProjectUpdate?.();
          } catch (err) {
            console.error('[ChatWizard] Failed to update project data:', err);
            setError(err instanceof Error ? err.message : 'Failed to update project data.');
          } finally {
            setIsSavingContent(false);
          }
        })();
      } else if (action.type === 'updateField') {
        // ===== EDIT MODE: Update a specific field =====
        const payload = action.payload as {
          field: string;
          value: string | string[];
          reason?: string;
        };

        if (!payload?.field || payload?.value === undefined) {
          setError('Missing field or value for update.');
          return;
        }

        setIsSavingContent(true);
        setError(null);

        void (async () => {
          try {
            const updatePayload: Record<string, unknown> = {
              [payload.field]: payload.value,
            };

            if (payload.field === 'description' && typeof payload.value === 'string') {
              updatePayload.description_blocks = buildDescriptionBlocksFromContent({
                description: payload.value,
                materials: extractedData.materials_mentioned,
                techniques: extractedData.techniques_mentioned,
                duration: extractedData.duration,
                proudOf: extractedData.proud_of,
              });
            }

            const response = await fetch(`/api/projects/${projectId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatePayload),
            });

            if (!response.ok) {
              throw new Error('Failed to update field');
            }

            if (payload.field === 'materials' && Array.isArray(payload.value)) {
              setExtractedData((prev) => ({
                ...prev,
                materials_mentioned: payload.value as string[],
              }));
              logPreviewEvent('projectDataUpdated', { fields: ['materials'] });
            }
            if (payload.field === 'techniques' && Array.isArray(payload.value)) {
              setExtractedData((prev) => ({
                ...prev,
                techniques_mentioned: payload.value as string[],
              }));
              logPreviewEvent('projectDataUpdated', { fields: ['techniques'] });
            }

            setSuccessMessage(`Updated ${payload.field}.`);
            onProjectUpdate?.();
          } catch (err) {
            console.error('[ChatWizard] Failed to update field:', err);
            setError(err instanceof Error ? err.message : 'Failed to update field.');
          } finally {
            setIsSavingContent(false);
          }
        })();
      } else if (action.type === 'reorderImages' || action.type === 'reorder') {
        // ===== EDIT MODE: Reorder images =====
        const payload = action.payload as {
          imageIds: string[];
          reason?: string;
        };

        if (!payload?.imageIds || payload.imageIds.length === 0) {
          setError('Missing image order.');
          return;
        }

        void applyImageOrder(payload.imageIds);
      } else if (action.type === 'validateForPublish') {
        // ===== EDIT MODE: Validate publish readiness =====
        // Issue #6: Use server-side validation via dry_run parameter
        // This ensures validation rules are consistent with actual publish endpoint
        void (async () => {
          try {
            // Call publish endpoint with dry_run=true for validation only
            const response = await fetch(`/api/projects/${projectId}/publish?dry_run=true`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
              throw new Error('Failed to validate project');
            }

            const { valid, missing } = await response.json();

            if (!valid && missing && missing.length > 0) {
              setError(`Not ready to publish. Missing: ${missing.join(', ')}`);
            } else {
              setSuccessMessage('Ready to publish! All requirements met.');
            }
          } catch (err) {
            console.error('[ChatWizard] Validation error:', err);
            setError('Failed to validate project.');
          }
        })();
      }
    },
    [
      canvasSize,
      categorizeImage,
      removeImage,
      handleOpenPhotoSheet,
      handleGenerate,
      openFormPanel,
      onProjectUpdate,
      projectId,
      setCanvasSize,
      setCanvasTab,
      updateContentEditorOutput,
      applyDescriptionBlocks,
      applyImageOrder,
      setShowPreviewOverlay,
      extractedData,
      logPreviewEvent,
      triggerMilestone,
    ]
  );

  useEffect(() => {
    if (!projectId || messages.length === 0) return;

    for (const message of messages) {
      if (!message.parts || message.parts.length === 0) continue;

      for (const part of message.parts) {
        if (part.type !== 'tool-generatePortfolioContent') continue;
        const toolPart = part as {
          state?: string;
          toolCallId?: string;
          output?: unknown;
        };

        if (toolPart.state !== 'output-available' || !toolPart.output || !toolPart.toolCallId) {
          continue;
        }

        if (processedGeneratedToolCalls.current.has(toolPart.toolCallId)) {
          continue;
        }

        processedGeneratedToolCalls.current.add(toolPart.toolCallId);

        const output = toolPart.output as GeneratePortfolioContentOutput;
        if (!output.success) {
          if (output.error) {
            setError(output.error);
          }
          continue;
        }

        void saveGeneratedContent(output);
      }
    }
  }, [messages, projectId, saveGeneratedContent]);

  // Clear error after 5 seconds (but not if canRetry - those are persistent)
  // Issue #4: Recoverable errors with retry capability should persist
  useEffect(() => {
    if (!error || canRetry) return;
    const timeout = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timeout);
  }, [error, canRetry]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (!successMessage) return;
    const timeout = setTimeout(() => setSuccessMessage(null), 5000);
    return () => clearTimeout(timeout);
  }, [successMessage]);

  useEffect(() => {
    return () => {
      if (previewHighlightTimeout.current) {
        clearTimeout(previewHighlightTimeout.current);
      }
      if (previewMessageTimeout.current) {
        clearTimeout(previewMessageTimeout.current);
      }
    };
  }, []);

  // Show loading state while session loads
  // NOTE: This early return is AFTER all hooks to satisfy Rules of Hooks
  if (isLoadingSession) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full', className)}>
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">
          {isEditMode ? 'Loading project...' : 'Loading conversation...'}
        </p>
      </div>
    );
  }

  return (
    <div className={cn('relative h-full min-h-0', className)}>
      <MilestoneToast milestone={currentMilestone} onDismiss={dismissMilestone} />
      {/*
        Split-pane layout (matching edit page):
        - Desktop (lg+): Flex with chat (flex-1) + collapsible canvas (400px)
        - Tablet/Mobile: Single column chat + preview pill/overlay
      */}
      <div className="flex h-full min-h-0">
        {/* ===== CHAT COLUMN ===== */}
        <div className="relative flex-1 min-w-0 flex flex-col h-full min-h-0 lg:border-r lg:border-border/50">
          {/* Save status indicator - subtle top-right badge */}
          {!isEditMode && saveStatus !== 'idle' && (
            <div className="absolute top-3 right-3 z-10">
              <SaveIndicator status={saveStatus} />
            </div>
          )}

          {/* Error display - floating at top center */}
          {/* Issue #4: Added retry button for recoverable errors */}
          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 max-w-[360px] w-full px-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20 shadow-lg animate-fade-in">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1 line-clamp-2">{error}</span>
                {canRetry && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    className="ml-2 h-7 px-2 text-xs border-destructive/30 hover:bg-destructive/10"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Success message display */}
          {successMessage && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 max-w-[360px] w-full px-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-600 text-sm border border-emerald-500/20 shadow-lg animate-fade-in">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <span className="line-clamp-2">{successMessage}</span>
              </div>
            </div>
          )}

          {/* Image upload error display */}
          {imageError && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 max-w-[360px] w-full px-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20 shadow-lg animate-fade-in">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="line-clamp-2">{imageError.message}</span>
                <button
                  onClick={clearImageError}
                  className="ml-auto hover:bg-destructive/20 rounded p-0.5"
                  aria-label="Dismiss error"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Chat messages - fills available space */}
          <ChatMessages
            messages={messages}
            isLoading={isLoading}
            onArtifactAction={handleArtifactAction}
            images={uploadedImages}
            className="flex-1 overflow-y-auto"
            isSaving={isSavingContent}
            processedSideEffectToolCallIds={processedSideEffectToolCalls.current}
          />

          {/* Loading indicator for analysis/generation - centered overlay */}
          {(phase === 'analyzing' || phase === 'generating') && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
              <div className="flex flex-col items-center gap-3 animate-fade-in">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  {phase === 'analyzing' ? 'Analyzing your photos...' : 'Writing your description...'}
                </span>
              </div>
            </div>
          )}

          {isSavingContent && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm z-10">
              <div className="flex flex-col items-center gap-3 animate-fade-in">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  Saving your edits...
                </span>
              </div>
            </div>
          )}

          {isRegenerating && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm z-10">
              <div className="flex flex-col items-center gap-3 animate-fade-in">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  {regeneratingSection
                    ? `Regenerating ${regeneratingSection}...`
                    : 'Regenerating content...'}
                </span>
              </div>
            </div>
          )}

          {/* Peek bar - visible on mobile and tablet, hidden on desktop (which has side canvas) */}
          <div className="lg:hidden">
            <CollectedDataPeekBar
              data={projectData}
              completeness={completeness}
              onExpand={() => {
                setOverlayTab('preview');
                setShowPreviewOverlay(true);
              }}
            />
          </div>

          {/* Fixed bottom input area with gradient fade */}
          {(phase === 'conversation' || phase === 'review') && (
            <div className="sticky bottom-0 pb-4 pt-3 bg-gradient-to-t from-background via-background/95 to-transparent">
              <div className="max-w-[720px] mx-auto px-4">
                {/* Quick actions - only show early in conversation */}
                {messages.length <= 2 && quickActions.length > 0 && (
                  <QuickActionChips
                    actions={quickActions}
                    onInsertPrompt={handleInsertPrompt}
                    onAction={handleQuickAction}
                    disabled={isLoading}
                    className="mb-3"
                  />
                )}

                {/* Generate button - above input when ready */}
                {canGenerate && phase === 'conversation' && (
                  <Button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className={cn(
                      'w-full mb-3 rounded-full h-11',
                      completeness.visualState === 'ready' && 'animate-glow-pulse'
                    )}
                    size="lg"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Portfolio Page
                  </Button>
                )}

                {showMicPermissionPrompt && (
                  <MicPermissionPrompt
                    status={micPermissionStatus}
                    onRequestPermission={requestMicPermission}
                    isRequesting={isRequestingMicPermission}
                    compact
                    className="mb-2"
                  />
                )}

                {voiceMode === 'voice_chat' ? (
                  <VoiceLiveControls
                    status={liveVoiceSession.status}
                    isConnected={liveVoiceSession.isConnected}
                    isContinuousMode={liveVoiceSession.isContinuousMode}
                    audioLevel={liveVoiceSession.audioLevel}
                    liveUserTranscript={liveVoiceSession.liveUserTranscript}
                    liveAssistantTranscript={liveVoiceSession.liveAssistantTranscript}
                    error={liveVoiceSession.error}
                    onPressStart={
                      canStartLiveVoice ? liveVoiceSession.startTalking : requestMicPermission
                    }
                    onPressEnd={liveVoiceSession.stopTalking}
                    onDisconnect={liveVoiceSession.disconnect}
                    onTalkModeChange={handleTalkModeChange}
                    onReturnToText={() => setVoiceMode('text')}
                  />
                ) : (
                  <ChatInput
                    onSend={handleSendMessage}
                    onAttachPhotos={handleOpenPhotoSheet}
                    photoCount={uploadedImages.length}
                    disabled={isLoading}
                    isLoading={isLoading}
                    value={inputValue}
                    onChange={setInputValue}
                    placeholder={inputPlaceholder}
                    enableVoice={enableVoiceInput}
                    onImageDrop={addImages}
                    voiceMode={voiceMode}
                    onVoiceModeChange={voiceChatAvailable ? setVoiceMode : undefined}
                    voiceChatEnabled={voiceChatAvailable}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* ===== CANVAS COLUMN (Desktop only) ===== */}
        <CanvasPanel
          projectId={projectId ?? 'new'}
          data={projectData}
          completeness={completeness}
          highlightFields={previewHints.highlightFields}
          previewMessage={previewHints.message}
          publicPreview={publicPreview}
          titleOverride={previewHints.title}
          size={canvasSize}
          onSizeChange={setCanvasSize}
          activeTab={hasFormContent ? canvasTab : 'preview'}
          onTabChange={setCanvasTab}
          formContent={formContent}
          className="hidden lg:flex"
        />
      </div>

      {/* ===== TABLET PREVIEW PILL (768-1023px) ===== */}
      <div className="hidden md:block lg:hidden">
        <PreviewPill
          title={previewTitle}
          percentage={completeness.percentage}
          onClick={() => {
            setOverlayTab('preview');
            setShowPreviewOverlay(true);
          }}
        />
      </div>

      {/* ===== PREVIEW OVERLAY (Tablet + Mobile) ===== */}
      <PreviewOverlay
        open={showPreviewOverlay}
        onOpenChange={setShowPreviewOverlay}
        data={projectData}
        completeness={completeness}
        publicPreview={publicPreview}
        titleOverride={previewHints.title}
        highlightFields={previewHints.highlightFields}
        previewMessage={previewHints.message}
        formContent={formContent}
        activeTab={overlayTab}
        onTabChange={setOverlayTab}
      />

      {/* Photo sheet (bottom drawer) */}
      <ChatPhotoSheet
        open={showPhotoSheet}
        onOpenChange={setShowPhotoSheet}
        projectId={projectId}
        images={uploadedImages}
        onImagesChange={handleImagesChange}
        disabled={isLoading}
        onEnsureProject={onEnsureProject}
      />
    </div>
  );
}
