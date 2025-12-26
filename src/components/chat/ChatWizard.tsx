'use client';

/**
 * Chat-based project creation wizard.
 *
 * Full-screen immersive chat interface for gathering project info,
 * uploading images, and generating portfolio content.
 *
 * Design: "Void Interface" - minimal chrome, floating elements,
 * messages centered in a 650px column.
 *
 * Uses Vercel AI SDK v6's useChat hook for streaming chat.
 * Persists conversation to database so users can resume sessions.
 *
 * @see /src/app/api/chat/route.ts for the streaming chat API
 * @see /src/app/api/chat/sessions/ for persistence API
 * @see https://sdk.vercel.ai/docs/ai-sdk-ui for AI SDK v6 docs
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { ChatPhotoSheet } from './ChatPhotoSheet';
import { Button } from '@/components/ui/button';
import { getOpeningMessage } from '@/lib/chat/chat-prompts';
import type { UploadedImage } from '@/components/upload/ImageUploader';
import type { ExtractedProjectData, ChatPhase } from '@/lib/chat/chat-types';
import { cn } from '@/lib/utils';

/**
 * Database message format from /api/chat/sessions endpoints.
 */
interface DbMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

/**
 * Convert database message to Vercel AI SDK UIMessage format.
 */
function dbMessageToUIMessage(dbMsg: DbMessage): UIMessage {
  return {
    id: dbMsg.id,
    role: dbMsg.role,
    parts: [{ type: 'text', text: dbMsg.content }],
  };
}

interface ChatWizardProps {
  /** Project ID to associate with this wizard session */
  projectId: string;
  /** Called when wizard completes successfully */
  onComplete?: (projectId: string) => void;
  /** Called when user wants to cancel */
  onCancel?: () => void;
  /** Optional additional className */
  className?: string;
}

/**
 * Main chat wizard component.
 *
 * Flow:
 * 1. Conversation - Gather project info (photos can be added anytime via floating button)
 * 2. Generate - When user has photos + conversation, they can generate content
 * 3. Review - User reviews/edits content
 * 4. Publish - Save and publish
 */
export function ChatWizard({
  projectId,
  onComplete,
  onCancel,
  className,
}: ChatWizardProps) {
  const [phase, setPhase] = useState<ChatPhase>('conversation');
  const [extractedData, setExtractedData] = useState<ExtractedProjectData>({});
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Photo sheet state (replaces floating panel)
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);

  // Session persistence state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // Track which messages have been saved to avoid duplicates
  const savedMessageIds = useRef<Set<string>>(new Set());
  const lastMessageCount = useRef<number>(0);

  // Create welcome message for new sessions
  const welcomeMessage: UIMessage = {
    id: 'welcome',
    role: 'assistant',
    parts: [{ type: 'text', text: getOpeningMessage() }],
  };

  // AI SDK v6 chat hook
  // NOTE: `messages` prop only sets initial value - use setMessages for async updates
  const { messages, sendMessage, status, setMessages } = useChat({
    id: `chat-${projectId}`,
    messages: [welcomeMessage],
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  });

  /**
   * Load existing session or create new one on mount.
   * Uses /api/chat/sessions/by-project/[projectId] which handles get-or-create.
   * Uses setMessages() to update chat after async load completes.
   */
  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch(`/api/chat/sessions/by-project/${projectId}`);
        if (!response.ok) {
          throw new Error('Failed to load session');
        }

        const { session, isNew } = await response.json();
        setSessionId(session.id);

        // If existing session with messages, restore them
        if (!isNew && session.messages && session.messages.length > 0) {
          const uiMessages = session.messages.map(dbMessageToUIMessage);

          // Use setMessages to update the chat with loaded messages
          setMessages(uiMessages);

          // Mark existing messages as already saved
          session.messages.forEach((msg: DbMessage) => {
            savedMessageIds.current.add(msg.id);
          });
          lastMessageCount.current = uiMessages.length;

          // Restore phase and extracted data if available
          if (session.phase) {
            setPhase(session.phase);
          }
          if (session.extracted_data && Object.keys(session.extracted_data).length > 0) {
            setExtractedData(session.extracted_data);
          }
        }
        // New session keeps the welcome message already set by useChat
      } catch (err) {
        console.error('[ChatWizard] Failed to load session:', err);
        // Keep welcome message on error
      } finally {
        setIsLoadingSession(false);
      }
    }

    loadSession();
  }, [projectId, setMessages]);

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
          // Extract text content from parts
          const textContent = msg.parts
            ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
            .map((p) => p.text)
            .join('\n') || '';

          if (!textContent) continue;

          const response = await fetch(`/api/chat/sessions/${sessionId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              role: msg.role,
              content: textContent,
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
   * Check for tool results in messages to extract data.
   *
   * In AI SDK v6, tool parts use type `tool-${toolName}` pattern
   * and have `state` and `output` properties.
   */
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant' && lastMessage.parts) {
      for (const part of lastMessage.parts) {
        // In v6, tool parts have type 'tool-extractProjectData'
        // and state 'output-available' when result is ready
        if (
          part.type === 'tool-extractProjectData' &&
          'state' in part &&
          part.state === 'output-available' &&
          'output' in part
        ) {
          const result = part.output as ExtractedProjectData;
          if (result) {
            setExtractedData((prev) => ({ ...prev, ...result }));
          }
        }
      }
    }
  }, [messages]);

  /**
   * Save extracted data to session when it changes.
   */
  useEffect(() => {
    if (!sessionId || Object.keys(extractedData).length === 0) return;

    // Debounce the save to avoid too many API calls
    const timeout = setTimeout(async () => {
      try {
        await fetch(`/api/chat/sessions/${sessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            extracted_data: extractedData,
            phase,
          }),
        });
      } catch (err) {
        console.error('[ChatWizard] Failed to save session data:', err);
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [sessionId, extractedData, phase]);

  const isLoading = status === 'streaming' || status === 'submitted';

  // Can generate when we have at least one photo and some conversation
  const canGenerate = uploadedImages.length > 0 && messages.length > 2;

  /**
   * Send a text message.
   * NOTE: All useCallback hooks must be declared BEFORE any conditional returns
   * to satisfy React's Rules of Hooks (consistent hook order on every render).
   */
  const handleSendMessage = useCallback(
    async (text: string) => {
      setError(null);
      try {
        await sendMessage({ text });
      } catch (err) {
        console.error('[ChatWizard] Send error:', err);
        setError('Failed to send message. Please try again.');
      }
    },
    [sendMessage]
  );

  /**
   * Handle voice recording (transcribe and send).
   */
  const handleVoiceRecording = useCallback(
    async (blob: Blob) => {
      setError(null);

      try {
        // Create form data for transcription API
        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm');

        const response = await fetch('/api/ai/transcribe', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Transcription failed');
        }

        const { text } = await response.json();

        if (text) {
          await sendMessage({ text });
        }
      } catch (err) {
        console.error('[ChatWizard] Transcription error:', err);
        setError('Failed to transcribe voice. Please try typing instead.');
      }
    },
    [sendMessage]
  );

  /**
   * Handle images changed from floating panel.
   */
  const handleImagesChange = useCallback((images: UploadedImage[]) => {
    setUploadedImages(images);
  }, []);

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
      // Step 1: Analyze images
      const analysisResponse = await fetch('/api/ai/analyze-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      });

      if (!analysisResponse.ok) {
        throw new Error('Image analysis failed');
      }

      const analysisResult = await analysisResponse.json();

      // Merge analysis with extracted data
      const combinedData = {
        ...extractedData,
        ...analysisResult.analysis,
      };

      setExtractedData(combinedData);
      setPhase('generating');

      // Step 2: Generate content
      const generateResponse = await fetch('/api/ai/generate-content?action=content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          image_analysis: analysisResult.analysis,
          extracted_data: combinedData,
        }),
      });

      if (!generateResponse.ok) {
        throw new Error('Content generation failed');
      }

      setPhase('review');

      // Redirect to edit page for review
      if (onComplete) {
        onComplete(projectId);
      }
    } catch (err) {
      console.error('[ChatWizard] Generation error:', err);
      setError('Failed to generate content. Please try again.');
      setPhase('conversation');
    }
  }, [projectId, uploadedImages, extractedData, onComplete]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (!error) return;
    const timeout = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timeout);
  }, [error]);

  // Show loading state while session loads
  // NOTE: This early return is AFTER all hooks to satisfy Rules of Hooks
  if (isLoadingSession) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full', className)}>
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">Loading conversation...</p>
      </div>
    );
  }

  return (
    <div className={cn('relative flex flex-col h-full', className)}>
      {/* Error display - floating at top center */}
      {error && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 max-w-[500px] w-full px-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20 shadow-lg animate-fade-in">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Chat messages - fills available space, centered column */}
      <ChatMessages
        messages={messages}
        isLoading={isLoading}
        className="flex-1"
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

      {/* Fixed bottom input area with gradient fade */}
      {(phase === 'conversation' || phase === 'review') && (
        <div className="sticky bottom-0 pb-6 pt-4 bg-gradient-to-t from-background via-background/95 to-transparent">
          <div className="max-w-[650px] mx-auto px-4">
            {/* Generate button - above input when ready */}
            {canGenerate && phase === 'conversation' && (
              <Button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full mb-3 rounded-full h-11"
                size="lg"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Portfolio Page
              </Button>
            )}

            {/* Floating input with attachment button */}
            <ChatInput
              onSend={handleSendMessage}
              onVoiceRecording={handleVoiceRecording}
              onAttachPhotos={() => setShowPhotoSheet(true)}
              photoCount={uploadedImages.length}
              disabled={isLoading}
              isLoading={isLoading}
              placeholder={
                phase === 'review'
                  ? 'Tell me what to change...'
                  : 'Type or tap mic to record...'
              }
            />
          </div>
        </div>
      )}

      {/* Photo sheet (bottom drawer) */}
      <ChatPhotoSheet
        open={showPhotoSheet}
        onOpenChange={setShowPhotoSheet}
        projectId={projectId}
        images={uploadedImages}
        onImagesChange={handleImagesChange}
        disabled={isLoading}
      />
    </div>
  );
}

/**
 * Phase indicator component.
 */
function PhaseIndicator({ phase, imageCount = 0 }: { phase: ChatPhase; imageCount?: number }) {
  const phases: { key: ChatPhase; label: string }[] = [
    { key: 'conversation', label: 'Chat' },
    { key: 'analyzing', label: 'Analyze' },
    { key: 'generating', label: 'Write' },
    { key: 'review', label: 'Review' },
    { key: 'published', label: 'Done' },
  ];

  const currentIndex = phases.findIndex((p) => p.key === phase);

  return (
    <div className="flex items-center gap-1">
      {phases.slice(0, 4).map((p, i) => (
        <div
          key={p.key}
          className={cn(
            'w-2 h-2 rounded-full transition-colors',
            i < currentIndex
              ? 'bg-primary'
              : i === currentIndex
                ? 'bg-primary animate-pulse'
                : 'bg-muted-foreground/30'
          )}
          title={p.label}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-2">
        {phases[currentIndex]?.label ?? 'Chat'}
        {imageCount > 0 && phase === 'conversation' && (
          <span className="ml-1 text-primary">• {imageCount} photo{imageCount !== 1 ? 's' : ''}</span>
        )}
      </span>
    </div>
  );
}
