# --- Stage 1: install dependencies (locked by pnpm-lock.yaml when present) ---
FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.12.2 --activate
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile=false

# --- Stage 2: compile TypeScript ---
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.12.2 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY src ./src
RUN pnpm run build

# --- Stage 3: slim production image ---
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S bot && adduser -S bot -G bot \
    && mkdir -p /app && chown bot:bot /app
COPY --from=build --chown=bot:bot /app/dist ./dist
COPY --from=build --chown=bot:bot /app/node_modules ./node_modules
COPY --from=build --chown=bot:bot /app/package.json ./
USER bot
EXPOSE 3000
CMD ["node", "dist/index.js"]
