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
import { useParams } from 'next/navigation';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { Loader2, AlertCircle, Sparkles, X, CheckCircle2, RefreshCw } from 'lucide-react';
import { ChatSurface } from './ChatSurface';
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
import { type ProjectState } from '@/lib/chat/project-state';
import {
  useInlineImages,
  useProjectData,
  useCompleteness,
  usePersistence,
  useProjectHydration,
  useQuickActions,
  useUIState,
  useVoiceModeManager,
  useLiveVoiceSession,
  useMilestoneToasts,
  MilestoneToast,
} from './hooks';
import { useContentActions } from './handlers/useContentActions';
import { useExportActions } from './handlers/useExportActions';
import { useFormActions } from './handlers/useFormActions';
import { useGenerationActions } from './handlers/useGenerationActions';
import { usePhotoActions } from './handlers/usePhotoActions';
import { usePreviewActions } from './handlers/usePreviewActions';
import { usePublishActions } from './handlers/usePublishActions';
import type { QuickActionItem, QuickActionType } from './hooks';
import { SaveIndicator } from './artifacts/shared/SaveStatusBadge';
import type { UploadedImage } from '@/components/upload/ImageUploader';
import type { ExtractedProjectData, ChatPhase, GeneratedContent } from '@/lib/chat/chat-types';
import type { GeneratePortfolioContentOutput } from '@/lib/chat/tool-schemas';
import {
  coerceQuickActionSuggestions,
  getResponseErrorMessage,
  inferDeepToolChoice,
  isContentEditorToolPart,
  mergeQuickActions,
  mergeUniqueStrings,
  normalizeStringArray,
  type DeepToolChoice,
} from '@/lib/chat/wizard-utils';
import { cn } from '@/lib/utils';
import {
  buildDescriptionBlocksFromContent,
} from '@/lib/content/description-blocks.client';
import { blocksToHtml, sanitizeDescriptionBlocks } from '@/lib/content/description-blocks';
import type { Business, Contractor, Project, ProjectImage } from '@/types/database';
import type { RelatedProject } from '@/lib/data/projects';

/**
 * Mode determines whether ChatWizard is creating a new project or editing existing.
 *
 * @deprecated Use the unified interface without mode prop. ChatWizard now derives
 * its behavior from project state (empty, has content, published) rather than
 * an explicit mode. The mode prop is kept for backward compatibility but will
 * be removed in a future version.
 *
 * - 'create': Gathering project info from scratch, uses conversation prompts
 * - 'edit': Refining existing project content, loads project data on mount
 */
export type ChatWizardMode = 'create' | 'edit';

interface ChatWizardProps {
  /**
   * Project ID to associate with this wizard session.
   *
   * In the new unified interface, projectId should always be provided (not null).
   * Projects are created before entering the chat workspace.
   *
   * Legacy behavior: In create mode, this can be null initially and set after
   * first message triggers project creation via onEnsureProject.
   */
  projectId: string | null;
  /**
   * Eager creation callback - creates project on first user message.
   *
   * @deprecated In the unified interface, projects are created before entering
   * the chat workspace. This prop is kept for backward compatibility with the
   * legacy /projects/new page.
   *
   * Only used when projectId is null. Returns the new project ID.
   * Called before sending the first message to enable immediate persistence.
   *
   * @see /src/app/(dashboard)/projects/new/page.tsx for implementation
   */
  onEnsureProject?: () => Promise<string>;
  /**
   * Operation mode - 'create' for new projects, 'edit' for existing.
   *
   * @deprecated ChatWizard now derives its behavior from project state.
   * When mode is not provided, behavior is determined by whether the project
   * has content, images, etc. This prop is kept for backward compatibility.
   */
  mode?: ChatWizardMode;
  /** Optional additional className */
  className?: string;
  /** Optional form content for the side panel */
  formContent?: React.ReactNode;
  /** Optional public preview data for full parity rendering */
  publicPreview?: {
    project: Project;
    /** Business data for the preview */
    business: Business | Contractor;
    images: (ProjectImage & { url?: string })[];
    relatedProjects?: RelatedProject[];
    /** @deprecated Use business instead */
    contractor?: Contractor;
  };
  /** Callback when project data changes */
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
  mode,
  className,
  formContent,
  publicPreview,
  onProjectUpdate,
}: ChatWizardProps) {
  // ==========================================================================
  // PROJECT STATE DERIVATION (Unified Interface)
  // ==========================================================================
  // Instead of explicit mode, derive behavior from project state after loading.
  // This enables a single chat interface that adapts to any project.
  //
  // Legacy: mode prop is still respected for backward compatibility.
  // When mode is provided, it takes precedence. When not provided, behavior
  // is derived from projectState after loading.
  // ==========================================================================

  // Derived project state - updated after loading project data
  const [projectState, setProjectState] = useState<ProjectState>({
    isEmpty: true,
    hasContent: false,
    hasImages: false,
    isPublished: false,
    isArchived: false,
    hasTitle: false,
    hasSeo: false,
  });

  // Backward compatibility: if mode is explicitly provided, use it
  // Otherwise, derive from project state (hasContent = edit-like behavior)
  const isEditMode = mode !== undefined
    ? mode === 'edit'
    : projectState.hasContent;

  const params = useParams();
  const routeProjectId = useMemo(() => {
    const param =
      (params as Record<string, string | string[] | undefined>)?.id ??
      (params as Record<string, string | string[] | undefined>)?.projectId;

    if (Array.isArray(param)) return param[0];
    return typeof param === 'string' ? param : undefined;
  }, [params]);

  const resolvedProjectId = projectId ?? routeProjectId ?? null;
  const projectIdRef = useRef<string | null>(resolvedProjectId);

  useEffect(() => {
    projectIdRef.current = resolvedProjectId;
  }, [resolvedProjectId]);

  // Initial phase/canvas based on mode or derived state
  // These will be updated after loading when we have full project data
  const [phase, setPhase] = useState<ChatPhase>(
    mode === 'edit' ? 'review' : 'conversation'
  );
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
  const {
    isSavingContent,
    setIsSavingContent,
    isRegenerating,
    setIsRegenerating,
    regeneratingSection,
    setRegeneratingSection,
    showPhotoSheet,
    setShowPhotoSheet,
    showPreviewOverlay,
    setShowPreviewOverlay,
    overlayTab,
    setOverlayTab,
    previewHints,
    setPreviewHints,
    previewHighlightTimeout,
    previewMessageTimeout,
  } = useUIState();
  const isMobile = useIsMobile();

  const milestoneReadyRef = useRef(false);
  const prevImageCountRef = useRef(0);
  const prevProjectTypeRef = useRef<string | undefined>(undefined);
  const prevMaterialsCountRef = useRef(0);
  const prevCanGenerateRef = useRef(false);
  const prevPhaseRef = useRef<ChatPhase>(phase);

  // Canvas state for desktop (matches edit page behavior)
  // Initial state based on mode, will be updated after loading based on projectState
  const [canvasSize, setCanvasSize] = useState<CanvasPanelSize>(
    mode === 'edit' ? 'medium' : 'collapsed'
  );
  const [canvasTab, setCanvasTab] = useState<CanvasTab>('preview');
  const [portfolioLayout, setPortfolioLayout] = useState<{
    tokens: import('@/lib/design/tokens').DesignTokens;
    blocks: import('@/lib/design/semantic-blocks').SemanticBlock[];
    rationale?: string;
  } | null>(null);
  const hasFormContent = Boolean(formContent);

  

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
    projectId: resolvedProjectId || '',
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

  const {
    sessionId,
    setSessionId,
    sessionIdRef,
    saveStatus,
    savedMessageIds,
    lastMessageCount,
    processedGeneratedToolCalls,
    processedSideEffectToolCalls,
  } = usePersistence({
    projectId,
    isEditMode,
    status,
    messages,
    phase,
    extractedData,
    setExtractedData,
    logPreviewEvent,
  });

  const { isLoadingSession, setIsLoadingSession } = useProjectHydration({
    projectId,
    mode,
    isEditMode,
    uploadedImages,
    setUploadedImages,
    setProjectState,
    setPhase,
    setCanvasSize,
    setExtractedData,
    setMessages,
    setSessionId,
    setError,
    setCanRetry,
    processedSideEffectToolCalls,
    savedMessageIds,
    lastMessageCount,
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
    let currentProjectId = projectIdRef.current ?? resolvedProjectId;

    if (!currentProjectId && onEnsureProject && !isEditMode) {
      currentProjectId = await onEnsureProject();
      projectIdRef.current = currentProjectId;
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
  }, [resolvedProjectId, onEnsureProject, isEditMode]);

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
   * @see /src/app/(dashboard)/projects/new/page.tsx for ensureProject implementation
   */
  const sendMessageWithContext = useCallback(
    async (text: string, toolChoice?: DeepToolChoice) => {
      let currentProjectId = projectIdRef.current ?? resolvedProjectId;

      // EAGER CREATION: Create project on first message if not exists
      // This ensures session persistence is available from the start
      if (!currentProjectId && onEnsureProject && !isEditMode) {
        currentProjectId = await onEnsureProject();
        projectIdRef.current = currentProjectId;
        // projectId prop will update via parent state change
        // Session loading useEffect will trigger automatically
      }

      // Pass projectId and sessionId in the request body for API context
      // @see /src/app/api/chat/route.ts expects these in the body
      await sendMessage(
        { text },
        {
          body: {
            projectId: currentProjectId || undefined,
            sessionId: sessionId || undefined,
            toolChoice,
          },
        }
      );
    },
    [sendMessage, resolvedProjectId, sessionId, onEnsureProject, isEditMode]
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
      let currentProjectId = projectIdRef.current ?? resolvedProjectId;

      if (!currentProjectId && onEnsureProject && !isEditMode) {
        try {
          currentProjectId = await onEnsureProject();
          projectIdRef.current = currentProjectId;
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
  }, [resolvedProjectId, uploadedImages, extractedData, onEnsureProject, isEditMode, sendMessage, sessionId]);

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
    // Only open overlay on mobile - desktop uses the canvas panel
    if (isMobile) {
      setShowPreviewOverlay(true);
    }
  }, [hasFormContent, canvasSize, setCanvasSize, setCanvasTab, setOverlayTab, setShowPreviewOverlay, isMobile]);

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
          // Only open overlay on mobile - desktop uses the canvas panel
          if (isMobile) {
            setShowPreviewOverlay(true);
          }
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
      isMobile,
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

  const handleFormAction = useFormActions({
    openFormPanel,
    handleInsertPrompt,
  });

  const handlePhotoAction = usePhotoActions({
    categorizeImage,
    removeImage,
    handleOpenPhotoSheet,
    applyImageOrder,
    setError,
  });

  const handlePreviewAction = usePreviewActions({
    canvasSize,
    isMobile,
    setCanvasSize,
    setCanvasTab,
    setOverlayTab,
    setShowPreviewOverlay,
    setPreviewHints,
    previewHighlightTimeoutRef: previewHighlightTimeout,
    previewMessageTimeoutRef: previewMessageTimeout,
    logPreviewEvent,
  });

  const handleContentAction = useContentActions({
    projectId,
    extractedData,
    setPhase,
    setIsSavingContent,
    setIsRegenerating,
    setRegeneratingSection,
    setError,
    setSuccessMessage,
    setExtractedData,
    logPreviewEvent,
    onProjectUpdate,
    handleGenerate,
    updateContentEditorOutput,
    applyDescriptionBlocks,
  });

  const handlePublishAction = usePublishActions({
    projectId,
    extractedData,
    setPhase,
    setIsSavingContent,
    setError,
    setSuccessMessage,
    triggerMilestone,
    onProjectUpdate,
  });

  const handleGenerationAction = useGenerationActions({
    canvasSize,
    setCanvasSize,
    setPortfolioLayout,
    applyDescriptionBlocks,
    applyImageOrder,
    setError,
  });

  const handleExportAction = useExportActions();

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
      const handled =
        handleFormAction(action) ||
        handlePhotoAction(action) ||
        handlePreviewAction(action) ||
        handleContentAction(action) ||
        handlePublishAction(action) ||
        handleGenerationAction(action) ||
        handleExportAction(action);

      if (!handled) {
        return;
      }
    },
    [
      handleContentAction,
      handleExportAction,
      handleFormAction,
      handleGenerationAction,
      handlePhotoAction,
      handlePreviewAction,
      handlePublishAction,
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

          <ChatSurface
            messages={messages}
            isLoading={isLoading}
            onArtifactAction={handleArtifactAction}
            images={uploadedImages}
            isSaving={isSavingContent}
            processedSideEffectToolCallIds={processedSideEffectToolCalls.current}
            className="flex-1 min-h-0"
            messagesClassName="flex-1 overflow-y-auto"
            footerSlot={
              <>
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
                {/* PHILOSOPHY: Always show input - no phase gating */}
                {/* User can type, upload, or generate at any point */}
                {phase !== 'analyzing' && phase !== 'generating' && (
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
                      {/* No phase gate - canGenerate alone decides visibility */}
                      {canGenerate && (
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
              </>
            }
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

        </div>

        {/* ===== CANVAS COLUMN (Desktop only) ===== */}
        <CanvasPanel
          projectId={resolvedProjectId ?? 'new'}
          data={projectData}
          completeness={completeness}
          highlightFields={previewHints.highlightFields}
          previewMessage={previewHints.message}
          publicPreview={publicPreview}
          titleOverride={previewHints.title}
          portfolioLayout={portfolioLayout}
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
        portfolioLayout={portfolioLayout}
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
        projectId={resolvedProjectId}
        images={uploadedImages}
        onImagesChange={handleImagesChange}
        disabled={isLoading}
        onEnsureProject={onEnsureProject}
      />
    </div>
  );
}
