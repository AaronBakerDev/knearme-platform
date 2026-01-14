# Dockerfile - Production Codex Agent Container
#
# Multi-stage image including Python for advanced scripts.

FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    jq \
    git \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

RUN npm install -g @openai/codex

WORKDIR /app
RUN mkdir -p /data/results /workspace

COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

VOLUME /data
VOLUME /workspace

ENV SESSION_FILE=/data/session.id
ENV RESULTS_DIR=/data/results
ENV QUEUE_FILE=/data/queue.txt
ENV SANDBOX=workspace-write
ENV APPROVAL_POLICY=on-request

HEALTHCHECK --interval=30s --timeout=10s --retries=3 CMD codex --version || exit 1

ENTRYPOINT ["/app/entrypoint.sh"]

