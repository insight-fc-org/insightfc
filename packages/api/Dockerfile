# ---- build stage ----
FROM node:20-slim AS build
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.14.0 --activate

# Copy workspace manifests first for better caching
COPY pnpm-workspace.yaml package.json ./
COPY packages/api/package.json packages/api/
COPY packages/api/tsconfig.json packages/api/

# Install deps (workspace-aware), then build only api
RUN pnpm install --frozen-lockfile=false
RUN pnpm -w --filter @app/api build

# ---- runtime stage ----
FROM node:20-slim
ENV NODE_ENV=production
WORKDIR /srv

# Copy only the built API dist and a minimal package.json (for provenance)
COPY --from=build /app/packages/api/dist ./dist
COPY --from=build /app/packages/api/package.json ./package.json

EXPOSE 3000
CMD ["node", "dist/server.js"]