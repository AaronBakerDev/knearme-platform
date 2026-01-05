'use client';

/**
 * Conversation-first onboarding chat component.
 *
 * Provides a simple chat interface for the Discovery Agent to gather
 * business information through natural conversation.
 *
 * Features:
 * - Clean chat UI without complex artifacts
 * - Business search results as clickable cards
 * - Auto-scroll to latest message
 * - State persistence across turns
 * - Voice input support
 *
 * @see /src/lib/agents/discovery.ts - Discovery Agent
 * @see /src/app/api/onboarding/route.ts - Onboarding API
 * @see /docs/philosophy/agentic-first-experience.md - Design philosophy
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { Button } from '@/components/ui/button';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatSurface } from '@/components/chat/ChatSurface';
import { Mic, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { DiscoveredBusiness } from '@/lib/tools/business-discovery';
import type { ProfileRevealData } from '@/types/artifacts';
import { logger } from '@/lib/logging';

// =============================================================================
// Types
// =============================================================================

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

function toUIMessage(message: Message): UIMessage {
  return {
    id: message.id,
    role: message.role,
    parts: [{ type: 'text', text: message.content }],
  };
}

function isToolPart(part: unknown): part is { type: string } {
  if (!part || typeof part !== 'object') return false;
  const obj = part as { type?: unknown };
  return typeof obj.type === 'string' && obj.type.startsWith('tool-');
}

interface OnboardingChatProps {
  /** Optional className for container */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function OnboardingChat({ className }: OnboardingChatProps) {
  const initialMessages = useMemo<UIMessage[]>(() => [], []);
  const stableChatId = useRef(
    `onboarding-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
  const { messages, sendMessage, status, setMessages } = useChat({
    id: stableChatId.current,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: '/api/onboarding',
    }),
  });
  const [searchResults, setSearchResults] = useState<DiscoveredBusiness[]>([]);
  const [searchPrompt, setSearchPrompt] = useState<string | undefined>();
  const [searchResultsKey, setSearchResultsKey] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  // Track which business card was selected (for loading state UI)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  // Profile reveal data (shown after profile is saved)
  const [profileReveal, setProfileReveal] = useState<ProfileRevealData | null>(null);
  const [profileRevealKey, setProfileRevealKey] = useState(0);
  const hasSentMessageRef = useRef(false);
  const processedWebSearchToolCalls = useRef<Set<string>>(new Set());
  const lastProcessedMessageIdRef = useRef<string | null>(null);
  const hasCompletedRef = useRef(false);

  const isLoading = status === 'streaming' || status === 'submitted';

  // Fetch initial conversation on mount
  useEffect(() => {
    const fetchConversation = async () => {
      try {
        const res = await fetch('/api/onboarding');

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to start onboarding');
        }

        const data = await res.json();

        if (Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages(
            data.messages.map((msg: Message) => toUIMessage(msg))
          );
        }

        if (data.state?.searchResults && data.state.searchResults.length > 0) {
          setSearchResults(data.state.searchResults);
          setSearchPrompt(undefined);
          setSearchResultsKey((prev) => prev + 1);
          setSelectedBusinessId(null);
        } else {
          setSearchResults([]);
          setSearchPrompt(undefined);
          setSelectedBusinessId(null);
        }
      } catch (error) {
      logger.error('[OnboardingChat] Failed to fetch onboarding conversation', { error });
        setInitError(error instanceof Error ? error.message : 'Failed to start onboarding');
      } finally {
        setIsInitializing(false);
      }
    };

    fetchConversation();
  }, []);

  useEffect(() => {
    if (status !== 'ready') return;
    if (!hasSentMessageRef.current) return;

    const lastAssistant = [...messages].reverse().find((message) => message.role === 'assistant');
    if (!lastAssistant || lastAssistant.id === lastProcessedMessageIdRef.current) return;

    lastProcessedMessageIdRef.current = lastAssistant.id;
    const parts = Array.isArray(lastAssistant.parts) ? lastAssistant.parts : [];

    const searchPart = parts.find((part) => {
      if (!isToolPart(part)) return false;
      return (
        part.type === 'tool-showBusinessSearchResults' &&
        (part as { state?: string }).state === 'output-available'
      );
    }) as { output?: { results?: DiscoveredBusiness[]; prompt?: string } } | undefined;

    const searchResultsOutput = searchPart?.output?.results;
    if (searchResultsOutput && searchResultsOutput.length > 0) {
      setSearchResults(searchResultsOutput);
      setSearchPrompt(searchPart?.output?.prompt);
      setSearchResultsKey((prev) => prev + 1);
    } else {
      setSearchResults([]);
      setSearchPrompt(undefined);
    }

    setSelectedBusinessId(null);

    // Check for profile reveal artifact
    const profileRevealPart = parts.find((part) => {
      if (!isToolPart(part)) return false;
      return (
        part.type === 'tool-showProfileReveal' &&
        (part as { state?: string }).state === 'output-available'
      );
    }) as { output?: { profile?: ProfileRevealData } } | undefined;

    if (profileRevealPart?.output?.profile) {
      setProfileReveal(profileRevealPart.output.profile);
      setProfileRevealKey((prev) => prev + 1);
      setSearchResults([]); // Clear search results when reveal shows
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        toast.success('Profile setup complete!');
      }
    }

    // Fallback: if saveProfile completed but no reveal, still mark complete (but don't redirect)
    const saveProfilePart = parts.find((part) => {
      if (!isToolPart(part)) return false;
      return (
        part.type === 'tool-saveProfile' &&
        (part as { state?: string }).state === 'output-available'
      );
    }) as { output?: { saved?: boolean } } | undefined;

    if (saveProfilePart?.output?.saved && !hasCompletedRef.current && !profileRevealPart) {
      // Only show toast if we don't have a reveal (reveal has its own celebration)
      hasCompletedRef.current = true;
      toast.success('Profile setup complete!');
    }
  }, [messages, status]);

  useEffect(() => {
    if (status !== 'ready') return;

    let didUpdate = false;
    const nextMessages = messages.map((message) => {
      if (message.role !== 'assistant' || !Array.isArray(message.parts)) return message;

      const hasSourceParts = message.parts.some((part) => {
        if (!part || typeof part !== 'object') return false;
        return (part as { type?: string }).type === 'source-url';
      });

      if (hasSourceParts) return message;

      const webSearchPart = message.parts.find((part) => {
        if (!isToolPart(part)) return false;
        return (
          part.type === 'tool-webSearchBusiness' &&
          (part as { state?: string }).state === 'output-available'
        );
      }) as {
        toolCallId?: string;
        output?: { sources?: Array<{ url?: string; title?: string }> };
      } | undefined;

      if (!webSearchPart?.toolCallId) return message;
      if (processedWebSearchToolCalls.current.has(webSearchPart.toolCallId)) return message;

      const sources = webSearchPart.output?.sources;
      if (!sources || sources.length === 0) return message;

      const sourceParts = sources
        .filter((source) => source?.url)
        .map((source, index) => ({
          type: 'source-url' as const,
          sourceId: `${webSearchPart.toolCallId}-${index}`,
          url: source.url as string,
          title: source.title,
        }));

      if (sourceParts.length === 0) return message;

      processedWebSearchToolCalls.current.add(webSearchPart.toolCallId);
      didUpdate = true;

      return {
        ...message,
        parts: [...message.parts, ...sourceParts],
      };
    });

    if (didUpdate) {
      setMessages(nextMessages);
    }
  }, [messages, status, setMessages]);

  /**
   * Send a message to the Discovery Agent
   */
  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;
      hasSentMessageRef.current = true;
      setSelectedBusinessId(null);

      try {
        await sendMessage({ text });
      } catch (error) {
        logger.error('[OnboardingChat] Failed to send message', { error });
        toast.error('Something went wrong. Please try again.');
        setSelectedBusinessId(null);
      }
    },
    [sendMessage, isLoading]
  );

  /**
   * Handle business selection from search results
   */
  const handleSelectBusiness = useCallback(
    (business: DiscoveredBusiness) => {
      // Mark this card as selected (shows loading state on the card)
      setSelectedBusinessId(business.googlePlaceId ?? null);

      // Send a message confirming the selection
      const confirmMessage = business.address
        ? `Yes, that's my business - ${business.name} at ${business.address}`
        : `Yes, that's us - ${business.name}`;
      handleSendMessage(confirmMessage);
    },
    [handleSendMessage]
  );

  /**
   * Handle "none of these" selection
   */
  const handleNoneOfThese = useCallback(() => {
    setSelectedBusinessId(null);
    handleSendMessage("None of these are my business. Let me tell you more about it.");
  }, [handleSendMessage]);

  const handleArtifactAction = useCallback(
    (action: { type: string; payload?: unknown }) => {
      if (action.type === 'selectBusiness' && action.payload) {
        handleSelectBusiness(action.payload as DiscoveredBusiness);
        return;
      }
      if (action.type === 'noneOfThese') {
        handleNoneOfThese();
      }
    },
    [handleSelectBusiness, handleNoneOfThese]
  );

  const displayMessages = useMemo(() => {
    const cleanedMessages = messages
      .map((message) => {
        if (!Array.isArray(message.parts)) return message;
        const filteredParts = message.parts.filter((part) => !isToolPart(part));
        if (filteredParts.length === 0) return null;
        return { ...message, parts: filteredParts };
      })
      .filter(Boolean) as UIMessage[];

    const artifactMessages: UIMessage[] = [];

    // Add search results artifact if present
    if (searchResults.length > 0) {
      artifactMessages.push({
        id: `onboarding-search-${searchResultsKey}`,
        role: 'assistant',
        parts: [
          {
            type: 'tool-showBusinessSearchResults',
            state: 'output-available',
            toolCallId: `onboarding-search-${searchResultsKey}`,
            input: { query: '' },
            output: {
              results: searchResults,
              prompt: searchPrompt,
              selectedId: selectedBusinessId ?? undefined,
            },
          },
        ],
      });
    }

    // Add profile reveal artifact if present (shown after profile is saved)
    if (profileReveal) {
      artifactMessages.push({
        id: `onboarding-reveal-${profileRevealKey}`,
        role: 'assistant',
        parts: [
          {
            type: 'tool-showProfileReveal',
            state: 'output-available',
            toolCallId: `onboarding-reveal-${profileRevealKey}`,
            input: {},
            output: profileReveal,
          },
        ],
      });
    }

    return [...cleanedMessages, ...artifactMessages];
  }, [messages, searchResults, searchPrompt, searchResultsKey, selectedBusinessId, profileReveal, profileRevealKey]);

  /**
   * Retry initialization
   */
  const handleRetry = () => {
    setIsInitializing(true);
    setInitError(null);
    window.location.reload();
  };

  // Loading state - elegant skeleton
  if (isInitializing) {
    return (
      <div className={cn('flex flex-col h-full', className)}>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-4 animate-fade-in">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-muted-foreground text-sm">Starting your setup...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (initError) {
    return (
      <div className={cn('flex flex-col h-full', className)}>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-4 max-w-md text-center">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Something went wrong</h2>
              <p className="text-sm text-muted-foreground">{initError}</p>
            </div>
            <Button onClick={handleRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <ChatSurface
        messages={displayMessages}
        isLoading={isLoading}
        onArtifactAction={handleArtifactAction}
        scrollOnLoad
        headerSlot={
          messages.length === 1 && messages[0]?.role === 'assistant' ? (
            <div className="px-4 pt-4">
              <div className="text-center pb-2 animate-fade-in">
                <p className="text-xs text-muted-foreground bg-muted/20 py-1.5 px-3 rounded-full inline-block mx-auto">
                  <Mic className="inline-block h-3 w-3 mr-1 opacity-60" />
                  Type or tap the mic to answer
                </p>
              </div>
            </div>
          ) : null
        }
        footerSlot={
          <div className="sticky bottom-0 pb-4 pt-3 bg-gradient-to-t from-background via-background/95 to-transparent">
            <div className="max-w-[720px] mx-auto px-4">
              <ChatInput
                value={inputValue}
                onChange={setInputValue}
                onSend={handleSendMessage}
                isLoading={isLoading}
                placeholder="Type your response..."
                enableVoice={true}
                aria-label="Your response"
              />
            </div>
          </div>
        }
      />
    </div>
  );
}
