FROM node:20-slim

WORKDIR /app

COPY package.json ./
RUN npm install --production

# Pre-install MCP backends for faster startup (avoids npx download on first call)
# Each installed separately so one failure doesn't block others
RUN npm install -g ruvector || true
RUN npm install -g ruflo || true
RUN npm install -g agentic@alpha || true
RUN npm install -g gemini-mcp-server || true
RUN npm install -g @openai/codex || true

COPY index.js ./
COPY mcp-stdio-kernel.js ./

# Create writable directories for MCP backends (ruflo, ruvector, agentic)
# These tools write state/tasks/memory to the working directory at runtime
RUN mkdir -p /app/.codex/tasks /app/.codex/memory /app/.codex/sessions \
    /app/.codex/agents /app/.codex/config /app/.codex/data \
    /app/.codex/logs /app/.codex/swarm \
    && chown -R node:node /app/.codex

USER node

EXPOSE 3001

ENV PORT=3001
# Default-on tool groups
ENV MCP_GROUP_INTELLIGENCE=true
ENV MCP_GROUP_AGENTS=true
ENV MCP_GROUP_MEMORY=true
ENV MCP_GROUP_DEVTOOLS=true
# Opt-in tool groups
ENV MCP_GROUP_SECURITY=false
ENV MCP_GROUP_BROWSER=false
ENV MCP_GROUP_NEURAL=false
ENV MCP_GROUP_AGENTIC_FLOW=false
ENV MCP_GROUP_CODEX=false
ENV MCP_GROUP_GEMINI=false
ENV MCP_GROUP_CODEX=false

CMD ["node", "index.js"]
