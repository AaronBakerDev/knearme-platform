import { useEffect, useRef, useState } from 'react';
import type { UIMessage } from 'ai';
import type { ExtractedProjectData, ChatPhase } from '@/lib/chat/chat-types';
import type { ProjectState } from '@/lib/chat/project-state';
import type { ContextLoadResult } from '@/lib/chat/context-shared';
import type { UploadedImage } from '@/components/upload/ImageUploader';
import type { CanvasPanelSize } from '@/components/chat/CanvasPanel';
import type { ProjectImage } from '@/types/database';
import { createSummarySystemMessage } from '@/lib/chat/context-shared';
import { deriveProjectState, getInitialCanvasSize, getInitialPhase } from '@/lib/chat/project-state';
import { getAdaptiveOpeningMessage } from '@/lib/chat/chat-prompts';
import { extractSideEffectToolCallIds } from '@/lib/chat/wizard-utils';
import { formatProjectLocation } from '@/lib/utils/location';
import { resolveProjectImageUrl } from '@/lib/storage/project-images';
import { logger } from '@/lib/logging';

interface UseProjectHydrationParams {
  projectId: string | null;
  mode?: 'create' | 'edit';
  isEditMode: boolean;
  uploadedImages: UploadedImage[];
  setUploadedImages: React.Dispatch<React.SetStateAction<UploadedImage[]>>;
  setProjectState: React.Dispatch<React.SetStateAction<ProjectState>>;
  setPhase: React.Dispatch<React.SetStateAction<ChatPhase>>;
  setCanvasSize: React.Dispatch<React.SetStateAction<CanvasPanelSize>>;
  setExtractedData: React.Dispatch<React.SetStateAction<ExtractedProjectData>>;
  setMessages: (messages: UIMessage[] | ((prev: UIMessage[]) => UIMessage[])) => void;
  setSessionId: React.Dispatch<React.SetStateAction<string | null>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setCanRetry: React.Dispatch<React.SetStateAction<boolean>>;
  processedSideEffectToolCalls: React.MutableRefObject<Set<string>>;
  savedMessageIds: React.MutableRefObject<Set<string>>;
  lastMessageCount: React.MutableRefObject<number>;
}

export function useProjectHydration({
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
}: UseProjectHydrationParams) {
  // For create mode with no projectId, don't show loading state initially.
  // This avoids SSR/hydration issues where useEffect may not run immediately.
  const [isLoadingSession, setIsLoadingSession] = useState(() => {
    // Create mode without projectId: skip loading
    if (!projectId && mode === 'create') return false;
    // Edit mode or has projectId: show loading until session loads
    return true;
  });
  const uploadedImagesRef = useRef(uploadedImages);

  useEffect(() => {
    uploadedImagesRef.current = uploadedImages;
  }, [uploadedImages]);

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
          const isPublished = project.status === 'published';
          projectImages.sort(
            (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
          );
          const images = projectImages
            .filter((image) => typeof image.storage_path === 'string')
            .map((image) => ({
              id: image.id,
              url: resolveProjectImageUrl({
                projectId: projectId!, // Edit mode guarantees projectId exists
                imageId: image.id,
                storagePath: image.storage_path,
                isPublished,
              }),
              filename:
                image.storage_path.split('/').pop() ?? 'project-image',
              storage_path: image.storage_path,
              image_type: image.image_type ?? undefined,
              width: image.width ?? undefined,
              height: image.height ?? undefined,
            }));

          // Step 2: Set loaded data
          setUploadedImages(images || []);

          // Derive project state for unified interface
          // This enables behavior adaptation based on project content
          const derivedState = deriveProjectState(project, images);
          setProjectState(derivedState);

          // If mode was not explicitly provided, update phase and canvas
          // based on derived state (unified interface behavior)
          if (mode === undefined) {
            const initialPhase = getInitialPhase(derivedState);
            const initialCanvas = getInitialCanvasSize(derivedState);
            setPhase(initialPhase);
            setCanvasSize(initialCanvas);
          }

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
            // New session - show adaptive welcome message based on project state
            const greeting = getAdaptiveOpeningMessage({
              projectState: derivedState,
              title: project.title,
              hasExistingSession: false,
            });
            setMessages([{
              id: 'welcome',
              role: 'assistant',
              parts: [{ type: 'text', text: greeting }],
            }]);
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

              // Derive project state for unified interface (create mode)
              // Note: In create mode, we may not have full project data,
              // so we derive from what's available in context
              const derivedState = deriveProjectState(
                {
                  title: context.projectData.title,
                  description: context.projectData.description,
                  status: 'draft', // Create mode is always draft
                },
                uploadedImagesRef.current
              );
              setProjectState(derivedState);

              // If mode was not explicitly provided, update phase/canvas
              if (mode === undefined) {
                const initialPhase = getInitialPhase(derivedState);
                const initialCanvas = getInitialCanvasSize(derivedState);
                setPhase(initialPhase);
                setCanvasSize(initialCanvas);
              }
            }
          }
          // New session keeps the welcome message already set by useChat
        }
      } catch (err) {
        logger.error('[ChatWizard] Failed to load session', { error: err });
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
  }, [
    projectId,
    isEditMode,
    mode,
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
  ]);

  return { isLoadingSession, setIsLoadingSession };
}
