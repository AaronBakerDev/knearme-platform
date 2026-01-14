/**
 * Production-ready React Chat Component for Claude Agent SDK
 *
 * Features:
 * - WebSocket connection with auto-reconnect and heartbeat
 * - Streaming text rendering with smooth scrolling
 * - Tool use visualization with loading states
 * - Session persistence via localStorage
 * - Mobile responsive with dark mode support
 *
 * @requires react ^18.0.0
 * @requires tailwindcss ^3.0.0
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';

// ============================================================================
// Types
// ============================================================================

interface ToolUse {
  name: string;
  status: 'running' | 'complete';
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  toolUse?: ToolUse[];
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface WebSocketMessage {
  type: 'text' | 'tool_use' | 'tool_result' | 'error' | 'done' | 'pong';
  content?: string;
  tool?: string;
  status?: 'running' | 'complete';
  error?: string;
  messageId?: string;
}

interface ChatComponentProps {
  /** WebSocket endpoint URL */
  wsUrl?: string;
  /** Initial session ID (optional, will generate if not provided) */
  initialSessionId?: string;
  /** Custom class name for container */
  className?: string;
  /** Placeholder text for input */
  placeholder?: string;
}

// ============================================================================
// Utilities
// ============================================================================

const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

const formatTime = (timestamp: number): string =>
  new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

const SESSION_STORAGE_KEY = 'chat-session-id';
const MESSAGES_STORAGE_KEY = 'chat-messages';

// ============================================================================
// Custom Hooks
// ============================================================================

function useWebSocket(
  url: string,
  sessionId: string,
  onMessage: (msg: WebSocketMessage) => void
) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef<NodeJS.Timeout>();
  const pingInterval = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus('connecting');
    const wsUrlWithSession = `${url}?sessionId=${sessionId}`;
    const ws = new WebSocket(wsUrlWithSession);

    ws.onopen = () => {
      setStatus('connected');
      reconnectAttempts.current = 0;

      // Start heartbeat
      pingInterval.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WebSocketMessage;
        onMessage(data);
      } catch {
        console.error('Failed to parse WebSocket message');
      }
    };

    ws.onerror = () => {
      setStatus('error');
    };

    ws.onclose = () => {
      setStatus('disconnected');
      clearInterval(pingInterval.current);

      // Exponential backoff reconnection
      const maxAttempts = 10;
      if (reconnectAttempts.current < maxAttempts) {
        const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 30000);
        reconnectAttempts.current += 1;
        reconnectTimeout.current = setTimeout(connect, delay);
      }
    };

    wsRef.current = ws;
  }, [url, sessionId, onMessage]);

  const disconnect = useCallback(() => {
    clearTimeout(reconnectTimeout.current);
    clearInterval(pingInterval.current);
    reconnectAttempts.current = 999; // Prevent auto-reconnect
    wsRef.current?.close();
  }, []);

  const send = useCallback((message: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'message', content: message }));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return { status, send, reconnect: connect };
}

function useAutoScroll(dependency: unknown) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [dependency]);

  return containerRef;
}

function useSessionStorage(initialSessionId?: string) {
  const [sessionId, setSessionId] = useState<string>(() => {
    if (initialSessionId) return initialSessionId;
    if (typeof window !== 'undefined') {
      return localStorage.getItem(SESSION_STORAGE_KEY) || generateId();
    }
    return generateId();
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(MESSAGES_STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }, [sessionId]);

  useEffect(() => {
    localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const newSession = useCallback(() => {
    const newId = generateId();
    setSessionId(newId);
    setMessages([]);
    localStorage.removeItem(MESSAGES_STORAGE_KEY);
  }, []);

  return { sessionId, messages, setMessages, newSession };
}

// ============================================================================
// Sub-Components
// ============================================================================

const ConnectionIndicator: React.FC<{ status: ConnectionStatus }> = ({
  status,
}) => {
  const config = {
    connecting: { color: 'bg-yellow-500', label: 'Connecting...' },
    connected: { color: 'bg-green-500', label: 'Connected' },
    disconnected: { color: 'bg-gray-500', label: 'Disconnected' },
    error: { color: 'bg-red-500', label: 'Error' },
  };

  const { color, label } = config[status];

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
      <span
        className={`h-2 w-2 rounded-full ${color} ${
          status === 'connecting' ? 'animate-pulse' : ''
        }`}
      />
      <span>{label}</span>
    </div>
  );
};

const ToolIndicator: React.FC<{ tools: ToolUse[] }> = ({ tools }) => {
  const activeTools = tools.filter((t) => t.status === 'running');
  if (activeTools.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500">
      {activeTools.map((tool, idx) => (
        <div
          key={idx}
          className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300"
        >
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span>Using {tool.name}...</span>
        </div>
      ))}
    </div>
  );
};

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-md'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <div
          className={`mt-1 text-xs ${
            isUser
              ? 'text-blue-200'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {formatTime(message.timestamp)}
        </div>
        {message.toolUse && message.toolUse.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {message.toolUse.map((tool, idx) => (
              <span
                key={idx}
                className={`text-xs px-2 py-0.5 rounded-full ${
                  tool.status === 'complete'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}
              >
                {tool.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const TypingIndicator: React.FC = () => (
  <div className="flex justify-start">
    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  </div>
);

// ============================================================================
// Main Component
// ============================================================================

export const ChatComponent: React.FC<ChatComponentProps> = ({
  wsUrl = 'ws://localhost:3001/ws',
  initialSessionId,
  className = '',
  placeholder = 'Type a message...',
}) => {
  const { sessionId, messages, setMessages, newSession } =
    useSessionStorage(initialSessionId);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentTools, setCurrentTools] = useState<ToolUse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null
  );
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useAutoScroll([messages, isTyping]);

  const handleWebSocketMessage = useCallback(
    (msg: WebSocketMessage) => {
      switch (msg.type) {
        case 'text': {
          const messageId = msg.messageId || streamingMessageId || generateId();

          setMessages((prev) => {
            const existingIdx = prev.findIndex((m) => m.id === messageId);
            if (existingIdx >= 0) {
              // Append to existing streaming message
              const updated = [...prev];
              updated[existingIdx] = {
                ...updated[existingIdx],
                content: updated[existingIdx].content + (msg.content || ''),
              };
              return updated;
            }
            // New message
            return [
              ...prev,
              {
                id: messageId,
                role: 'assistant',
                content: msg.content || '',
                timestamp: Date.now(),
              },
            ];
          });

          setStreamingMessageId(messageId);
          setIsTyping(false);
          break;
        }

        case 'tool_use': {
          const tool: ToolUse = {
            name: msg.tool || 'unknown',
            status: msg.status || 'running',
          };
          setCurrentTools((prev) => [...prev, tool]);
          break;
        }

        case 'tool_result': {
          setCurrentTools((prev) =>
            prev.map((t) =>
              t.name === msg.tool ? { ...t, status: 'complete' } : t
            )
          );

          // Add tool use to current message
          if (streamingMessageId) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === streamingMessageId
                  ? {
                      ...m,
                      toolUse: [
                        ...(m.toolUse || []),
                        { name: msg.tool || 'unknown', status: 'complete' },
                      ],
                    }
                  : m
              )
            );
          }
          break;
        }

        case 'done':
          setIsTyping(false);
          setCurrentTools([]);
          setStreamingMessageId(null);
          break;

        case 'error':
          setError(msg.error || 'An error occurred');
          setIsTyping(false);
          setCurrentTools([]);
          break;

        case 'pong':
          // Heartbeat acknowledged
          break;
      }
    },
    [streamingMessageId, setMessages]
  );

  const { status, send, reconnect } = useWebSocket(
    wsUrl,
    sessionId,
    handleWebSocketMessage
  );

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const trimmed = input.trim();
      if (!trimmed || status !== 'connected') return;

      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: trimmed,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setIsTyping(true);
      setError(null);

      if (!send(trimmed)) {
        setError('Failed to send message. Please try again.');
        setIsTyping(false);
      }
    },
    [input, status, send, setMessages]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleNewSession = useCallback(() => {
    newSession();
    setError(null);
    setCurrentTools([]);
    setStreamingMessageId(null);
    reconnect();
  }, [newSession, reconnect]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [input]);

  const activeToolNames = useMemo(
    () => currentTools.filter((t) => t.status === 'running'),
    [currentTools]
  );

  return (
    <div
      className={`flex flex-col h-full bg-white dark:bg-gray-900 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <ConnectionIndicator status={status} />
        <button
          onClick={handleNewSession}
          className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300
                     bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200
                     dark:hover:bg-gray-700 transition-colors"
        >
          New Chat
        </button>
      </div>

      {/* Messages Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p>Start a conversation...</p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isTyping && activeToolNames.length === 0 && <TypingIndicator />}
      </div>

      {/* Tool Indicator */}
      {activeToolNames.length > 0 && <ToolIndicator tools={activeToolNames} />}

      {/* Error Display */}
      {error && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-l-2 border-red-500">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Reconnect Button */}
      {status === 'disconnected' && (
        <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20">
          <button
            onClick={reconnect}
            className="w-full py-2 text-sm font-medium text-yellow-700 dark:text-yellow-300
                       hover:underline"
          >
            Connection lost. Click to reconnect.
          </button>
        </div>
      )}

      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-gray-200 dark:border-gray-700 p-4"
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={status !== 'connected'}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-300 dark:border-gray-600
                       bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-gray-100
                       placeholder-gray-500 dark:placeholder-gray-400
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!input.trim() || status !== 'connected' || isTyping}
            className="flex-shrink-0 h-10 w-10 rounded-xl bg-blue-600 text-white
                       flex items-center justify-center hover:bg-blue-700
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatComponent;
