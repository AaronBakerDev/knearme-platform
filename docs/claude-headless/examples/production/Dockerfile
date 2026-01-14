# Dockerfile - Production Claude Agent Container
#
# Multi-stage build for optimized image size.
# Includes Python for advanced agent scripts.

# --- Build stage ---
FROM node:20-slim AS builder

# Install Claude Code CLI
RUN npm install -g @anthropic-ai/claude-code

# --- Runtime stage ---
FROM node:20-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    jq \
    git \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy Claude Code from builder
COPY --from=builder /usr/local/lib/node_modules /usr/local/lib/node_modules
COPY --from=builder /usr/local/bin/claude /usr/local/bin/claude

# Create non-root user (optional, for security)
# RUN useradd -m -s /bin/bash agent
# USER agent

# Create directories
WORKDIR /app
RUN mkdir -p /data/results /workspace

# Copy application files
COPY entrypoint.sh /app/entrypoint.sh
COPY agent-service.py /app/agent-service.py
COPY mcp.json /app/mcp.json

RUN chmod +x /app/entrypoint.sh /app/agent-service.py

# Volumes for persistence
VOLUME /data
VOLUME /workspace

# Environment defaults
ENV SESSION_FILE=/data/session.id
ENV RESULTS_DIR=/data/results
ENV QUEUE_FILE=/data/queue.txt
ENV MCP_CONFIG=/app/mcp.json
ENV PERMISSION_MODE=acceptEdits
ENV MAX_TURNS=20
ENV LOG_LEVEL=info

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD claude --version || exit 1

# Default entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]

# Default command (can be overridden)
CMD ["--help"]
