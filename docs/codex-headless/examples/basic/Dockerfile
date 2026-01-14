# Dockerfile - Minimal Codex headless agent container
#
# Build:
#   docker build -t codex-agent .
#
# Run (interactive):
#   docker run -it --rm -v $(pwd)/data:/data codex-agent "Your prompt"
#
# Run (with mounted code):
#   docker run -it --rm -v $(pwd):/workspace -v $(pwd)/data:/data \
#       -w /workspace codex-agent "Analyze this codebase"
#
# Note: Codex CLI authenticates via OAuth or API key. On first run, you may need
# to authenticate interactively or mount existing credentials at ~/.codex/.

FROM node:20-slim

# Install Codex CLI
RUN npm install -g @openai/codex

# Optional runtime helpers
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    jq \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY agent.sh /app/agent.sh
COPY agent.py /app/agent.py
RUN chmod +x /app/agent.sh /app/agent.py

RUN mkdir -p /data
VOLUME /data

ENV SESSION_FILE=/data/session.id
ENV SANDBOX=workspace-write
ENV APPROVAL_POLICY=on-failure

ENTRYPOINT ["/app/agent.sh"]
CMD ["Hello! I am ready to help."]

