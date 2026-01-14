#!/bin/bash
#
# KnearMe Business Advisor - Remote Server Setup
#
# This script sets up the business advisor on a remote Mac (e.g., M1 Pro)
# to run 24/7 with Cloudflare Tunnel for secure remote access.
#
# Usage:
#   1. Copy business-agent folder to the remote Mac
#   2. Run this script: ./scripts/setup-remote.sh
#

set -e

echo ""
echo "╭───────────────────────────────────────────────────╮"
echo "│  💼 KnearMe Business Advisor - Remote Setup       │"
echo "╰───────────────────────────────────────────────────╯"
echo ""

# Check if we're on macOS
if [[ "$(uname)" != "Darwin" ]]; then
  echo "❌ This script is designed for macOS"
  exit 1
fi

# Check for Homebrew
if ! command -v brew &> /dev/null; then
  echo "📦 Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Check for Node.js
if ! command -v node &> /dev/null; then
  echo "📦 Installing Node.js..."
  brew install node
fi

# Check node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "📦 Upgrading Node.js (need v18+)..."
  brew upgrade node
fi

echo "✓ Node.js $(node -v)"

# Check for cloudflared
if ! command -v cloudflared &> /dev/null; then
  echo "📦 Installing Cloudflare Tunnel..."
  brew install cloudflared
fi
echo "✓ Cloudflared installed"

# Install npm dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Check for Claude Code CLI
if ! command -v claude &> /dev/null; then
  echo ""
  echo "⚠️  Claude Code CLI not found!"
  echo ""
  echo "Please install Claude Code:"
  echo "  npm install -g @anthropic-ai/claude-code"
  echo ""
  echo "Then authenticate:"
  echo "  claude"
  echo ""
  echo "After that, run this script again."
  exit 1
fi
echo "✓ Claude Code CLI installed"

# Test Claude auth
echo ""
echo "🔐 Testing Claude authentication..."
if claude --version &> /dev/null; then
  echo "✓ Claude Code authenticated"
else
  echo ""
  echo "⚠️  Please authenticate Claude Code:"
  echo "  claude"
  echo ""
  echo "After authenticating, run this script again."
  exit 1
fi

# Create launchd plist for auto-start
PLIST_PATH="$HOME/Library/LaunchAgents/com.knearme.business-advisor.plist"
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo ""
echo "📝 Creating auto-start configuration..."

cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.knearme.business-advisor</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>$(which npx)</string>
        <string>tsx</string>
        <string>src/web-server.ts</string>
    </array>
    <key>WorkingDirectory</key>
    <string>${SCRIPT_DIR}</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>${SCRIPT_DIR}/logs/server.log</string>
    <key>StandardErrorPath</key>
    <string>${SCRIPT_DIR}/logs/server.error.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin</string>
    </dict>
</dict>
</plist>
EOF

# Create logs directory
mkdir -p "$SCRIPT_DIR/logs"

echo "✓ Created launchd service"

# Setup Cloudflare Tunnel
echo ""
echo "🌐 Setting up Cloudflare Tunnel..."
echo ""

if cloudflared tunnel list 2>/dev/null | grep -q "business-advisor"; then
  echo "✓ Tunnel 'business-advisor' already exists"
else
  echo "Creating Cloudflare Tunnel..."
  echo ""
  echo "This will open a browser window to authenticate with Cloudflare."
  echo "Press Enter to continue..."
  read

  cloudflared tunnel login
  cloudflared tunnel create business-advisor
fi

# Get tunnel credentials
TUNNEL_ID=$(cloudflared tunnel list | grep business-advisor | awk '{print $1}')
CRED_FILE="$HOME/.cloudflared/${TUNNEL_ID}.json"

# Create tunnel config
TUNNEL_CONFIG="$HOME/.cloudflared/config.yml"
echo ""
echo "📝 Creating tunnel configuration..."

cat > "$TUNNEL_CONFIG" << EOF
tunnel: $TUNNEL_ID
credentials-file: $CRED_FILE

ingress:
  - hostname: business-advisor.${USER}.workers.dev
    service: http://localhost:3456
  - service: http_status:404
EOF

echo "✓ Tunnel configuration created"

# Create tunnel launchd plist
TUNNEL_PLIST="$HOME/Library/LaunchAgents/com.cloudflare.tunnel.business-advisor.plist"

cat > "$TUNNEL_PLIST" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.cloudflare.tunnel.business-advisor</string>
    <key>ProgramArguments</key>
    <array>
        <string>$(which cloudflared)</string>
        <string>tunnel</string>
        <string>run</string>
        <string>business-advisor</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>${SCRIPT_DIR}/logs/tunnel.log</string>
    <key>StandardErrorPath</key>
    <string>${SCRIPT_DIR}/logs/tunnel.error.log</string>
</dict>
</plist>
EOF

echo "✓ Created tunnel service"

# Load services
echo ""
echo "🚀 Starting services..."
launchctl unload "$PLIST_PATH" 2>/dev/null || true
launchctl load "$PLIST_PATH"
launchctl unload "$TUNNEL_PLIST" 2>/dev/null || true
launchctl load "$TUNNEL_PLIST"

echo "✓ Services started"

# Wait for server to start
echo ""
echo "⏳ Waiting for server to start..."
sleep 3

# Check if server is running
if curl -s http://localhost:3456/health > /dev/null; then
  echo "✓ Web server is running"
else
  echo "⚠️  Web server may not be running. Check logs:"
  echo "   cat logs/server.log"
fi

# Get the public URL
echo ""
echo "╭───────────────────────────────────────────────────╮"
echo "│  ✅ Setup Complete!                               │"
echo "╰───────────────────────────────────────────────────╯"
echo ""
echo "📍 Local URL:  http://localhost:3456"
echo ""
echo "🌐 To get your public URL, run:"
echo "   cloudflared tunnel route dns business-advisor your-subdomain"
echo ""
echo "   Or use quick tunnel (temporary URL):"
echo "   cloudflared tunnel --url http://localhost:3456"
echo ""
echo "📋 Commands:"
echo "   Start server:   launchctl load ~/Library/LaunchAgents/com.knearme.business-advisor.plist"
echo "   Stop server:    launchctl unload ~/Library/LaunchAgents/com.knearme.business-advisor.plist"
echo "   View logs:      tail -f logs/server.log"
echo ""
