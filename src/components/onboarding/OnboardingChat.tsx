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

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { UIMessage } from 'ai';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatSurface } from '@/components/chat/ChatSurface';
import { Mic, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { DiscoveredBusiness } from '@/lib/tools/business-discovery';

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

function buildUIMessage(role: 'user' | 'assistant', content: string): UIMessage {
  return {
    id: `${role}-${Date.now()}`,
    role,
    parts: [{ type: 'text', text: content }],
  };
}

interface OnboardingChatProps {
  /** Optional className for container */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function OnboardingChat({ className }: OnboardingChatProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [searchResults, setSearchResults] = useState<DiscoveredBusiness[]>([]);
  const [searchResultsKey, setSearchResultsKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);

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

        if (data.conversationId) {
          setConversationId(data.conversationId);
        }

        if (Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages(
            data.messages.map((msg: Message) => toUIMessage(msg))
          );
        }

        if (data.state?.searchResults && data.state.searchResults.length > 0) {
          setSearchResults(data.state.searchResults);
          setSearchResultsKey((prev) => prev + 1);
        }
      } catch (error) {
        console.error('Failed to fetch onboarding conversation:', error);
        setInitError(error instanceof Error ? error.message : 'Failed to start onboarding');
      } finally {
        setIsInitializing(false);
      }
    };

    fetchConversation();
  }, []);

  /**
   * Send a message to the Discovery Agent
   */
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMessage = buildUIMessage('user', text);

      setMessages((prev) => [...prev, userMessage]);
      setInputValue('');
      setIsLoading(true);
      setSearchResults([]); // Clear previous search results

      try {
        const res = await fetch('/api/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            conversationId,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to send message');
        }

        const data = await res.json();

        // Add assistant response
        if (data.message) {
          setMessages((prev) => [...prev, buildUIMessage('assistant', data.message)]);
        }

        // Show search results if present
        if (data.state?.searchResults && data.state.searchResults.length > 0) {
          setSearchResults(data.state.searchResults);
          setSearchResultsKey((prev) => prev + 1);
        }

        // Handle completion
        if (data.isComplete) {
          toast.success('Profile setup complete!');
          router.push('/dashboard');
          router.refresh();
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        toast.error('Something went wrong. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, isLoading, router]
  );

  /**
   * Handle business selection from search results
   */
  const handleSelectBusiness = useCallback(
    (business: DiscoveredBusiness) => {
      // Send a message confirming the selection
      const confirmMessage = business.address
        ? `Yes, that's my business - ${business.name} at ${business.address}`
        : `Yes, that's us - ${business.name}`;
      sendMessage(confirmMessage);
    },
    [sendMessage]
  );

  /**
   * Handle "none of these" selection
   */
  const handleNoneOfThese = useCallback(() => {
    sendMessage("None of these are my business. Let me tell you more about it.");
  }, [sendMessage]);

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
    if (searchResults.length === 0) return messages;

    const toolMessage: UIMessage = {
      id: `onboarding-search-${searchResultsKey}`,
      role: 'assistant',
      parts: [
        {
          type: 'tool-showBusinessSearchResults',
          state: 'output-available',
          toolCallId: `onboarding-search-${searchResultsKey}`,
          input: { query: '' }, // Required by UIMessagePart type
          output: { results: searchResults },
        },
      ],
    };

    return [...messages, toolMessage];
  }, [messages, searchResults, searchResultsKey]);

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
                onSend={sendMessage}
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
