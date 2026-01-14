FROM node:20-slim

RUN apt-get update && apt-get install -y \
    bash curl jq git python3 python3-pip \
  && rm -rf /var/lib/apt/lists/*

# Install Codex CLI
RUN npm install -g @openai/codex

WORKDIR /app

# Copy optional config template (users should mount real config)
COPY config.toml.template /app/config.toml

ENV CODEX_HOME=/root/.codex
ENV CODEX_CONFIG=/app/config.toml

ENTRYPOINT ["bash"]

