#!/bin/bash
#
# Create New Agent Project
#
# Usage:
#   bash new-agent.sh <agent-name>
#
# Example:
#   bash new-agent.sh support-agent
#

set -e

AGENT_NAME=$1

if [ -z "$AGENT_NAME" ]; then
  echo "Usage: bash new-agent.sh <agent-name>"
  echo ""
  echo "Example:"
  echo "  bash new-agent.sh support-agent"
  exit 1
fi

echo ""
echo "╭───────────────────────────────────────────────────╮"
echo "│  Creating: $AGENT_NAME                             "
echo "╰───────────────────────────────────────────────────╯"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# CREATE DIRECTORIES
# ═══════════════════════════════════════════════════════════════════════════

mkdir -p "$AGENT_NAME"/{src,public,docs,data}
cd "$AGENT_NAME"

# ═══════════════════════════════════════════════════════════════════════════
# PACKAGE.JSON
# ═══════════════════════════════════════════════════════════════════════════

cat > package.json << EOF
{
  "name": "$AGENT_NAME",
  "version": "1.0.0",
  "description": "Claude Agent SDK application",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "start": "tsx src/index.tsx",
    "web": "tsx src/web-server.ts",
    "web:dev": "tsx watch src/web-server.ts",
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  },
  "keywords": ["claude", "agent", "ai"],
  "license": "MIT",
  "dependencies": {
    "@anthropic-ai/claude-agent-sdk": "^0.1.76",
    "express": "^5.2.1",
    "ws": "^8.18.3"
  },
  "devDependencies": {
    "@types/express": "^5.0.6",
    "@types/node": "^25.0.3",
    "@types/ws": "^8.18.1",
    "tsx": "^4.21.0",
    "typescript": "^5.9.3"
  }
}
EOF

# ═══════════════════════════════════════════════════════════════════════════
# TSCONFIG
# ═══════════════════════════════════════════════════════════════════════════

cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# ═══════════════════════════════════════════════════════════════════════════
# WEB SERVER (from template)
# ═══════════════════════════════════════════════════════════════════════════

cat > src/web-server.ts << 'SERVEREOF'
/**
 * Agent Web Server
 *
 * Express + WebSocket server for real-time streaming.
 */

import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import { query } from "@anthropic-ai/claude-agent-sdk";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3456;
const PROJECT_ROOT = path.resolve(__dirname, "..");
const DOCS_PATH = path.join(PROJECT_ROOT, "docs");
const DATA_PATH = path.join(PROJECT_ROOT, "data");

// ═══════════════════════════════════════════════════════════════════════════
// SYSTEM PROMPT - Customize this for your agent
// ═══════════════════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `# Your Agent Name

You are a helpful assistant.

## Your Role
- Help users with their questions
- Provide accurate, concise answers
- Use available tools when needed

## Documentation
Read from \`docs/\` for reference materials.
`;

// ═══════════════════════════════════════════════════════════════════════════
// SUBAGENTS (Optional) - Define specialists here
// ═══════════════════════════════════════════════════════════════════════════

const SUBAGENTS = {
  // "specialist": {
  //   description: "When to use this specialist",
  //   prompt: "System prompt for specialist",
  //   tools: ["Read", "Glob", "Grep"],
  // },
};

// ═══════════════════════════════════════════════════════════════════════════
// SESSION MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

interface Session {
  id: string;
  sessionId?: string;
  totalCost: number;
  queryCount: number;
}

const sessions = new Map<string, Session>();

// ═══════════════════════════════════════════════════════════════════════════
// EXPRESS SERVER
// ═══════════════════════════════════════════════════════════════════════════

const app = express();
app.use(express.json());
app.use(express.static(path.join(PROJECT_ROOT, "public")));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ═══════════════════════════════════════════════════════════════════════════
// WEBSOCKET SERVER
// ═══════════════════════════════════════════════════════════════════════════

const server = createServer(app);
const wss = new WebSocketServer({ server });

function send(ws: WebSocket, msg: Record<string, unknown>) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

wss.on("connection", (ws) => {
  console.log("[WS] Client connected");

  const id = `session-${Date.now()}`;
  const session: Session = { id, totalCost: 0, queryCount: 0 };
  sessions.set(id, session);

  send(ws, { type: "session_created", sessionId: id });

  ws.on("message", async (data) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === "ping") {
        send(ws, { type: "pong" });
        return;
      }

      if (msg.type === "query" && msg.prompt) {
        await runQuery(ws, session, msg.prompt);
      }
    } catch (error) {
      send(ws, { type: "error", error: String(error) });
    }
  });

  ws.on("close", () => console.log("[WS] Disconnected"));
});

// ═══════════════════════════════════════════════════════════════════════════
// QUERY EXECUTION
// ═══════════════════════════════════════════════════════════════════════════

async function runQuery(ws: WebSocket, session: Session, prompt: string) {
  try {
    const q = query({
      prompt,
      options: {
        ...(session.sessionId && { resume: session.sessionId }),
        model: "claude-sonnet-4-5-20250929",
        systemPrompt: SYSTEM_PROMPT,
        allowedTools: ["Read", "Glob", "Grep", "WebSearch", "WebFetch", "Task"],
        agents: Object.keys(SUBAGENTS).length > 0 ? SUBAGENTS : undefined,
        additionalDirectories: [DOCS_PATH, DATA_PATH],
        cwd: PROJECT_ROOT,
        permissionMode: "acceptEdits",
      },
    });

    let responseText = "";

    for await (const message of q) {
      if (message.type === "system" && "subtype" in message && message.subtype === "init") {
        session.sessionId = message.session_id;
      }

      if (message.type === "assistant" && "message" in message) {
        for (const block of message.message.content) {
          if ("type" in block && block.type === "tool_use") {
            const tb = block as { name: string; input?: Record<string, unknown> };
            send(ws, { type: "tool_use", tool: tb.name });
          }
          if ("text" in block) {
            responseText += block.text;
            send(ws, { type: "chunk", text: block.text });
          }
        }
      }

      if (message.type === "result" && "result" in message) {
        session.totalCost += message.total_cost_usd || 0;
        session.queryCount++;
        send(ws, {
          type: "done",
          cost: message.total_cost_usd,
          duration: message.duration_ms,
          queryCount: session.queryCount,
        });
      }
    }
  } catch (error) {
    send(ws, { type: "error", error: String(error) });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// START
// ═══════════════════════════════════════════════════════════════════════════

server.listen(PORT, () => {
  console.log();
  console.log(`🤖 Agent running at http://localhost:${PORT}`);
  console.log();
});
SERVEREOF

# ═══════════════════════════════════════════════════════════════════════════
# BASIC HTML CLIENT
# ═══════════════════════════════════════════════════════════════════════════

cat > public/index.html << 'HTMLEOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agent Chat</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #f5f5f5; height: 100vh; display: flex; flex-direction: column; }
    #chat { flex: 1; overflow-y: auto; padding: 16px; }
    .message { margin-bottom: 12px; max-width: 80%; }
    .message.user { margin-left: auto; text-align: right; }
    .message-content { display: inline-block; padding: 10px 14px; border-radius: 12px; }
    .message.user .message-content { background: #0084ff; color: white; }
    .message.assistant .message-content { background: white; border: 1px solid #ddd; }
    #input-area { padding: 12px; background: white; border-top: 1px solid #ddd; display: flex; gap: 8px; }
    #input { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; }
    #send { padding: 10px 20px; background: #0084ff; color: white; border: none; border-radius: 8px; cursor: pointer; }
    #send:disabled { opacity: 0.5; }
    .tool { font-size: 12px; color: #666; padding: 4px 8px; background: #f0f0f0; border-radius: 4px; margin: 4px 0; }
  </style>
</head>
<body>
  <div id="chat"></div>
  <div id="input-area">
    <input type="text" id="input" placeholder="Type a message..." />
    <button id="send">Send</button>
  </div>
  <script>
    const chat = document.getElementById('chat');
    const input = document.getElementById('input');
    const sendBtn = document.getElementById('send');
    let ws, currentMsg;

    function connect() {
      ws = new WebSocket(`${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}`);
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === 'chunk') appendChunk(msg.text);
        if (msg.type === 'tool_use') showTool(msg.tool);
        if (msg.type === 'done') { currentMsg = null; sendBtn.disabled = false; }
        if (msg.type === 'error') { alert(msg.error); sendBtn.disabled = false; }
      };
      ws.onclose = () => setTimeout(connect, 2000);
    }

    function addMessage(text, role) {
      const div = document.createElement('div');
      div.className = `message ${role}`;
      div.innerHTML = `<div class="message-content">${text}</div>`;
      chat.appendChild(div);
      chat.scrollTop = chat.scrollHeight;
      return div;
    }

    function appendChunk(text) {
      if (!currentMsg) currentMsg = addMessage('', 'assistant');
      const content = currentMsg.querySelector('.message-content');
      content.textContent += text;
      chat.scrollTop = chat.scrollHeight;
    }

    function showTool(tool) {
      const div = document.createElement('div');
      div.className = 'tool';
      div.textContent = `🔧 ${tool}`;
      chat.appendChild(div);
    }

    function send() {
      const text = input.value.trim();
      if (!text || !ws) return;
      addMessage(text, 'user');
      ws.send(JSON.stringify({ type: 'query', prompt: text }));
      input.value = '';
      sendBtn.disabled = true;
    }

    sendBtn.onclick = send;
    input.onkeydown = (e) => e.key === 'Enter' && send();
    connect();
  </script>
</body>
</html>
HTMLEOF

# ═══════════════════════════════════════════════════════════════════════════
# GITIGNORE
# ═══════════════════════════════════════════════════════════════════════════

cat > .gitignore << 'EOF'
node_modules/
dist/
.env
*.log
.DS_Store
EOF

# ═══════════════════════════════════════════════════════════════════════════
# README
# ═══════════════════════════════════════════════════════════════════════════

cat > README.md << EOF
# $AGENT_NAME

Claude Agent SDK application.

## Setup

\`\`\`bash
npm install
\`\`\`

## Development

\`\`\`bash
npm run web:dev
\`\`\`

## Production

\`\`\`bash
npm run web
\`\`\`

## Configuration

Edit \`src/web-server.ts\`:
- \`SYSTEM_PROMPT\` - Agent personality and instructions
- \`SUBAGENTS\` - Optional specialist subagents
EOF

# ═══════════════════════════════════════════════════════════════════════════
# SAMPLE DOCS
# ═══════════════════════════════════════════════════════════════════════════

cat > docs/README.md << 'EOF'
# Documentation

Put reference materials here for your agent to read.
EOF

cat > data/README.md << 'EOF'
# Data

Store persistent data, memories, and state here.
EOF

# ═══════════════════════════════════════════════════════════════════════════
# DONE
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo "╭───────────────────────────────────────────────────╮"
echo "│  ✅ Agent Created: $AGENT_NAME                     "
echo "╰───────────────────────────────────────────────────╯"
echo ""
echo "Next steps:"
echo "  cd $AGENT_NAME"
echo "  npm install"
echo "  npm run web:dev"
echo ""
echo "Then customize:"
echo "  - src/web-server.ts  (SYSTEM_PROMPT, SUBAGENTS)"
echo "  - docs/              (reference materials)"
echo "  - public/index.html  (UI)"
echo ""
