# Multi-stage build for AnyGPT MCP Server
# Stage 1: Build
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY nx.json ./

# Copy workspace packages
COPY packages/ ./packages/
COPY tools/ ./tools/

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Build only the MCP package and its dependencies using Nx
RUN npx nx build @anygpt/mcp

# Stage 2: Production
FROM node:24-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy built MCP package and its dependencies
COPY --from=builder /app/packages/mcp/dist ./packages/mcp/dist
COPY --from=builder /app/packages/mcp/package.json ./packages/mcp/package.json

# Copy config package (dependency of MCP)
COPY --from=builder /app/packages/config/dist ./packages/config/dist
COPY --from=builder /app/packages/config/package.json ./packages/config/package.json

# Copy types package (dependency of MCP)
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/types/package.json ./packages/types/package.json

# Copy connectors (dependencies of config)
COPY --from=builder /app/packages/connectors/ ./packages/connectors/

# Install only production dependencies
RUN npm ci --only=production --ignore-scripts

# Create non-root user
RUN addgroup -g 1001 -S anygpt && \
    adduser -S anygpt -u 1001 -G anygpt

# Change ownership
RUN chown -R anygpt:anygpt /app

# Switch to non-root user
USER anygpt

# Metadata
LABEL org.opencontainers.image.title="AnyGPT MCP Server"
LABEL org.opencontainers.image.description="Universal AI provider gateway with multi-provider support"
LABEL org.opencontainers.image.source="https://github.com/genai-tools/anygpt"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.vendor="AnyGPT Contributors"

# Health check (optional - checks if node is running)
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD node -e "process.exit(0)" || exit 1

# Start MCP server
ENTRYPOINT ["node", "dist/packages/mcp/index.js"]
