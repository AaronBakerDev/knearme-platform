# Dockerfile - Minimal Claude Code headless agent container
#
# Build:
#   docker build -t claude-agent .
#
# Run (interactive):
#   docker run -it --rm -v $(pwd)/data:/data claude-agent "Your prompt"
#
# Run (with mounted code):
#   docker run -it --rm -v $(pwd):/workspace -v $(pwd)/data:/data \
#       -w /workspace claude-agent "Analyze this codebase"
#
# Note: Claude Code authenticates via OAuth. On first run, you may need
# to authenticate interactively or mount existing credentials.

FROM node:20-slim

# Install Claude Code CLI
RUN npm install -g @anthropic-ai/claude-code

# Install Python for the Python agent wrapper (optional)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy agent scripts
COPY agent.sh /app/agent.sh
COPY agent.py /app/agent.py
RUN chmod +x /app/agent.sh /app/agent.py

# Create data directory for session persistence
RUN mkdir -p /data
VOLUME /data

# Environment configuration
ENV SESSION_FILE=/data/session.id
ENV OUTPUT_FORMAT=json
ENV PERMISSION_MODE=default

# Default entrypoint uses bash agent
ENTRYPOINT ["/app/agent.sh"]

# Default command (can be overridden)
CMD ["Hello! I am ready to help."]
