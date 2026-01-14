#!/bin/bash
#
# Quick start: Run web server with Cloudflare Tunnel
#
# This gives you a temporary public URL that works from any device.
# Great for testing before setting up permanent hosting.
#

set -e

echo ""
echo "╭───────────────────────────────────────────────────╮"
echo "│  💼 KnearMe Business Advisor - Quick Tunnel       │"
echo "╰───────────────────────────────────────────────────╯"
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$SCRIPT_DIR"

# Check for cloudflared
if ! command -v cloudflared &> /dev/null; then
  echo "📦 Installing Cloudflare Tunnel..."
  if command -v brew &> /dev/null; then
    brew install cloudflared
  else
    echo "❌ Please install cloudflared:"
    echo "   brew install cloudflared"
    exit 1
  fi
fi

# Start web server in background
echo "🚀 Starting web server..."
npm run web &
SERVER_PID=$!

# Wait for server to start
sleep 2

if ! curl -s http://localhost:3456/health > /dev/null; then
  echo "❌ Web server failed to start"
  kill $SERVER_PID 2>/dev/null
  exit 1
fi

echo "✓ Web server running on http://localhost:3456"
echo ""
echo "🌐 Starting Cloudflare Tunnel..."
echo ""
echo "   Your public URL will appear below."
echo "   Share it to access from any device!"
echo ""
echo "   Press Ctrl+C to stop everything."
echo ""
echo "───────────────────────────────────────────────────"
echo ""

# Start tunnel (this blocks until Ctrl+C)
cloudflared tunnel --url http://localhost:3456

# Cleanup on exit
kill $SERVER_PID 2>/dev/null
