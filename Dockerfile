# Multi-stage build for Food 4 Thought

FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --quiet

FROM deps AS build
WORKDIR /app
COPY . .
# Build frontend (Vite) -> outputs to /app/dist per vite.config.js
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install prod deps
COPY package*.json ./
RUN npm ci --omit=dev --quiet \
    && npm cache clean --force

# Copy built app and server
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
COPY --from=build /app/src/server ./src/server

# Ensure data dir exists for SQLite
RUN mkdir -p /app/data

# Non-root for safety
RUN useradd -m appuser || true
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 3001
ENV PORT=3001
CMD ["node", "src/server/index.js"]


