# UI Development Guide for Claude Agent SDK

This guide covers building real-time chat interfaces for Claude Agent SDK applications. Learn WebSocket streaming, React/Vue patterns, and production-ready UI components.

## Table of Contents

1. [WebSocket Streaming Architecture](#1-websocket-streaming-architecture)
2. [Message Types and Handling](#2-message-types-and-handling)
3. [React Chat Component Patterns](#3-react-chat-component-patterns)
4. [Vue Chat Component Patterns](#4-vue-chat-component-patterns)
5. [Session Persistence](#5-session-persistence)
6. [Error Handling UI](#6-error-handling-ui)
7. [Mobile Responsiveness](#7-mobile-responsiveness)
8. [File Upload Integration](#8-file-upload-integration)
9. [State Management](#9-state-management)
10. [Production Checklist](#10-production-checklist)

---

## 1. WebSocket Streaming Architecture

### Why WebSocket for Agents?

Claude Agent SDK responses stream token-by-token. WebSocket provides the bidirectional, persistent connection needed for:

- **Real-time streaming**: See responses as they generate
- **Tool use indicators**: Show when agent uses tools
- **Subagent status**: Track delegation to specialists
- **Session persistence**: Maintain conversation context
- **Low latency**: No HTTP overhead per message

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                               CLIENT                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         React/Vue App                                │    │
│  │                                                                      │    │
│  │   ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │    │
│  │   │  Chat Input  │───▶│  WebSocket   │───▶│  Message Dispatcher  │  │    │
│  │   └──────────────┘    │   Manager    │    └──────────────────────┘  │    │
│  │                       └──────────────┘              │               │    │
│  │                             ▲                       ▼               │    │
│  │                             │              ┌────────────────────┐   │    │
│  │                             │              │   Message Store    │   │    │
│  │                             │              │  (State/Context)   │   │    │
│  │                             │              └────────────────────┘   │    │
│  │                             │                       │               │    │
│  │                             │                       ▼               │    │
│  │                             │              ┌────────────────────┐   │    │
│  │                             │              │   Chat Display     │   │    │
│  │                             │              │   Components       │   │    │
│  │                             │              └────────────────────┘   │    │
│  └─────────────────────────────│────────────────────────────────────────┘    │
│                                │                                             │
└────────────────────────────────│─────────────────────────────────────────────┘
                                 │
                                 │ WebSocket (wss://)
                                 │
┌────────────────────────────────│─────────────────────────────────────────────┐
│                               SERVER                                          │
│                                ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         Express + WS                                 │    │
│  │                                                                      │    │
│  │   ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │    │
│  │   │  WebSocket   │───▶│   Session    │───▶│   Claude Agent SDK   │  │    │
│  │   │   Server     │    │   Manager    │    │       query()        │  │    │
│  │   └──────────────┘    └──────────────┘    └──────────────────────┘  │    │
│  │                                                     │               │    │
│  │                                                     ▼               │    │
│  │                                           ┌──────────────────────┐  │    │
│  │                                           │  Streaming Response  │  │    │
│  │                                           │  (tokens, tools)     │  │    │
│  │                                           └──────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Connection Lifecycle

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          WebSocket Lifecycle                                │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────┐      ┌───────────┐      ┌───────────┐      ┌─────────┐       │
│  │  INIT   │─────▶│ CONNECTING│─────▶│   OPEN    │─────▶│ CLOSING │       │
│  └─────────┘      └───────────┘      └───────────┘      └─────────┘       │
│       │                │                  │                  │            │
│       │           Error/Timeout      Heartbeat              │            │
│       │                │             Ping/Pong              │            │
│       │                ▼                  │                  ▼            │
│       │           ┌───────────┐          │            ┌─────────┐        │
│       └──────────▶│RECONNECTING│◀─────────┘            │ CLOSED  │        │
│                   └───────────┘                        └─────────┘        │
│                        │                                     ▲            │
│                        │     Max retries exceeded            │            │
│                        └─────────────────────────────────────┘            │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### WebSocket Manager Class

```typescript
/**
 * WebSocket Manager with reconnection and heartbeat
 *
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Heartbeat ping/pong to detect stale connections
 * - Message queuing during reconnection
 * - Event-based message handling
 */
export class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private heartbeatTimeout: NodeJS.Timeout | null = null;
  private messageQueue: string[] = [];

  // Event handlers
  public onMessage: ((data: WSResponse) => void) | null = null;
  public onStateChange: ((state: ConnectionState) => void) | null = null;
  public onError: ((error: Error) => void) | null = null;

  constructor(url: string) {
    this.url = url;
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.notifyStateChange('connecting');
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.notifyStateChange('connected');
      this.startHeartbeat();
      this.flushMessageQueue();
    };

    this.ws.onclose = (event) => {
      this.stopHeartbeat();

      if (event.wasClean) {
        this.notifyStateChange('disconnected');
      } else {
        this.attemptReconnect();
      }
    };

    this.ws.onerror = (error) => {
      this.onError?.(new Error('WebSocket error'));
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Handle pong (heartbeat response)
        if (data.type === 'pong') {
          this.clearHeartbeatTimeout();
          return;
        }

        this.onMessage?.(data);
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };
  }

  send(message: WSMessage): void {
    const payload = JSON.stringify(message);

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(payload);
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push(payload);
    }
  }

  disconnect(): void {
    this.stopHeartbeat();
    this.ws?.close(1000, 'Client disconnected');
    this.ws = null;
    this.notifyStateChange('disconnected');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private Methods
  // ─────────────────────────────────────────────────────────────────────────

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.notifyStateChange('failed');
      this.onError?.(new Error('Max reconnection attempts exceeded'));
      return;
    }

    this.notifyStateChange('reconnecting');
    this.reconnectAttempts++;

    // Exponential backoff with jitter
    const jitter = Math.random() * 1000;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000) + jitter;

    setTimeout(() => this.connect(), delay);
  }

  private startHeartbeat(): void {
    // Send ping every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });

        // Expect pong within 10 seconds
        this.heartbeatTimeout = setTimeout(() => {
          console.warn('Heartbeat timeout, closing connection');
          this.ws?.close();
        }, 10000);
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.heartbeatTimeout) clearTimeout(this.heartbeatTimeout);
  }

  private clearHeartbeatTimeout(): void {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const payload = this.messageQueue.shift()!;
      this.ws?.send(payload);
    }
  }

  private notifyStateChange(state: ConnectionState): void {
    this.onStateChange?.(state);
  }
}

type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'failed';
```

### Vanilla JavaScript Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>Agent Chat</title>
  <style>
    .chat-container { max-width: 600px; margin: 0 auto; font-family: system-ui; }
    .messages { height: 400px; overflow-y: auto; border: 1px solid #ddd; padding: 16px; }
    .message { margin-bottom: 12px; }
    .user { text-align: right; }
    .user .bubble { background: #007bff; color: white; }
    .assistant .bubble { background: #f1f1f1; }
    .bubble { display: inline-block; padding: 8px 12px; border-radius: 12px; max-width: 80%; }
    .streaming { opacity: 0.7; }
    .tool-indicator { font-size: 12px; color: #666; font-style: italic; margin-bottom: 4px; }
    .input-area { display: flex; gap: 8px; margin-top: 16px; }
    .input-area input { flex: 1; padding: 12px; border: 1px solid #ddd; border-radius: 8px; }
    .input-area button { padding: 12px 24px; background: #007bff; color: white; border: none; border-radius: 8px; cursor: pointer; }
    .input-area button:disabled { background: #ccc; }
    .status { font-size: 12px; color: #666; margin-bottom: 8px; }
    .status.error { color: #dc3545; }
  </style>
</head>
<body>
  <div class="chat-container">
    <div class="status" id="status">Connecting...</div>
    <div class="messages" id="messages"></div>
    <div class="input-area">
      <input type="text" id="input" placeholder="Ask anything..." disabled />
      <button id="send" disabled>Send</button>
    </div>
  </div>

  <script>
    const messagesEl = document.getElementById('messages');
    const inputEl = document.getElementById('input');
    const sendBtn = document.getElementById('send');
    const statusEl = document.getElementById('status');

    let ws = null;
    let currentAssistantMessage = null;
    let reconnectAttempts = 0;
    const maxReconnects = 5;

    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(`${protocol}//${window.location.host}`);

      ws.onopen = () => {
        statusEl.textContent = 'Connected';
        statusEl.className = 'status';
        inputEl.disabled = false;
        sendBtn.disabled = false;
        reconnectAttempts = 0;
      };

      ws.onclose = () => {
        statusEl.textContent = 'Disconnected - Reconnecting...';
        statusEl.className = 'status error';
        inputEl.disabled = true;
        sendBtn.disabled = true;

        if (reconnectAttempts < maxReconnects) {
          reconnectAttempts++;
          setTimeout(connect, 1000 * Math.pow(2, reconnectAttempts - 1));
        } else {
          statusEl.textContent = 'Connection failed. Refresh to retry.';
        }
      };

      ws.onerror = () => {
        statusEl.textContent = 'Connection error';
        statusEl.className = 'status error';
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        handleMessage(msg);
      };
    }

    function handleMessage(msg) {
      switch (msg.type) {
        case 'session_created':
          console.log('Session:', msg.sessionId);
          break;

        case 'chunk':
          if (!currentAssistantMessage) {
            currentAssistantMessage = addMessage('assistant', '');
          }
          const bubble = currentAssistantMessage.querySelector('.bubble');
          bubble.textContent += msg.text;
          messagesEl.scrollTop = messagesEl.scrollHeight;
          break;

        case 'tool_use':
          if (currentAssistantMessage) {
            const indicator = document.createElement('div');
            indicator.className = 'tool-indicator';
            indicator.textContent = `Using ${msg.tool}${msg.detail ? ': ' + msg.detail : ''}...`;
            currentAssistantMessage.insertBefore(indicator, currentAssistantMessage.firstChild);
          }
          break;

        case 'subagent':
          if (currentAssistantMessage) {
            const indicator = document.createElement('div');
            indicator.className = 'tool-indicator';
            indicator.textContent = msg.subagentStatus === 'started'
              ? `Consulting ${msg.subagentId}...`
              : `${msg.subagentId} complete`;
            currentAssistantMessage.insertBefore(indicator, currentAssistantMessage.firstChild);
          }
          break;

        case 'done':
          if (currentAssistantMessage) {
            currentAssistantMessage.classList.remove('streaming');
          }
          currentAssistantMessage = null;
          inputEl.disabled = false;
          sendBtn.disabled = false;
          statusEl.textContent = `Connected (${msg.cost?.toFixed(4) || 0} USD)`;
          break;

        case 'error':
          statusEl.textContent = `Error: ${msg.error}`;
          statusEl.className = 'status error';
          inputEl.disabled = false;
          sendBtn.disabled = false;
          currentAssistantMessage = null;
          break;
      }
    }

    function addMessage(role, text) {
      const div = document.createElement('div');
      div.className = `message ${role}${role === 'assistant' ? ' streaming' : ''}`;
      div.innerHTML = `<div class="bubble">${text}</div>`;
      messagesEl.appendChild(div);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      return div;
    }

    function sendMessage() {
      const text = inputEl.value.trim();
      if (!text || !ws || ws.readyState !== WebSocket.OPEN) return;

      addMessage('user', text);
      inputEl.value = '';
      inputEl.disabled = true;
      sendBtn.disabled = true;

      ws.send(JSON.stringify({ type: 'query', prompt: text }));
    }

    inputEl.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });

    sendBtn.addEventListener('click', sendMessage);

    connect();
  </script>
</body>
</html>
```

---

## 2. Message Types and Handling

### Message Flow Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        Message Flow: Query Lifecycle                        │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  CLIENT                          SERVER                        SDK        │
│    │                               │                            │          │
│    │──── { type: "query" } ───────▶│                            │          │
│    │                               │                            │          │
│    │                               │──── query(prompt) ────────▶│          │
│    │                               │                            │          │
│    │◀── { type: "session_init" }───│◀── system.init ───────────│          │
│    │                               │                            │          │
│    │                               │                            │          │
│    │                               │◀── assistant.text ────────│          │
│    │◀──── { type: "chunk" } ───────│    (streaming tokens)     │          │
│    │◀──── { type: "chunk" } ───────│                            │          │
│    │                               │                            │          │
│    │                               │◀── assistant.tool_use ────│          │
│    │◀── { type: "tool_use" } ──────│    (Read, Grep, etc.)     │          │
│    │                               │                            │          │
│    │                               │◀── assistant.tool_use ────│          │
│    │◀── { type: "subagent" } ──────│    (Task tool)            │          │
│    │    subagentStatus: "started"  │                            │          │
│    │                               │                            │          │
│    │◀──── { type: "chunk" } ───────│◀── assistant.text ────────│          │
│    │                               │                            │          │
│    │◀── { type: "subagent" } ──────│    (subagent completes)   │          │
│    │    subagentStatus: "completed"│                            │          │
│    │                               │                            │          │
│    │                               │◀── result ────────────────│          │
│    │◀──── { type: "done" } ────────│    (cost, duration)       │          │
│    │                               │                            │          │
└────────────────────────────────────────────────────────────────────────────┘
```

### TypeScript Type Definitions

```typescript
// ═══════════════════════════════════════════════════════════════════════════
// CLIENT → SERVER MESSAGES
// ═══════════════════════════════════════════════════════════════════════════

interface WSQueryMessage {
  type: 'query';
  prompt: string;
  /** Optional: Resume a previous session */
  sessionId?: string;
  /** Optional: Files to include with the query */
  files?: Array<{
    name: string;
    content: string;
    mimeType: string;
  }>;
}

interface WSNewSessionMessage {
  type: 'new_session';
}

interface WSPingMessage {
  type: 'ping';
}

type WSClientMessage = WSQueryMessage | WSNewSessionMessage | WSPingMessage;


// ═══════════════════════════════════════════════════════════════════════════
// SERVER → CLIENT MESSAGES
// ═══════════════════════════════════════════════════════════════════════════

/** Sent when WebSocket connection is established */
interface WSSessionCreatedMessage {
  type: 'session_created';
  sessionId: string;
}

/** Streaming text chunk from assistant */
interface WSChunkMessage {
  type: 'chunk';
  text: string;
  /** Index within the response (for ordering) */
  index?: number;
}

/** Tool usage notification */
interface WSToolUseMessage {
  type: 'tool_use';
  /** Tool name: Read, Glob, Grep, WebSearch, Edit, Write, Task, etc. */
  tool: string;
  /** Human-readable detail: file path, search pattern, etc. */
  detail?: string;
  /** Tool execution status */
  status?: 'started' | 'completed' | 'error';
  /** For Task tool: subagent being spawned */
  subagentType?: string;
}

/** Subagent status update */
interface WSSubagentMessage {
  type: 'subagent';
  /** Subagent identifier */
  subagentId: string;
  /** Current status */
  subagentStatus: 'started' | 'completed';
  /** Human-readable description of what subagent is doing */
  detail?: string;
}

/** Query completed successfully */
interface WSDoneMessage {
  type: 'done';
  /** Cost in USD for this query */
  cost?: number;
  /** Duration in milliseconds */
  duration?: number;
  /** Total queries in this session */
  queryCount?: number;
  /** Final result summary (optional) */
  result?: string;
}

/** Error occurred */
interface WSErrorMessage {
  type: 'error';
  /** Error message */
  error: string;
  /** Error code for programmatic handling */
  code?: 'rate_limit' | 'auth_error' | 'timeout' | 'server_error' | 'unknown';
  /** Whether the error is recoverable */
  recoverable?: boolean;
}

/** Heartbeat response */
interface WSPongMessage {
  type: 'pong';
}

type WSServerMessage =
  | WSSessionCreatedMessage
  | WSChunkMessage
  | WSToolUseMessage
  | WSSubagentMessage
  | WSDoneMessage
  | WSErrorMessage
  | WSPongMessage;


// ═══════════════════════════════════════════════════════════════════════════
// INTERNAL TYPES
// ═══════════════════════════════════════════════════════════════════════════

/** Message stored in chat history */
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  /** Tool uses associated with this message */
  toolUses?: Array<{
    tool: string;
    detail?: string;
    status: 'completed' | 'error';
  }>;
  /** Subagents consulted */
  subagents?: Array<{
    id: string;
    detail?: string;
  }>;
  /** Cost for assistant messages */
  cost?: number;
  /** Whether message is still streaming */
  isStreaming?: boolean;
  /** Error if message failed */
  error?: string;
}

/** Connection state for UI indicators */
type ConnectionState =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'failed';
```

### Message Handler Pattern

```typescript
/**
 * Message dispatcher pattern for clean handling
 */
class MessageHandler {
  private handlers: Map<string, (msg: WSServerMessage) => void> = new Map();

  constructor() {
    // Register handlers
    this.handlers.set('session_created', this.handleSessionCreated.bind(this));
    this.handlers.set('chunk', this.handleChunk.bind(this));
    this.handlers.set('tool_use', this.handleToolUse.bind(this));
    this.handlers.set('subagent', this.handleSubagent.bind(this));
    this.handlers.set('done', this.handleDone.bind(this));
    this.handlers.set('error', this.handleError.bind(this));
  }

  dispatch(message: WSServerMessage): void {
    const handler = this.handlers.get(message.type);
    if (handler) {
      handler(message);
    } else {
      console.warn('Unknown message type:', message.type);
    }
  }

  private handleSessionCreated(msg: WSSessionCreatedMessage): void {
    // Store session ID for resume capability
    localStorage.setItem('agent_session_id', msg.sessionId);
  }

  private handleChunk(msg: WSChunkMessage): void {
    // Append text to current streaming message
    this.appendToCurrentMessage(msg.text);
  }

  private handleToolUse(msg: WSToolUseMessage): void {
    // Show tool indicator in UI
    this.showToolIndicator(msg.tool, msg.detail);
  }

  private handleSubagent(msg: WSSubagentMessage): void {
    // Show subagent status
    if (msg.subagentStatus === 'started') {
      this.showSubagentStarted(msg.subagentId, msg.detail);
    } else {
      this.showSubagentCompleted(msg.subagentId);
    }
  }

  private handleDone(msg: WSDoneMessage): void {
    // Finalize message, show cost/duration
    this.finalizeCurrentMessage(msg.cost, msg.duration);
  }

  private handleError(msg: WSErrorMessage): void {
    // Show error, potentially retry
    this.showError(msg.error, msg.recoverable);
  }

  // ... implementation methods
}
```

---

## 3. React Chat Component Patterns

### Complete React Chat Component

```tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  toolUses?: Array<{ tool: string; detail?: string }>;
  subagents?: Array<{ id: string; status: 'started' | 'completed' }>;
  cost?: number;
  error?: string;
}

type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'failed';

// ═══════════════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Custom hook for WebSocket connection management
 */
function useWebSocket(url: string) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const messageHandlersRef = useRef<Set<(msg: any) => void>>(new Set());

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionState('connecting');
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionState('connected');
      reconnectAttemptsRef.current = 0;
    };

    ws.onclose = (event) => {
      if (event.wasClean) {
        setConnectionState('disconnected');
      } else {
        setConnectionState('reconnecting');

        if (reconnectAttemptsRef.current < 5) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current - 1), 30000);
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        } else {
          setConnectionState('failed');
        }
      }
    };

    ws.onerror = () => {
      // Error will be followed by close event
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'session_created') {
          setSessionId(data.sessionId);
        }

        messageHandlersRef.current.forEach(handler => handler(data));
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    };
  }, [url]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    wsRef.current?.close(1000, 'Client disconnected');
    wsRef.current = null;
    setConnectionState('disconnected');
  }, []);

  const send = useCallback((message: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  const subscribe = useCallback((handler: (msg: any) => void) => {
    messageHandlersRef.current.add(handler);
    return () => messageHandlersRef.current.delete(handler);
  }, []);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return { connectionState, sessionId, send, subscribe, reconnect: connect };
}


/**
 * Custom hook for chat message management
 */
function useChat(wsUrl: string) {
  const { connectionState, sessionId, send, subscribe, reconnect } = useWebSocket(wsUrl);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const currentMessageRef = useRef<string | null>(null);

  useEffect(() => {
    return subscribe((msg) => {
      switch (msg.type) {
        case 'chunk':
          setMessages(prev => {
            if (!currentMessageRef.current) return prev;
            return prev.map(m =>
              m.id === currentMessageRef.current
                ? { ...m, content: m.content + msg.text }
                : m
            );
          });
          break;

        case 'tool_use':
          setMessages(prev => {
            if (!currentMessageRef.current) return prev;
            return prev.map(m =>
              m.id === currentMessageRef.current
                ? {
                    ...m,
                    toolUses: [...(m.toolUses || []), { tool: msg.tool, detail: msg.detail }]
                  }
                : m
            );
          });
          break;

        case 'subagent':
          setMessages(prev => {
            if (!currentMessageRef.current) return prev;
            return prev.map(m => {
              if (m.id !== currentMessageRef.current) return m;

              const subagents = m.subagents || [];
              if (msg.subagentStatus === 'started') {
                return { ...m, subagents: [...subagents, { id: msg.subagentId, status: 'started' }] };
              } else {
                return {
                  ...m,
                  subagents: subagents.map(s =>
                    s.id === msg.subagentId ? { ...s, status: 'completed' } : s
                  )
                };
              }
            });
          });
          break;

        case 'done':
          setMessages(prev => prev.map(m =>
            m.id === currentMessageRef.current
              ? { ...m, isStreaming: false, cost: msg.cost }
              : m
          ));
          currentMessageRef.current = null;
          setIsLoading(false);
          break;

        case 'error':
          setMessages(prev => prev.map(m =>
            m.id === currentMessageRef.current
              ? { ...m, isStreaming: false, error: msg.error }
              : m
          ));
          currentMessageRef.current = null;
          setIsLoading(false);
          break;
      }
    });
  }, [subscribe]);

  const sendMessage = useCallback((content: string) => {
    if (!content.trim() || isLoading) return false;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    // Add placeholder assistant message
    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    currentMessageRef.current = assistantMessage.id;
    setIsLoading(true);

    return send({ type: 'query', prompt: content });
  }, [send, isLoading]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    send({ type: 'new_session' });
  }, [send]);

  return {
    messages,
    isLoading,
    connectionState,
    sessionId,
    sendMessage,
    clearMessages,
    reconnect,
  };
}


// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Connection status indicator
 */
function ConnectionStatus({ state }: { state: ConnectionState }) {
  const statusConfig = {
    connecting: { color: 'bg-yellow-500', text: 'Connecting...' },
    connected: { color: 'bg-green-500', text: 'Connected' },
    reconnecting: { color: 'bg-yellow-500', text: 'Reconnecting...' },
    disconnected: { color: 'bg-gray-500', text: 'Disconnected' },
    failed: { color: 'bg-red-500', text: 'Connection Failed' },
  };

  const config = statusConfig[state];

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${config.color}`} />
      <span className="text-gray-600">{config.text}</span>
    </div>
  );
}

/**
 * Tool use indicator with animation
 */
function ToolIndicator({ tool, detail }: { tool: string; detail?: string }) {
  const toolIcons: Record<string, string> = {
    Read: '📄',
    Glob: '🔍',
    Grep: '🔎',
    WebSearch: '🌐',
    WebFetch: '📡',
    Edit: '✏️',
    Write: '📝',
    Task: '🤖',
    Bash: '💻',
  };

  return (
    <div className="flex items-center gap-2 text-sm text-gray-500 animate-pulse">
      <span>{toolIcons[tool] || '🔧'}</span>
      <span>Using {tool}</span>
      {detail && <span className="text-gray-400">({detail})</span>}
    </div>
  );
}

/**
 * Subagent status indicator
 */
function SubagentIndicator({
  subagentId,
  status
}: {
  subagentId: string;
  status: 'started' | 'completed';
}) {
  return (
    <div className={`flex items-center gap-2 text-sm ${
      status === 'started' ? 'text-blue-500 animate-pulse' : 'text-green-500'
    }`}>
      <span>{status === 'started' ? '🔄' : '✅'}</span>
      <span>
        {status === 'started' ? `Consulting ${subagentId}...` : `${subagentId} complete`}
      </span>
    </div>
  );
}

/**
 * Streaming text with cursor animation
 */
function StreamingText({ content, isStreaming }: { content: string; isStreaming: boolean }) {
  return (
    <div className="whitespace-pre-wrap">
      {content}
      {isStreaming && (
        <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1" />
      )}
    </div>
  );
}

/**
 * Single message component
 */
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Tool uses */}
        {message.toolUses?.map((tool, i) => (
          <ToolIndicator key={i} tool={tool.tool} detail={tool.detail} />
        ))}

        {/* Subagents */}
        {message.subagents?.map((subagent, i) => (
          <SubagentIndicator key={i} subagentId={subagent.id} status={subagent.status} />
        ))}

        {/* Message bubble */}
        <div className={`rounded-2xl px-4 py-2 ${
          isUser
            ? 'bg-blue-500 text-white'
            : message.error
              ? 'bg-red-100 text-red-800'
              : 'bg-gray-100 text-gray-800'
        }`}>
          {message.error ? (
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{message.error}</span>
            </div>
          ) : (
            <StreamingText
              content={message.content}
              isStreaming={message.isStreaming || false}
            />
          )}
        </div>

        {/* Cost indicator */}
        {message.cost !== undefined && (
          <div className="text-xs text-gray-400 mt-1 text-right">
            ${message.cost.toFixed(4)}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Chat input component
 */
function ChatInput({
  onSend,
  disabled
}: {
  onSend: (message: string) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex gap-2 p-4 border-t">
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        disabled={disabled}
        className="flex-1 resize-none rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        rows={1}
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        Send
      </button>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// MAIN CHAT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface ChatProps {
  wsUrl: string;
  title?: string;
}

export function Chat({ wsUrl, title = 'Agent Chat' }: ChatProps) {
  const {
    messages,
    isLoading,
    connectionState,
    sendMessage,
    clearMessages,
    reconnect,
  } = useChat(wsUrl);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-xl font-semibold">{title}</h1>
        <div className="flex items-center gap-4">
          <ConnectionStatus state={connectionState} />
          {connectionState === 'failed' && (
            <button
              onClick={reconnect}
              className="text-sm text-blue-500 hover:underline"
            >
              Retry
            </button>
          )}
          <button
            onClick={clearMessages}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            Start a conversation
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        disabled={isLoading || connectionState !== 'connected'}
      />
    </div>
  );
}

export default Chat;
```

### Usage Example

```tsx
// App.tsx
import { Chat } from './components/Chat';

function App() {
  // WebSocket URL - adjust for production
  const wsUrl = process.env.NODE_ENV === 'production'
    ? 'wss://your-agent.example.com'
    : 'ws://localhost:3456';

  return (
    <Chat
      wsUrl={wsUrl}
      title="Masonry Advisor"
    />
  );
}
```

---

## 4. Vue Chat Component Patterns

### Vue 3 Composition API Implementation

```vue
<!-- Chat.vue -->
<template>
  <div class="chat-container">
    <!-- Header -->
    <header class="chat-header">
      <h1>{{ title }}</h1>
      <div class="status-bar">
        <ConnectionStatus :state="connectionState" />
        <button v-if="connectionState === 'failed'" @click="reconnect">
          Retry
        </button>
        <button @click="clearMessages">Clear</button>
      </div>
    </header>

    <!-- Messages -->
    <main class="messages-container" ref="messagesContainer">
      <div v-if="messages.length === 0" class="empty-state">
        Start a conversation
      </div>
      <template v-else>
        <MessageBubble
          v-for="message in messages"
          :key="message.id"
          :message="message"
        />
      </template>
    </main>

    <!-- Input -->
    <ChatInput
      :disabled="isLoading || connectionState !== 'connected'"
      @send="sendMessage"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import ConnectionStatus from './ConnectionStatus.vue';
import MessageBubble from './MessageBubble.vue';
import ChatInput from './ChatInput.vue';

// Props
interface Props {
  wsUrl: string;
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Agent Chat',
});

// Types
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  toolUses?: Array<{ tool: string; detail?: string }>;
  subagents?: Array<{ id: string; status: 'started' | 'completed' }>;
  cost?: number;
  error?: string;
}

type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'failed';

// State
const messages = ref<Message[]>([]);
const isLoading = ref(false);
const connectionState = ref<ConnectionState>('connecting');
const sessionId = ref<string | null>(null);
const messagesContainer = ref<HTMLElement | null>(null);

// WebSocket management
let ws: WebSocket | null = null;
let reconnectAttempts = 0;
let currentMessageId: string | null = null;
let reconnectTimeout: number | null = null;

function connect() {
  if (ws?.readyState === WebSocket.OPEN) return;

  connectionState.value = 'connecting';
  ws = new WebSocket(props.wsUrl);

  ws.onopen = () => {
    connectionState.value = 'connected';
    reconnectAttempts = 0;
  };

  ws.onclose = (event) => {
    if (event.wasClean) {
      connectionState.value = 'disconnected';
    } else {
      connectionState.value = 'reconnecting';

      if (reconnectAttempts < 5) {
        reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 30000);
        reconnectTimeout = window.setTimeout(connect, delay);
      } else {
        connectionState.value = 'failed';
      }
    }
  };

  ws.onerror = () => {
    // Error will be followed by close event
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleMessage(data);
    } catch (e) {
      console.error('Failed to parse message:', e);
    }
  };
}

function handleMessage(msg: any) {
  switch (msg.type) {
    case 'session_created':
      sessionId.value = msg.sessionId;
      break;

    case 'chunk':
      if (currentMessageId) {
        const message = messages.value.find(m => m.id === currentMessageId);
        if (message) {
          message.content += msg.text;
        }
      }
      break;

    case 'tool_use':
      if (currentMessageId) {
        const message = messages.value.find(m => m.id === currentMessageId);
        if (message) {
          message.toolUses = message.toolUses || [];
          message.toolUses.push({ tool: msg.tool, detail: msg.detail });
        }
      }
      break;

    case 'subagent':
      if (currentMessageId) {
        const message = messages.value.find(m => m.id === currentMessageId);
        if (message) {
          message.subagents = message.subagents || [];
          if (msg.subagentStatus === 'started') {
            message.subagents.push({ id: msg.subagentId, status: 'started' });
          } else {
            const subagent = message.subagents.find(s => s.id === msg.subagentId);
            if (subagent) subagent.status = 'completed';
          }
        }
      }
      break;

    case 'done':
      if (currentMessageId) {
        const message = messages.value.find(m => m.id === currentMessageId);
        if (message) {
          message.isStreaming = false;
          message.cost = msg.cost;
        }
      }
      currentMessageId = null;
      isLoading.value = false;
      break;

    case 'error':
      if (currentMessageId) {
        const message = messages.value.find(m => m.id === currentMessageId);
        if (message) {
          message.isStreaming = false;
          message.error = msg.error;
        }
      }
      currentMessageId = null;
      isLoading.value = false;
      break;
  }
}

function send(data: object): boolean {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
    return true;
  }
  return false;
}

function sendMessage(content: string) {
  if (!content.trim() || isLoading.value) return;

  // Add user message
  const userMessage: Message = {
    id: `user-${Date.now()}`,
    role: 'user',
    content,
    timestamp: Date.now(),
  };

  // Add placeholder assistant message
  const assistantMessage: Message = {
    id: `assistant-${Date.now()}`,
    role: 'assistant',
    content: '',
    timestamp: Date.now(),
    isStreaming: true,
  };

  messages.value.push(userMessage, assistantMessage);
  currentMessageId = assistantMessage.id;
  isLoading.value = true;

  send({ type: 'query', prompt: content });
}

function clearMessages() {
  messages.value = [];
  send({ type: 'new_session' });
}

function reconnect() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  reconnectAttempts = 0;
  connect();
}

// Auto-scroll on new messages
watch(messages, async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}, { deep: true });

// Lifecycle
onMounted(() => {
  connect();
});

onUnmounted(() => {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }
  ws?.close(1000, 'Component unmounted');
});
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 42rem;
  margin: 0 auto;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.chat-header h1 {
  font-size: 1.25rem;
  font-weight: 600;
}

.status-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-bar button {
  font-size: 0.875rem;
  color: #6b7280;
  background: none;
  border: none;
  cursor: pointer;
}

.status-bar button:hover {
  color: #374151;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
}
</style>
```

### Vue Composable for Reusability

```typescript
// composables/useAgentChat.ts
import { ref, onMounted, onUnmounted } from 'vue';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  toolUses?: Array<{ tool: string; detail?: string }>;
  cost?: number;
  error?: string;
}

type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'failed';

export function useAgentChat(wsUrl: string) {
  const messages = ref<Message[]>([]);
  const isLoading = ref(false);
  const connectionState = ref<ConnectionState>('connecting');
  const sessionId = ref<string | null>(null);

  let ws: WebSocket | null = null;
  let currentMessageId: string | null = null;

  // ... WebSocket management logic (same as above)

  return {
    messages,
    isLoading,
    connectionState,
    sessionId,
    sendMessage,
    clearMessages,
    reconnect,
  };
}
```

---

## 5. Session Persistence

### Session Management Strategy

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        Session Persistence Flow                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────┐    ┌───────────────┐    ┌──────────────────────────┐    │
│  │  New Visit   │───▶│ Check Storage │───▶│ session_id exists?       │    │
│  └──────────────┘    └───────────────┘    └──────────────────────────┘    │
│                                                   │                        │
│                               ┌───────────────────┴───────────────────┐    │
│                               │                                       │    │
│                              YES                                      NO   │
│                               │                                       │    │
│                               ▼                                       ▼    │
│                 ┌─────────────────────────┐         ┌────────────────────┐│
│                 │ Connect with resume ID  │         │ Create new session ││
│                 │ options.resume = id     │         │                    ││
│                 └─────────────────────────┘         └────────────────────┘│
│                               │                                       │    │
│                               ▼                                       │    │
│                 ┌─────────────────────────┐                          │    │
│                 │ Session valid?          │                          │    │
│                 └─────────────────────────┘                          │    │
│                               │                                       │    │
│               ┌───────────────┴───────────────┐                      │    │
│               │                               │                      │    │
│              YES                              NO                     │    │
│               │                               │                      │    │
│               ▼                               ▼                      │    │
│  ┌────────────────────────┐    ┌────────────────────────┐           │    │
│  │ Resume conversation    │    │ Clear storage,         │◀──────────┘    │
│  │ with context           │    │ start fresh            │                │
│  └────────────────────────┘    └────────────────────────┘                │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Implementation

```typescript
/**
 * Session persistence utilities
 */
const SESSION_STORAGE_KEY = 'agent_session';
const CHAT_HISTORY_KEY = 'agent_chat_history';

interface StoredSession {
  sessionId: string;
  createdAt: number;
  lastActiveAt: number;
  totalCost: number;
  queryCount: number;
}

interface StoredMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  cost?: number;
}

/**
 * Save session to localStorage
 */
export function saveSession(session: StoredSession): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (e) {
    console.warn('Failed to save session:', e);
  }
}

/**
 * Load session from localStorage
 */
export function loadSession(): StoredSession | null {
  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return null;

    const session = JSON.parse(stored) as StoredSession;

    // Check if session is still valid (e.g., not expired)
    const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
    if (Date.now() - session.lastActiveAt > MAX_AGE) {
      clearSession();
      return null;
    }

    return session;
  } catch (e) {
    console.warn('Failed to load session:', e);
    return null;
  }
}

/**
 * Clear stored session
 */
export function clearSession(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
  localStorage.removeItem(CHAT_HISTORY_KEY);
}

/**
 * Save chat history
 */
export function saveChatHistory(messages: StoredMessage[]): void {
  try {
    // Keep only last 100 messages to prevent storage bloat
    const trimmed = messages.slice(-100);
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Failed to save chat history:', e);
  }
}

/**
 * Load chat history
 */
export function loadChatHistory(): StoredMessage[] {
  try {
    const stored = localStorage.getItem(CHAT_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.warn('Failed to load chat history:', e);
    return [];
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// React Hook for Session Persistence
// ═══════════════════════════════════════════════════════════════════════════

export function useSessionPersistence() {
  const [session, setSession] = useState<StoredSession | null>(() => loadSession());
  const [chatHistory, setChatHistory] = useState<StoredMessage[]>(() => loadChatHistory());

  // Update session when it changes
  const updateSession = useCallback((updates: Partial<StoredSession>) => {
    setSession(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates, lastActiveAt: Date.now() };
      saveSession(updated);
      return updated;
    });
  }, []);

  // Create new session
  const createSession = useCallback((sessionId: string) => {
    const newSession: StoredSession = {
      sessionId,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      totalCost: 0,
      queryCount: 0,
    };
    saveSession(newSession);
    setSession(newSession);
    setChatHistory([]);
  }, []);

  // Add message to history
  const addToHistory = useCallback((message: StoredMessage) => {
    setChatHistory(prev => {
      const updated = [...prev, message];
      saveChatHistory(updated);
      return updated;
    });
  }, []);

  // Clear everything
  const resetSession = useCallback(() => {
    clearSession();
    setSession(null);
    setChatHistory([]);
  }, []);

  return {
    session,
    chatHistory,
    updateSession,
    createSession,
    addToHistory,
    resetSession,
    hasExistingSession: !!session,
  };
}


// ═══════════════════════════════════════════════════════════════════════════
// Session Resume UI Component
// ═══════════════════════════════════════════════════════════════════════════

function SessionResumePrompt({
  session,
  onResume,
  onNewSession
}: {
  session: StoredSession;
  onResume: () => void;
  onNewSession: () => void;
}) {
  const lastActive = new Date(session.lastActiveAt);
  const timeAgo = formatTimeAgo(lastActive);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-lg font-semibold mb-2">Resume Session?</h2>
        <p className="text-gray-600 mb-4">
          You have an existing session from {timeAgo} with {session.queryCount} messages.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onResume}
            className="flex-1 bg-blue-500 text-white rounded-lg py-2 hover:bg-blue-600"
          >
            Resume
          </button>
          <button
            onClick={onNewSession}
            className="flex-1 bg-gray-200 text-gray-700 rounded-lg py-2 hover:bg-gray-300"
          >
            Start Fresh
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}
```

### Fork Session Pattern

```typescript
/**
 * Fork an existing session to try a different approach
 * without modifying the original conversation
 */
async function forkSession(originalSessionId: string, newPrompt: string) {
  const response = query({
    prompt: newPrompt,
    options: {
      resume: originalSessionId,
      forkSession: true,  // Create a branch, don't modify original
    },
  });

  for await (const message of response) {
    if (message.type === 'system' && message.subtype === 'init') {
      // New session ID for the fork
      const forkedSessionId = message.session_id;
      console.log(`Forked session: ${forkedSessionId}`);
    }
    // Handle other messages...
  }
}
```

---

## 6. Error Handling UI

### Error Types and Recovery

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           Error Handling Flow                              │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────┐     │
│  │                        ERROR OCCURS                               │     │
│  └──────────────────────────────────────────────────────────────────┘     │
│                                    │                                       │
│                                    ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────┐     │
│  │                     Classify Error Type                           │     │
│  └──────────────────────────────────────────────────────────────────┘     │
│                                    │                                       │
│        ┌──────────────┬────────────┼────────────┬──────────────┐          │
│        │              │            │            │              │          │
│        ▼              ▼            ▼            ▼              ▼          │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌─────────┐ │
│  │CONNECTION │  │RATE_LIMIT │  │AUTH_ERROR │  │  TIMEOUT  │  │ SERVER  │ │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘  └─────────┘ │
│        │              │            │            │              │          │
│        ▼              ▼            ▼            ▼              ▼          │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌─────────┐ │
│  │Auto       │  │ Show wait │  │ Redirect  │  │  Retry    │  │ Show    │ │
│  │reconnect  │  │ countdown │  │ to login  │  │  button   │  │ message │ │
│  │           │  │ + retry   │  │           │  │           │  │         │ │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘  └─────────┘ │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Error Handling Implementation

```typescript
// ═══════════════════════════════════════════════════════════════════════════
// ERROR TYPES
// ═══════════════════════════════════════════════════════════════════════════

type ErrorCode =
  | 'connection_failed'
  | 'connection_lost'
  | 'rate_limit'
  | 'auth_error'
  | 'timeout'
  | 'server_error'
  | 'unknown';

interface AppError {
  code: ErrorCode;
  message: string;
  recoverable: boolean;
  retryAfter?: number;  // milliseconds
  action?: 'retry' | 'reconnect' | 'login' | 'refresh';
}

/**
 * Parse server error into structured AppError
 */
function parseError(rawError: string | { error: string; code?: string }): AppError {
  const message = typeof rawError === 'string' ? rawError : rawError.error;
  const code = typeof rawError === 'object' ? rawError.code : undefined;

  // Rate limit detection
  if (message.toLowerCase().includes('rate limit') || code === 'rate_limit') {
    const retryMatch = message.match(/retry after (\d+)/i);
    return {
      code: 'rate_limit',
      message: 'Too many requests. Please wait a moment.',
      recoverable: true,
      retryAfter: retryMatch ? parseInt(retryMatch[1]) * 1000 : 60000,
      action: 'retry',
    };
  }

  // Auth errors
  if (message.toLowerCase().includes('unauthorized') ||
      message.toLowerCase().includes('authentication') ||
      code === 'auth_error') {
    return {
      code: 'auth_error',
      message: 'Session expired. Please sign in again.',
      recoverable: true,
      action: 'login',
    };
  }

  // Timeout
  if (message.toLowerCase().includes('timeout') || code === 'timeout') {
    return {
      code: 'timeout',
      message: 'Request timed out. Please try again.',
      recoverable: true,
      action: 'retry',
    };
  }

  // Server errors
  if (message.toLowerCase().includes('internal server') || code === 'server_error') {
    return {
      code: 'server_error',
      message: 'Something went wrong. Please try again later.',
      recoverable: false,
    };
  }

  // Default
  return {
    code: 'unknown',
    message: message || 'An unexpected error occurred.',
    recoverable: true,
    action: 'retry',
  };
}


// ═══════════════════════════════════════════════════════════════════════════
// ERROR UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

interface ErrorBannerProps {
  error: AppError;
  onRetry?: () => void;
  onDismiss?: () => void;
}

function ErrorBanner({ error, onRetry, onDismiss }: ErrorBannerProps) {
  const [countdown, setCountdown] = useState(
    error.retryAfter ? Math.ceil(error.retryAfter / 1000) : 0
  );

  // Countdown timer for rate limits
  useEffect(() => {
    if (!error.retryAfter || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [error.retryAfter]);

  const getIcon = () => {
    switch (error.code) {
      case 'connection_failed':
      case 'connection_lost':
        return '🔌';
      case 'rate_limit':
        return '⏳';
      case 'auth_error':
        return '🔒';
      case 'timeout':
        return '⏱️';
      default:
        return '⚠️';
    }
  };

  const getActionButton = () => {
    if (countdown > 0) {
      return (
        <span className="text-sm text-gray-500">
          Retry in {countdown}s
        </span>
      );
    }

    switch (error.action) {
      case 'retry':
        return (
          <button
            onClick={onRetry}
            className="px-3 py-1 bg-white text-red-600 rounded text-sm hover:bg-red-50"
          >
            Retry
          </button>
        );
      case 'reconnect':
        return (
          <button
            onClick={onRetry}
            className="px-3 py-1 bg-white text-red-600 rounded text-sm hover:bg-red-50"
          >
            Reconnect
          </button>
        );
      case 'login':
        return (
          <a
            href="/login"
            className="px-3 py-1 bg-white text-red-600 rounded text-sm hover:bg-red-50"
          >
            Sign In
          </a>
        );
      case 'refresh':
        return (
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 bg-white text-red-600 rounded text-sm hover:bg-red-50"
          >
            Refresh Page
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-xl">{getIcon()}</span>
        <span className="text-red-700">{error.message}</span>
      </div>
      <div className="flex items-center gap-2">
        {getActionButton()}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-400 hover:text-red-600"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}


/**
 * Inline error indicator for individual messages
 */
function MessageError({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center gap-2 text-red-600 text-sm mt-1">
      <span>⚠️</span>
      <span>{error}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="underline hover:no-underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}


/**
 * Full-page error state for catastrophic failures
 */
function ErrorPage({
  title,
  description,
  onRetry
}: {
  title: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">😵</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{title}</h1>
        <p className="text-gray-600 mb-6">{description}</p>
        <div className="flex gap-4 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Try Again
            </button>
          )}
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 7. Mobile Responsiveness

### Responsive Layout Patterns

```css
/* Base mobile-first styles */
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100dvh; /* Dynamic viewport height for mobile browsers */
  max-width: 100%;
  margin: 0 auto;
}

/* Messages area */
.messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
}

/* Message bubbles */
.message-bubble {
  max-width: 85%;
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* Input area - fixed at bottom on mobile */
.input-area {
  padding: 0.75rem;
  padding-bottom: max(0.75rem, env(safe-area-inset-bottom)); /* iPhone notch */
  border-top: 1px solid #e5e7eb;
  background: white;
}

/* Input field */
.chat-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 1.5rem;
  font-size: 16px; /* Prevents iOS zoom on focus */
  resize: none;
  outline: none;
}

.chat-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

/* Tablet and desktop */
@media (min-width: 640px) {
  .chat-container {
    max-width: 640px;
    height: 100vh;
  }

  .message-bubble {
    max-width: 70%;
  }

  .input-area {
    padding: 1rem;
  }
}

/* Large screens */
@media (min-width: 1024px) {
  .chat-container {
    max-width: 768px;
  }

  .message-bubble {
    max-width: 60%;
  }
}
```

### Mobile Keyboard Handling

```typescript
import { useEffect, useState, useRef } from 'react';

/**
 * Hook to handle mobile keyboard and viewport changes
 */
function useMobileKeyboard() {
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const originalHeight = useRef(window.innerHeight);

  useEffect(() => {
    // Detect keyboard open/close via viewport resize
    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDiff = originalHeight.current - currentHeight;

      // Keyboard is likely open if viewport shrunk significantly
      setKeyboardOpen(heightDiff > 150);
      setViewportHeight(currentHeight);
    };

    // Also use visualViewport API if available (more accurate)
    if (window.visualViewport) {
      const handleViewportResize = () => {
        setViewportHeight(window.visualViewport!.height);
        setKeyboardOpen(
          window.visualViewport!.height < originalHeight.current * 0.75
        );
      };

      window.visualViewport.addEventListener('resize', handleViewportResize);
      return () => {
        window.visualViewport!.removeEventListener('resize', handleViewportResize);
      };
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { keyboardOpen, viewportHeight };
}


/**
 * Hook to scroll to input when keyboard opens
 */
function useScrollToInput(inputRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const handleFocus = () => {
      // Small delay to let keyboard animate open
      setTimeout(() => {
        input.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 300);
    };

    input.addEventListener('focus', handleFocus);
    return () => input.removeEventListener('focus', handleFocus);
  }, [inputRef]);
}


/**
 * Mobile-optimized chat input component
 */
function MobileChatInput({ onSend, disabled }: { onSend: (text: string) => void; disabled: boolean }) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [value]);

  // Scroll input into view on focus
  useScrollToInput(inputRef as any);

  const handleSubmit = () => {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue('');

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // On mobile, Enter should submit (no shift+enter)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="input-area flex gap-2 items-end">
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Message..."
        disabled={disabled}
        rows={1}
        className="chat-input flex-1"
        // Prevent iOS zoom
        style={{ fontSize: '16px' }}
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        className="p-3 bg-blue-500 text-white rounded-full disabled:bg-gray-300 flex-shrink-0"
        aria-label="Send message"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    </div>
  );
}
```

### Touch-Friendly Interactions

```tsx
/**
 * Swipe-to-delete message component
 */
function SwipeableMessage({
  message,
  onDelete
}: {
  message: Message;
  onDelete: () => void;
}) {
  const [translateX, setTranslateX] = useState(0);
  const [startX, setStartX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;

    const currentX = e.touches[0].clientX;
    const diff = startX - currentX;

    // Only allow swipe left (for delete)
    if (diff > 0) {
      setTranslateX(Math.min(diff, 80));
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);

    if (translateX > 60) {
      // Trigger delete
      onDelete();
    }

    setTranslateX(0);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Delete indicator */}
      <div
        className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 flex items-center justify-center text-white"
        style={{ opacity: translateX / 80 }}
      >
        🗑️
      </div>

      {/* Message */}
      <div
        style={{ transform: `translateX(-${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="transition-transform"
      >
        <MessageBubble message={message} />
      </div>
    </div>
  );
}
```

---

## 8. File Upload Integration

### Drag and Drop Implementation

```tsx
import { useState, useCallback, useRef } from 'react';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  preview?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
}

/**
 * Hook for file upload management
 */
function useFileUpload(maxFiles = 5, maxSizeMB = 10) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = (file: File): string | null => {
    const maxSize = maxSizeMB * 1024 * 1024;

    if (file.size > maxSize) {
      return `File too large. Maximum size is ${maxSizeMB}MB.`;
    }

    // Allowed types for agent context
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'text/plain', 'text/markdown', 'text/csv',
      'application/pdf', 'application/json',
    ];

    if (!allowedTypes.includes(file.type)) {
      return 'File type not supported.';
    }

    return null;
  };

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);

    setFiles(prev => {
      const remaining = maxFiles - prev.length;
      const toAdd = fileArray.slice(0, remaining);

      const newUploads: UploadedFile[] = toAdd.map(file => {
        const error = validateFile(file);

        return {
          id: `${file.name}-${Date.now()}`,
          name: file.name,
          size: file.size,
          type: file.type,
          preview: file.type.startsWith('image/')
            ? URL.createObjectURL(file)
            : undefined,
          progress: error ? 0 : 100, // Simulate instant upload for demo
          status: error ? 'error' : 'complete',
          error,
        };
      });

      return [...prev, ...newUploads];
    });
  }, [maxFiles]);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  }, []);

  const clearFiles = useCallback(() => {
    files.forEach(f => {
      if (f.preview) URL.revokeObjectURL(f.preview);
    });
    setFiles([]);
  }, [files]);

  return {
    files,
    isDragging,
    setIsDragging,
    addFiles,
    removeFile,
    clearFiles,
    canAddMore: files.length < maxFiles,
  };
}


/**
 * Drag and drop zone component
 */
function DropZone({
  onFilesAdded,
  isDragging,
  setIsDragging,
  disabled,
  children,
}: {
  onFilesAdded: (files: FileList) => void;
  isDragging: boolean;
  setIsDragging: (v: boolean) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const { files } = e.dataTransfer;
    if (files.length > 0) {
      onFilesAdded(files);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`transition-colors ${
        isDragging ? 'bg-blue-50 border-blue-500' : ''
      }`}
    >
      {children}

      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center">
          <div className="text-blue-500 font-medium">
            Drop files here
          </div>
        </div>
      )}
    </div>
  );
}


/**
 * File preview component
 */
function FilePreview({ file, onRemove }: { file: UploadedFile; onRemove: () => void }) {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={`relative flex items-center gap-2 p-2 rounded-lg ${
      file.status === 'error' ? 'bg-red-50' : 'bg-gray-100'
    }`}>
      {/* Preview or icon */}
      {file.preview ? (
        <img
          src={file.preview}
          alt={file.name}
          className="w-10 h-10 object-cover rounded"
        />
      ) : (
        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-500">
          📄
        </div>
      )}

      {/* File info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{file.name}</div>
        <div className="text-xs text-gray-500">{formatSize(file.size)}</div>
        {file.error && (
          <div className="text-xs text-red-500">{file.error}</div>
        )}
      </div>

      {/* Progress or status */}
      {file.status === 'uploading' && (
        <div className="w-16">
          <div className="h-1 bg-gray-200 rounded">
            <div
              className="h-full bg-blue-500 rounded transition-all"
              style={{ width: `${file.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="p-1 hover:bg-gray-200 rounded"
        aria-label="Remove file"
      >
        ✕
      </button>
    </div>
  );
}


/**
 * Complete file upload section for chat input
 */
function FileUploadSection({
  files,
  onFilesAdded,
  onRemove,
  onClear,
  canAddMore,
  disabled,
}: {
  files: UploadedFile[];
  onFilesAdded: (files: FileList) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  canAddMore: boolean;
  disabled?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="border-t p-2">
      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2 mb-2">
          {files.map(file => (
            <FilePreview
              key={file.id}
              file={file}
              onRemove={() => onRemove(file.id)}
            />
          ))}

          {files.length > 1 && (
            <button
              onClick={onClear}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Add button */}
      {canAddMore && (
        <>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            <span>📎</span>
            <span>Attach file</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.txt,.md,.csv,.pdf,.json"
            onChange={(e) => e.target.files && onFilesAdded(e.target.files)}
            className="hidden"
          />
        </>
      )}
    </div>
  );
}
```

---

## 9. State Management

### State Architecture Options

```
┌────────────────────────────────────────────────────────────────────────────┐
│                      State Management Decision Tree                        │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────┐     │
│  │                    What's the scope?                              │     │
│  └──────────────────────────────────────────────────────────────────┘     │
│                                │                                           │
│        ┌──────────────────────┼──────────────────────┐                    │
│        │                      │                      │                    │
│        ▼                      ▼                      ▼                    │
│  ┌───────────┐         ┌───────────┐         ┌───────────────┐           │
│  │ Component │         │ Feature/  │         │ App-wide +    │           │
│  │ local     │         │ Page      │         │ Persistence   │           │
│  └───────────┘         └───────────┘         └───────────────┘           │
│        │                      │                      │                    │
│        ▼                      ▼                      ▼                    │
│  ┌───────────┐         ┌───────────┐         ┌───────────────┐           │
│  │ useState  │         │ Context   │         │ Zustand /     │           │
│  │ useReducer│         │ + hooks   │         │ Jotai + sync  │           │
│  └───────────┘         └───────────┘         └───────────────┘           │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### React Context for Chat State

```tsx
import React, { createContext, useContext, useReducer, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  toolUses?: Array<{ tool: string; detail?: string }>;
  cost?: number;
  error?: string;
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'failed';
  sessionId: string | null;
  totalCost: number;
  error: string | null;
}

type ChatAction =
  | { type: 'SET_CONNECTION_STATE'; payload: ChatState['connectionState'] }
  | { type: 'SET_SESSION_ID'; payload: string }
  | { type: 'ADD_USER_MESSAGE'; payload: { id: string; content: string } }
  | { type: 'ADD_ASSISTANT_MESSAGE'; payload: { id: string } }
  | { type: 'APPEND_TO_MESSAGE'; payload: { id: string; text: string } }
  | { type: 'ADD_TOOL_USE'; payload: { id: string; tool: string; detail?: string } }
  | { type: 'COMPLETE_MESSAGE'; payload: { id: string; cost?: number } }
  | { type: 'SET_MESSAGE_ERROR'; payload: { id: string; error: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_MESSAGES' };


// ═══════════════════════════════════════════════════════════════════════════
// REDUCER
// ═══════════════════════════════════════════════════════════════════════════

const initialState: ChatState = {
  messages: [],
  isLoading: false,
  connectionState: 'connecting',
  sessionId: null,
  totalCost: 0,
  error: null,
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_CONNECTION_STATE':
      return { ...state, connectionState: action.payload };

    case 'SET_SESSION_ID':
      return { ...state, sessionId: action.payload };

    case 'ADD_USER_MESSAGE':
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: action.payload.id,
            role: 'user',
            content: action.payload.content,
            timestamp: Date.now(),
          },
        ],
      };

    case 'ADD_ASSISTANT_MESSAGE':
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: action.payload.id,
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
            isStreaming: true,
          },
        ],
        isLoading: true,
      };

    case 'APPEND_TO_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(m =>
          m.id === action.payload.id
            ? { ...m, content: m.content + action.payload.text }
            : m
        ),
      };

    case 'ADD_TOOL_USE':
      return {
        ...state,
        messages: state.messages.map(m =>
          m.id === action.payload.id
            ? {
                ...m,
                toolUses: [
                  ...(m.toolUses || []),
                  { tool: action.payload.tool, detail: action.payload.detail },
                ],
              }
            : m
        ),
      };

    case 'COMPLETE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(m =>
          m.id === action.payload.id
            ? { ...m, isStreaming: false, cost: action.payload.cost }
            : m
        ),
        totalCost: state.totalCost + (action.payload.cost || 0),
        isLoading: false,
      };

    case 'SET_MESSAGE_ERROR':
      return {
        ...state,
        messages: state.messages.map(m =>
          m.id === action.payload.id
            ? { ...m, isStreaming: false, error: action.payload.error }
            : m
        ),
        isLoading: false,
      };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'CLEAR_MESSAGES':
      return { ...state, messages: [], totalCost: 0 };

    default:
      return state;
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

interface ChatContextValue {
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
  // Convenience actions
  sendMessage: (content: string) => void;
  clearChat: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({
  children,
  wsUrl
}: {
  children: React.ReactNode;
  wsUrl: string;
}) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const wsRef = useRef<WebSocket | null>(null);
  const currentMessageIdRef = useRef<string | null>(null);

  // WebSocket setup (simplified, see full implementation above)
  useEffect(() => {
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => dispatch({ type: 'SET_CONNECTION_STATE', payload: 'connected' });
    ws.onclose = () => dispatch({ type: 'SET_CONNECTION_STATE', payload: 'disconnected' });

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      switch (msg.type) {
        case 'session_created':
          dispatch({ type: 'SET_SESSION_ID', payload: msg.sessionId });
          break;
        case 'chunk':
          if (currentMessageIdRef.current) {
            dispatch({
              type: 'APPEND_TO_MESSAGE',
              payload: { id: currentMessageIdRef.current, text: msg.text }
            });
          }
          break;
        case 'tool_use':
          if (currentMessageIdRef.current) {
            dispatch({
              type: 'ADD_TOOL_USE',
              payload: { id: currentMessageIdRef.current, tool: msg.tool, detail: msg.detail },
            });
          }
          break;
        case 'done':
          if (currentMessageIdRef.current) {
            dispatch({
              type: 'COMPLETE_MESSAGE',
              payload: { id: currentMessageIdRef.current, cost: msg.cost },
            });
          }
          currentMessageIdRef.current = null;
          break;
        case 'error':
          if (currentMessageIdRef.current) {
            dispatch({
              type: 'SET_MESSAGE_ERROR',
              payload: { id: currentMessageIdRef.current, error: msg.error },
            });
          }
          currentMessageIdRef.current = null;
          break;
      }
    };

    return () => ws.close();
  }, [wsUrl]);

  const sendMessage = useCallback((content: string) => {
    if (!content.trim() || state.isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `assistant-${Date.now()}`;

    dispatch({ type: 'ADD_USER_MESSAGE', payload: { id: userMsgId, content } });
    dispatch({ type: 'ADD_ASSISTANT_MESSAGE', payload: { id: assistantMsgId } });

    currentMessageIdRef.current = assistantMsgId;

    wsRef.current?.send(JSON.stringify({ type: 'query', prompt: content }));
  }, [state.isLoading]);

  const clearChat = useCallback(() => {
    dispatch({ type: 'CLEAR_MESSAGES' });
    wsRef.current?.send(JSON.stringify({ type: 'new_session' }));
  }, []);

  return (
    <ChatContext.Provider value={{ state, dispatch, sendMessage, clearChat }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider');
  }
  return context;
}
```

### Zustand Store for Complex Apps

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  cost?: number;
}

interface ChatStore {
  // State
  messages: Message[];
  isLoading: boolean;
  connectionState: 'connecting' | 'connected' | 'disconnected';
  sessionId: string | null;
  totalCost: number;

  // Actions
  addUserMessage: (content: string) => string;
  addAssistantMessage: () => string;
  appendToMessage: (id: string, text: string) => void;
  completeMessage: (id: string, cost?: number) => void;
  setError: (id: string, error: string) => void;
  setConnectionState: (state: ChatStore['connectionState']) => void;
  setSessionId: (id: string) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      // Initial state
      messages: [],
      isLoading: false,
      connectionState: 'connecting',
      sessionId: null,
      totalCost: 0,

      // Actions
      addUserMessage: (content) => {
        const id = `user-${Date.now()}`;
        set(state => ({
          messages: [
            ...state.messages,
            { id, role: 'user', content, timestamp: Date.now() },
          ],
        }));
        return id;
      },

      addAssistantMessage: () => {
        const id = `assistant-${Date.now()}`;
        set(state => ({
          messages: [
            ...state.messages,
            { id, role: 'assistant', content: '', timestamp: Date.now(), isStreaming: true },
          ],
          isLoading: true,
        }));
        return id;
      },

      appendToMessage: (id, text) => {
        set(state => ({
          messages: state.messages.map(m =>
            m.id === id ? { ...m, content: m.content + text } : m
          ),
        }));
      },

      completeMessage: (id, cost) => {
        set(state => ({
          messages: state.messages.map(m =>
            m.id === id ? { ...m, isStreaming: false, cost } : m
          ),
          totalCost: state.totalCost + (cost || 0),
          isLoading: false,
        }));
      },

      setError: (id, error) => {
        set(state => ({
          messages: state.messages.map(m =>
            m.id === id ? { ...m, isStreaming: false, error } : m
          ),
          isLoading: false,
        }));
      },

      setConnectionState: (connectionState) => set({ connectionState }),

      setSessionId: (sessionId) => set({ sessionId }),

      clearMessages: () => set({ messages: [], totalCost: 0 }),
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist these fields
        messages: state.messages.filter(m => !m.isStreaming).slice(-50),
        sessionId: state.sessionId,
        totalCost: state.totalCost,
      }),
    }
  )
);
```

---

## 10. Production Checklist

### Accessibility Checklist

```tsx
/**
 * Accessibility requirements for chat UI
 */

// 1. Screen reader announcements for new messages
function useMessageAnnouncer() {
  const announcerRef = useRef<HTMLDivElement>(null);

  const announce = useCallback((message: string) => {
    if (announcerRef.current) {
      announcerRef.current.textContent = message;
    }
  }, []);

  return {
    announce,
    Announcer: () => (
      <div
        ref={announcerRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    ),
  };
}

// 2. Keyboard navigation
function ChatContainer({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="main"
      aria-label="Chat interface"
      className="chat-container"
    >
      {children}
    </div>
  );
}

// 3. Focus management
function useFocusManagement() {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const focusMessages = useCallback(() => {
    messagesRef.current?.focus();
  }, []);

  return { inputRef, messagesRef, focusInput, focusMessages };
}

// 4. Proper ARIA labels
function MessageBubble({ message }: { message: Message }) {
  const roleLabel = message.role === 'user' ? 'You said' : 'Assistant said';
  const timeLabel = new Date(message.timestamp).toLocaleTimeString();

  return (
    <article
      role="article"
      aria-label={`${roleLabel} at ${timeLabel}`}
      className={`message ${message.role}`}
    >
      {message.content}
    </article>
  );
}

// 5. Loading state announcements
function LoadingIndicator() {
  return (
    <div role="status" aria-label="Assistant is thinking">
      <span className="sr-only">Assistant is thinking...</span>
      <div className="animate-pulse">...</div>
    </div>
  );
}
```

### Performance Optimization

```tsx
import { memo, useMemo, useCallback, lazy, Suspense } from 'react';

// 1. Memoize expensive components
const MessageBubble = memo(function MessageBubble({ message }: { message: Message }) {
  return (
    <div className={`message ${message.role}`}>
      {message.content}
    </div>
  );
}, (prev, next) => {
  // Only re-render if content or streaming state changed
  return prev.message.content === next.message.content &&
         prev.message.isStreaming === next.message.isStreaming;
});

// 2. Virtualize long message lists
import { VariableSizeList as List } from 'react-window';

function VirtualizedMessages({ messages }: { messages: Message[] }) {
  const getItemSize = useCallback((index: number) => {
    const message = messages[index];
    // Estimate height based on content length
    const lines = Math.ceil(message.content.length / 60);
    return Math.max(60, lines * 24 + 32);
  }, [messages]);

  return (
    <List
      height={400}
      itemCount={messages.length}
      itemSize={getItemSize}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <MessageBubble message={messages[index]} />
        </div>
      )}
    </List>
  );
}

// 3. Lazy load heavy components
const FileUploadSection = lazy(() => import('./FileUploadSection'));

function ChatInput({ showUpload }: { showUpload: boolean }) {
  return (
    <div>
      <textarea placeholder="Message..." />
      {showUpload && (
        <Suspense fallback={<div>Loading...</div>}>
          <FileUploadSection />
        </Suspense>
      )}
    </div>
  );
}

// 4. Debounce expensive operations
import { useDebouncedCallback } from 'use-debounce';

function useAutoSave(content: string) {
  const debouncedSave = useDebouncedCallback(
    (value: string) => {
      localStorage.setItem('draft', value);
    },
    500
  );

  useEffect(() => {
    debouncedSave(content);
  }, [content, debouncedSave]);
}
```

### Error Boundaries

```tsx
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ChatErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error reporting service
    console.error('Chat error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-4">
            The chat encountered an error. Please refresh the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Refresh
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage
function App() {
  return (
    <ChatErrorBoundary
      onError={(error) => {
        // Send to Sentry, LogRocket, etc.
        sendToErrorTracking(error);
      }}
    >
      <Chat wsUrl="wss://your-agent.example.com" />
    </ChatErrorBoundary>
  );
}
```

### Analytics Integration

```typescript
/**
 * Analytics events for chat UI
 */
interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
}

const analytics = {
  track: (event: AnalyticsEvent) => {
    // Send to your analytics provider (Mixpanel, Amplitude, etc.)
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track(event.event, event.properties);
    }
  },
};

// Track chat events
function trackChatEvents() {
  return {
    sessionStarted: (sessionId: string) => {
      analytics.track({
        event: 'chat_session_started',
        properties: { sessionId },
      });
    },

    messageSent: (messageLength: number) => {
      analytics.track({
        event: 'message_sent',
        properties: { messageLength },
      });
    },

    responseReceived: (responseTime: number, cost: number) => {
      analytics.track({
        event: 'response_received',
        properties: { responseTime, cost },
      });
    },

    toolUsed: (toolName: string) => {
      analytics.track({
        event: 'tool_used',
        properties: { toolName },
      });
    },

    subagentSpawned: (subagentId: string) => {
      analytics.track({
        event: 'subagent_spawned',
        properties: { subagentId },
      });
    },

    errorOccurred: (errorCode: string, errorMessage: string) => {
      analytics.track({
        event: 'chat_error',
        properties: { errorCode, errorMessage },
      });
    },

    sessionEnded: (totalMessages: number, totalCost: number, duration: number) => {
      analytics.track({
        event: 'chat_session_ended',
        properties: { totalMessages, totalCost, duration },
      });
    },
  };
}
```

### Production Deployment Checklist

```markdown
## Pre-Launch Checklist

### Security
- [ ] WebSocket connections use WSS (TLS)
- [ ] CORS configured correctly
- [ ] Rate limiting implemented
- [ ] Input sanitization for user messages
- [ ] XSS prevention for rendered content
- [ ] CSP headers configured

### Performance
- [ ] Bundle size optimized (< 200KB gzipped)
- [ ] Code splitting implemented
- [ ] Images optimized and lazy loaded
- [ ] WebSocket reconnection tested
- [ ] Memory leaks checked (long sessions)

### Accessibility
- [ ] Screen reader tested (VoiceOver, NVDA)
- [ ] Keyboard navigation works
- [ ] Focus management implemented
- [ ] Color contrast meets WCAG AA
- [ ] Reduced motion supported

### Mobile
- [ ] Tested on iOS Safari
- [ ] Tested on Android Chrome
- [ ] Virtual keyboard handling works
- [ ] Touch targets are 44x44px minimum
- [ ] Safe area insets respected

### Monitoring
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Analytics events firing
- [ ] Performance monitoring (Core Web Vitals)
- [ ] WebSocket connection monitoring
- [ ] Cost tracking per session

### Fallbacks
- [ ] Offline state handled gracefully
- [ ] Connection errors show user-friendly messages
- [ ] Session recovery works
- [ ] Graceful degradation for old browsers
```

---

## Resources

- [MDN WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [React Docs](https://react.dev/)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Zustand](https://github.com/pmndrs/zustand)
- [react-window (Virtualization)](https://github.com/bvaughn/react-window)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
