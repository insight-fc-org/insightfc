# ---- build stage ----
FROM node:20-slim AS build
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.14.0 --activate

# Copy workspace manifests first for better caching
COPY pnpm-workspace.yaml package.json ./
COPY pnpm-lock.yaml* ./
COPY packages/api/package.json packages/api/
COPY packages/api/tsconfig.json packages/api/
COPY packages/api/src packages/api/src

# Install deps (workspace-aware), then build only api
RUN pnpm install --frozen-lockfile=false
RUN pnpm -w --filter @app/api build

# ---- runtime stage ----
FROM node:20-slim
ENV NODE_ENV=production
WORKDIR /srv

# Reduce CVEs in base by applying latest security patches
RUN apt-get update \
  && apt-get -y upgrade \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build --chown=node:node /app/packages/api/dist ./dist
COPY --from=build --chown=node:node /app/packages/api/package.json ./package.json

# Drop privileges
USER node

EXPOSE 3000
CMD ["node", "dist/server.js"]